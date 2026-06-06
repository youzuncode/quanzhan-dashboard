import { useState, useMemo } from 'react'
import { RULE_DEFS, getInspectionHistory } from '../lib/mockData'
import type { PlanData, InspStatus } from '../lib/mockData'

interface Checkpoint {
  time: string
  h: number
  icon: string
  conf: string
  confColor: string
  confBg: string
  label: string
  desc: string
  actions: string[]
  rules: string[]
}

const CHECKPOINTS: Checkpoint[] = [
  {
    time: '09:00', h: 9, icon: '📋', conf: '全量', confColor: '#1a73e8', confBg: '#e3f2fd',
    label: '天规则 + 今日参数输出',
    desc: '基于昨日完整数据，执行四步法，三区间初始化，批量输出今日各计划净目标投产比+每日预算建议',
    actions: [
      '计算全店毛利余量，确定今日动作模式（宽松/紧张/强收紧）',
      '各计划三区间分类（Gross毛利率→三线）',
      '批量设置防停投开关（绿区开/红黄区关）',
      '输出今日参数操作清单（ROI目标+预算值）',
    ],
    rules: ['DT1', 'DT2', 'DT3', 'DT4', 'DT5', 'WK1', 'WK5'],
  },
  {
    time: '12:00', h: 12, icon: '👁️', conf: '低置信度', confColor: '#757575', confBg: '#f5f5f5',
    label: '仅预警推送，不执行操作',
    desc: '约3小时花费数据，数据量不足，触发R1动态阈值确认，但不执行ROI或预算自动操作',
    actions: [
      'R1-A动态阈值检测（异常花费+零成交）',
      '仅推送预警通知，等待下一时点重新判断',
      '红区计划：推送人工确认（不自动操作）',
    ],
    rules: ['R1-A', 'R4'],
  },
  {
    time: '14:00', h: 14, icon: '🛑', conf: '中置信度', confColor: '#e65100', confBg: '#fff3e0',
    label: '三区间差异化止损',
    desc: '约5小时数据，收严阈值执行止损，类目整体费比异常检测，红区计划须在此时点前人工确认',
    actions: [
      '红区计划：ROI上调+剩余预算缩减（R2-B）',
      '黄区计划视全店余量轻压（R2-C）',
      '类目整体费比异常推送（vs历史同期+15%触发）',
      '⚠️ R2-B止损须在此时点前人工确认执行',
    ],
    rules: ['R2-A', 'R2-B', 'R2-C'],
  },
  {
    time: '16:00', h: 16, icon: '💰', conf: '中高置信度', confColor: '#00796b', confBg: '#e0f2f1',
    label: '绿区预算保障',
    desc: '约7小时数据，距晚高峰不足3小时，绿区余量不足的计划追加预算，确认压预算计划执行',
    actions: [
      '绿区计划预算保障：余量<3小时均值×3时追加（R3/DT3）',
      '黄/红区确认压预算操作',
      '预算耗尽预测（中置信度→人工确认后追加）',
    ],
    rules: ['R3', 'DT3'],
  },
  {
    time: '18:00', h: 18, icon: '⭐', conf: '高置信度', confColor: '#1a73e8', confBg: '#e3f2fd',
    label: '⭐ 最重要巡检',
    desc: '约9小时数据，高置信度，无需人工确认自动执行关键操作，绿区追量+黄区禁入晚高峰',
    actions: [
      '绿区+ROI达标+余量极低：强制追加今日预算（R3无需确认）',
      '全店余量<0%：黄区计划ROI强制上调10%，禁入晚高峰',
      '红区：R2-B执行（上调ROI至止损线+剩余预算×0.6）',
      '优先级最高，自动执行无需等待',
    ],
    rules: ['R3', 'R2-B', 'R2-C'],
  },
  {
    time: '20:00', h: 20, icon: '🚀', conf: '高置信度', confColor: '#2e7d32', confBg: '#e8f5e9',
    label: 'R3最后追加 + 亏损标记',
    desc: '约11小时数据，绿区计划最后一次追加预算机会；亏损计划标记[今日超利润目标]备次日处理',
    actions: [
      '绿区+高置信度+余量极低：最后一次追加今日预算（R3）',
      '亏损计划标记[今日超利润目标]（费比>目标费比）',
      '本次追加后不再执行追量操作，防止晚高峰后超预算',
    ],
    rules: ['R3'],
  },
  {
    time: '22:00', h: 22, icon: '📊', conf: '高置信度', confColor: '#1557b0', confBg: '#e8f0fe',
    label: 'DT1-DT5 + 明日参数清单',
    desc: '约13小时全天数据，执行天规则最终判定，输出明日预算+ROI建议，更新预测误差和周毛利余量',
    actions: [
      'DT1-DT5执行：明日每日预算+净目标投产比设定',
      '记录今日预测误差，更新历史误差均值（更新置信度基准）',
      '全店周毛利余量更新（累计本周已完成天数）',
      '输出明日各计划操作清单（含WK1/WK5如为周一）',
    ],
    rules: ['DT1', 'DT2', 'DT3', 'DT4', 'DT5', 'WK1', 'WK4', 'WK5'],
  },
]

