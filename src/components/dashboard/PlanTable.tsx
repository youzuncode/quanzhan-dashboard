import { useState } from 'react'
import { plans } from '../../lib/mockData'
import type { PlanData } from '../../lib/mockData'

interface Props {
  onSelectPlan?: (name: string) => void
}

type SortKey = 'zone' | 'name' | 'roiTarget' | 'febi' | 'budget' | 'spend'
const zoneOrder = { red: 0, yellow: 1, green: 2 }

export function PlanTable({ onSelectPlan }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('zone')
  const [sortAsc, setSortAsc] = useState(true)

  const sorted = [...plans].sort((a, b) => {
    let va: number | string = a[sortKey] as number | string
    let vb: number | string = b[sortKey] as number | string
    if (sortKey === 'zone') { va = zoneOrder[a.zone]; vb = zoneOrder[b.zone] }
    if (typeof va === 'string') return sortAsc ? va.localeCompare(vb as string) : (vb as string).localeCompare(va)
    return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number)
  })

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortAsc(!sortAsc)
    else { setSortKey(k); setSortAsc(true) }
  }

  function Th({ k, children }: { k: SortKey; children: React.ReactNode }) {
    return (
      <th className="px-2 py-1.5 text-left text-xs font-bold text-gray-500 cursor-pointer hover:text-indigo-800 select-none whitespace-nowrap"
        onClick={() => toggleSort(k)}>
        {children} {sortKey === k ? (sortAsc ? '↑' : '↓') : ''}
      </th>
    )
  }

  const zoneStyle = {
    green: { row: 'bg-green-50', badge: 'text-green-700 bg-green-100', dot: 'bg-green-700' },
    yellow: { row: 'bg-yellow-50', badge: 'text-yellow-700 bg-yellow-100', dot: 'bg-yellow-600' },
    red: { row: 'bg-red-50', badge: 'text-red-700 bg-red-100', dot: 'bg-red-700' },
  }
  const zoneLabel = { green: '绿区', yellow: '黄区', red: '红区' }
  const confBadge = { H: 'bg-green-100 text-green-800', M: 'bg-yellow-100 text-yellow-800', L: 'bg-red-100 text-red-800' }

  function getRuleBadge(rule: string, zone: PlanData['zone']) {
    if (rule === '—') return null
    const isPending = rule.includes('待确认')
    const isActive = rule.includes('触发中')
    const isExecuted = rule.includes('已预执行') || rule.includes('已执行')
    const cls = isPending ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                isActive  ? 'bg-green-100 text-green-800 border border-green-300' :
                isExecuted? 'bg-blue-100 text-blue-800 border border-blue-300' :
                zone === 'red' ? 'bg-red-100 text-red-800' : zone === 'yellow' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700'
    return <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${cls}`}>{rule}</span>
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-2.5">
      <div className="px-3 py-2 font-bold text-xs border-b border-gray-100 flex items-center justify-between">
        <span>📋 计划管理总表</span>
        <span className="text-gray-400 font-normal">{plans.length}个计划 · 点击计划名查看详情</span>
      </div>
      <div className="overflow-x-auto max-h-80 overflow-y-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50 border-b-2 border-gray-200">
              <Th k="zone">区间</Th>
              <Th k="name">计划名称</Th>
              <Th k="roiTarget">ROI目标</Th>
              <Th k="febi">今日费比</Th>
              <Th k="budget">每日预算</Th>
              <Th k="spend">今日花费</Th>
              <th className="px-2 py-1.5 text-left text-xs font-bold text-gray-500">Gross</th>
              <th className="px-2 py-1.5 text-left text-xs font-bold text-gray-500">置信度</th>
              <th className="px-2 py-1.5 text-left text-xs font-bold text-gray-500">防停投</th>
              <th className="px-2 py-1.5 text-left text-xs font-bold text-gray-500">规则触发</th>
              <th className="px-2 py-1.5 text-left text-xs font-bold text-gray-500 min-w-40">今日操作指令</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(p => {
              const s = zoneStyle[p.zone]
              const stopLossRoi = +(1 / p.gross).toFixed(2)
              const targetFebipct = (p.gross * 100 - 10).toFixed(0)
              const febiColor = p.febi * 100 > p.gross * 100 ? 'text-red-700 font-bold' :
                                p.febi * 100 > parseFloat(targetFebipct) ? 'text-yellow-600 font-bold' : 'text-green-700 font-bold'
              return (
                <tr key={p.name} className={`border-b border-gray-100 hover:brightness-95 cursor-pointer ${s.row}`}
                  onClick={() => onSelectPlan?.(p.name)}>
                  <td className="px-2 py-1.5">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${s.badge}`}>
                      {zoneLabel[p.zone]}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 font-semibold text-indigo-800 hover:underline whitespace-nowrap">{p.name}</td>
                  <td className="px-2 py-1.5">
                    <div className="font-bold">{p.roiTarget}</div>
                    <div className="text-gray-400">止损{stopLossRoi}</div>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className={febiColor}>{(p.febi * 100).toFixed(1)}%</div>
                    <div className="text-gray-400">目标≤{targetFebipct}%</div>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className={p.budget === 0 ? 'text-red-700 font-bold' : 'font-semibold'}>
                      {p.budget === 0 ? '¥0 暂停' : `¥${p.budget.toLocaleString()}`}
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <div>¥{p.spend.toLocaleString()}</div>
                    {p.budget > 0 && <div className="text-gray-400">{Math.round(p.spend / p.budget * 100)}%利用</div>}
                  </td>
                  <td className="px-2 py-1.5 text-gray-600">{(p.gross * 100).toFixed(0)}%</td>
                  <td className="px-2 py-1.5">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${confBadge[p.conf]}`}>{p.conf}</span>
                  </td>
                  <td className="px-2 py-1.5">
                    <span className={`text-xs font-bold ${p.guard ? 'text-green-700' : 'text-gray-400'}`}>
                      {p.guard ? '✅ 开' : '—'}
                    </span>
                  </td>
                  <td className="px-2 py-1.5">{getRuleBadge(p.rule, p.zone)}</td>
                  <td className="px-2 py-1.5">
                    {p.action.split('\n').map((line, i) => (
                      <div key={i} className={`text-xs ${i === 0 ? 'text-indigo-800 font-semibold' : line.includes('待') ? 'text-orange-700' : 'text-gray-500'}`}>
                        {line}
                      </div>
                    ))}
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
