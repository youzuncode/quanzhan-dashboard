import { useState, useCallback, useRef } from 'react'
import { timepoints as defaultTimepoints, MOCK_API_PARAMS } from '../../lib/mockData'
import type { TimepointResult, Timepoint } from '../../lib/mockData'
import { loadJSON, saveJSON } from '../../lib/persist'

const LS_STATES = 'inspection.states'
const LS_API = 'inspection.apiResults'

interface ResultState {
  execStatus: 'executed' | 'confirmed' | 'pending' | 'loading' | 'dismissed' | 'api_error'
  execTime: string | null
  operator: string | null
  confirmNote: string
}

type ResultStates = Record<string, ResultState>
type ApiResults = Record<string, { status: string; message: string; requestId: string; execTime: string; params: { key: string; before: string; after: string; change: string; dir: string }[] }>

function initStates(timepoints: Timepoint[]): ResultStates {
  const persisted = loadJSON<ResultStates>(LS_STATES, {})
  const s: ResultStates = {}
  timepoints.forEach(tp => {
    tp.results.forEach(r => {
      // Persisted user actions win over mock defaults — restoration after reload
      s[r.id] = persisted[r.id] || {
        execStatus: r.initStatus,
        execTime: r.execTime || null,
        operator: r.operator || null,
        confirmNote: r.confirmNote || '',
      }
    })
  })
  return s
}

function buildMockAPIResponse(r: TimepointResult) {
  const spec = MOCK_API_PARAMS[r.id]
  const reqId = 'REQ-' + r.id.toUpperCase()
  return {
    status: 'success',
    message: '参数设置成功',
    requestId: reqId,
    execTime: new Date().toLocaleTimeString('zh-CN'),
    params: spec?.params || [{ key: '操作已记录', before: '—', after: '已执行', change: '完成', dir: 'neutral' }],
  }
}

interface Props {
  alerts?: unknown[]  // kept for compat
  timepoints?: Timepoint[]
}