interface Props {
  plans: PlanData[]
  onClose: () => void
}

type InspTab = 'today' | 'history' | 'trend'
const statusMeta: Record<InspStatus, { label: string; bg: string; color: string }> = {
  auto: { label: '🤖 自动执行', bg: '#f1f5f9', color: '#475569' },
  confirmed: { label: '✅ 人工确认', bg: '#e8f5e9', color: '#2e7d32' },
  dismissed: { label: '✗ 已忽略', bg: '#f3f4f6', color: '#9ca3af' },
}
const zoneChip = { red: { t: '🔴', c: '#c62828' }, yellow: { t: '🟡', c: '#f57f17' }, green: { t: '🟢', c: '#2e7d32' } }

export function InspectPage({ plans, onClose }: Props) {
  const now = new Date()
  const curH = now.getHours()
  const [tab, setTab] = useState<InspTab>('today')
  const history = useMemo(() => getInspectionHistory(plans), [plans])
  const [histDate, setHistDate] = useState(() => history[history.length - 1]?.date || '')
  const histDay = history.find(d => d.date === histDate) || history[history.length - 1]

  // 时点趋势:按时点跨天聚合
  const trendRows = useMemo(() => {
    return ['09:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'].map(time => {
      let triggers = 0, auto = 0, confirmed = 0, dismissed = 0
      history.forEach(d => {
        const tp = d.timepoints.find(t => t.time === time)
        tp?.results.forEach(r => {
          triggers++
          if (r.status === 'auto') auto++
          else if (r.status === 'confirmed') confirmed++
          else dismissed++
        })
      })
      const manual = confirmed + dismissed
      const confirmRate = manual > 0 ? Math.round(confirmed / manual * 100) : null
      return { time, triggers, auto, confirmed, dismissed, confirmRate }
    })
  }, [history])
  const trendMax = Math.max(1, ...trendRows.map(r => r.triggers))

  // Auto-select the checkpoint closest to current time
  function getDefaultSelected() {
    const hours = CHECKPOINTS.map(c => c.h)
    // Find last checkpoint that has already started or is current
    for (let i = hours.length - 1; i >= 0; i--) {
      if (curH >= hours[i]) return i
    }
    return 0
  }

  const [selected, setSelected] = useState(getDefaultSelected)

  function getDotCls(h: number) {
    if (curH > h) return 'done'
    if (curH === h) return 'now'
    return 'pending'
  }

  function getStatusLabel(h: number) {
    const dot = getDotCls(h)
    if (dot === 'done') return { text: '✓ 已完成', color: '#2e7d32', bg: '#e8f5e9' }
    if (dot === 'now') return { text: '● 进行中', color: '#1557b0', bg: '#e3f2fd' }
    return { text: '○ 待执行', color: '#9e9e9e', bg: '#f5f5f5' }
  }

  function getTimeInfo(h: number) {
    const dot = getDotCls(h)
    const minutesAway = (h - curH) * 60 - now.getMinutes()
    if (dot === 'done') return `已完成 ${Math.abs(minutesAway)} 分钟前`
    if (dot === 'now') return '当前时点执行中'
    if (minutesAway < 60) return `距执行 ${minutesAway} 分钟`
    return `距执行约 ${Math.floor(minutesAway / 60)} 小时`
  }

  const cp = CHECKPOINTS[selected]
  const statusLabel = getStatusLabel(cp.h)
  const timeInfo = getTimeInfo(cp.h)

  // Per-plan simulation
  const planRows = plans.map(p => {
    const gross = p.gross
    const sl = (1 / gross) * 100
    const pt = gross * 100 - 10
    const f = p.febi * 100
    const zone = f > sl ? 'R' : f > pt ? 'Y' : 'G'
    const zoneColor = { G: '#2e7d32', Y: '#f57f17', R: '#c62828' }[zone]
    const zoneLabel2 = { G: '🟢', Y: '🟡', R: '🔴' }[zone]

    const applicableRules = cp.rules.filter(rk => {
      if (zone === 'G' && ['R2-A', 'R2-B', 'R2-C', 'DT1'].includes(rk)) return false
      if (zone === 'R' && ['R3', 'DT3', 'DT2'].includes(rk)) return false
      return true
    })

    const simRoi = p.roiTarget
    const roiComp = (p.spend > 0 && p.budget > 0) ? ((p.spend / p.budget) / (1 / simRoi)) * 100 : 80

    let actionSummary = '—'
    if (selected === 0) {
      actionSummary = `ROI目标 ${simRoi}，预算 ¥${p.budget}`
    } else if (selected === 2 && zone === 'R') {
      actionSummary = `⚠️ 红区止损：ROI→${(simRoi * 1.10).toFixed(2)}，剩余预算×0.60`
    } else if (selected === 4 && zone === 'G' && roiComp >= 120) {
      actionSummary = `🚀 强制追量：今日预算+17%`
    } else if (selected === 6) {
      actionSummary = `明日参数：ROI ${simRoi.toFixed(2)}，预算 ¥${p.budget}`
    } else if (zone === 'Y') {
      actionSummary = `🟡 黄区监控`
    } else if (zone === 'G') {
      actionSummary = `🟢 绿区正常`
    } else {
      actionSummary = `🔴 红区警戒`
    }

    return { name: p.name, zone, zoneColor, zoneLabel: zoneLabel2, actionSummary, applicableRules }
  })

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-gray-100">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 h-14 text-white flex-shrink-0"
        style={{ background: 'linear-gradient(135deg,#11294d,#1557b0)' }}>
        <div className="flex-1">
          <div className="font-bold text-base">⏰ 7时点巡检面板</div>
          <div className="text-xs opacity-70 mt-0.5">今日巡检状态 · 置信度分级 · 规则触发情况 · 操作输出</div>
        </div>
        <button onClick={onClose}
          className="text-white text-lg font-bold w-8 h-8 flex items-center justify-center rounded-full"
          style={{ background: 'rgba(255,255,255,.2)' }}>✕</button>
      </div>

      {/* Tabs */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 18px', display: 'flex', gap: 4, flexShrink: 0 }}>
        {([['today', '🕐 今日操作台'], ['history', '📅 历史回看'], ['trend', '📈 时点趋势']] as [InspTab, string][]).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{
              padding: '10px 16px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', background: 'none', border: 'none',
              borderBottom: `2.5px solid ${tab === k ? '#1557b0' : 'transparent'}`,
              color: tab === k ? '#1557b0' : '#6b7280',
            }}>
            {l}
          </button>
        ))}
        {tab !== 'today' && (
          <span style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: 10, fontWeight: 700, color: '#92400e', background: '#fef3c7', padding: '2px 8px', borderRadius: 4 }}>模拟历史</span>
        )}
      </div>

      {/* ── 今日操作台 ── */}
      {tab === 'today' && (
      <div className="flex flex-1 overflow-hidden">
        {/* Left timeline */}
        <div className="flex-shrink-0 overflow-y-auto bg-gray-50 border-r border-gray-200 py-3"
          style={{ width: 220 }}>
          {CHECKPOINTS.map((c, idx) => {
            const dot = getDotCls(c.h)
            const st = getStatusLabel(c.h)
            return (
              <div key={c.time}
                onClick={() => setSelected(idx)}
                className={`px-4 py-2.5 cursor-pointer relative flex gap-2.5 items-start transition-colors hover:bg-blue-50
                  ${selected === idx ? 'bg-blue-50' : ''}`}>
                {/* Dot */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5
                  ${dot === 'done' ? 'bg-green-50 border-2 border-green-600' :
                    dot === 'now' ? 'bg-blue-50 border-2 border-blue-700 shadow-[0_0_0_3px_rgba(40,53,147,.15)] animate-pulse' :
                    'bg-gray-100 border-2 border-gray-300'}`}>
                  {c.icon}
                </div>
                {/* Connector line */}
                {idx < CHECKPOINTS.length - 1 && (
                  <div className="absolute left-7 top-9 bottom-0 w-0.5 bg-gray-200" style={{ height: 'calc(100% - 12px)' }} />
                )}
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-black ${selected === idx ? 'text-blue-800' : 'text-gray-800'}`}>{c.time}</div>
                  <div className="text-xs text-gray-500 leading-tight mt-0.5">{c.label}</div>
                  <div className="text-xs font-bold mt-1" style={{ color: st.color }}>{st.text}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right detail */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
            <div className="font-black text-blue-800" style={{ fontSize: 32 }}>{cp.time}</div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: statusLabel.bg, color: statusLabel.color }}>
                  {statusLabel.text}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: cp.confBg, color: cp.confColor }}>
                  {cp.conf}
                </span>
              </div>
              <div className="text-xs text-gray-500">{timeInfo}</div>
            </div>
            <div className="ml-auto text-3xl">{cp.icon}</div>
          </div>

          {/* Description */}
          <div className="text-xs text-gray-500 mb-4 leading-relaxed">{cp.desc}</div>

          {/* 本时点核心动作 */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
            <div className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-1.5">
              📋 本时点核心动作
            </div>
            <div className="space-y-1.5">
              {cp.actions.map((a, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-700 py-1 border-b border-gray-50 last:border-0">
                  <span className="text-blue-600 mt-0.5 flex-shrink-0">▶</span>
                  <span>{a}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 各计划执行情况 */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
            <div className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-2">
              📌 各计划执行情况
              <span className="text-xs font-normal text-gray-400">（基于当日数据模拟）</span>
            </div>
            <div className="space-y-0">
              {planRows.map((row, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                  <span className="font-bold text-xs" style={{ minWidth: 110, maxWidth: 130 }} title={row.name}>
                    {row.name}
                  </span>
                  <span className="text-xs font-bold" style={{ color: row.zoneColor }}>{row.zoneLabel}</span>
                  <span className="text-xs text-gray-500 flex-1">{row.actionSummary}</span>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {row.applicableRules.slice(0, 4).map(rk => {
                      const rd = RULE_DEFS.find(r => r.key === rk)
                      if (!rd) return null
                      return (
                        <span key={rk} className="text-xs font-bold px-1.5 py-0.5 rounded-full border"
                          style={{
                            background: rd.color + '18',
                            color: rd.color,
                            borderColor: rd.color + '44',
                            fontSize: 9,
                          }}>
                          {rd.icon}{rk}
                        </span>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 本时点激活规则 */}
          <div className="border border-gray-200 rounded-lg p-3" style={{ background: '#f6f8fa' }}>
            <div className="text-xs font-bold text-blue-800 mb-2">📏 本时点激活规则</div>
            <div className="flex flex-wrap gap-2">
              {cp.rules.map(rk => {
                const rd = RULE_DEFS.find(r => r.key === rk)
                if (!rd) return null
                return (
                  <span key={rk} className="text-xs font-bold px-2.5 py-1 rounded-full border"
                    style={{
                      background: rd.color + '18',
                      color: rd.color,
                      borderColor: rd.color + '55',
                    }}>
                    {rd.icon} {rd.key} · {rd.label}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ── 历史回看 ── */}
      {tab === 'history' && (
        <div className="flex-1 overflow-y-auto p-4">
          {/* 完成度热力条 */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4">
            <div className="text-xs font-bold text-blue-800 mb-2.5">📅 近 {history.length} 天巡检完成度（点击查看当天）</div>
            <div className="flex gap-1.5 flex-wrap">
              {history.map(d => {
                const sel = d.date === histDate
                const color = d.triggers === 0 ? '#e5e7eb' : d.dismissed > 0 ? '#fbbf24' : '#34d399'
                return (
                  <button key={d.date} onClick={() => setHistDate(d.date)}
                    title={`${d.date} · ${d.triggers}次触发 · 忽略${d.dismissed}`}
                    style={{
                      width: 56, padding: '6px 4px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                      border: sel ? '2px solid #1557b0' : '1px solid #e5e7eb', background: sel ? '#e8f0fe' : '#fff',
                    }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#374151' }}>{d.date}</div>
                    <div style={{ height: 6, borderRadius: 3, background: color, margin: '4px 2px 3px' }} />
                    <div style={{ fontSize: 9, color: '#9ca3af' }}>{d.triggers}次</div>
                  </button>
                )
              })}
            </div>
            <div className="flex gap-4 mt-2.5" style={{ fontSize: 10, color: '#9ca3af' }}>
              <span><span style={{ display: 'inline-block', width: 10, height: 6, borderRadius: 3, background: '#34d399', verticalAlign: 'middle' }} /> 全部处理</span>
              <span><span style={{ display: 'inline-block', width: 10, height: 6, borderRadius: 3, background: '#fbbf24', verticalAlign: 'middle' }} /> 有忽略</span>
              <span><span style={{ display: 'inline-block', width: 10, height: 6, borderRadius: 3, background: '#e5e7eb', verticalAlign: 'middle' }} /> 无触发</span>
            </div>
          </div>

          {/* 当天汇总 */}
          {histDay && (
            <>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className="font-black text-blue-800" style={{ fontSize: 22 }}>{histDay.date}</span>
                {[['触发', histDay.triggers, '#1557b0'], ['自动执行', histDay.auto, '#475569'], ['人工确认', histDay.confirmed, '#2e7d32'], ['已忽略', histDay.dismissed, histDay.dismissed ? '#c62828' : '#9ca3af']].map(([l, v, c]) => (
                  <span key={String(l)} style={{ fontSize: 12, color: '#6b7280' }}>{String(l)} <strong style={{ color: c as string, fontSize: 14 }}>{v}</strong></span>
                ))}
              </div>

              {/* 7时点 */}
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {histDay.timepoints.map(tp => (
                  <div key={tp.time} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2" style={{ background: '#f9fafb' }}>
                      <span className="font-bold text-sm">{tp.time}</span>
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                        style={{ background: tp.conf === 'H' ? '#e8f5e9' : tp.conf === 'M' ? '#fff8e1' : '#f5f5f5', color: tp.conf === 'H' ? '#2e7d32' : tp.conf === 'M' ? '#f57f17' : '#757575' }}>
                        {tp.conf}置信
                      </span>
                      <span className="ml-auto text-xs text-gray-400">{tp.results.length}项</span>
                    </div>
                    <div className="p-2">
                      {tp.results.length === 0
                        ? <div className="text-center text-gray-300 text-xs py-3">无触发</div>
                        : tp.results.map((r, i) => {
                          const rd = RULE_DEFS.find(x => x.key === r.rule)
                          const sm = statusMeta[r.status]
                          return (
                            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                              <span style={{ color: zoneChip[r.zone].c, fontSize: 11 }}>{zoneChip[r.zone].t}</span>
                              <span className="font-semibold text-xs truncate" style={{ maxWidth: 90 }} title={r.plan}>{r.plan}</span>
                              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full border" style={{ fontSize: 9, background: (rd?.color || '#999') + '18', color: rd?.color || '#999', borderColor: (rd?.color || '#999') + '44' }}>{r.rule}</span>
                              <span className="ml-auto text-xs px-1.5 py-0.5 rounded font-semibold whitespace-nowrap" style={{ fontSize: 9, background: sm.bg, color: sm.color }}>{sm.label}</span>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── 时点趋势 ── */}
      {tab === 'trend' && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-xs text-gray-500 mb-3">跨 {history.length} 天聚合 · 看每个巡检时点的触发量与人工确认习惯,定位最有用 / 最常被忽略的时点。</div>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['时点', '触发量(近14天)', '🤖自动', '✅人工确认', '✗忽略', '人工确认率'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-bold text-gray-500" style={{ borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trendRows.map(r => (
                  <tr key={r.time} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td className="px-3 py-2 font-bold">{r.time}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div style={{ height: 8, width: `${Math.round(r.triggers / trendMax * 100)}%`, minWidth: 2, background: '#1a73e8', borderRadius: 4 }} />
                        <span className="font-bold text-gray-700">{r.triggers}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-500">{r.auto}</td>
                    <td className="px-3 py-2 text-green-700 font-semibold">{r.confirmed}</td>
                    <td className="px-3 py-2" style={{ color: r.dismissed ? '#c62828' : '#9ca3af' }}>{r.dismissed}</td>
                    <td className="px-3 py-2">
                      {r.confirmRate == null
                        ? <span className="text-gray-300">— 全自动</span>
                        : <span className="font-bold" style={{ color: r.confirmRate >= 80 ? '#2e7d32' : r.confirmRate >= 50 ? '#f57f17' : '#c62828' }}>{r.confirmRate}%</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-gray-400 mt-2 leading-relaxed">
            人工确认率低 = 该时点系统建议常被运营否决,可能阈值偏激进或时机不对,值得回查规则参数。
          </div>
        </div>
      )}
    </div>
  )
}
