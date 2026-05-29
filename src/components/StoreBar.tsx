import { store, plans } from '../lib/mockData'

function computeStoreMetrics() {
  const zoneCounts = { green: 0, yellow: 0, red: 0 }
  plans.forEach(p => { zoneCounts[p.zone]++ })
  const surplus = store.weeklyNetProfit - store.weeklyTarget
  let mode: string, mc: string, mbg: string
  if (surplus > 0.05)      { mode = '🟢 宽松';  mc = '#2e7d32'; mbg = '#e8f5e9' }
  else if (surplus > 0.02) { mode = '🔵 达标';  mc = '#1565c0'; mbg = '#e3f2fd' }
  else if (surplus >= 0)   { mode = '🟡 紧张';  mc = '#f57f17'; mbg = '#fff8e1' }
  else if (surplus > -0.03){ mode = '🟠 收紧';  mc = '#e65100'; mbg = '#fff3e0' }
  else                     { mode = '🔴 强收紧'; mc = '#c62828'; mbg = '#ffebee' }
  const wkPct = Math.max(0, Math.min(100, (store.weeklyNetProfit / store.weeklyTarget) * 100))
  const wkColor = store.weeklyNetProfit >= 0.10 ? '#2e7d32' : store.weeklyNetProfit >= 0.07 ? '#f57f17' : '#c62828'
  return { zoneCounts, surplus, mode, mc, mbg, wkPct, wkColor }
}

export function StoreBar() {
  const { zoneCounts, surplus, mode, mc, mbg, wkPct, wkColor } = computeStoreMetrics()
  const febiPct = (store.febi * 100).toFixed(1)
  const wkProfitPct = (store.weeklyNetProfit * 100).toFixed(1)

  return (
    <div className="bg-white rounded-xl shadow-sm mb-2.5 px-4 py-2.5 flex items-center gap-4 flex-wrap text-xs">
      {/* Spend / Revenue / Febi */}
      <div className="flex items-center gap-4">
        <div>
          <div className="text-gray-400">今日花费</div>
          <div className="font-bold text-sm">¥{store.totalSpend.toLocaleString('zh-CN')}</div>
        </div>
        <div>
          <div className="text-gray-400">今日成交额</div>
          <div className="font-bold text-sm text-green-700">¥{store.totalRevenue.toLocaleString('zh-CN')}</div>
        </div>
        <div>
          <div className="text-gray-400">今日费比</div>
          <div className={`font-bold text-sm ${store.febi > store.grossMargin ? 'text-red-700' : store.febi > store.targetFebi ? 'text-yellow-600' : 'text-green-700'}`}>
            {febiPct}%
          </div>
        </div>
      </div>

      <div className="w-px h-8 bg-gray-200" />

      {/* Mode badge */}
      <div>
        <div className="text-gray-400 mb-0.5">余量模式</div>
        <div className="font-bold px-2 py-0.5 rounded-full text-xs border"
          style={{ color: mc, background: mbg, borderColor: mc }}>
          {mode}
        </div>
      </div>

      {/* Zone chips */}
      <div>
        <div className="text-gray-400 mb-1">计划分布</div>
        <div className="flex gap-1">
          <span className="px-2 py-0.5 rounded-full font-bold" style={{ background: '#e8f5e9', color: '#2e7d32' }}>🟢{zoneCounts.green}</span>
          <span className="px-2 py-0.5 rounded-full font-bold" style={{ background: '#fff8e1', color: '#f57f17' }}>🟡{zoneCounts.yellow}</span>
          <span className="px-2 py-0.5 rounded-full font-bold" style={{ background: '#ffebee', color: '#c62828' }}>🔴{zoneCounts.red}</span>
        </div>
      </div>

      <div className="w-px h-8 bg-gray-200" />

      {/* Weekly progress */}
      <div className="flex-1 min-w-36">
        <div className="flex justify-between mb-1">
          <span className="text-gray-400">本周净毛利率</span>
          <span className="font-bold" style={{ color: wkColor }}>{wkProfitPct}% / 目标10%</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${wkPct}%`, background: wkColor }} />
        </div>
        <div className="mt-0.5 text-right" style={{ color: surplus >= 0 ? '#2e7d32' : '#c62828' }}>
          余量 {surplus >= 0 ? '+' : ''}{(surplus * 100).toFixed(1)}pp
        </div>
      </div>
    </div>
  )
}