export function InspectionPanel({ timepoints = defaultTimepoints }: Props) {
  const [activeIdx, setActiveIdx] = useState(2) // default 14:00
  const [states, setStatesRaw] = useState<ResultStates>(() => initStates(timepoints))
  const [apiResults, setApiResultsRaw] = useState<ApiResults>(() => loadJSON<ApiResults>(LS_API, {}))

  // Persistent setters — write through to localStorage on every mutation
  const setStates = useCallback((u: (p: ResultStates) => ResultStates) => {
    setStatesRaw(prev => { const next = u(prev); saveJSON(LS_STATES, next); return next })
  }, [])
  const setApiResults = useCallback((u: (p: ApiResults) => ApiResults) => {
    setApiResultsRaw(prev => { const next = u(prev); saveJSON(LS_API, next); return next })
  }, [])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [showNote, setShowNote] = useState<Record<string, boolean>>({})

  // When the store (timepoints) changes, re-init from persisted+defaults.
  // Per-result-id keys keep different stores' state isolated naturally.
  const prevTpRef = useRef(timepoints)
  if (prevTpRef.current !== timepoints) {
    prevTpRef.current = timepoints
    setStatesRaw(initStates(timepoints))
  }

  const now = new Date()
  const currentHour = now.getHours()
  const tpHours = [9, 12, 14, 16, 18, 20, 22]

  function getDotStatus(idx: number): 'done' | 'now' | 'pending' {
    const h = tpHours[idx]
    if (currentHour > h) return 'done'
    if (currentHour === h) return 'now'
    return 'pending'
  }

  const confirmAction = useCallback(async (r: TimepointResult, tp: Timepoint, withNote = false) => {
    const note = withNote ? (notes[r.id] || '') : ''
    void tp
    setStates(prev => ({ ...prev, [r.id]: { ...prev[r.id], execStatus: 'loading', execTime: null, operator: null, confirmNote: '' } }))
    await new Promise(res => setTimeout(res, 800))
    const apiRes = buildMockAPIResponse(r)
    const t = new Date().toLocaleTimeString('zh-CN')
    setApiResults(prev => ({ ...prev, [r.id]: apiRes }))
    setStates(prev => ({ ...prev, [r.id]: { execStatus: 'confirmed', execTime: t, operator: '操作员', confirmNote: note } }))
  }, [notes])

  const dismissAction = useCallback((r: TimepointResult) => {
    const t = new Date().toLocaleTimeString('zh-CN')
    setStates(prev => ({ ...prev, [r.id]: { execStatus: 'dismissed', execTime: t, operator: '操作员', confirmNote: '' } }))
  }, [])

  const confirmAll = useCallback(async (tp: Timepoint) => {
    const pendingConfirm = tp.results.filter(r => states[r.id]?.execStatus === 'pending' && r.type === 'confirm')
    for (const r of pendingConfirm) {
      await confirmAction(r, tp)
    }
  }, [states, confirmAction])

  const activeTp = timepoints[activeIdx]

  function getPendingCount(tp: Timepoint) {
    return tp.results.filter(r => states[r.id]?.execStatus === 'pending').length
  }
  function getDoneCount(tp: Timepoint) {
    return tp.results.filter(r => ['executed', 'confirmed'].includes(states[r.id]?.execStatus || '')).length
  }

  const zoneCls = { red: 'bg-red-50 border-red-200', yellow: 'bg-yellow-50 border-yellow-200', green: 'bg-green-50 border-green-200', gray: 'bg-gray-50 border-gray-200' }
  const zoneLabel = { red: '红区', yellow: '黄区', green: '绿区', gray: '信息' }
  const zoneBadge = { red: 'bg-red-700 text-white', yellow: 'bg-yellow-600 text-white', green: 'bg-green-700 text-white', gray: 'bg-gray-500 text-white' }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden flex-1">
      <div className="px-3 py-2 font-bold text-xs border-b border-gray-100">🕐 日内7时点巡检</div>
      <div className="flex" style={{ minHeight: 320 }}>
        {/* Left nav */}
        <div className="w-32 border-r border-gray-100 bg-gray-50 flex-shrink-0">
          <div className="px-3 py-2 text-xs font-bold text-indigo-800 bg-indigo-50 border-b border-gray-100">巡检时点</div>
          {timepoints.map((tp, idx) => {
            const dot = getDotStatus(idx)
            const pending = getPendingCount(tp)
            const done = getDoneCount(tp)
            const total = tp.results.length
            return (
              <div
                key={tp.time}
                onClick={() => setActiveIdx(idx)}
                className={`px-2.5 py-2 cursor-pointer border-b border-gray-100 relative transition-colors
                  ${activeIdx === idx ? 'bg-indigo-50 border-r-2 border-r-indigo-800' : 'hover:bg-blue-50'}`}>
                <div className={`text-xs font-bold ${activeIdx === idx ? 'text-indigo-800' : 'text-gray-600'}`}>{tp.time}</div>
                <div className="text-xs text-gray-400">{tp.name}</div>
                <div className="text-xs mt-0.5">
                  {pending > 0
                    ? <span className="text-yellow-600 font-semibold">⚠ 待确认{pending}</span>
                    : done === total && total > 0
                    ? <span className="text-green-700">✓ {done}/{total}</span>
                    : <span className="text-gray-400">{total}项</span>}
                </div>
                <span className={`absolute right-2 top-3 w-2 h-2 rounded-full
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
              <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded
                ${activeTp.conf === 'H' ? 'bg-green-100 text-green-800' : activeTp.conf === 'M' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                {activeTp.conf}级置信度
              </span>
              <span className="ml-2 text-xs text-gray-400">{activeTp.summary}</span>
            </div>
            {getPendingCount(activeTp) > 0 && (
              <button
                onClick={() => confirmAll(activeTp)}
                className="text-xs px-3 py-1 rounded-lg bg-indigo-800 text-white font-semibold">
                ✓ 一键确认全部 ({getPendingCount(activeTp)})
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-72">
            {activeTp.results.length === 0 ? (
              <div className="text-center text-gray-400 py-8 text-xs">此时点暂无规则结果</div>
            ) : activeTp.results.map(r => {
              const st = states[r.id]
              const status = st?.execStatus || r.initStatus
              const apiRes = apiResults[r.id]
              const zone = r.zone as keyof typeof zoneCls

              return (
                <div key={r.id} className={`rounded-lg border overflow-hidden ${zoneCls[zone] || zoneCls.gray}`}>
                  {/* Header */}
                  <div className="px-3 py-1.5 flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${zoneBadge[zone] || zoneBadge.gray}`}>{r.rule}</span>
                    <span className="font-semibold text-xs flex-1 truncate">{r.plan}</span>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${zoneBadge[zone] || zoneBadge.gray}`}>{zoneLabel[zone]}</span>
                    {/* Status badge */}
                    {status === 'executed' && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">🤖 已自动执行 {st?.execTime || r.execTime}</span>}
                    {status === 'confirmed' && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">✅ 已确认 {st?.execTime} · {st?.operator}</span>}
                    {status === 'pending' && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full animate-pulse">👤 待确认</span>}
                    {status === 'loading' && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">📡 API调用中…</span>}
                    {status === 'dismissed' && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">✗ 已忽略</span>}
                    {status === 'api_error' && <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">❌ API失败</span>}
                  </div>

                  {/* Body */}
                  <div className="px-3 py-2 bg-white text-xs space-y-1.5">
                    <div className="text-gray-600"><span className="font-semibold text-gray-700">触发：</span>{r.trigger}</div>
                    <div className="bg-indigo-50 text-indigo-800 font-semibold px-2 py-1 rounded">⚙️ {r.actionText}</div>

                    {/* Action buttons */}
                    {status === 'pending' && r.type === 'confirm' && (
                      <div className="space-y-1.5">
                        <div className="flex gap-2">
                          <button onClick={() => confirmAction(r, activeTp)}
                            className="px-3 py-1 rounded bg-green-700 text-white font-semibold text-xs">✓ 确认执行</button>
                          <button onClick={() => dismissAction(r)}
                            className="px-3 py-1 rounded bg-gray-300 text-gray-700 font-semibold text-xs">✗ 忽略</button>
                          <button onClick={() => setShowNote(p => ({ ...p, [r.id]: !p[r.id] }))}
                            className="px-3 py-1 rounded bg-gray-100 text-gray-600 font-semibold text-xs">+ 备注</button>
                        </div>
                        {showNote[r.id] && (
                          <div className="flex gap-2">
                            <input
                              className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs"
                              placeholder="输入备注…"
                              value={notes[r.id] || ''}
                              onChange={e => setNotes(p => ({ ...p, [r.id]: e.target.value }))}
                            />
                            <button onClick={() => confirmAction(r, activeTp, true)}
                              className="px-2 py-1 rounded bg-indigo-800 text-white text-xs">确认</button>
                          </div>
                        )}
                      </div>
                    )}
                    {status === 'loading' && (
                      <div className="flex items-center gap-2 text-blue-700">
                        <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        正在调用天猫全站推广 OpenAPI…
                      </div>
                    )}
                    {status === 'api_error' && (
                      <div className="flex gap-2">
                        <button onClick={() => confirmAction(r, activeTp)}
                          className="px-3 py-1 rounded bg-red-700 text-white font-semibold text-xs">↺ 重新调用API</button>
                        <button onClick={() => dismissAction(r)}
                          className="px-3 py-1 rounded bg-gray-300 text-gray-700 font-semibold text-xs">✗ 忽略</button>
                      </div>
                    )}

                    {/* API result */}
                    {apiRes && (
                      <div className="mt-1.5 border border-green-200 rounded bg-green-50 p-2">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-bold text-green-800">✅ {apiRes.message}</span>
                          <span className="text-gray-400">{apiRes.requestId}</span>
                        </div>
                        <div className="space-y-1">
                          {apiRes.params.map((param, pi) => (
                            <div key={pi} className="flex items-center gap-2 text-xs">
                              <span className="text-gray-600 w-28 shrink-0">{param.key}</span>
                              <span className="text-gray-500">{param.before}</span>
                              <span className="text-gray-400">→</span>
                              <span className={`font-bold ${param.dir === 'up' ? 'text-green-700' : param.dir === 'down' ? 'text-red-700' : 'text-indigo-800'}`}>
                                {param.after}
                              </span>
                              <span className="ml-auto text-gray-400 text-xs">{param.change}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
