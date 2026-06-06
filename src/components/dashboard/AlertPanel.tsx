import { useState } from 'react'
import type { Alert } from '../../types/database'

interface Props {
  alerts: Alert[]
  onConfirm: (id: string, note: string) => void
  onDismiss: (id: string) => void
}

const severityStyle: Record<string, { border: string; bg: string; action: string }> = {
  red: {
    border: 'border-l-red-700',
    bg: 'bg-red-50',
    action: 'bg-red-100 text-red-700',
  },
  yellow: {
    border: 'border-l-yellow-600',
    bg: 'bg-yellow-50',
    action: 'bg-yellow-100 text-yellow-700',
  },
  green: {
    border: 'border-l-green-700',
    bg: 'bg-green-50',
    action: 'bg-green-100 text-green-700',
  },
  indigo: {
    border: 'border-l-blue-800',
    bg: 'bg-blue-50',
    action: 'bg-blue-100 text-blue-800',
  },
}

export function AlertPanel({ alerts, onConfirm, onDismiss }: Props) {
  const [noteInputId, setNoteInputId] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')

  const active = alerts.filter(a => a.status !== 'dismissed')
  const pending = active.filter(a => a.status === 'pending').length

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden flex-1">
      <div className="px-3 py-2 font-bold text-xs flex items-center gap-2 border-b border-gray-100">
        <span>⚡ 实时告警 / 操作建议</span>
        {pending > 0 && (
          <span className="bg-yellow-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
            {pending} 待确认
          </span>
        )}
      </div>
      <div className="p-2.5 space-y-2 max-h-80 overflow-y-auto">
        {active.length === 0 && (
          <div className="text-center text-gray-400 py-8 text-xs">暂无告警，系统运行正常 ✅</div>
        )}
        {active.map(a => {
          const s = severityStyle[a.severity] ?? severityStyle.indigo
          return (
            <div key={a.id} className={`rounded-lg p-2.5 border-l-4 ${s.border} ${s.bg}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs">{a.title}</span>
                <div className="flex items-center gap-1">
                  {a.inspection_point && (
                    <span className="text-xs text-gray-400">{a.inspection_point}</span>
                  )}
                  {a.status === 'pending' && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 font-bold px-1.5 py-0.5 rounded animate-pulse">
                      待确认
                    </span>
                  )}
                  {a.status === 'confirmed' && (
                    <span className="text-xs bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded">
                      ✓ 已确认
                    </span>
                  )}
                  {a.status === 'auto' && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                      自动执行
                    </span>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-500 leading-relaxed mb-1.5">{a.detail}</div>
              <div className={`text-xs font-semibold rounded px-2 py-1 mb-2 ${s.action}`}>
                → {a.action_text}
              </div>
              {a.status === 'pending' && (
                <div className="flex gap-1.5 items-center flex-wrap">
                  <button
                    onClick={() => setNoteInputId(noteInputId === a.id ? null : a.id)}
                    className="text-xs bg-green-700 text-white rounded px-2.5 py-1 font-bold flex items-center gap-1">
                    ✓ 确认执行
                  </button>
                  <button
                    onClick={() => onDismiss(a.id)}
                    className="text-xs bg-gray-100 text-gray-600 border border-gray-200 rounded px-2 py-1">
                    忽略
                  </button>
                  {noteInputId === a.id && (
                    <div className="flex gap-1.5 items-center w-full mt-1.5">
                      <input
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        placeholder="备注（可选）"
                        className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs"
                      />
                      <button
                        onClick={() => { onConfirm(a.id, noteText); setNoteInputId(null); setNoteText('') }}
                        className="text-xs bg-green-700 text-white rounded px-2 py-1">
                        提交
                      </button>
                    </div>
                  )}
                </div>
              )}
              {a.confirmed_note && (
                <div className="text-xs text-gray-400 mt-1">备注：{a.confirmed_note}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
