import { useState } from 'react'
import { getInspectionTimepoints } from '../../lib/rules'
import type { Alert } from '../../types/database'

interface Props {
  alerts: Alert[]
}

export function InspectionPanel({ alerts }: Props) {
  const timepoints = getInspectionTimepoints()
  const now = new Date()
  const currentHour = now.getHours()

  const [activeIdx, setActiveIdx] = useState(() => {
    const tpHours = [9, 12, 14, 16, 18, 20, 22]
    for (let i = tpHours.length - 1; i >= 0; i--) {
      if (currentHour >= tpHours[i]) return i
    }
    return 0
  })

  const tpHours = [9, 12, 14, 16, 18, 20, 22]

  function getDotStatus(idx: number) {
    const h = tpHours[idx]
    if (currentHour > h) return 'done'
    if (currentHour === h) return 'now'
    return 'pending'
  }

  const activeTp = timepoints[activeIdx]
  const tpAlerts = alerts.filter(a => a.inspection_point === activeTp.time)

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden flex-1">
      <div className="px-3 py-2 font-bold text-xs border-b border-gray-100">🕐 日内7时点巡检</div>
      <div className="flex" style={{ minHeight: 300 }}>
        {/* Left nav */}
        <div className="w-28 border-r border-gray-100 bg-gray-50 flex-shrink-0">
          <div className="px-3 py-2 text-xs font-bold text-indigo-800 bg-indigo-50 border-b border-gray-100">巡检时点</div>
          {timepoints.map((tp, idx) => {
            const dot = getDotStatus(idx)
            return (
              <div
                key={tp.time}
                onClick={() => setActiveIdx(idx)}
                className={`px-3 py-2 cursor-pointer border-b border-gray-100 relative transition-colors
                  ${activeIdx === idx ? 'bg-indigo-50 border-r-2 border-r-indigo-800' : 'hover:bg-blue-50'}`}>
                <div className={`text-xs font-bold ${activeIdx === idx ? 'text-indigo-800' : 'text-gray-600'}`}>{tp.time}</div>
                <div className="text-xs text-gray-400">{tp.name}</div>
                <span className={`absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full
                  ${dot === 'done' ? 'bg-green-600' : dot === 'now' ? 'bg-blue-600 animate-pulse' : 'bg-gray-300'}`} />
              </div>
            )
          })}
        </div>

        {/* Right detail */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-3.5 py-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="font-bold text-sm">{activeTp.time} · {activeTp.name}</span>
              <span className="ml-2 text-xs text-gray-400">{activeTp.desc}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">置信度要求：</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded
                ${activeTp.confidence === 'H' ? 'bg-green-100 text-green-800' :
                  activeTp.confidence === 'M' ? 'bg-yellow-100 text-yellow-800' :
                  activeTp.confidence === '-' ? 'bg-indigo-100 text-indigo-800' :
                  'bg-red-100 text-red-800'}`}>
                {activeTp.confidence === 'H' ? '高置信度' :
                  activeTp.confidence === 'M' ? '中置信度' :
                  activeTp.confidence === 'M+' ? '中高置信度' :
                  activeTp.confidence === 'L' ? '低置信度 (仅预警)' : '—'}
              </span>
            </div>
          </div>
          <div className="p-3.5 flex-1 overflow-y-auto max-h-64">
            {tpAlerts.length === 0 ? (
              <div className="text-center text-gray-400 py-8 text-xs">该时点暂无告警记录</div>
            ) : (
              <div className="space-y-2">
                {tpAlerts.map(a => (
                  <div key={a.id} className={`rounded-lg border overflow-hidden
                    ${a.severity === 'red' ? 'border-red-200' : a.severity === 'yellow' ? 'border-yellow-200' : 'border-green-200'}`}>
                    <div className={`px-3 py-1.5 flex items-center gap-2 flex-wrap
                      ${a.severity === 'red' ? 'bg-red-50' : a.severity === 'yellow' ? 'bg-yellow-50' : 'bg-green-50'}`}>
                      <span className="font-bold text-xs">{a.plan_name}</span>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded
                        ${a.severity === 'red' ? 'bg-red-700 text-white' : a.severity === 'yellow' ? 'bg-yellow-600 text-white' : 'bg-green-700 text-white'}`}>
                        {a.rule_code}
                      </span>
                      <span className={`ml-auto text-xs font-bold px-1.5 py-0.5 rounded
                        ${a.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          a.status === 'pending' ? 'bg-yellow-100 text-yellow-800 animate-pulse' :
                          'bg-gray-100 text-gray-600'}`}>
                        {a.status === 'confirmed' ? '✓ 已确认' : a.status === 'pending' ? '待确认' : '自动'}
                      </span>
                    </div>
                    <div className="px-3 py-2 bg-white">
                      <div className="text-xs text-gray-600 mb-1">{a.detail}</div>
                      <div className="text-xs font-semibold text-indigo-800 bg-indigo-50 rounded px-2 py-1">
                        → {a.action_text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
