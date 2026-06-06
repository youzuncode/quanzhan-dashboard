import type { PlanData } from '../lib/mockData'

interface Props {
  storeConfig: { febi: number; weeklyNetProfit: number; weeklyTarget: number; grossMargin: number; targetFebi: number; totalSpend: number; totalRevenue: number; triggeredRulesCount: number; storeMarginGap?: number }
  storePlans: PlanData[]
}

function fmt(v: number, d = 0) {
  return v >= 10000 ? (v / 10000).toFixed(1) + '万' : v.toFixed(d)
}

function computeStoreMetrics(store: Props['storeConfig'], plans: Props['storePlans']) {
  const zones = { G: 0, Y: 0, R: 0 }
  plans.forEach(p => {
    if (p.zone === 'green') zones.G++
    else if (p.zone === 'yellow') zones.Y++
    else zones.R++
  })

  const totalSpend = store.totalSpend
  const totalRev = store.totalRevenue
  const storeROI = totalSpend > 0 ? totalRev / totalSpend : 0
  const storeFebi = totalRev > 0 ? (totalSpend / totalRev * 100) : 0

  const surplus = (store.weeklyNetProfit - 0.10) * 100  // % vs 10% target
  let mode: string, mc: string, mbg: string, mBorder: string
  const diff = store.weeklyNetProfit - store.weeklyTarget
  if (diff > 0.05)       { mode = '🟢 宽松';  mc = '#2e7d32'; mbg = '#e8f5e9'; mBorder = '#2e7d32' }
  else if (diff > 0.02)  { mode = '🔵 达标';  mc = '#1a73e8'; mbg = '#e3f2fd'; mBorder = '#1a73e8' }
  else if (diff >= 0)    { mode = '🟡 紧张';  mc = '#f57f17'; mbg = '#fff8e1'; mBorder = '#f57f17' }
  else if (diff > -0.03) { mode = '🟠 收紧';  mc = '#e65100'; mbg = '#fff3e0'; mBorder = '#e65100' }
  else                   { mode = '🔴 强收紧'; mc = '#c62828'; mbg = '#ffebee'; mBorder = '#c62828' }

  const modeRule: Record<string, string> = {
    '🟢 宽松': '预算维持或小幅追加（×1.0~1.1），R3正常触发',
    '🔵 达标': '预算维持，费比恶化才轻压（×0.9）',
    '🟡 紧张': '预算轻压×0.85 + ROI上调5%，禁止R3追加',
    '🟠 收紧': '预算中压×0.75 + ROI上调10%，18:00黄区禁入晚高峰',
    '🔴 强收紧': '预算重压×0.6 + ROI上调15%，或暂停计划',
  }

  const wkNetRate = store.weeklyNetProfit * 100
  const wkPct = Math.max(0, Math.min(100, (store.weeklyNetProfit / 0.10) * 100))
  const wkColor = store.weeklyNetProfit >= 0.10 ? '#2e7d32' : store.weeklyNetProfit >= 0.07 ? '#f57f17' : '#c62828'
  const wkSpend = totalSpend * 7
  const wkRev = totalRev * 7
  const avgGross = plans.reduce((s, p) => s + p.gross, 0) / plans.length

  return { totalSpend, totalRev, storeROI, storeFebi, surplus, mode, mc, mbg, mBorder, modeRule: modeRule[mode] || '', zones, wkNetRate, wkPct, wkColor, wkSpend, wkRev, avgGross }
}

export function StoreBar({ storeConfig, storePlans }: Props) {
  const m = computeStoreMetrics(storeConfig, storePlans)

  return (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 10, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', fontSize: 11 }}>
      {/* 今日总花费 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 13 }}>¥{fmt(m.totalSpend)}</div>
        <div style={{ color: '#999' }}>今日总花费</div>
      </div>

      {/* 今日总成交额 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#2e7d32' }}>¥{fmt(m.totalRev)}</div>
        <div style={{ color: '#999' }}>今日总成交额</div>
      </div>

      {/* 全店ROI */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#1557b0' }}>{m.storeROI.toFixed(2)}</div>
        <div style={{ color: '#999' }}>全店ROI</div>
      </div>

      {/* 今日费比 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: m.storeFebi > 30 ? '#c62828' : '#222' }}>{m.storeFebi.toFixed(1)}%</div>
        <div style={{ color: '#999' }}>全店费比</div>
      </div>

      {/* 余量数值 */}
      <div style={{ background: m.mbg, borderRadius: 8, padding: '4px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: m.mc }}>{m.surplus >= 0 ? '+' : ''}{m.surplus.toFixed(1)}%</div>
        <div style={{ fontSize: 9, color: m.mc }}>余量 vs 10%目标</div>
      </div>

      {/* 余量模式 badge */}
      <div title={m.modeRule}>
        <div style={{ fontWeight: 700, padding: '3px 10px', borderRadius: 20, color: m.mc, background: m.mbg, border: `2px solid ${m.mBorder}`, fontSize: 11, whiteSpace: 'nowrap' }}>
          {m.mode}
        </div>
        <div style={{ fontSize: 9, color: '#aaa', marginTop: 3, maxWidth: 160, lineHeight: 1.3 }}>{m.modeRule}</div>
      </div>

      {/* 三区分布 */}
      <div>
        <div style={{ fontSize: 9, color: '#999', marginBottom: 4 }}>计划分布</div>
        <div style={{ display: 'flex', gap: 4 }}>
          <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '2px 8px', borderRadius: 20, fontWeight: 700, fontSize: 11 }}>🟢{m.zones.G}</span>
          <span style={{ background: '#fff8e1', color: '#f57f17', padding: '2px 8px', borderRadius: 20, fontWeight: 700, fontSize: 11 }}>🟡{m.zones.Y}</span>
          <span style={{ background: '#ffebee', color: '#c62828', padding: '2px 8px', borderRadius: 20, fontWeight: 700, fontSize: 11 }}>🔴{m.zones.R}</span>
        </div>
      </div>

      {/* 本周毛利进度条 */}
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ color: '#999' }}>本周毛利进度（近7日累计）</span>
          <span style={{ fontWeight: 700, color: m.wkColor }}>{m.wkNetRate.toFixed(1)}% / 10%目标</span>
        </div>
        <div style={{ height: 6, borderRadius: 6, background: '#f0f0f0', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 6, background: m.wkColor, width: `${m.wkPct}%`, transition: 'width 0.4s' }} />
        </div>
        <div style={{ fontSize: 9, color: '#aaa', marginTop: 3 }}>
          花费¥{fmt(m.wkSpend)} · 成交¥{fmt(m.wkRev)} · 净利润¥{fmt(m.wkRev * m.avgGross - m.wkSpend)}
        </div>
      </div>
    </div>
  )
}
