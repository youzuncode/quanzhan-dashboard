import { useState } from 'react'
import { RULE_DEFS } from '../lib/mockData'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Line, ComposedChart, Bar } from 'recharts'

interface Props {
  onClose: () => void
}

type Tab = 'overview' | 'log' | 'eval' | 'config' | 'backtest'

const layerBg: Record<string, { bg: string; color: string }> = {
  H: { bg: '#fff3e0', color: '#e65100' },
  D: { bg: '#e8eaf6', color: '#283593' },
  W: { bg: '#e8f5e9', color: '#2e7d32' },
}

// Deterministic mock effectiveness data
function buildEffData() {
  return RULE_DEFS.map(rd => {
    let h = 0
    for (let i = 0; i < rd.key.length; i++) h = (Math.imul(31, h) + rd.key.charCodeAt(i)) | 0
    const rng = (mn: number, mx: number) => { h = (Math.imul(1664525, h) + 1013904223) | 0; return mn + ((h >>> 0) / 4294967296) * (mx - mn) }
    const scaleUp = new Set(['R3', 'DT3', 'WK2'])
    const triggers = Math.round(rng(2, 20))
    const pending = Math.round(rng(0, 2))
    const auto = rd.auto ? Math.round(triggers * rng(0.6, 0.95)) : 0
    const avgRoiDelta = scaleUp.has(rd.key) ? +rng(0, 0.8).toFixed(2) : +rng(-0.6, 0.1).toFixed(2)
    const avgFebiDelta = scaleUp.has(rd.key) ? +rng(-2, 0).toFixed(1) : +rng(-4, 1).toFixed(1)
    const avgSpendDelta = scaleUp.has(rd.key) ? +rng(5, 30).toFixed(1) : +rng(-25, -5).toFixed(1)
    const successRate = triggers > 0 ? Math.round(((triggers - pending) / triggers) * 100) : 0
    return { ...rd, triggers, pending, auto, avgRoiDelta, avgFebiDelta, avgSpendDelta, successRate }
  })
}

const effData = buildEffData()

// Sample log rows from eff data
const logRows = effData.flatMap(e =>
  Array.from({ length: Math.min(e.triggers, 3) }, (_, i) => ({
    date: `05/${28 - i}`,
    plan: ['施华蔻养发精华液', 'UNO男士控油乳液', '海飞丝去屑洗发水', '清扬男士洗发水', '力士香薰沐浴露'][i % 5],
    rule: e.key, layer: e.layer, layerFull: e.layerFull,
    trigger: e.trigger, action: e.action,
    ok: i < e.triggers - e.pending,
    roiDelta: e.avgRoiDelta,
    color: e.color,
  }))
).slice(0, 60)

