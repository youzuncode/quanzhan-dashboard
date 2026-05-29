import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import type { ActionLogEntry } from '../lib/mockData'

interface Props {
  entries: ActionLogEntry[]
  onClose: () => void
}

type TypeFilter = 'all' | 'executed' | 'confirmed' | 'dismissed' | 'info' | 'api_error'

const typeLbl: Record<string, string> = {
  executed: '🤖 自动执行', confirmed: '✅ 人工确认', dismissed: '✗ 已忽略',
  info: '📋 记录', api_error: '❌ API失败',
}
const typeCls: Record<string, string> = {
  executed: 'bg-gray-100 text-gray-600',
  confirmed: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-400',
  info: 'bg-blue-50 text-blue-700',
  api_error: 'bg-red-100 text-red-800',
}

export function ActionLogPage({ entries, onClose }: Props) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  const filtered = entries.filter(l => {
    if (typeFilter !== 'all' && l.type !== typeFilter) return false
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      if (
        !l.plan.toLowerCase().includes(q) &&
        !l.rule.toLowerCase().includes(q) &&
        !l.action.toLowerCase().includes(q) &&
        !(l.note || '').toLowerCase().includes(q)
      ) return false
    }
    return true
  })

  // 统计
  const counts = entries.reduce<Record<string, number>>((acc, l) => {
    acc[l.type] = (acc[l.type] || 0) + 1; return acc
  }, {})

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0d3c61,#1a5f8a)', padding: '12px 18px', color: '#fff', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        <button onClick={onClose}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', color: '#fff', cursor: 'pointer' }}>
          <ArrowLeft size={13} /> 返回看板
        </button>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>📝 操作日志</div>
          <div style={{ fontSize: 11, opacity: 0.75, marginTop: 1 }}>
            全部 {entries.length} 条 · 自动执行 {counts.executed || 0} · 人工确认 {counts.confirmed || 0}
            {counts.dismissed ? ` · 已忽略 ${counts.dismissed}` : ''}
            {counts.api_error ? ` · API失败 ${counts.api_error}` : ''}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ background: '#fafbfc', borderBottom: '1px solid #e5e7eb', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flexShrink: 0 }}>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 340 }}>
          <input
            type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 搜索计划/规则/操作内容/备注…"
            style={{ width: '100%', padding: '6px 28px 6px 12px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => (e.target.style.borderColor = '#6366f1')}
            onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
          />
          {search && (
            <button onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 2 }}>
              ✕
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'executed', 'confirmed', 'dismissed', 'info', 'api_error'] as const).map(t => {
            const labels: Record<string, string> = {
              all: '全部', executed: '🤖 自动', confirmed: '✅ 确认',
              dismissed: '✗ 忽略', info: '📋 记录', api_error: '❌ 失败',
            }
            const active = typeFilter === t
            const n = t === 'all' ? entries.length : (counts[t] || 0)
            if (t !== 'all' && n === 0) return null
            return (
              <button key={t} onClick={() => setTypeFilter(t)}
                style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  border: `1px solid ${active ? '#6366f1' : '#e5e7eb'}`,
                  background: active ? '#eef2ff' : '#fff',
                  color: active ? '#4338ca' : '#6b7280',
                }}>
                {labels[t]} {n > 0 && <span style={{ opacity: 0.7 }}>{n}</span>}
              </button>
            )
          })}
        </div>

        <div style={{ marginLeft: 'auto', fontSize: 11, color: '#6b7280' }}>
          显示 <span style={{ fontWeight: 700, color: '#374151' }}>{filtered.length}</span> / {entries.length} 条
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 18px 18px' }}>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ marginTop: 12 }}>
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 bg-gray-50 z-10">
              <tr className="border-b border-gray-200">
                {['时间', '时点', '计划', '规则', '操作内容', '类型', '操作方', '备注'].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-bold text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-gray-400 py-12 text-xs">
                    没有符合筛选条件的日志
                    {(search || typeFilter !== 'all') && (
                      <button onClick={() => { setSearch(''); setTypeFilter('all') }}
                        style={{ marginLeft: 10, padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 700, background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe', cursor: 'pointer' }}>
                        清除筛选
                      </button>
                    )}
                  </td>
                </tr>
              ) : [...filtered].reverse().map((l, i) => {
                const isDismissed = l.type === 'dismissed'
                const isConfirmed = l.type === 'confirmed'
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #f0f0f0', textDecoration: isDismissed ? 'line-through' : 'none', fontWeight: isConfirmed ? 600 : 400 }}>
                    <td className="px-3 py-2 whitespace-nowrap font-semibold">{l.time}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{l.timepoint}</td>
                    <td className="px-3 py-2 font-semibold whitespace-nowrap">{l.plan}</td>
                    <td className="px-3 py-2"><span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold" style={{ fontSize: 9 }}>{l.rule}</span></td>
                    <td className="px-3 py-2 text-indigo-800" style={{ fontSize: 11, maxWidth: 380 }}>
                      <span title={l.action} className="block truncate">{l.action}</span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${typeCls[l.type] || 'bg-gray-100 text-gray-600'}`}>
                        {typeLbl[l.type] || l.type}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{l.operator}</td>
                    <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{l.note || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
