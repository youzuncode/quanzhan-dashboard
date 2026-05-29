import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { plans, PLAN_PARAMS, PLAN_TODAY_TRIGGERS, PLAN_HIST_LOG, planErr } from '../lib/mockData'
import type { PlanData, TodayTrigger } from '../lib/mockData'

interface Props {
  planName: string
  onClose: () => void
}

type Tab = 'info' | 'params' | 'today' | 'history' | 'data'

interface TriggerState {
  status: 'ok' | 'pending' | 'loading' | 'confirmed' | 'dismissed'
  operator: string
  execTime?: string
}

// Generate daily data deterministically
function genDailyData(p: PlanData) {
  const rows = []
  const base = new Date(2026, 3, 29)
  let h = (p.roiTarget * 100 | 0) * 10000
  const rng = (mn: number, mx: number) => { h = (Math.imul(1664525, h) + 1013904223) | 0; return mn + ((h >>> 0) / 4294967296) * (mx - mn) }
  for (let i = 0; i < 30; i++) {
    const dt = new Date(base); dt.setDate(dt.getDate() + i)
    const roi = parseFloat((p.roiTarget * (0.84 + rng(0, 0.30))).toFixed(2))
    const febi = parseFloat((100 / roi).toFixed(1))
    const spend = Math.round(p.budget * (0.70 + rng(0, 0.48)))
    rows.push({ date: `${dt.getMonth() + 1}/${dt.getDate()}`, roi, febi, spend, rev: Math.round(spend * roi), orders: Math.round(spend / 58) })
  }
  return rows
}

