import type { Plan, StoreConfig } from '../../types/database'

interface Props {
  plans: Plan[]
  store: StoreConfig
}

export function KPICards({ plans, store }: Props) {
  const totalSpend = plans.reduce((s, p) => s + p.spend_today, 0)
  const totalRevenue = plans.reduce((s, p) => s + p.revenue_today, 0)
  const storeRoi = totalSpend > 0 ? totalRevenue / totalSpend : 0
  const storeCostRate = totalRevenue > 0 ? totalSpend / totalRevenue : 0

  const greenCount = plans.filter(p => p.zone === 'green').length
  const yellowCount = plans.filter(p => p.zone === 'yellow').length
  const redCount = plans.filter(p => p.zone === 'red').length

  const pendingAlerts = 2

  const kpis = [
    {
      label: '今日花费',
      value: '¥' + totalSpend.toLocaleString(),
      sub: `预算 ¥${plans.reduce((s, p) => s + p.daily_budget, 0).toLocaleString()}`,
      color: 'blue',
      trend: null,
    },
    {
      label: '今日成交额',
      value: '¥' + totalRevenue.toLocaleString(),
      sub: `全店 ROI ${storeRoi.toFixed(2)}`,
      color: 'green',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: '全店费比',
      value: (storeCostRate * 100).toFixed(1) + '%',
      sub: `Gross毛利 ${(store.gross_margin_rate * 100).toFixed(0)}% | 止损 ${(store.gross_margin_rate * 100).toFixed(0)}%`,
      color: storeCostRate > store.gross_margin_rate ? 'red' : storeCostRate > store.gross_margin_rate - 0.1 ? 'yellow' : 'green',
      trend: null,
    },
    {
      label: '计划三区间',
      value: `🟢${greenCount} 🟡${yellowCount} 🔴${redCount}`,
      sub: `共 ${plans.length} 个计划`,
      color: redCount > 0 ? 'red' : yellowCount > 0 ? 'yellow' : 'green',
      trend: null,
    },
    {
      label: '待确认操作',
      value: pendingAlerts.toString(),
      sub: '需人工确认',
      color: pendingAlerts > 0 ? 'yellow' : 'green',
      trend: null,
    },
  ]

  const colorMap: Record<string, { bar: string; val: string }> = {
    green: { bar: 'bg-green-700', val: 'text-green-700' },
    yellow: { bar: 'bg-yellow-600', val: 'text-yellow-600' },
    red: { bar: 'bg-red-700', val: 'text-red-700' },
    blue: { bar: 'bg-blue-700', val: 'text-blue-700' },
    indigo: { bar: 'bg-indigo-800', val: 'text-indigo-800' },
  }

  return (
    <div className="grid grid-cols-5 gap-2.5 mb-2.5">
      {kpis.map((k) => {
        const c = colorMap[k.color] ?? colorMap.blue
        return (
          <div key={k.label} className="bg-white rounded-xl p-3 shadow-sm relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${c.bar}`} />
            <div className="text-xs text-gray-500 mb-1">{k.label}</div>
            <div className={`text-xl font-bold leading-none ${c.val}`}>{k.value}</div>
            <div className="text-xs text-gray-400 mt-1">{k.sub}</div>
            {k.trend && (
              <div className={`text-xs mt-0.5 font-semibold ${k.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                {k.trendUp ? '▲' : '▼'} {k.trend}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
