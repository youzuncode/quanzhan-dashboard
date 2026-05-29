import { store, plans } from '../../lib/mockData'

function num(v: number) {
  return v >= 10000 ? (v / 10000).toFixed(1) + '万' : v.toLocaleString('zh-CN')
}

export function KPICards() {
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

  const colorMap: Record<KpiColor, { bar: string; val: string }> = {
    green: { bar: '#2e7d32', val: '#2e7d32' },
    yellow: { bar: '#f57f17', val: '#f57f17' },
    red: { bar: '#c62828', val: '#c62828' },
    blue: { bar: '#1565c0', val: '#1565c0' },
    indigo: { bar: '#283593', val: '#283593' },
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 10 }}>
      {kpis.map(k => {
        const c = colorMap[k.cls]
        return (
          <div key={k.label}
            style={{ background: '#fff', borderRadius: 12, padding: '10px 12px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', position: 'relative', overflow: 'hidden' }}>
            {/* 顶部 3px 彩色条 */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: c.bar }} />
            <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1, color: c.val }}>{k.val}</div>
            <div style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>{k.sub}</div>
            <div style={{ fontSize: 10, marginTop: 3, fontWeight: 600, color: k.tdir === 'up' ? '#2e7d32' : '#c62828' }}>
              {k.trend}
            </div>
          </div>
        )
      })}
    </div>
  )
}
