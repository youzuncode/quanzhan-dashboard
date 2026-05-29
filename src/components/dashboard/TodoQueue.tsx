import { useState, useRef } from 'react'
import { generateTodoQueue } from '../../lib/mockData'
import type { PlanData } from '../../lib/mockData'

interface Props {
  plans: PlanData[]
  storeConfig: Parameters<typeof generateTodoQueue>[1]
  onSelectPlan?: (name: string) => void
}

const prioStyle: Record<string, { bg: string; color: string; label: string }> = {
  urgent: { bg: '#ffebee', color: '#c62828', label: '紧急' },
  high: { bg: '#fff8e1', color: '#f57f17', label: '关注' },
  opportunity: { bg: '#e8f5e9', color: '#2e7d32', label: '机会' },
}

export function TodoQueue({ plans, storeConfig, onSelectPlan }: Props) {
  const items = generateTodoQueue(plans, storeConfig)
  const [done, setDone] = useState<Set<string>>(new Set())
  const [collapsed, setCollapsed] = useState(false)

  // Reset checkmarks when store changes
  const prevRef = useRef(plans)
  if (prevRef.current !== plans) {
    prevRef.current = plans
    setDone(new Set())
  }

  function toggleDone(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setDone(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const pendingItems = items.filter(it => !done.has(it.id))
  const doneItems = items.filter(it => done.has(it.id))
  const ordered = [...pendingItems, ...doneItems]

  // 合计：减亏 + 增收 都算"今日可改善金额"
  const totalImpact = pendingItems.reduce((s, it) => s + it.impact, 0)
  const urgentCount = pendingItems.filter(it => it.priority === 'urgent').length

  return (
    <div className="bg-white rounded-xl shadow-sm mb-2.5 overflow-hidden" style={{ border: urgentCount > 0 ? '1.5px solid #ffcdd2' : undefined }}>
      <div className="px-3 py-2 font-bold text-xs border-b border-gray-100 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span>📌 今日待办决策</span>
          {pendingItems.length > 0
            ? <span className="text-gray-400 font-normal">{pendingItems.length}项待处理{urgentCount > 0 && <span className="text-red-600 font-bold"> · {urgentCount}项紧急</span>}</span>
            : <span className="text-green-600 font-normal">✓ 今日动作已全部处理</span>}
        </div>
        <div className="flex items-center gap-2">
          {pendingItems.length > 0 && (
            <span className="font-normal" style={{ fontSize: 11, color: '#6b7280' }}>
              预计可改善 <span style={{ color: '#2e7d32', fontWeight: 700 }}>¥{totalImpact.toLocaleString()}</span>
            </span>
          )}
          <button onClick={() => setCollapsed(c => !c)}
            style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb', cursor: 'pointer' }}>
            {collapsed ? '展开' : '收起'}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="divide-y divide-gray-50">
          {ordered.length === 0 && (
            <div className="text-center text-gray-400 py-6 text-xs">当前店铺暂无需要处理的动作 🎉</div>
          )}
          {ordered.map((it, idx) => {
            const ps = prioStyle[it.priority]
            const isDone = done.has(it.id)
            const impactColor = it.impactKind === 'gain' ? '#2e7d32' : it.impactKind === 'save' ? '#c62828' : '#f57f17'
            const impactPrefix = it.impactKind === 'gain' ? '增收' : it.impactKind === 'save' ? '减亏' : '防损'
            return (
              <div key={it.id}
                onClick={() => onSelectPlan?.(it.plan)}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                style={{ opacity: isDone ? 0.5 : 1 }}>
                {/* checkbox */}
                <div onClick={e => toggleDone(it.id, e)}
                  style={{
                    width: 17, height: 17, borderRadius: 5, flexShrink: 0,
                    border: `2px solid ${isDone ? '#2e7d32' : '#cbd5e1'}`, background: isDone ? '#2e7d32' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}>
                  {isDone && <span style={{ color: '#fff', fontSize: 11, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                </div>

                {/* rank */}
                <span style={{ width: 18, textAlign: 'center', fontSize: 11, fontWeight: 800, color: '#9ca3af', flexShrink: 0 }}>{idx + 1}</span>

                {/* deadline */}
                <span style={{ fontSize: 10, fontWeight: 700, color: '#374151', background: '#f1f5f9', borderRadius: 5, padding: '2px 6px', flexShrink: 0, width: 50, textAlign: 'center' }}>
                  {it.deadline}
                </span>

                {/* priority chip */}
                <span style={{ fontSize: 10, fontWeight: 700, color: ps.color, background: ps.bg, borderRadius: 5, padding: '2px 6px', flexShrink: 0, width: 36, textAlign: 'center' }}>
                  {ps.label}
                </span>

                {/* main */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5" style={{ textDecoration: isDone ? 'line-through' : 'none' }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{it.title}</span>
                    <span style={{ fontSize: 11, color: '#4338ca', fontWeight: 600 }} className="truncate">{it.plan}</span>
                    {it.pending && !isDone && <span style={{ fontSize: 9, color: '#f57f17', background: '#fff8e1', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>待确认</span>}
                  </div>
                  <div className="text-gray-500 truncate" style={{ fontSize: 10.5 }} title={it.action}>{it.rule} · {it.action}</div>
                </div>

                {/* impact */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: impactColor }}>¥{it.impact.toLocaleString()}</div>
                  <div style={{ fontSize: 9, color: '#9ca3af' }}>{impactPrefix}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
