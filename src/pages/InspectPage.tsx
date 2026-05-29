import { useState } from 'react'
import { plans, RULE_DEFS } from '../lib/mockData'

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
    time: '09:00', h: 9, icon: '📋', conf: '全量', confColor: '#1565c0', confBg: '#e3f2fd',
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
    time: '18:00', h: 18, icon: '⭐', conf: '高置信度', confColor: '#1565c0', confBg: '#e3f2fd',
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
    time: '22:00', h: 22, icon: '📊', conf: '高置信度', confColor: '#283593', confBg: '#e8eaf6',
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
  onClose: () => void
}

export function InspectPage({ onClose }: Props) {
  const [selected, setSelected] = useState(2) // default 14:00
  const now = new Date()
  const curH = now.getHours()

  function getDotCls(h: number) {
    if (curH > h) return 'done'
    if (curH === h) return 'now'
    return 'pending'
  }

  function getStatusLabel(h: number) {
    const dot = getDotCls(h)
    if (dot === 'done') return { text: '✓ 已完成', color: '#2e7d32', bg: '#e8f5e9' }
    if (dot === 'now') return { text: '● 进行中', color: '#283593', bg: '#e3f2fd' }
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
        style={{ background: 'linear-gradient(135deg,#0d3c61,#1a5f8a)' }}>
        <div className="flex-1">
          <div className="font-bold text-base">⏰ 7时点巡检面板</div>
          <div className="text-xs opacity-70 mt-0.5">今日巡检状态 · 置信度分级 · 规则触发情况 · 操作输出</div>
        </div>
        <button onClick={onClose}
          className="text-white text-lg font-bold w-8 h-8 flex items-center justify-center rounded-full"
          style={{ background: 'rgba(255,255,255,.2)' }}>✕</button>
      </div>

      {/* Layout */}
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
                  ${selected === idx ? 'bg-indigo-50' : ''}`}>
                {/* Dot */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5
                  ${dot === 'done' ? 'bg-green-50 border-2 border-green-600' :
                    dot === 'now' ? 'bg-blue-50 border-2 border-indigo-700 shadow-[0_0_0_3px_rgba(40,53,147,.15)] animate-pulse' :
                    'bg-gray-100 border-2 border-gray-300'}`}>
                  {c.icon}
                </div>
                {/* Connector line */}
                {idx < CHECKPOINTS.length - 1 && (
                  <div className="absolute left-7 top-9 bottom-0 w-0.5 bg-gray-200" style={{ height: 'calc(100% - 12px)' }} />
                )}
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-black ${selected === idx ? 'text-indigo-800' : 'text-gray-800'}`}>{c.time}</div>
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
            <div className="font-black text-indigo-800" style={{ fontSize: 32 }}>{cp.time}</div>
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
            <div className="text-xs font-bold text-indigo-800 mb-2 flex items-center gap-1.5">
              📋 本时点核心动作
            </div>
            <div className="space-y-1.5">
              {cp.actions.map((a, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-700 py-1 border-b border-gray-50 last:border-0">
                  <span className="text-indigo-600 mt-0.5 flex-shrink-0">▶</span>
                  <span>{a}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 各计划执行情况 */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
            <div className="text-xs font-bold text-indigo-800 mb-2 flex items-center gap-2">
              📌 各计划执行情况
              <span className="text-xs font-normal text-gray-400">（基于当日数据模拟）</span>
            </div>
            <div className="space-y-0">
              {planRows.map((row, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                  <span className="font-bold text-xs min-w-[72px] truncate" title={row.name}>
                    {row.name.slice(0, 5)}…
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
          <div className="border border-gray-200 rounded-lg p-3" style={{ background: '#f8f9fe' }}>
            <div className="text-xs font-bold text-indigo-800 mb-2">📏 本时点激活规则</div>
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
    </div>
  )
}
