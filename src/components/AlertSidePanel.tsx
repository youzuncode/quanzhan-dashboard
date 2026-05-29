import { useState, useRef } from 'react'
import { plans } from '../lib/mockData'

// Dynamically compute alerts from plans (matching HTML _collectAlerts logic)
type AlertLevel = 'urgent' | 'warning' | 'opportunity' | 'info'
interface ComputedAlert {
  id: string
  level: AlertLevel
  plan: string
  rule: string
  deadline: string
  title: string
  desc: string
  ops: string[]
  color: string
}

function collectAlerts(): ComputedAlert[] {
  const alerts: ComputedAlert[] = []
  const simGross = 0.31

  plans.forEach(p => {
    const gross = p.gross || simGross
    const sl = (1 / gross) * 100
    const pt = gross * 100 - 10
    const f = p.febi * 100
    const zone = f > sl ? 'R' : f > pt ? 'Y' : 'G'
    const roi = p.roiTarget
    const simRoi = p.roiTarget
    const spend = p.spend
    const estRemain = Math.max(0, p.budget - spend * 0.6)
    const stopLossROI = 1 / gross
    const budget = p.budget

    // 🔴 紧急：红区止损
    if (zone === 'R' && spend > 100) {
      const newROI = Math.max(simRoi, stopLossROI * 1.10)
      const nb = spend * 0.6 + estRemain * 0.60
      alerts.push({
        id: `urgent-r2b-${p.name}`,
        level: 'urgent', plan: p.name, rule: 'R2-B',
        deadline: '截止 14:00 确认',
        title: '🔴 红区止损待确认',
        desc: `费比${f.toFixed(1)}% > Gross毛利率${sl.toFixed(1)}%，计划已进入红区，须立即执行止损操作`,
        ops: [
          `净目标投产比 → ${newROI.toFixed(2)}（止损ROI×1.10）`,
          `今日预算 → ¥${nb.toFixed(0)}（剩余×0.60）`,
          `强制关闭「优质计划防停投」`,
        ],
        color: '#c62828',
      })
    }

    // 🔴 紧急：ROI完成率过低
    if (roi < simRoi * 0.55 && spend > 150) {
      const newROI = simRoi * 1.18
      const nb = spend * 0.6 + estRemain * 0.70
      alerts.push({
        id: `urgent-r2a-${p.name}`,
        level: 'urgent', plan: p.name, rule: 'R2-A',
        deadline: '建议12:00前执行',
        title: `📉 ROI完成率过低`,
        desc: `当前ROI${roi.toFixed(2)}，目标ROI${simRoi}，需上调ROI目标并压缩预算`,
        ops: [
          `净目标投产比：${simRoi} → ${newROI.toFixed(2)}（×1.18）`,
          `今日预算 → ¥${nb.toFixed(0)}（剩余×0.70）`,
        ],
        color: '#d84315',
      })
    }

    // 🟡 预警：黄区
    if (zone === 'Y' && spend > 100) {
      alerts.push({
        id: `warning-r2c-${p.name}`,
        level: 'warning', plan: p.name, rule: 'R2-C',
        deadline: '关注',
        title: `🟡 黄区预警`,
        desc: `费比${f.toFixed(1)}%在黄区（${pt.toFixed(1)}%~${sl.toFixed(1)}%），如全店余量<0%将自动触发R2-C压量`,
        ops: [
          `若全店余量<0%：ROI×1.10 + 剩余预算×0.80`,
          `暂时观察，下一时点视全店余量决策`,
        ],
        color: '#f57f17',
      })
    }

    // 🟢 机会：绿区追量
    if (zone === 'G' && budget > 0 && spend > 50) {
      const nb = budget * 1.17
      alerts.push({
        id: `opp-r3-${p.name}`,
        level: 'opportunity', plan: p.name, rule: 'R3',
        deadline: '建议18:00前执行',
        title: `🚀 绿区追量机会`,
        desc: `绿区高置信，费比${f.toFixed(1)}% < 目标费比，可追加预算扩量`,
        ops: [
          `今日预算：¥${budget.toFixed(0)} → ¥${nb.toFixed(0)}（+17%）`,
          `确认「优质计划防停投」已开启`,
        ],
        color: '#2e7d32',
      })
    }
  })

  const order: Record<AlertLevel, number> = { urgent: 0, warning: 1, opportunity: 2, info: 3 }
  alerts.sort((a, b) => order[a.level] - order[b.level])
  return alerts
}

