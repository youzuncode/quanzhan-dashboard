import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Plan } from '../../types/database'
import { calcTargetRoi, calcBreakevenRoi } from '../../lib/rules'

interface Props {
  plans: Plan[]
}

type SortKey = 'name' | 'zone' | 'roi_target' | 'daily_budget' | 'cost_rate_today' | 'roi_completion_rate' | 'spend_today'

const zoneOrder = { red: 0, yellow: 1, green: 2 }

export function PlanTable({ plans }: Props) {
  const navigate = useNavigate()
  const [sortKey, setSortKey] = useState<SortKey>('zone')
  const [sortAsc, setSortAsc] = useState(true)

  const sorted = [...plans].sort((a, b) => {
    let va: number | string = a[sortKey] as number | string
    let vb: number | string = b[sortKey] as number | string
    if (sortKey === 'zone') {
      va = zoneOrder[a.zone]
      vb = zoneOrder[b.zone]
    }
    if (typeof va === 'string') return sortAsc ? va.localeCompare(vb as string) : (vb as string).localeCompare(va)
    return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number)
  })

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(true) }
  }

  function Th({ k, children }: { k: SortKey; children: React.ReactNode }) {
    return (
      <th
        className="px-2 py-1.5 text-left text-xs font-bold text-gray-500 cursor-pointer hover:text-indigo-800 select-none whitespace-nowrap"
        onClick={() => toggleSort(k)}>
        {children} {sortKey === k ? (sortAsc ? '↑' : '↓') : ''}
      </th>
    )
  }

  const zoneStyle = {
    green: { row: 'bg-green-50', dot: 'bg-green-700', badge: 'text-green-700 bg-green-100' },
    yellow: { row: 'bg-yellow-50', dot: 'bg-yellow-600', badge: 'text-yellow-700 bg-yellow-100' },
    red: { row: 'bg-red-50', dot: 'bg-red-700', badge: 'text-red-700 bg-red-100' },
  }

  const confBadge = { H: 'bg-green-100 text-green-800', M: 'bg-yellow-100 text-yellow-800', L: 'bg-red-100 text-red-800' }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-3 py-2 font-bold text-xs border-b border-gray-100 flex items-center justify-between">
        <span>📋 计划管理表</span>
        <span className="text-gray-400 font-normal">点击计划名查看详情</span>
      </div>
      <div className="overflow-x-auto max-h-72 overflow-y-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50 border-b-2 border-gray-200">
              <Th k="zone">区间</Th>
              <Th k="name">计划名称</Th>
              <Th k="roi_target">ROI目标</Th>
              <Th k="daily_budget">每日预算</Th>
              <Th k="spend_today">今日花费</Th>
              <Th k="cost_rate_today">当前费比</Th>
              <Th k="roi_completion_rate">ROI完成率</Th>
              <th className="px-2 py-1.5 text-left text-xs font-bold text-gray-500">置信度</th>
              <th className="px-2 py-1.5 text-left text-xs font-bold text-gray-500">出价方式</th>
              <th className="px-2 py-1.5 text-left text-xs font-bold text-gray-500">防停投</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(p => {
              const s = zoneStyle[p.zone]
              const targetRoi = calcTargetRoi(p.gross_margin_rate)
              const breakevenRoi = calcBreakevenRoi(p.gross_margin_rate)
              const costRateTarget = +(p.gross_margin_rate - 0.10) * 100
              return (
                <tr key={p.id} className={`border-b border-gray-100 hover:brightness-95 cursor-pointer ${s.row}`}
                  onClick={() => navigate(`/plan/${p.id}`)}>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-1">
                      <span className={`inline-block w-2 h-2 rounded-full ${s.dot}`} />
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${s.badge}`}>
                        {p.zone === 'green' ? '绿区' : p.zone === 'yellow' ? '黄区' : '红区'}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-1.5 font-semibold text-indigo-800 hover:underline">{p.name}</td>
                  <td className="px-2 py-1.5">
                    <div className="font-bold">{p.roi_target}</div>
                    <div className="text-gray-400">止损{breakevenRoi.toFixed(1)} / 目标{targetRoi.toFixed(1)}</div>
                  </td>
                  <td className="px-2 py-1.5 font-semibold">¥{p.daily_budget}</td>
                  <td className="px-2 py-1.5">
                    <div>¥{p.spend_today}</div>
                    <div className="text-gray-400">{(p.spend_today / p.daily_budget * 100).toFixed(0)}%利用</div>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className={`font-bold ${p.cost_rate_today * 100 > p.gross_margin_rate * 100 ? 'text-red-700' : p.cost_rate_today * 100 > costRateTarget ? 'text-yellow-600' : 'text-green-700'}`}>
                      {(p.cost_rate_today * 100).toFixed(1)}%
                    </div>
                    <div className="text-gray-400">目标≤{costRateTarget.toFixed(1)}%</div>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className={`font-bold ${p.roi_completion_rate >= 1.3 ? 'text-green-700' : p.roi_completion_rate >= 0.8 ? 'text-yellow-600' : 'text-red-700'}`}>
                      {(p.roi_completion_rate * 100).toFixed(0)}%
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${confBadge[p.confidence]}`}>
                      {p.confidence === 'H' ? '高' : p.confidence === 'M' ? '中' : '低'}
                    </span>
                  </td>
                  <td className="px-2 py-1.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${p.bid_mode === 'roi' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                      {p.bid_mode === 'roi' ? '控投产比' : '最大化拿量'}
                    </span>
                  </td>
                  <td className="px-2 py-1.5">
                    <span className={`text-xs font-bold ${p.anti_stop_enabled ? 'text-green-700' : 'text-gray-400'}`}>
                      {p.anti_stop_enabled ? '✅ 开' : '—'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
