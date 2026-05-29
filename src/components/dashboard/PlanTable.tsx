import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import type { PlanData } from '../../lib/mockData'
import { PlanEditModal } from './PlanEditModal'
import { PlanCompareModal } from './PlanCompareModal'

interface Props {
  plans: PlanData[]
  onSelectPlan?: (name: string) => void
}

type SortKey = 'zone' | 'name' | 'roiTarget' | 'febi' | 'budget' | 'spend'
const zoneOrder = { red: 0, yellow: 1, green: 2 }

export function PlanTable({ plans: initialPlans, onSelectPlan }: Props) {
  const [planData, setPlanData] = useState<PlanData[]>(initialPlans)
  const [sortKey, setSortKey] = useState<SortKey>('zone')
  const [sortAsc, setSortAsc] = useState(true)
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set())
  const [editingPlan, setEditingPlan] = useState<PlanData | null>(null)
  const [showCompare, setShowCompare] = useState(false)
  const [limitToast, setLimitToast] = useState(false)
  const lastClickedRef = useRef<string | null>(null)

  // Sync planData when store changes
  const prevInitialRef = useRef(initialPlans)
  if (prevInitialRef.current !== initialPlans) {
    prevInitialRef.current = initialPlans
    setPlanData(initialPlans)
    setSelectedNames(new Set())
  }

  const sorted = [...planData].sort((a, b) => {
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

  function toggleSelect(name: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (e.shiftKey && lastClickedRef.current) {
      // Shift+click: select range
      const sortedNames = sorted.map(p => p.name)
      const i1 = sortedNames.indexOf(lastClickedRef.current)
      const i2 = sortedNames.indexOf(name)
      const [from, to] = i1 < i2 ? [i1, i2] : [i2, i1]
      const rangeNames = sortedNames.slice(from, to + 1)
      setSelectedNames(prev => {
        const next = new Set(prev)
        rangeNames.forEach(n => { if (next.size < 4) next.add(n) })
        if (next.size >= 4 && rangeNames.some(n => !prev.has(n))) {
          setLimitToast(true); setTimeout(() => setLimitToast(false), 2000)
        }
        return next
      })
    } else {
      setSelectedNames(prev => {
        const next = new Set(prev)
        if (next.has(name)) {
          next.delete(name)
        } else if (next.size >= 4) {
          setLimitToast(true)
          setTimeout(() => setLimitToast(false), 2000)
          return prev
        } else {
          next.add(name)
        }
        return next
      })
    }
    lastClickedRef.current = name
  }

  function handleEdit(p: PlanData, e: React.MouseEvent) {
    e.stopPropagation()
    setEditingPlan(p)
  }

  function handleSave(updated: Partial<PlanData>) {
    if (!editingPlan) return
    setPlanData(prev => prev.map(p => p.name === editingPlan.name ? { ...p, ...updated } : p))
  }

  function exportExcel() {
    const rows = planData.map(p => ({
      '计划名称': p.name,
      '区间': { red: '红区', yellow: '黄区', green: '绿区' }[p.zone],
      'ROI目标': p.roiTarget,
      '止损ROI': +(1 / p.gross).toFixed(2),
      '今日费比(%)': +(p.febi * 100).toFixed(1),
      '目标费比上限(%)': +(p.gross * 100 - 10).toFixed(0),
      '毛利率(%)': +(p.gross * 100).toFixed(0),
      '每日预算(元)': p.budget,
      '今日花费(元)': p.spend,
      '预算利用率(%)': p.budget > 0 ? Math.round(p.spend / p.budget * 100) : 0,
      '置信度': p.conf,
      '防停投': p.guard ? '是' : '否',
      '规则触发': p.rule,
      '操作指令': p.action.replace(/\n/g, ' | '),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '计划数据')
    const today = new Date()
    const dateStr = `${today.getMonth() + 1}${String(today.getDate()).padStart(2, '0')}`
    XLSX.writeFile(wb, `全站推广计划_${dateStr}.xlsx`)
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

  const comparePlans = planData.filter(p => selectedNames.has(p.name))

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-2.5">
        {/* Header */}
        <div className="px-3 py-2 font-bold text-xs border-b border-gray-100 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span>📋 计划管理总表</span>
            <span className="text-gray-400 font-normal">{planData.length}个计划</span>
            {selectedNames.size > 0 && (
              <span className="text-indigo-600 font-normal">已选{selectedNames.size}个</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedNames.size >= 2 && (
              <button
                onClick={() => setShowCompare(true)}
                style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#e8eaf6', color: '#283593', border: '1px solid #c5cae9', cursor: 'pointer' }}>
                📊 对比选中({selectedNames.size})
              </button>
            )}
            {selectedNames.size > 0 && (
              <button
                onClick={() => setSelectedNames(new Set())}
                style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#f3f4f6', color: '#9ca3af', border: '1px solid #e5e7eb', cursor: 'pointer' }}>
                清除选择
              </button>
            )}
            <button
              onClick={exportExcel}
              style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7', cursor: 'pointer' }}>
              ⬇ 导出Excel
            </button>
          </div>
        </div>

        {limitToast && (
          <div style={{ padding: '5px 14px', background: '#fff3e0', fontSize: 11, color: '#e65100', fontWeight: 600, borderBottom: '1px solid #ffe0b2', display: 'flex', alignItems: 'center', gap: 6 }}>
            ⚠️ 最多同时对比 4 个计划，请先取消已选计划再添加新的
          </div>
        )}
        {!limitToast && selectedNames.size === 0 && (
          <div style={{ padding: '4px 12px', background: '#f9fafb', fontSize: 10, color: '#9ca3af', borderBottom: '1px solid #f0f0f0' }}>
            勾选 2~4 个计划可横向对比（支持 Shift+点击批量选择）；点击计划名查看详情；✏️ 可编辑参数
          </div>
        )}

        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="px-2 py-1.5 w-8"></th>
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
                <th className="px-2 py-1.5 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(p => {
                const s = zoneStyle[p.zone]
                const stopLossRoi = +(1 / p.gross).toFixed(2)
                const targetFebipct = (p.gross * 100 - 10).toFixed(0)
                const febiColor = p.febi * 100 > p.gross * 100 ? 'text-red-700 font-bold' :
                                  p.febi * 100 > parseFloat(targetFebipct) ? 'text-yellow-600 font-bold' : 'text-green-700 font-bold'
                const isSelected = selectedNames.has(p.name)
                return (
                  <tr key={p.name}
                    className={`border-b border-gray-100 hover:brightness-95 cursor-pointer ${s.row} ${isSelected ? 'ring-2 ring-inset ring-indigo-400' : ''}`}
                    onClick={() => onSelectPlan?.(p.name)}>
                    {/* Checkbox */}
                    <td className="px-2 py-1.5" onClick={e => toggleSelect(p.name, e)}>
                      <div style={{
                        width: 16, height: 16, borderRadius: 4, border: `2px solid ${isSelected ? '#3b82f6' : '#d1d5db'}`,
                        background: isSelected ? '#3b82f6' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', flexShrink: 0,
                      }}>
                        {isSelected && <span style={{ color: '#fff', fontSize: 10, lineHeight: 1, fontWeight: 900 }}>✓</span>}
                      </div>
                    </td>
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
                    {/* Edit button */}
                    <td className="px-2 py-1.5" onClick={e => handleEdit(p, e)}>
                      <button style={{ padding: '3px 7px', borderRadius: 5, fontSize: 10, fontWeight: 700, background: '#f0f4ff', color: '#3730a3', border: '1px solid #c7d2fe', cursor: 'pointer' }}>
                        ✏️
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editingPlan && (
        <PlanEditModal
          plan={editingPlan}
          onSave={handleSave}
          onClose={() => setEditingPlan(null)}
        />
      )}

      {showCompare && comparePlans.length >= 2 && (
        <PlanCompareModal
          plans={comparePlans}
          onClose={() => setShowCompare(false)}
        />
      )}
    </>
  )
}
