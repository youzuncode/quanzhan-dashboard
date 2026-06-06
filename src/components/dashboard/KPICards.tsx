import type { PlanData } from '../../lib/mockData'

interface Props {
  storeConfig: { febi: number; weeklyNetProfit: number; weeklyTarget: number; grossMargin: number; targetFebi: number; totalSpend: number; totalRevenue: number; triggeredRulesCount: number }
  storePlans: PlanData[]
}

function num(v: number) {
  return v >= 10000 ? (v / 10000).toFixed(1) + '万' : v.toLocaleString('zh-CN')
}

export function KPICards({ storeConfig: store, storePlans: plans }: Props) {
  const greenCount = plans.filter(p => p.zone === 'green').length
  const yellowCount = plans.filter(p => p.zone === 'yellow').length
  const redCount = plans.filter(p => p.zone === 'red').length

  const fc = store.febi > store.grossMargin ? 'red' : store.febi > store.targetFebi ? 'yellow' : 'green'
  const pp = Math.round(store.weeklyNetProfit / store.weeklyTarget * 100)
  const pc = store.weeklyNetProfit >= store.weeklyTarget ? 'green' : store.weeklyNetProfit >= 0.05 ? 'yellow' : 'red'

  type KpiColor = 'blue' | 'green' | 'red' | 'yellow' | 'indigo'
  const kpis: Array<{
    cls: KpiColor
    label: string
    val: string
    sub: string
    trend: string
    tdir: 'up' | 'dn'
  }> = [
    {
      cls: 'blue',
      label: '今日全店花费',
      val: '¥' + num(store.totalSpend),
      sub: '成交额: ¥' + num(store.totalRevenue),
      trend: '↑5.2% vs 昨日',
      tdir: 'up',
    },
    {
      cls: fc as KpiColor,
      label: '今日全店费比',
      val: (store.febi * 100).toFixed(1) + '%',
      sub: `目标:${(store.targetFebi * 100).toFixed(0)}% | 止损:${(store.grossMargin * 100).toFixed(0)}%`,
      trend: fc === 'red' ? '⚠ 红区' : fc === 'yellow' ? '▲ 黄区' : '✓ 绿区',
      tdir: fc === 'green' ? 'up' : 'dn',
    },
    {
      cls: pc as KpiColor,
      label: '本周净毛利率',
      val: (store.weeklyNetProfit * 100).toFixed(1) + '%',
      sub: `目标10% · 完成${pp}%`,
      trend: pp >= 100 ? '✓ 已达标' : `差${((store.weeklyTarget - store.weeklyNetProfit) * 100).toFixed(1)}pp`,
      tdir: pp >= 100 ? 'up' : 'dn',
    },
    {
      cls: 'yellow',
      label: '三区 红/黄/绿',
      val: `${redCount}/${yellowCount}/${greenCount}`,
      sub: `共${plans.length}个计划`,
      trend: '收紧模式',
      tdir: 'dn',
    },
    {
      cls: 'red',
      label: '今日触发规则',
      val: String(store.triggeredRulesCount),
      sub: 'R1×1 R2×2 R3×3',
      trend: '待确认: 3条',
      tdir: 'dn',
    },
  ]

  // 科技数据屏:深底亮字。状态色统一提亮以适配深色背景
  const colorMap: Record<KpiColor, { bar: string; val: string; glow: string }> = {
    green: { bar: '#22c55e', val: '#4ade80', glow: 'rgba(34,197,94,.45)' },
    yellow: { bar: '#f59e0b', val: '#fbbf24', glow: 'rgba(245,158,11,.45)' },
    red: { bar: '#ef4444', val: '#f87171', glow: 'rgba(239,68,68,.45)' },
    blue: { bar: '#1a73e8', val: '#60a5fa', glow: 'rgba(96,165,250,.5)' },
    indigo: { bar: '#1557b0', val: '#7aa9ff', glow: 'rgba(122,169,255,.45)' },
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 10 }}>
      {kpis.map(k => {
        const c = colorMap[k.cls]
        return (
          <div key={k.label}
            style={{
              background: 'linear-gradient(150deg,#0f2748 0%,#15315a 100%)',
              borderRadius: 12,
              padding: '12px 14px',
              border: '1px solid rgba(96,165,250,.18)',
              boxShadow: '0 2px 10px rgba(8,22,48,.35)',
              position: 'relative',
              overflow: 'hidden',
            }}>
            {/* 顶部发光色条 */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: c.bar, boxShadow: `0 0 10px 1px ${c.glow}` }} />
            {/* 右上角光晕装饰 */}
            <div style={{ position: 'absolute', top: -28, right: -28, width: 70, height: 70, borderRadius: '50%', background: c.glow, filter: 'blur(24px)', opacity: 0.5 }} />
            <div style={{ fontSize: 10, color: '#9fb6d4', marginBottom: 5, letterSpacing: 0.3, position: 'relative' }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1, color: c.val, textShadow: `0 0 14px ${c.glow}`, fontVariantNumeric: 'tabular-nums', position: 'relative' }}>{k.val}</div>
            <div style={{ fontSize: 10, color: '#7e96b6', marginTop: 5, position: 'relative' }}>{k.sub}</div>
            <div style={{ fontSize: 10, marginTop: 4, fontWeight: 600, color: k.tdir === 'up' ? '#4ade80' : '#f87171', position: 'relative' }}>
              {k.trend}
            </div>
          </div>
        )
      })}
    </div>
  )
}
