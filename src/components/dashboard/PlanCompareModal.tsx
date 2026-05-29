import type { PlanData } from '../../lib/mockData'

interface Props {
  plans: PlanData[]
  onClose: () => void
}

const zoneLabel: Record<string, string> = { red: '🔴 红区', yellow: '🟡 黄区', green: '🟢 绿区' }
const zoneColor: Record<string, string> = { red: '#c62828', yellow: '#f57f17', green: '#2e7d32' }
const confColor: Record<string, string> = { H: '#2e7d32', M: '#f57f17', L: '#c62828' }

export function PlanCompareModal({ plans, onClose }: Props) {
  const colW = `${Math.floor(100 / (plans.length + 1))}%`

  function MetricRow({ label, render }: { label: string; render: (p: PlanData) => React.ReactNode }) {
    return (
      <tr style={{ borderBottom: '1px solid #f3f4f6' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
        onMouseLeave={e => (e.currentTarget.style.background = '')}>
        <td style={{ padding: '7px 14px', fontSize: 11, color: '#6b7280', fontWeight: 600, width: colW, verticalAlign: 'middle' }}>{label}</td>
        {plans.map(p => (
          <td key={p.name} style={{ padding: '7px 10px', fontSize: 12, textAlign: 'center', width: colW, verticalAlign: 'middle' }}>
            {render(p)}
          </td>
        ))}
      </tr>
    )
  }

  // Best/worst helpers
  function best(vals: number[], higherIsBetter = true) {
    const target = higherIsBetter ? Math.max(...vals) : Math.min(...vals)
    return vals.map(v => v === target)
  }

  const spendUtils = plans.map(p => p.budget > 0 ? p.spend / p.budget : 0)
  const rois = plans.map(p => p.roiTarget)
  const febis = plans.map(p => p.febi)
  const grossMargins = plans.map(p => p.gross)
  const spends = plans.map(p => p.spend)
  const budgets = plans.map(p => p.budget)

  function Chip({ val, bg, color }: { val: string; bg: string; color: string }) {
    return <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, background: bg, color, fontSize: 11, fontWeight: 700 }}>{val}</span>
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-6">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-full overflow-auto pointer-events-auto">
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg,#283593,#1565c0)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>📊 多计划横向对比</div>
            <button onClick={onClose} style={{ color: 'rgba(255,255,255,.8)', background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            {/* Column headers */}
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textAlign: 'left', width: colW }}>指标</th>
                {plans.map(p => (
                  <th key={p.name} style={{ padding: '10px 10px', fontSize: 12, fontWeight: 700, color: zoneColor[p.zone], textAlign: 'center', width: colW }}>
                    <div>{p.name}</div>
                    <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 400, marginTop: 2 }}>{zoneLabel[p.zone]}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Zone */}
              <MetricRow label="区间状态" render={p => (
                <Chip val={zoneLabel[p.zone]} bg={`${zoneColor[p.zone]}18`} color={zoneColor[p.zone]} />
              )} />

              {/* ROI Target */}
              <MetricRow label="ROI目标" render={(p, ) => {
                const isBest = best(rois, true)[plans.indexOf(p)]
                return <span style={{ fontWeight: 700, color: isBest ? '#2e7d32' : '#374151', fontSize: 14 }}>{p.roiTarget}</span>
              }} />

              {/* 今日费比 */}
              <MetricRow label="今日费比" render={p => {
                const isBest = best(febis, false)[plans.indexOf(p)]
                const color = p.febi * 100 > p.gross * 100 ? '#c62828' : p.febi * 100 > (p.gross * 100 - 10) ? '#f57f17' : '#2e7d32'
                return <span style={{ fontWeight: 700, color: isBest ? '#2e7d32' : color }}>{(p.febi * 100).toFixed(1)}%</span>
              }} />

              {/* 毛利率 */}
              <MetricRow label="商品毛利率" render={p => {
                const isBest = best(grossMargins, true)[plans.indexOf(p)]
                return <span style={{ fontWeight: 700, color: isBest ? '#2e7d32' : '#374151' }}>{(p.gross * 100).toFixed(0)}%</span>
              }} />

              {/* 止损ROI */}
              <MetricRow label="止损ROI" render={p => (
                <span style={{ color: '#9ca3af' }}>{(1 / p.gross).toFixed(2)}</span>
              )} />

              {/* 目标费比 */}
              <MetricRow label="目标费比上限" render={p => (
                <span style={{ color: '#6b7280' }}>{(p.gross * 100 - 10).toFixed(0)}%</span>
              )} />

              {/* 今日花费 */}
              <MetricRow label="今日花费" render={p => {
                const isBest = best(spends, true)[plans.indexOf(p)]
                return <span style={{ fontWeight: 700, color: isBest ? '#2e7d32' : '#374151' }}>¥{p.spend.toLocaleString()}</span>
              }} />

              {/* 每日预算 */}
              <MetricRow label="每日预算" render={p => {
                const isBest = best(budgets, true)[plans.indexOf(p)]
                return <span style={{ fontWeight: 700, color: isBest ? '#2e7d32' : '#374151' }}>¥{p.budget.toLocaleString()}</span>
              }} />

              {/* 预算利用率 */}
              <MetricRow label="预算利用率" render={p => {
                const isBest = best(spendUtils, true)[plans.indexOf(p)]
                const pct = p.budget > 0 ? Math.round(p.spend / p.budget * 100) : 0
                const color = pct > 90 ? '#c62828' : pct > 60 ? '#2e7d32' : '#f57f17'
                return <span style={{ fontWeight: 700, color: isBest ? '#2e7d32' : color }}>{pct}%</span>
              }} />

              {/* 置信度 */}
              <MetricRow label="预测置信度" render={p => (
                <Chip
                  val={{ H: '高', M: '中', L: '低' }[p.conf]!}
                  bg={`${confColor[p.conf]}18`}
                  color={confColor[p.conf]}
                />
              )} />

              {/* 防停投 */}
              <MetricRow label="优质计划防停投" render={p => (
                <span style={{ fontSize: 13 }}>{p.guard ? '✅ 开启' : '⭕ 关闭'}</span>
              )} />

              {/* 规则触发 */}
              <MetricRow label="当前规则触发" render={p => (
                <span style={{ fontSize: 10, color: p.rule === '—' ? '#9ca3af' : '#374151', fontWeight: p.rule === '—' ? 400 : 600 }}>{p.rule}</span>
              )} />

              {/* 盈亏评估 */}
              <MetricRow label="盈亏状态" render={p => {
                const febi = p.febi * 100
                const sl = (1 / p.gross) * 100
                const pt = p.gross * 100 - 10
                const gap = febi > sl ? febi - sl : febi > pt ? febi - pt : pt - febi
                const isLoss = febi > sl
                const isWarn = febi > pt
                return (
                  <div>
                    <div style={{ fontWeight: 700, color: isLoss ? '#c62828' : isWarn ? '#f57f17' : '#2e7d32', fontSize: 11 }}>
                      {isLoss ? '亏损' : isWarn ? '预警' : '盈利'}
                    </div>
                    <div style={{ fontSize: 9, color: '#9ca3af' }}>
                      {isLoss ? `超止损${gap.toFixed(1)}%` : isWarn ? `超目标${gap.toFixed(1)}%` : `余量${gap.toFixed(1)}%`}
                    </div>
                  </div>
                )
              }} />
            </tbody>
          </table>

          <div style={{ padding: '10px 14px', background: '#f9fafb', fontSize: 10, color: '#9ca3af', borderTop: '1px solid #e5e7eb' }}>
            绿色高亮为同维度最优值
          </div>
        </div>
      </div>
    </>
  )
}
