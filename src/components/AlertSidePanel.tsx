import { useState } from 'react'
import { sidePanelAlerts } from '../lib/mockData'
import type { SidePanelAlert } from '../lib/mockData'

interface Props {
  onClose: () => void
}

export function AlertSidePanel({ onClose }: Props) {
  const [alerts, setAlerts] = useState<SidePanelAlert[]>(sidePanelAlerts)

  const pending = alerts.filter(a => a.status === 'pending')
  const done = alerts.filter(a => a.status === 'done')

  function handleConfirm(id: string) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'done' } : a))
  }
  function handleIgnore(id: string) {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  const zoneBadge = { red: 'bg-red-700 text-white', yellow: 'bg-yellow-600 text-white', green: 'bg-green-700 text-white' }

  function AlertCard({ a, showActions }: { a: SidePanelAlert; showActions: boolean }) {
    return (
      <div className={`rounded-lg border overflow-hidden ${a.zone === 'red' ? 'border-red-200' : a.zone === 'yellow' ? 'border-yellow-200' : 'border-green-200'}`}>
        <div className={`px-3 py-2 flex items-center gap-2 flex-wrap ${a.zone === 'red' ? 'bg-red-50' : a.zone === 'yellow' ? 'bg-yellow-50' : 'bg-green-50'}`}>
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${zoneBadge[a.zone]}`}>{a.rule}</span>
          <span className="font-bold text-xs flex-1">{a.plan}</span>
          <span className="text-xs text-gray-400">{a.deadline}</span>
        </div>
        <div className="px-3 py-2 bg-white text-xs space-y-1.5">
          <div className="text-gray-600">{a.detail}</div>
          <div className="bg-indigo-50 text-indigo-800 font-semibold px-2 py-1 rounded">→ {a.actionText}</div>
          {showActions && (
            <div className="flex gap-2 mt-1">
              <button onClick={() => handleConfirm(a.id)}
                className="flex-1 py-1 rounded bg-green-700 text-white font-semibold text-xs">✓ 确认执行</button>
              <button onClick={() => handleIgnore(a.id)}
                className="px-3 py-1 rounded bg-gray-200 text-gray-600 font-semibold text-xs">✗ 忽略</button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-96 bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 text-white font-bold flex items-center justify-between flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #c62828, #e53935)' }}>
          <span>🔔 消息 / 预警中心</span>
          <button onClick={onClose} className="text-white/70 hover:text-white text-lg leading-none">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Pending */}
          <div className="px-4 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-bold text-sm text-red-800">待处理</span>
              {pending.length > 0 && (
                <span className="bg-red-700 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {pending.length}
                </span>
              )}
            </div>
            {pending.length === 0 ? (
              <div className="text-center text-gray-400 text-xs py-4">暂无待处理预警</div>
            ) : (
              <div className="space-y-2">
                {pending.map(a => <AlertCard key={a.id} a={a} showActions />)}
              </div>
            )}
          </div>

          {/* Done */}
          {done.length > 0 && (
            <div className="px-4 pt-4 pb-4">
              <div className="font-bold text-sm text-gray-500 mb-3">已处理</div>
              <div className="space-y-2 opacity-60">
                {done.map(a => <AlertCard key={a.id} a={a} showActions={false} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