export function PlanDetail({ planName, onClose }: Props) {
  const plan = plans.find(p => p.name === planName)
  const [activeTab, setActiveTab] = useState<Tab>('info')
  const [triggerStates, setTriggerStates] = useState<Record<string, TriggerState>>({})
  const [apiResults, setApiResults] = useState<Record<string, object>>({})
  const [dateRange, setDateRange] = useState<7 | 14 | 30>(14)
  const [metricKey, setMetricKey] = useState<'spend' | 'rev' | 'febi' | 'roi'>('roi')

  if (!plan) return (
    <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-gray-400 mb-4">计划不存在</div>
        <button onClick={onClose} className="text-indigo-800 underline text-sm">返回看板</button>
      </div>
    </div>
  )

  const pp = PLAN_PARAMS[plan.name] || { mode: '控投产比', multiTarget: false, oneKey: false, budgetType: '日预算', guard: false }
  const triggers = PLAN_TODAY_TRIGGERS[plan.name] || []
  const hist = PLAN_HIST_LOG[plan.name] || []
  const mapeInfo = planErr.find(e => e.name === plan.name)
  const pendingCount = triggers.filter(t => {
    const st = triggerStates[t.time + t.rule]
    return (st?.status || t.status) === 'pending'
  }).length
  const stopLossROI = parseFloat((1 / plan.gross).toFixed(2))
  const targetROI = parseFloat((1 / (plan.gross - 0.1)).toFixed(2))
  const roiGap = ((plan.roiTarget - stopLossROI) / stopLossROI * 100).toFixed(1)

  const zoneStyle = { red: 'bg-red-700', yellow: 'bg-yellow-600', green: 'bg-green-700' }
  const zoneLabel = { red: '🔴 红区', yellow: '🟡 黄区', green: '🟢 绿区' }
  const fc = plan.febi > plan.gross ? 'red' : plan.febi > (plan.gross - 0.1) ? 'yellow' : 'green'

  const dailyData = genDailyData(plan).slice(-dateRange)

  async function confirmTrigger(t: TodayTrigger) {
    const key = t.time + t.rule
    setTriggerStates(prev => ({ ...prev, [key]: { status: 'loading', operator: '操作员' } }))
    await new Promise(res => setTimeout(res, 800))
    const params = [{ key: '参数已更新', before: '当前值', after: '已执行', change: '完成', dir: 'neutral' }]
    setApiResults(prev => ({ ...prev, [key]: { status: 'success', message: '参数设置成功', params } }))
    setTriggerStates(prev => ({ ...prev, [key]: { status: 'confirmed', operator: '操作员', execTime: new Date().toLocaleTimeString('zh-CN') } }))
  }

  function dismissTrigger(t: TodayTrigger) {
    const key = t.time + t.rule
    setTriggerStates(prev => ({ ...prev, [key]: { status: 'dismissed', operator: '操作员' } }))
  }

  const tabs: { k: Tab; l: string }[] = [
    { k: 'info', l: '📊 基本信息' },
    { k: 'params', l: '⚙️ 出价参数' },
    { k: 'today', l: `🔔 今日规则${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
    { k: 'history', l: '📋 历史日志' },
    { k: 'data', l: '📈 推广数据' },
  ]

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 h-14 text-white flex-shrink-0"
        style={{ background: 'linear-gradient(135deg,#0a2f4e,#1565c0)' }}>
        <button onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)' }}>
          <ArrowLeft size={13} /> 返回看板
        </button>
        <div className="font-bold text-lg flex-1 truncate">{plan.name}</div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-1 rounded text-white ${zoneStyle[plan.zone]}`}>{zoneLabel[plan.zone]}</span>
          <span className={`text-xs font-bold px-2 py-1 rounded text-white ${plan.conf === 'H' ? 'bg-green-600' : plan.conf === 'M' ? 'bg-yellow-500' : 'bg-red-600'}`}>
            {plan.conf}级置信度
          </span>
          {mapeInfo && <span className="text-xs opacity-70">MAPE {mapeInfo.mape}%</span>}
        </div>
      </div>

      {/* Hero metrics */}
      <div className="bg-white border-b border-gray-200 px-5 py-2.5 flex-shrink-0 overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {[
            { label: '净目标投产比', val: plan.roiTarget.toFixed(1), sub: `≈${(100 / plan.roiTarget).toFixed(1)}%费比` },
            { label: '今日费比', val: (plan.febi * 100).toFixed(1) + '%', sub: `止损线${(plan.gross * 100).toFixed(0)}%` },
            { label: 'Gross毛利率', val: (plan.gross * 100).toFixed(0) + '%', sub: `目标费比${(plan.gross * 100 - 10).toFixed(0)}%` },
            { label: '止损ROI', val: stopLossROI.toString(), sub: '=1÷Gross' },
            { label: '目标ROI', val: targetROI.toString(), sub: '=1÷(Gross−10%)' },
            { label: 'ROI余量', val: `${+roiGap > 0 ? '+' : ''}${roiGap}pp`, sub: plan.zone === 'red' ? '⚠ 已超止损' : plan.zone === 'yellow' ? '▲ 接近止损' : '✓ 安全' },
            { label: '每日预算', val: plan.budget === 0 ? '暂停' : `¥${plan.budget.toLocaleString()}`, sub: plan.budget > 0 ? `利用率${Math.round(plan.spend / plan.budget * 100)}%` : '今日已暂停' },
            { label: '今日花费', val: `¥${plan.spend.toLocaleString()}`, sub: '' },
          ].map((m, i) => (
            <div key={i} className="px-4 border-r border-gray-200 last:border-r-0 flex flex-col gap-0.5 min-w-max">
              <div className="text-xs text-gray-400">{m.label}</div>
              <div className="text-base font-bold leading-tight">{m.val}</div>
              {m.sub && <div className="text-xs text-gray-400">{m.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b-2 border-gray-200 px-5 flex gap-0 flex-shrink-0">
        {tabs.map(t => (
          <button key={t.k} onClick={() => setActiveTab(t.k)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 -mb-0.5 transition-colors whitespace-nowrap
              ${activeTab === t.k ? 'text-indigo-800 border-indigo-800' : 'text-gray-500 border-transparent hover:text-indigo-800'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* ── 基本信息 ── */}
        {activeTab === 'info' && (
          <>
            {/* ROI range bar */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="font-bold text-sm mb-3">📐 ROI区间可视化</div>
              <div className="relative h-3 rounded-full overflow-hidden mb-2"
                style={{ background: `linear-gradient(to right, #ffcdd2 0%, #ffcdd2 ${(stopLossROI / (plan.roiTarget * 1.3)) * 100}%, #fff9c4 ${(stopLossROI / (plan.roiTarget * 1.3)) * 100}%, #fff9c4 ${(targetROI / (plan.roiTarget * 1.3)) * 100}%, #c8e6c9 ${(targetROI / (plan.roiTarget * 1.3)) * 100}%, #c8e6c9 100%)`, border: '1px solid #e0e0e0' }}>
                <div className="absolute top-0 h-full w-0.5 bg-indigo-800"
                  style={{ left: `${(plan.roiTarget / (plan.roiTarget * 1.3)) * 100}%` }} />
              </div>
              <div className="flex gap-4 text-xs mt-1">
                <span className="text-red-700">■ 亏损区（费比&gt;Gross）</span>
                <span className="text-yellow-600">■ 黄区（目标~止损之间）</span>
                <span className="text-green-700">■ 绿区（费比&lt;目标费比）</span>
                <span className="text-indigo-800 font-bold">│ 当前ROI {plan.roiTarget}</span>
              </div>
            </div>

            {/* KPI grid */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: '净目标投产比', val: plan.roiTarget.toFixed(1), sub: `≈${(100 / plan.roiTarget).toFixed(1)}%费比`, cls: 'text-indigo-800' },
                { label: '今日费比', val: `${(plan.febi * 100).toFixed(1)}%`, sub: `止损线${(plan.gross * 100).toFixed(0)}%`, cls: fc === 'red' ? 'text-red-700' : fc === 'yellow' ? 'text-yellow-600' : 'text-green-700' },
                { label: 'Gross毛利率', val: `${(plan.gross * 100).toFixed(0)}%`, sub: `目标费比${(plan.gross * 100 - 10).toFixed(0)}%`, cls: '' },
                { label: 'ROI余量', val: `${+roiGap > 0 ? '+' : ''}${roiGap}pp`, sub: plan.zone === 'red' ? '⚠ 亏损' : plan.zone === 'yellow' ? '▲ 接近止损' : '✓ 安全余量', cls: plan.zone === 'red' ? 'text-red-700' : plan.zone === 'yellow' ? 'text-yellow-600' : 'text-green-700' },
                { label: '每日预算', val: plan.budget === 0 ? '¥0 暂停' : `¥${plan.budget.toLocaleString()}`, sub: plan.budget === 0 ? '⏸ 已暂停' : '运行中', cls: plan.budget === 0 ? 'text-red-700' : '' },
                { label: '今日花费', val: `¥${plan.spend.toLocaleString()}`, sub: `利用率${plan.budget > 0 ? Math.round(plan.spend / plan.budget * 100) + '%' : '—'}`, cls: '' },
                { label: '优质计划防停投', val: plan.guard ? '✅ 已开启' : '❌ 已关闭', sub: plan.guard ? '已开启' : '已关闭', cls: plan.guard ? 'text-green-700' : 'text-red-700' },
                { label: '置信度', val: `${plan.conf}级`, sub: mapeInfo ? `14天MAPE ${mapeInfo.mape}%` : '—', cls: '' },
              ].map((m, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-3">
                  <div className="text-xs text-gray-400">{m.label}</div>
                  <div className={`text-lg font-bold my-1 ${m.cls}`}>{m.val}</div>
                  <div className="text-xs text-gray-400">{m.sub}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── 出价参数 ── */}
        {activeTab === 'params' && (
          <>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="font-bold text-sm mb-3">⚙️ 当前出价参数（共8项）</div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { icon: '⚡', label: '出价方式', val: pp.mode, sub: pp.mode === '最大化拿量' ? 'R1-B/R3暂停，仅R2-B费比止损' : 'ROI目标驱动系统出价' },
                  { icon: '🎯', label: '多目标优化', val: pp.multiTarget ? '✅ 已开启' : '❌ 关闭', sub: pp.multiTarget ? '加购+成交双目标' : '仅成交目标' },
                  { icon: '🚀', label: '一键起量', val: pp.oneKey ? '✅ 已开启' : '❌ 关闭', sub: pp.oneKey ? '系统加速拿量' : '标准竞价' },
                  { icon: '💰', label: '预算类型', val: pp.budgetType, sub: '按日限额控制' },
                  { icon: '🛡', label: '防停投', val: plan.guard ? '✅ 已开启' : '❌ 已关闭', sub: plan.guard ? '绿区自动追量' : '红/黄区强制关闭' },
                  { icon: '📊', label: '出价目标', val: plan.roiTarget.toFixed(1), sub: '净目标投产比当前值' },
                  { icon: '📅', label: '预算状态', val: plan.budget === 0 ? '暂停' : `¥${plan.budget.toLocaleString()}`, sub: plan.budget === 0 ? 'R1-A触发暂停' : '当日可用预算' },
                  { icon: '🎖', label: '计划区域', val: zoneLabel[plan.zone], sub: { red: '费比>Gross，亏损', yellow: '费比>目标，预警', green: '费比<目标，健康' }[plan.zone] },
                ].map((c, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-3">
                    <div className="text-xl mb-1">{c.icon}</div>
                    <div className="text-xs text-gray-400">{c.label}</div>
                    <div className="font-bold text-sm my-0.5">{c.val}</div>
                    <div className="text-xs text-gray-400">{c.sub}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="font-bold text-sm mb-3">💡 ROI↔费比换算</div>
              <div className="grid grid-cols-6 gap-2">
                {[stopLossROI, targetROI, plan.roiTarget, 5, 7, 10].map((roi, i) => (
                  <div key={i} className="text-center p-2 rounded bg-gray-50">
                    <div className="text-xs text-gray-400">{i === 0 ? '止损ROI' : i === 1 ? '目标ROI' : i === 2 ? '当前ROI' : `ROI ${roi}`}</div>
                    <div className={`font-bold text-sm my-1 ${i === 0 ? 'text-red-700' : i === 1 ? 'text-green-700' : i === 2 ? 'text-indigo-800' : 'text-gray-600'}`}>{roi}</div>
                    <div className="text-xs text-gray-400">{(100 / +roi).toFixed(1)}%费比</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── 今日规则 ── */}
        {activeTab === 'today' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 font-bold text-sm">
              🔔 今日规则触发时间线
              <span className="ml-2 text-xs font-normal text-gray-400">{triggers.length}条 · 待确认{pendingCount}条</span>
            </div>
            {triggers.length === 0 ? (
              <div className="text-center text-gray-400 py-12 text-sm">今日暂无规则触发</div>
            ) : (
              <div className="p-4 space-y-4">
                {triggers.map(t => {
                  const key = t.time + t.rule
                  const st = triggerStates[key]
                  const status = st?.status || t.status
                  const apiRes = apiResults[key] as { status: string; message: string; params: { key: string; before: string; after: string; change: string; dir: string }[] } | undefined
                  const zoneBg = t.zone === 'red' ? 'border-red-200 bg-red-50' : t.zone === 'yellow' ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'
                  return (
                    <div key={key} className={`rounded-lg border overflow-hidden ${zoneBg}`}>
                      <div className="px-3 py-2 flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-gray-400">{t.time}</span>
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded text-white ${t.zone === 'red' ? 'bg-red-700' : t.zone === 'yellow' ? 'bg-yellow-600' : 'bg-green-700'}`}>{t.rule}</span>
                        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold
                          ${status === 'ok' || status === 'confirmed' ? 'bg-green-100 text-green-800' : status === 'pending' ? 'bg-yellow-100 text-yellow-800 animate-pulse' : status === 'loading' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                          {status === 'ok' ? '✅ 已执行' : status === 'confirmed' ? `✅ 已确认 ${st?.execTime}` : status === 'pending' ? '⏳ 待执行' : status === 'loading' ? '📡 调用中…' : '✗ 已忽略'}
                        </span>
                      </div>
                      <div className="px-3 py-2 bg-white text-xs space-y-1.5">
                        <div className="text-gray-600"><span className="font-semibold">操作方：</span>{st?.operator || t.operator}</div>
                        <div className="bg-indigo-50 text-indigo-800 font-semibold px-2 py-1 rounded">⚙️ {t.action}</div>
                        {status === 'pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => confirmTrigger(t)}
                              className="px-3 py-1 rounded bg-green-700 text-white font-semibold text-xs">✓ 确认执行</button>
                            <button onClick={() => dismissTrigger(t)}
                              className="px-3 py-1 rounded bg-gray-300 text-gray-700 font-semibold text-xs">✗ 忽略</button>
                          </div>
                        )}
                        {status === 'loading' && (
                          <div className="flex items-center gap-2 text-blue-700">
                            <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            正在调用 API…
                          </div>
                        )}
                        {apiRes && (
                          <div className="border border-green-200 rounded bg-green-50 p-2 mt-1">
                            <div className="font-bold text-green-800 text-xs mb-1">✅ {apiRes.message}</div>
                            <div className="space-y-0.5">
                              {apiRes.params.map((p, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                  <span className="text-gray-600 w-24 shrink-0">{p.key}</span>
                                  <span className="text-gray-500">{p.before}</span>
                                  <span className="text-gray-400">→</span>
                                  <span className={`font-bold ${p.dir === 'up' ? 'text-green-700' : p.dir === 'down' ? 'text-red-700' : 'text-indigo-800'}`}>{p.after}</span>
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
            )}
          </div>
        )}

        {/* ── 历史日志 ── */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 font-bold text-sm border-b border-gray-100">
              📋 近14天操作日志
              <span className="ml-2 text-xs font-normal text-gray-400">{hist.length}条记录</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['日期', '规则', '执行动作', '结果', '操作方', '备注'].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-bold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hist.map((h, i) => {
                    const resultCls = { ok: 'text-green-700', fail: 'text-red-700', warn: 'text-yellow-600', skip: 'text-gray-400' }
                    const resultLbl = { ok: '✅ 成功', fail: '❌ 失败', warn: '⏳ 待确认', skip: '— 无触发' }
                    return (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-1.5 font-bold whitespace-nowrap">{h.date}</td>
                        <td className="px-3 py-1.5"><span className="text-xs font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">{h.rule}</span></td>
                        <td className="px-3 py-1.5 text-indigo-800">{h.action}</td>
                        <td className={`px-3 py-1.5 font-semibold ${resultCls[h.result]}`}>{resultLbl[h.result]}</td>
                        <td className="px-3 py-1.5 text-gray-400 whitespace-nowrap">{h.operator}</td>
                        <td className="px-3 py-1.5 text-gray-400">{h.note || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 推广数据 ── */}
        {activeTab === 'data' && (
          <>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex gap-1">
                {([7, 14, 30] as const).map(d => (
                  <button key={d} onClick={() => setDateRange(d)}
                    className={`px-3 py-1 rounded text-xs font-semibold ${dateRange === d ? 'bg-indigo-800 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>
                    {d}天
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                {(['spend', 'rev', 'febi', 'roi'] as const).map(k => (
                  <button key={k} onClick={() => setMetricKey(k)}
                    className={`px-3 py-1 rounded text-xs font-semibold ${metricKey === k ? 'bg-indigo-800 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>
                    {k === 'spend' ? '花费' : k === 'rev' ? '成交额' : k === 'febi' ? '费比' : 'ROI'}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="font-bold text-sm mb-3">日趋势 – {metricKey === 'spend' ? '花费' : metricKey === 'rev' ? '成交额' : metricKey === 'febi' ? '费比(%)' : 'ROI'}</div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip />
                    {metricKey === 'roi' && (
                      <>
                        <ReferenceLine y={targetROI} stroke="#2e7d32" strokeDasharray="4 2" label={{ value: `目标ROI ${targetROI}`, fill: '#2e7d32', fontSize: 9 }} />
                        <ReferenceLine y={stopLossROI} stroke="#c62828" strokeDasharray="4 2" label={{ value: `止损ROI ${stopLossROI}`, fill: '#c62828', fontSize: 9 }} />
                      </>
                    )}
                    <Line type="monotone" dataKey={metricKey} stroke="#1565c0" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 font-bold text-sm border-b border-gray-100">数据明细</div>
              <div className="overflow-x-auto max-h-60">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {['日期', '花费', '成交额', 'ROI', '费比', '订单数'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-bold text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...dailyData].reverse().map((d, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-1.5 font-semibold">{d.date}</td>
                        <td className="px-3 py-1.5">¥{d.spend.toLocaleString()}</td>
                        <td className="px-3 py-1.5">¥{d.rev.toLocaleString()}</td>
                        <td className={`px-3 py-1.5 font-bold ${d.roi >= targetROI ? 'text-green-700' : d.roi >= stopLossROI ? 'text-yellow-600' : 'text-red-700'}`}>{d.roi}</td>
                        <td className={`px-3 py-1.5 ${d.febi > plan.gross * 100 ? 'text-red-700 font-bold' : d.febi > plan.gross * 100 - 10 ? 'text-yellow-600' : 'text-green-700'}`}>{d.febi}%</td>
                        <td className="px-3 py-1.5">{d.orders}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