export function RuleEnginePage({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  const [fltPlan, setFltPlan] = useState('')
  const [fltRule, setFltRule] = useState('')
  const [fltLayer, setFltLayer] = useState('')
  const [fltStatus, setFltStatus] = useState('')

  const totalTriggers = effData.reduce((s, e) => s + e.triggers, 0)
  const totalPending = effData.reduce((s, e) => s + e.pending, 0)
  const autoRate = totalTriggers > 0 ? Math.round(effData.reduce((s, e) => s + e.auto, 0) / totalTriggers * 100) : 0

  const tabs: { k: Tab; l: string }[] = [
    { k: 'overview', l: '📋 规则总览' },
    { k: 'log', l: '📝 执行日志' },
    { k: 'eval', l: '📊 效果评估' },
    { k: 'config', l: '⚙️ 规则参数' },
    { k: 'backtest', l: '🔬 历史回测' },
  ]

  const filteredLog = logRows.filter(r =>
    (!fltPlan || r.plan === fltPlan) &&
    (!fltRule || r.rule === fltRule) &&
    (!fltLayer || r.layer === fltLayer) &&
    (!fltStatus || (fltStatus === 'ok' ? r.ok : !r.ok))
  )

  const scaleUp = new Set(['R3', 'DT3', 'WK2'])
  const costCut = new Set(['R1-A', 'R1-B', 'R2-A', 'R2-B', 'R2-C', 'DT1', 'DT4', 'WK1', 'WK3'])

  const chartData = effData.map(e => ({
    key: e.key,
    roiDelta: e.avgRoiDelta,
    triggers: e.triggers,
    fill: scaleUp.has(e.key)
      ? e.avgRoiDelta >= -0.05 ? 'rgba(46,125,50,.7)' : 'rgba(198,40,40,.6)'
      : e.avgRoiDelta < 0 ? 'rgba(46,125,50,.7)' : e.avgRoiDelta > 0.2 ? 'rgba(198,40,40,.6)' : 'rgba(245,127,23,.6)',
  }))

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 h-14 text-white flex-shrink-0"
        style={{ background: 'linear-gradient(135deg,#283593,#1565c0)' }}>
        <button onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)' }}>
          ← 返回看板
        </button>
        <div className="font-bold text-lg flex-1">⚙️ 规则引擎管理</div>
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-1 rounded-full bg-green-700/80">{totalTriggers}次触发</span>
          {totalPending > 0 && <span className="px-2 py-1 rounded-full bg-red-700/80">{totalPending}项待确认</span>}
          <span className="px-2 py-1 rounded-full" style={{ background: 'rgba(255,255,255,.2)' }}>自动执行率{autoRate}%</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b-2 border-gray-200 px-5 flex gap-0 flex-shrink-0">
        {tabs.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 -mb-0.5 transition-colors whitespace-nowrap
              ${tab === t.k ? 'text-indigo-800 border-indigo-800' : 'text-gray-500 border-transparent hover:text-indigo-800'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">

        {/* ── 规则总览 ── */}
        {tab === 'overview' && (
          <div>
            {/* KPI row */}
            <div className="grid grid-cols-5 gap-3 mb-4">
              {[
                ['总触发次数', totalTriggers, '#283593'],
                ['待确认', totalPending, totalPending ? '#c62828' : '#2e7d32'],
                ['自动执行率', autoRate + '%', '#2e7d32'],
                ['规则条数', RULE_DEFS.length, '#283593'],
              ].map(([l, v, c], i) => (
                <div key={i} className="bg-white rounded-xl p-3 text-center shadow-sm">
                  <div className="text-xl font-bold" style={{ color: c as string }}>{v}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{l}</div>
                </div>
              ))}
            </div>

            {/* Rule cards */}
            <div className="grid grid-cols-4 gap-3">
              {effData.map(e => {
                const lb = layerBg[e.layer]
                const effCls = e.avgRoiDelta == null ? 'neu' :
                  scaleUp.has(e.key) ? (e.avgRoiDelta >= -0.1 ? 'pos' : 'neg') :
                  e.avgRoiDelta < 0 ? 'pos' : e.avgRoiDelta > 0.2 ? 'neg' : 'neu'
                return (
                  <div key={e.key} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2 flex-wrap">
                      <span className="text-base">{e.icon}</span>
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: lb.bg, color: lb.color }}>{e.layerFull}</span>
                      <span className="font-bold text-xs">{e.key} · {e.label}</span>
                      <span className={`ml-auto text-xs font-bold px-1.5 py-0.5 rounded ${e.auto ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {e.auto ? '自动' : '确认'}
                      </span>
                    </div>
                    <div className="px-3 py-2">
                      <div className="text-xs text-gray-500 mb-2 line-clamp-2">{e.desc}</div>
                      <div className="grid grid-cols-3 gap-1.5 mb-2">
                        <div className="text-center p-1 bg-gray-50 rounded">
                          <div className="font-bold text-sm" style={{ color: e.color }}>{e.triggers}</div>
                          <div className="text-xs text-gray-400">触发</div>
                        </div>
                        <div className="text-center p-1 bg-gray-50 rounded">
                          <div className="font-bold text-sm" style={{ color: e.pending ? '#c62828' : '#2e7d32' }}>{e.pending}</div>
                          <div className="text-xs text-gray-400">待确认</div>
                        </div>
                        <div className="text-center p-1 bg-gray-50 rounded">
                          <div className="font-bold text-sm text-indigo-800">{e.successRate}%</div>
                          <div className="text-xs text-gray-400">执行率</div>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                        <div className="h-full rounded-full" style={{ width: `${e.successRate}%`, background: e.color }} />
                      </div>
                      <div className={`text-xs px-2 py-1 rounded flex items-center gap-1
                        ${effCls === 'pos' ? 'bg-green-50 text-green-800' : effCls === 'neg' ? 'bg-red-50 text-red-800' : 'bg-gray-50 text-gray-600'}`}>
                        <span>{effCls === 'pos' ? '✅' : effCls === 'neg' ? '⚠️' : 'ℹ️'}</span>
                        <span>执行后ROI {e.avgRoiDelta > 0 ? '↑' : '↓'}{Math.abs(e.avgRoiDelta)} | 费比{e.avgFebiDelta > 0 ? '↑' : '↓'}{Math.abs(e.avgFebiDelta)}%</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── 执行日志 ── */}
        {tab === 'log' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-3 border-b border-gray-100 flex gap-2 flex-wrap items-center">
              <span className="text-xs font-bold text-gray-500">筛选：</span>
              <select className="text-xs border border-gray-300 rounded px-2 py-1" value={fltPlan} onChange={e => setFltPlan(e.target.value)}>
                <option value="">全部计划</option>
                {[...new Set(logRows.map(r => r.plan))].map(n => <option key={n}>{n}</option>)}
              </select>
              <select className="text-xs border border-gray-300 rounded px-2 py-1" value={fltRule} onChange={e => setFltRule(e.target.value)}>
                <option value="">全部规则</option>
                {RULE_DEFS.map(r => <option key={r.key}>{r.key}</option>)}
              </select>
              <select className="text-xs border border-gray-300 rounded px-2 py-1" value={fltLayer} onChange={e => setFltLayer(e.target.value)}>
                <option value="">全部层级</option>
                <option value="H">小时层</option>
                <option value="D">日层</option>
                <option value="W">周层</option>
              </select>
              <select className="text-xs border border-gray-300 rounded px-2 py-1" value={fltStatus} onChange={e => setFltStatus(e.target.value)}>
                <option value="">全部状态</option>
                <option value="ok">已执行</option>
                <option value="pending">待确认</option>
              </select>
              <span className="ml-auto text-xs text-gray-400">共 <strong>{filteredLog.length}</strong> 条</span>
            </div>
            <div className="overflow-x-auto max-h-[calc(100vh-280px)]">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-2 py-1.5 text-left text-gray-500 font-bold whitespace-nowrap">时间</th>
                    <th className="px-2 py-1.5 text-left text-gray-500 font-bold">计划</th>
                    <th className="px-2 py-1.5 text-left text-gray-500 font-bold">规则</th>
                    <th className="px-2 py-1.5 text-left text-gray-500 font-bold">层级</th>
                    <th className="px-2 py-1.5 text-left text-gray-500 font-bold">执行动作</th>
                    <th className="px-2 py-1.5 text-left text-gray-500 font-bold">状态</th>
                    <th className="px-2 py-1.5 text-left text-gray-500 font-bold">次日ROI变化</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLog.map((r, i) => {
                    const lb = layerBg[r.layer]
                    return (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-2 py-1.5 text-gray-400 whitespace-nowrap">{r.date}</td>
                        <td className="px-2 py-1.5 font-semibold">{r.plan}</td>
                        <td className="px-2 py-1.5">
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: r.color + '22', color: r.color, border: `1px solid ${r.color}44` }}>
                            {r.rule}
                          </span>
                        </td>
                        <td className="px-2 py-1.5">
                          <span className="text-xs px-1 py-0.5 rounded" style={{ background: lb.bg, color: lb.color }}>{r.layerFull}</span>
                        </td>
                        <td className="px-2 py-1.5 text-gray-600 max-w-48 truncate">{r.action}</td>
                        <td className="px-2 py-1.5">
                          <span className={`font-semibold ${r.ok ? 'text-green-700' : 'text-yellow-600'}`}>
                            {r.ok ? '✅ 已执行' : '⏳ 待确认'}
                          </span>
                        </td>
                        <td className="px-2 py-1.5">
                          <span className={`font-bold ${r.roiDelta > 0 ? 'text-red-600' : 'text-green-700'}`}>
                            {r.roiDelta > 0 ? '↑' : '↓'}{Math.abs(r.roiDelta)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 效果评估 ── */}
        {tab === 'eval' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-xs text-gray-400 mb-2">基于30天历史执行数据，对比触发日前3日均值 vs 执行后3日均值，评估各规则实际效果。</div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="key" tick={{ fontSize: 9 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 9 }} label={{ value: 'ROI变化', angle: -90, position: 'insideLeft', fontSize: 9 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} label={{ value: '触发次数', angle: 90, position: 'insideRight', fontSize: 9 }} />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="roiDelta" name="ROI均变化" radius={[4, 4, 0, 0]}>
                      {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Bar>
                    <Line yAxisId="right" type="monotone" dataKey="triggers" stroke="rgba(63,81,181,.6)" strokeWidth={2} dot={{ r: 3 }} name="触发次数" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {effData.map(e => {
                const fmt = (v: number | null, unit: string) => v == null ? '—' : `${v > 0 ? '+' : ''}${v}${unit}`
                const roiGood = scaleUp.has(e.key) ? e.avgRoiDelta >= -0.05 : e.avgRoiDelta <= 0.1
                return (
                  <div key={e.key} className="bg-white rounded-xl shadow-sm p-3">
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className="text-sm">{e.icon}</span>
                      <span className="font-bold text-xs" style={{ color: e.color }}>{e.key}</span>
                      <span className="text-xs text-gray-500">{e.label}</span>
                      <span className="ml-auto text-xs text-gray-400">n={e.triggers}</span>
                    </div>
                    {[
                      ['触发后ROI变化', fmt(e.avgRoiDelta, ''), roiGood],
                      ['费比变化', fmt(e.avgFebiDelta, '%'), costCut.has(e.key) ? e.avgFebiDelta != null && e.avgFebiDelta < 0 : true],
                      ['花费变化', fmt(e.avgSpendDelta, '%'), costCut.has(e.key) ? e.avgSpendDelta != null && e.avgSpendDelta < 0 : true],
                    ].map(([label, val, good]) => (
                      <div key={String(label)} className="flex justify-between text-xs border-b border-gray-100 py-1">
                        <span className="text-gray-500">{String(label)}</span>
                        <span className={`font-bold ${good ? 'text-green-700' : 'text-red-700'}`}>{String(val)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-gray-500">执行率</span>
                      <span className="font-bold text-indigo-800">{e.successRate}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── 规则参数 ── */}
        {tab === 'config' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 font-bold text-sm border-b border-gray-100">📋 规则总体参数配置</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['规则', '层级', '触发条件', '执行动作', '执行方式', '状态'].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-bold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RULE_DEFS.map(rd => {
                    const lb = layerBg[rd.layer]
                    return (
                      <tr key={rd.key} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <div className="font-bold" style={{ color: rd.color }}>{rd.icon} {rd.key}</div>
                          <div className="text-gray-400">{rd.label}</div>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: lb.bg, color: lb.color }}>{rd.layerFull}</span>
                        </td>
                        <td className="px-3 py-2 text-gray-600 max-w-48">{rd.trigger}</td>
                        <td className="px-3 py-2 text-gray-600 max-w-48">{rd.action}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${rd.auto ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {rd.auto ? '🤖 自动' : '👤 人工确认'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-xs text-green-700 font-semibold">● 运行中</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 历史回测 ── */}
        {tab === 'backtest' && (
          <div className="flex gap-4">
            <div className="w-56 flex-shrink-0 bg-white rounded-xl shadow-sm p-4">
              <div className="font-bold text-sm mb-3">回测参数设置</div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-gray-500 block mb-1">时间范围</label>
                  <select className="w-full border border-gray-300 rounded px-2 py-1 text-xs">
                    <option>最近30天</option>
                    <option>最近14天</option>
                    <option>最近7天</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-500 block mb-1">选择规则</label>
                  <select className="w-full border border-gray-300 rounded px-2 py-1 text-xs">
                    <option>全部规则</option>
                    {RULE_DEFS.map(r => <option key={r.key}>{r.key}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-gray-500 block mb-1">选择计划</label>
                  <select className="w-full border border-gray-300 rounded px-2 py-1 text-xs">
                    <option>全部计划</option>
                  </select>
                </div>
                <button className="w-full py-2 rounded-lg bg-indigo-800 text-white font-semibold text-xs">
                  运行回测
                </button>
              </div>
            </div>
            <div className="flex-1 bg-white rounded-xl shadow-sm p-4">
              <div className="text-center text-gray-400 py-16 text-sm">
                <div className="text-3xl mb-3">🔬</div>
                <div className="font-semibold">历史回测功能</div>
                <div className="text-xs mt-2">设置参数后点击"运行回测"查看结果<br/>将对比规则干预 vs 不干预的收益差异</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
