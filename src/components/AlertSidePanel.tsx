import { useState, useRef } from 'react'
import { loadJSON, saveJSON } from '../lib/persist'

const LS_DISMISSED = 'alerts.dismissed'
const LS_CONFIRMED = 'alerts.confirmed'
const LS_PUSH_HIST = 'alerts.pushHistory'
import type { PlanData } from '../lib/mockData'

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

function collectAlerts(plans: PlanData[]): ComputedAlert[] {
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
  plans: PlanData[]
  onClose: () => void
}

interface PushRecord { time: string; summary: string; status: 'ok' | 'err' }

export function AlertSidePanel({ plans, onClose }: Props) {
  const allAlerts = collectAlerts(plans)
  const [dismissed, setDismissedRaw] = useState<Set<string>>(() => new Set(loadJSON<string[]>(LS_DISMISSED, [])))
  const [confirmed, setConfirmedRaw] = useState<Set<string>>(() => new Set(loadJSON<string[]>(LS_CONFIRMED, [])))
  const [showNotifyModal, setShowNotifyModal] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem('feishu_webhook') || '')
  const [notifyStatus, setNotifyStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle')
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'err'>('idle')
  const [pushHistory, setPushHistoryRaw] = useState<PushRecord[]>(() => loadJSON<PushRecord[]>(LS_PUSH_HIST, []))
  const [showHistory, setShowHistory] = useState(false)

  // Persistent setters — write through to localStorage on every mutation
  function setDismissed(u: (p: Set<string>) => Set<string>) {
    setDismissedRaw(prev => { const next = u(prev); saveJSON(LS_DISMISSED, [...next]); return next })
  }
  function setConfirmed(u: (p: Set<string>) => Set<string>) {
    setConfirmedRaw(prev => { const next = u(prev); saveJSON(LS_CONFIRMED, [...next]); return next })
  }
  function setPushHistory(u: (p: PushRecord[]) => PushRecord[]) {
    setPushHistoryRaw(prev => { const next = u(prev); saveJSON(LS_PUSH_HIST, next); return next })
  }
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
      const now2 = new Date()
      const timeStr2 = `${now2.getHours()}:${String(now2.getMinutes()).padStart(2, '0')}`
      setPushHistory(prev => [{ time: timeStr2, summary: `${urgent.length}紧急·${warning.length}预警·${opp.length}机会`, status: 'ok' as const }, ...prev].slice(0, 20))
      setTimeout(() => setNotifyStatus('idle'), 3000)
    } catch {
      setNotifyStatus('err')
      const now2 = new Date()
      const timeStr2 = `${now2.getHours()}:${String(now2.getMinutes()).padStart(2, '0')}`
      setPushHistory(prev => [{ time: timeStr2, summary: '发送失败', status: 'err' as const }, ...prev].slice(0, 20))
      setTimeout(() => setNotifyStatus('idle'), 3000)
    }
  }

  async function testWebhook() {
    const url = webhookRef.current?.value.trim() || webhookUrl
    if (!url) return
    setTestStatus('testing')
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msg_type: 'text', content: { text: '【测试】全站推广决策看板 Webhook 连接测试成功 ✅' } }),
      })
      setTestStatus('ok')
      setTimeout(() => setTestStatus('idle'), 3000)
    } catch {
      setTestStatus('err')
      setTimeout(() => setTestStatus('idle'), 3000)
    }
  }

  const active = allAlerts.filter(a => !dismissed.has(a.id))
  const urgent = active.filter(a => a.level === 'urgent')
  const warning = active.filter(a => a.level === 'warning')
  const opportunity = active.filter(a => a.level === 'opportunity')
  const info = active.filter(a => a.level === 'info')
  const badgeCount = urgent.length + warning.length

  function AlertRow({ a }: { a: ComputedAlert }) {
    const isConfirmed = confirmed.has(a.id)
    const [expanded, setExpanded] = useState(false)
    return (
      <div style={{
        display: 'flex', alignItems: 'stretch',
        background: '#fff',
        borderLeft: `4px solid ${a.color}`,
        borderBottom: '1px solid #f0f0f0',
        opacity: isConfirmed ? 0.5 : 1,
      }}>
        {/* Rule badge */}
        <div style={{ flexShrink: 0, width: 54, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>
          <span style={{ background: `${a.color}18`, color: a.color, border: `1px solid ${a.color}44`, fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, whiteSpace: 'nowrap' }}>{a.rule}</span>
        </div>
        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0, padding: '8px 8px 8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: a.color, whiteSpace: 'nowrap' }}>{a.title}</span>
            <span style={{ fontSize: 11, color: '#374151', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.plan}</span>
            <span style={{ color: '#c62828', fontSize: 10, fontWeight: 600, marginLeft: 'auto', flexShrink: 0, whiteSpace: 'nowrap' }}>{a.deadline}</span>
          </div>
          <div style={{ fontSize: 10, color: '#666', marginTop: 3, overflow: expanded ? 'visible' : 'hidden', textOverflow: 'ellipsis', whiteSpace: expanded ? 'normal' : 'nowrap' }}>{a.desc}</div>
          {expanded && (
            <div style={{ fontSize: 10, color: '#444', marginTop: 6, paddingLeft: 2 }}>
              {a.ops.map((op, i) => (
                <div key={i} style={{ padding: '1px 0' }}>{i + 1}. {op}</div>
              ))}
            </div>
          )}
          <button onClick={() => setExpanded(e => !e)} style={{ fontSize: 9.5, color: '#1a73e8', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0 0', fontWeight: 600 }}>
            {expanded ? '收起 ▲' : `操作建议 ${a.ops.length}项 ▼`}
          </button>
        </div>
        {/* Action buttons */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px' }}>
          <button
            onClick={() => setConfirmed(p => { const n = new Set(p); n.add(a.id); return n })}
            style={{ padding: '4px 10px', background: isConfirmed ? '#e8f5e9' : '#2e7d32', color: isConfirmed ? '#2e7d32' : '#fff', border: 'none', borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {isConfirmed ? '✓ 已确认' : '✓ 处理'}
          </button>
          <button
            onClick={() => setDismissed(p => { const n = new Set(p); n.add(a.id); return n })}
            style={{ padding: '4px 10px', background: '#f0f0f0', color: '#666', border: 'none', borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            跳过
          </button>
        </div>
      </div>
    )
  }

  function Section({ title, arr, color }: { title: string; arr: ComputedAlert[]; color: string }) {
    if (arr.length === 0) return null
    return (
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          {title}
          <span style={{ background: `${color}22`, color, padding: '1px 7px', borderRadius: 10, fontSize: 10 }}>{arr.length}</span>
        </div>
        <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          {arr.map(a => <AlertRow key={a.id} a={a} />)}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Full-screen page */}
      <div className="fixed inset-0 z-50 flex flex-col overflow-hidden" style={{ background: '#f6f8fa' }}>
        {/* Header */}
        <div style={{ padding: '12px 18px', background: 'linear-gradient(135deg, #c62828, #e53935)', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', cursor: 'pointer' }}>
            ← 返回看板
          </button>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>🔔 消息 / 预警中心</div>
            <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 11, marginTop: 1 }}>
              {urgent.length}条紧急 · {warning.length}条预警 · {opportunity.length}条机会
              {badgeCount > 0 && <span style={{ background: '#fff', color: '#c62828', fontWeight: 700, borderRadius: 10, padding: '0 7px', marginLeft: 8, fontSize: 10 }}>{badgeCount}</span>}
            </div>
          </div>
          <button
            onClick={() => setShowNotifyModal(true)}
            style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.35)', color: '#fff', cursor: 'pointer' }}>
            {notifyStatus === 'ok' ? '✅ 已推送' : notifyStatus === 'sending' ? '推送中…' : '⚡ 推送飞书'}
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            {active.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', color: '#aaa' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 14 }}>暂无待处理消息</div>
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
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 8 }}>已跳过 ({dismissed.size}条)</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 6 }}>
                  {allAlerts.filter(a => dismissed.has(a.id)).map(a => (
                    <div key={a.id} style={{ fontSize: 11, color: '#bbb', padding: '4px 8px', background: '#fff', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.rule} · {a.plan} · {a.title}</span>
                      <button onClick={() => setDismissed(p => { const n = new Set(p); n.delete(a.id); return n })}
                        style={{ fontSize: 10, color: '#1a73e8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, flexShrink: 0 }}>恢复</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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
                  onFocus={e => (e.target.style.borderColor = '#1a73e8')}
                  onBlur={e => (e.target.style.borderColor = '#d1d5db')}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <div style={{ fontSize: 10, color: '#9ca3af' }}>飞书群内添加机器人 → 自定义机器人 → 复制地址</div>
                  <button onClick={testWebhook} disabled={testStatus === 'testing'}
                    style={{ padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, border: '1px solid #e5e7eb', background: testStatus === 'ok' ? '#e8f5e9' : testStatus === 'err' ? '#ffebee' : '#f9fafb', color: testStatus === 'ok' ? '#2e7d32' : testStatus === 'err' ? '#c62828' : '#6b7280', cursor: 'pointer' }}>
                    {testStatus === 'testing' ? '测试中…' : testStatus === 'ok' ? '✅ 连通' : testStatus === 'err' ? '❌ 失败' : '测试连接'}
                  </button>
                </div>
                <div style={{ marginTop: 12, padding: '10px 12px', background: '#fff8e1', borderRadius: 8, fontSize: 10, color: '#795548' }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>📋 推送内容预览</div>
                  <div>【全站推广告警】{active.filter(a => a.level === 'urgent').length}条紧急 · {active.filter(a => a.level === 'warning').length}条预警 · {active.filter(a => a.level === 'opportunity').length}条机会</div>
                </div>
                {pushHistory.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <button onClick={() => setShowHistory(!showHistory)} style={{ fontSize: 10, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      📋 推送历史（{pushHistory.length}条）{showHistory ? ' ▲' : ' ▼'}
                    </button>
                    {showHistory && (
                      <div style={{ marginTop: 6, maxHeight: 100, overflowY: 'auto' }}>
                        {pushHistory.map((r, i) => (
                          <div key={i} style={{ fontSize: 10, padding: '3px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: 8, color: r.status === 'ok' ? '#2e7d32' : '#c62828' }}>
                            <span>{r.time}</span>
                            <span>{r.status === 'ok' ? '✅' : '❌'} {r.summary}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
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