interface Props {
  onClose: () => void
}

export function AlertSidePanel({ onClose }: Props) {
  const allAlerts = collectAlerts()
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set())
  const [showNotifyModal, setShowNotifyModal] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem('feishu_webhook') || '')
  const [notifyStatus, setNotifyStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle')
  const webhookRef = useRef<HTMLInputElement>(null)

  async function sendToFeishu() {
    const url = webhookRef.current?.value.trim() || webhookUrl
    if (!url) return
    localStorage.setItem('feishu_webhook', url)
    setWebhookUrl(url)
    setNotifyStatus('sending')

    const activeAlerts = allAlerts.filter(a => !dismissed.has(a.id))
    const urgent = activeAlerts.filter(a => a.level === 'urgent')
    const warning = activeAlerts.filter(a => a.level === 'warning')
    const opp = activeAlerts.filter(a => a.level === 'opportunity')

    const now = new Date()
    const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`

    let text = `【全站推广告警推送】${timeStr}\n`
    text += `📊 汇总：${urgent.length}条紧急 · ${warning.length}条预警 · ${opp.length}条机会\n\n`
    if (urgent.length > 0) {
      text += `🔴 紧急待确认（${urgent.length}条）\n`
      urgent.forEach(a => { text += `• ${a.plan} [${a.rule}]：${a.title}\n` })
      text += '\n'
    }
    if (warning.length > 0) {
      text += `🟡 预警关注（${warning.length}条）\n`
      warning.forEach(a => { text += `• ${a.plan} [${a.rule}]：${a.title}\n` })
      text += '\n'
    }
    if (opp.length > 0) {
      text += `🚀 追量机会（${opp.length}条）\n`
      opp.forEach(a => { text += `• ${a.plan} [${a.rule}]：${a.title}\n` })
    }

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msg_type: 'text', content: { text } }),
      })
      setNotifyStatus('ok')
      setTimeout(() => setNotifyStatus('idle'), 3000)
    } catch {
      setNotifyStatus('err')
      setTimeout(() => setNotifyStatus('idle'), 3000)
    }
  }

  const active = allAlerts.filter(a => !dismissed.has(a.id))
  const urgent = active.filter(a => a.level === 'urgent')
  const warning = active.filter(a => a.level === 'warning')
  const opportunity = active.filter(a => a.level === 'opportunity')
  const info = active.filter(a => a.level === 'info')
  const badgeCount = urgent.length + warning.length

  function AlertItem({ a }: { a: ComputedAlert }) {
    const isConfirmed = confirmed.has(a.id)
    return (
      <div style={{
        borderLeft: `4px solid ${a.color}`,
        background: '#fff',
        borderRadius: '0 8px 8px 0',
        marginBottom: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,.06)',
        opacity: isConfirmed ? 0.5 : 1,
        border: `1px solid ${a.color}22`,
        borderLeftColor: a.color,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', background: `${a.color}0c` }}>
          <span style={{ background: `${a.color}18`, color: a.color, border: `1px solid ${a.color}44`, fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>{a.rule}</span>
          <span style={{ fontWeight: 600, fontSize: 11, flex: 1 }}>{a.plan}</span>
          <span style={{ color: '#c62828', fontSize: 10, fontWeight: 600 }}>{a.deadline}</span>
        </div>
        {/* Body */}
        <div style={{ padding: '6px 10px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: a.color, marginBottom: 3 }}>{a.title}</div>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 6 }}>{a.desc}</div>
          {/* Ops bullet list */}
          <div style={{ fontSize: 10, color: '#444', marginBottom: 8 }}>
            {a.ops.map((op, i) => (
              <div key={i} style={{ padding: '1px 0' }}>{i + 1}. {op}</div>
            ))}
          </div>
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setConfirmed(p => { const n = new Set(p); n.add(a.id); return n })}
              style={{ flex: 1, padding: '4px 0', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
              {isConfirmed ? '✓ 已确认' : '✓ 标记已处理'}
            </button>
            <button
              onClick={() => setDismissed(p => { const n = new Set(p); n.add(a.id); return n })}
              style={{ padding: '4px 12px', background: '#f0f0f0', color: '#666', border: 'none', borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
              跳过
            </button>
          </div>
        </div>
      </div>
    )
  }

  function Section({ title, arr, color }: { title: string; arr: ComputedAlert[]; color: string }) {
    if (arr.length === 0) return null
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          {title}
          <span style={{ background: `${color}22`, color, padding: '1px 7px', borderRadius: 10, fontSize: 9 }}>{arr.length}</span>
        </div>
        {arr.map(a => <AlertItem key={a.id} a={a} />)}
      </div>
    )
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 flex flex-col overflow-hidden" style={{ width: 400, background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,.15)' }}>
        {/* Header */}
        <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg, #c62828, #e53935)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>🔔 消息 / 预警中心</span>
            <div style={{ color: 'rgba(255,255,255,.75)', fontSize: 10, marginTop: 2 }}>
              {urgent.length}条紧急 · {warning.length}条预警 · {opportunity.length}条机会
              {badgeCount > 0 && <span style={{ background: '#fff', color: '#c62828', fontWeight: 700, borderRadius: 10, padding: '0 6px', marginLeft: 8, fontSize: 10 }}>{badgeCount}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => setShowNotifyModal(true)}
              style={{ padding: '4px 10px', borderRadius: 16, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.35)', color: '#fff', cursor: 'pointer' }}>
              {notifyStatus === 'ok' ? '✅ 已推送' : notifyStatus === 'sending' ? '推送中…' : '⚡ 推送飞书'}
            </button>
            <button onClick={onClose} style={{ color: 'rgba(255,255,255,.8)', background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {active.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#aaa' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
              <div style={{ fontSize: 13 }}>暂无待处理消息</div>
            </div>
          ) : (
            <>
              <Section title="🔴 紧急待确认" arr={urgent} color="#c62828" />
              <Section title="🟡 预警关注" arr={warning} color="#f57f17" />
              <Section title="🚀 追量机会" arr={opportunity} color="#2e7d32" />
              <Section title="📋 信息提示" arr={info} color="#546e7a" />
            </>
          )}

          {/* Done (dismissed from view but show as history) */}
          {dismissed.size > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', marginBottom: 6 }}>已跳过 ({dismissed.size}条)</div>
              {allAlerts.filter(a => dismissed.has(a.id)).map(a => (
                <div key={a.id} style={{ fontSize: 10, color: '#bbb', padding: '3px 0', borderBottom: '1px solid #f0f0f0' }}>
                  {a.rule} · {a.plan} · {a.title}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {showNotifyModal && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,.4)' }} onClick={() => setShowNotifyModal(false)} />
          <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,.18)', width: 380, pointerEvents: 'auto', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg,#c62828,#e53935)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>⚡ 推送飞书机器人</span>
                <button onClick={() => setShowNotifyModal(false)} style={{ color: 'rgba(255,255,255,.8)', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>✕</button>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>飞书机器人 Webhook URL</div>
                <input
                  ref={webhookRef}
                  defaultValue={webhookUrl}
                  placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/xxx"
                  style={{ width: '100%', border: '1.5px solid #d1d5db', borderRadius: 8, padding: '8px 10px', fontSize: 12, boxSizing: 'border-box', outline: 'none' }}
                  onFocus={e => (e.target.style.borderColor = '#3b82f6')}
                  onBlur={e => (e.target.style.borderColor = '#d1d5db')}
                />
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
                  飞书群内添加机器人 → 自定义机器人 → 复制Webhook地址
                </div>
                <div style={{ marginTop: 14, padding: '10px 12px', background: '#fff8e1', borderRadius: 8, fontSize: 10, color: '#795548' }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>📋 将推送内容预览</div>
                  <div>【全站推广告警】{active.filter(a => a.level === 'urgent').length}条紧急 · {active.filter(a => a.level === 'warning').length}条预警 · {active.filter(a => a.level === 'opportunity').length}条机会</div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button onClick={() => setShowNotifyModal(false)} style={{ flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, border: '1.5px solid #e5e7eb', background: '#fff', color: '#6b7280', cursor: 'pointer' }}>取消</button>
                  <button
                    onClick={async () => { await sendToFeishu(); setShowNotifyModal(false) }}
                    disabled={notifyStatus === 'sending'}
                    style={{ flex: 2, padding: '9px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, border: 'none', background: 'linear-gradient(135deg,#c62828,#e53935)', color: '#fff', cursor: 'pointer' }}>
                    {notifyStatus === 'sending' ? '推送中…' : '立即推送'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
