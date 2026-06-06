import { useState } from 'react'
import { format } from 'date-fns'
import type { ActionLog as ActionLogType } from '../../types/database'

interface Props {
  logs: ActionLogType[]
}

export function ActionLog({ logs }: Props) {
  const [open, setOpen] = useState(true)

  const statusStyle: Record<string, string> = {
    confirmed: 'text-green-700 font-bold',
    auto: 'text-gray-500',
    dismissed: 'text-gray-300 line-through',
    pending: 'text-yellow-600 font-bold',
    info: 'text-blue-600',
  }

  const statusLabel: Record<string, string> = {
    confirmed: '✓ 已确认',
    auto: '自动',
    dismissed: '已忽略',
    pending: '待确认',
    info: '信息',
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-2.5">
      <div
        className="px-3 py-2 font-bold text-xs flex items-center gap-2 cursor-pointer select-none bg-gray-50 border-b border-gray-100 hover:bg-gray-100"
        onClick={() => setOpen(!open)}>
        <span>📝 操作日志</span>
        <span className="text-gray-400 font-normal">最近 {logs.length} 条</span>
        <span className="ml-auto text-gray-400">{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 bg-gray-50">
              <tr>
                <th className="px-2.5 py-1.5 text-left font-bold text-gray-500 border-b border-gray-100">时间</th>
                <th className="px-2.5 py-1.5 text-left font-bold text-gray-500 border-b border-gray-100">计划</th>
                <th className="px-2.5 py-1.5 text-left font-bold text-gray-500 border-b border-gray-100">规则</th>
                <th className="px-2.5 py-1.5 text-left font-bold text-gray-500 border-b border-gray-100">操作</th>
                <th className="px-2.5 py-1.5 text-left font-bold text-gray-500 border-b border-gray-100">ROI变化</th>
                <th className="px-2.5 py-1.5 text-left font-bold text-gray-500 border-b border-gray-100">预算变化</th>
                <th className="px-2.5 py-1.5 text-left font-bold text-gray-500 border-b border-gray-100">状态</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr><td colSpan={7} className="text-center text-gray-400 py-6">暂无操作记录</td></tr>
              )}
              {logs.map(l => (
                <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-2.5 py-1.5 text-gray-400 whitespace-nowrap">
                    {format(new Date(l.created_at), 'MM-dd HH:mm')}
                  </td>
                  <td className="px-2.5 py-1.5 font-semibold text-blue-800">{l.plan_name}</td>
                  <td className="px-2.5 py-1.5">
                    <span className="bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded font-bold">{l.rule_code}</span>
                  </td>
                  <td className="px-2.5 py-1.5 text-gray-700">{l.action}</td>
                  <td className="px-2.5 py-1.5">
                    {l.old_roi != null && l.new_roi != null ? (
                      <span>
                        <span className="text-gray-400 line-through">{l.old_roi}</span>
                        {' → '}
                        <span className={l.new_roi > l.old_roi ? 'text-red-600 font-bold' : 'text-green-700 font-bold'}>{l.new_roi}</span>
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-2.5 py-1.5">
                    {l.old_budget != null && l.new_budget != null ? (
                      <span>
                        <span className="text-gray-400 line-through">¥{l.old_budget}</span>
                        {' → '}
                        <span className={l.new_budget > l.old_budget ? 'text-green-700 font-bold' : 'text-red-600 font-bold'}>¥{l.new_budget}</span>
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-2.5 py-1.5">
                    <span className={statusStyle[l.status]}>{statusLabel[l.status]}</span>
                    {l.note && <div className="text-gray-400 text-xs">{l.note}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
