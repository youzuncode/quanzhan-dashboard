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

type ZoneFilter = 'all' | 'red' | 'yellow' | 'green'
type RuleFilter = 'all' | 'pending' | 'triggered' | 'none'

export function PlanTable({ plans: initialPlans, onSelectPlan }: Props) {
  const [planData, setPlanData] = useState<PlanData[]>(initialPlans)
  const [sortKey, setSortKey] = useState<SortKey>('zone')
  const [sortAsc, setSortAsc] = useState(true)
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set())
  const [editingPlan, setEditingPlan] = useState<PlanData | null>(null)
  const [showCompare, setShowCompare] = useState(false)
  const [limitToast, setLimitToast] = useState(false)
  const [search, setSearch] = useState('')
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>('all')
  const [ruleFilter, setRuleFilter] = useState<RuleFilter>('all')
  const [pageSize, setPageSize] = useState<number>(20)
  const [page, setPage] = useState(1)
  const lastClickedRef = useRef<string | null>(null)

  // Sync planData when store changes
  const prevInitialRef = useRef(initialPlans)
  if (prevInitialRef.current !== initialPlans) {
    prevInitialRef.current = initialPlans
    setPlanData(initialPlans)
    setSelectedNames(new Set())
  }

  const filtered = planData.filter(p => {
    if (zoneFilter !== 'all' && p.zone !== zoneFilter) return false
    if (ruleFilter === 'pending' && !p.rule.includes('待确认')) return false
    if (ruleFilter === 'triggered' && (!p.rule || p.rule === '—')) return false
    if (ruleFilter === 'none' && p.rule && p.rule !== '—') return false
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      if (!p.name.toLowerCase().includes(q) && !p.rule.toLowerCase().includes(q)) return false
    }
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    let va: number | string = a[sortKey] as number | string
    let vb: number | string = b[sortKey] as number | string
    if (sortKey === 'zone') { va = zoneOrder[a.zone]; vb = zoneOrder[b.zone] }
    if (typeof va === 'string') return sortAsc ? va.localeCompare(vb as string) : (vb as string).localeCompare(va)
    return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number)
  })

  // 分页:筛选/搜索/排序变化时,如当前页超界则回到第1页
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, totalPages)
  if (safePage !== page) setPage(safePage)
  const pageStart = (safePage - 1) * pageSize
  const pageEnd = Math.min(pageStart + pageSize, sorted.length)
  const paged = sorted.slice(pageStart, pageEnd)

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortAsc(!sortAsc)
    else { setSortKey(k); setSortAsc(true) }
  }

  function toggleSelect(name: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (e.shiftKey && lastClickedRef.current) {
      // Shift+click: select range
      const sortedNames = paged.map(p => p.name)
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
      <th className="px-2 py-1.5 text-left text-xs font-bold text-gray-500 cursor-pointer hover:text-blue-800 select-none whitespace-nowrap"
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
            <span className="text-gray-400 font-normal">
              {filtered.length === planData.length ? `${planData.length}个计划` : `${filtered.length}/${planData.length}个`}
            </span>
            {selectedNames.size > 0 && (
              <span className="text-blue-600 font-normal">已选{selectedNames.size}个</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedNames.size >= 2 && (
              <button
                onClick={() => setShowCompare(true)}
                style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#e8f0fe', color: '#1557b0', border: '1px solid #d2e3fc', cursor: 'pointer' }}>
                📊 对比选中({selectedNames.size})
              </button>
            )}
            {selectedNames.size > 0 && (
              <button
                onClick={() => setSelectedNames(new Set())}
                style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#f6f8fa', color: '#9ca3af', border: '1px solid #e5e7eb', cursor: 'pointer' }}>
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

        {/* C9: 搜索/筛选工具栏 */}
        <div style={{ padding: '6px 12px', background: '#fafbfc', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 180px', maxWidth: 280 }}>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔍 搜索计划名或规则…"
              style={{ width: '100%', padding: '4px 28px 4px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 11, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
              onFocus={e => (e.target.style.borderColor = '#1a73e8')}
              onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
            />
            {search && (
              <button onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 13, lineHeight: 1, padding: 2 }}>
                ✕
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 3 }}>
            {(['all', 'red', 'yellow', 'green'] as const).map(z => {
              const labels = { all: '全部', red: '🔴 红区', yellow: '🟡 黄区', green: '🟢 绿区' }
              const active = zoneFilter === z
              return (
                <button key={z} onClick={() => setZoneFilter(z)}
                  style={{
                    padding: '3px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                    border: `1px solid ${active ? '#1a73e8' : '#e5e7eb'}`,
                    background: active ? '#e8f0fe' : '#fff',
                    color: active ? '#1557b0' : '#6b7280',
                  }}>
                  {labels[z]}
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: 3 }}>
            {(['all', 'pending', 'triggered', 'none'] as const).map(r => {
              const labels = { all: '全规则', pending: '⏳ 待确认', triggered: '⚡ 有触发', none: '— 无触发' }
              const active = ruleFilter === r
              return (
                <button key={r} onClick={() => setRuleFilter(r)}
                  style={{
                    padding: '3px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                    border: `1px solid ${active ? '#f59e0b' : '#e5e7eb'}`,
                    background: active ? '#fff7ed' : '#fff',
                    color: active ? '#c2410c' : '#6b7280',
                  }}>
                  {labels[r]}
                </button>
              )
            })}
          </div>

          {(search || zoneFilter !== 'all' || ruleFilter !== 'all') && (
            <button onClick={() => { setSearch(''); setZoneFilter('all'); setRuleFilter('all') }}
              style={{ padding: '3px 8px', borderRadius: 5, fontSize: 10, fontWeight: 600, background: '#f6f8fa', color: '#6b7280', border: '1px solid #e5e7eb', cursor: 'pointer', marginLeft: 'auto' }}>
              ⟲ 清除筛选
            </button>
          )}
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

        {/* No overflow on this wrapper so the thead can be sticky to the page viewport */}
        <div>
          <table className="w-full border-collapse text-xs">
            <thead style={{ position: 'sticky', top: 0, zIndex: 30, background: '#f9fafb', boxShadow: '0 1px 0 #e5e7eb' }}>
              <tr className="bg-gray-50 border-b-2 border-gray-200" style={{ background: '#f9fafb' }}>
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
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={13} className="text-center text-gray-400 py-8 text-xs">
                    没有符合筛选条件的计划
                    {(search || zoneFilter !== 'all' || ruleFilter !== 'all') && (
                      <button onClick={() => { setSearch(''); setZoneFilter('all'); setRuleFilter('all') }}
                        style={{ marginLeft: 10, padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 700, background: '#e8f0fe', color: '#1557b0', border: '1px solid #d2e3fc', cursor: 'pointer' }}>
                        清除筛选
                      </button>
                    )}
                  </td>
                </tr>
              )}
              {paged.map(p => {
                const s = zoneStyle[p.zone]
                const stopLossRoi = +(1 / p.gross).toFixed(2)
                const targetFebipct = (p.gross * 100 - 10).toFixed(0)
                const febiColor = p.febi * 100 > p.gross * 100 ? 'text-red-700 font-bold' :
                                  p.febi * 100 > parseFloat(targetFebipct) ? 'text-yellow-600 font-bold' : 'text-green-700 font-bold'
                const isSelected = selectedNames.has(p.name)
                return (
                  <tr key={p.name}
                    className={`border-b border-gray-100 hover:brightness-95 cursor-pointer ${s.row} ${isSelected ? 'ring-2 ring-inset ring-blue-400' : ''}`}
                    onClick={() => onSelectPlan?.(p.name)}>
                    {/* Checkbox */}
                    <td className="px-2 py-1.5" onClick={e => toggleSelect(p.name, e)}>
                      <div style={{
                        width: 16, height: 16, borderRadius: 4, border: `2px solid ${isSelected ? '#1a73e8' : '#d1d5db'}`,
                        background: isSelected ? '#1a73e8' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
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
                    <td className="px-2 py-1.5 font-semibold text-blue-800 hover:underline whitespace-nowrap">{p.name}</td>
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
                        <div key={i} className={`text-xs ${i === 0 ? 'text-blue-800 font-semibold' : line.includes('待') ? 'text-orange-700' : 'text-gray-500'}`}>
                          {line}
                        </div>
                      ))}
                    </td>
                    {/* Edit button */}
                    <td className="px-2 py-1.5" onClick={e => handleEdit(p, e)}>
                      <button style={{ padding: '3px 7px', borderRadius: 5, fontSize: 10, fontWeight: 700, background: '#e8f0fe', color: '#1557b0', border: '1px solid #d2e3fc', cursor: 'pointer' }}>
                        ✏️
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* 分页 footer */}
        {sorted.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
            padding: '8px 14px', borderTop: '1px solid #f0f0f0', background: '#fafbfc', fontSize: 11, color: '#475569',
          }}>
            <div className="flex items-center gap-3">
              <span>共 <span style={{ fontWeight: 800, color: '#1e293b' }}>{planData.length}</span> 个计划</span>
              {sorted.length !== planData.length && (
                <span>· 当前筛选 <span style={{ fontWeight: 800, color: '#1e293b' }}>{sorted.length}</span> 条</span>
              )}
              <span>· 显示 <span style={{ fontWeight: 800, color: '#1e293b' }}>{pageStart + 1}-{pageEnd}</span> 条</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                · 每页
                <select value={pageSize} onChange={e => { setPageSize(parseInt(e.target.value)); setPage(1) }}
                  style={{ padding: '2px 6px', borderRadius: 5, border: '1px solid #d1d5db', fontSize: 11, fontWeight: 700, color: '#1e293b', background: '#fff', cursor: 'pointer' }}>
                  {[20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                条
              </span>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button disabled={safePage === 1} onClick={() => setPage(1)}
                  style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700, border: '1px solid #e5e7eb', background: '#fff', color: safePage === 1 ? '#cbd5e1' : '#475569', cursor: safePage === 1 ? 'default' : 'pointer' }}>
                  « 首页
                </button>
                <button disabled={safePage === 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                  style={{ padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 700, border: '1px solid #e5e7eb', background: '#fff', color: safePage === 1 ? '#cbd5e1' : '#475569', cursor: safePage === 1 ? 'default' : 'pointer' }}>
                  ‹ 上一页
                </button>
                <span style={{ padding: '3px 10px', fontWeight: 800, color: '#1e293b' }}>
                  {safePage} / {totalPages}
                </span>
                <button disabled={safePage === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  style={{ padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 700, border: '1px solid #e5e7eb', background: '#fff', color: safePage === totalPages ? '#cbd5e1' : '#475569', cursor: safePage === totalPages ? 'default' : 'pointer' }}>
                  下一页 ›
                </button>
                <button disabled={safePage === totalPages} onClick={() => setPage(totalPages)}
                  style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700, border: '1px solid #e5e7eb', background: '#fff', color: safePage === totalPages ? '#cbd5e1' : '#475569', cursor: safePage === totalPages ? 'default' : 'pointer' }}>
                  末页 »
                </button>
              </div>
            )}
          </div>
        )}
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
