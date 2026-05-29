import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { Plan } from '../types/database'
import { calcTargetRoi, calcBreakevenRoi, calcCostRateFromRoi } from '../lib/rules'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface Props {
  plans: Plan[]
  onUpdatePlan: (id: string, roi: number, budget: number) => void
}

const mockHourlyData = Array.from({ length: 14 }, (_, i) => ({
  hour: i + 8,
  spend: Math.random() * 40 + 10,
  revenue: Math.random() * 300 + 100,
  costRate: Math.random() * 0.15 + 0.08,
  roi: Math.random() * 8 + 4,
}))

const mockDailyData = Array.from({ length: 14 }, (_, i) => ({
  day: `5/${i + 16}`,
  spend: Math.random() * 200 + 100,
  revenue: Math.random() * 2000 + 500,
  costRate: Math.random() * 0.15 + 0.08,
  roi: Math.random() * 8 + 4,
}))

export function PlanDetail({ plans, onUpdatePlan }: Props) {
  const { id } = useParams()
  const navigate = useNavigate()
  const plan = plans.find(p => p.id === id)
  const [activeTab, setActiveTab] = useState<'overview' | 'data' | 'rules' | 'history'>('overview')
  const [editRoi, setEditRoi] = useState('')
  const [editBudget, setEditBudget] = useState('')

  if (!plan) return (
    <div className="p-8 text-center text-gray-500">
      计划不存在
      <button onClick={() => navigate('/')} className="ml-4 text-indigo-800 underline">返回看板</button>
    </div>
  )

  const targetRoi = calcTargetRoi(plan.gross_margin_rate)
  const breakevenRoi = calcBreakevenRoi(plan.gross_margin_rate)
  const costRateTarget = (plan.gross_margin_rate - 0.10) * 100
  const costRateBreakeven = plan.gross_margin_rate * 100

  const zoneStyle = {
    green: 'bg-green-700',
    yellow: 'bg-yellow-600',
    red: 'bg-red-700',
  }
  const zoneLabel = { green: '🟢 绿区', yellow: '🟡 黄区', red: '🔴 红区' }

  const tabs = [
    { key: 'overview', label: '📊 概览' },
    { key: 'data', label: '📈 数据趋势' },
    { key: 'rules', label: '📋 规则说明' },
    { key: 'history', label: '📝 操作历史' },
  ] as const

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 h-14 text-white flex-shrink-0"
        style={{ background: 'linear-gradient(135deg,#0a2f4e,#1565c0)' }}>
        <button onClick={() => navigate('/')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)' }}>
          <ArrowLeft size={13} /> 返回看板
        </button>
        <div className="font-bold text-lg flex-1 truncate">{plan.name}</div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-1 rounded text-white ${zoneStyle[plan.zone]}`}>
            {zoneLabel[plan.zone]}
          </span>
          <span className={`text-xs font-bold px-2 py-1 rounded
            ${plan.confidence === 'H' ? 'bg-green-600' : plan.confidence === 'M' ? 'bg-yellow-500' : 'bg-red-600'} text-white`}>
            置信度：{plan.confidence === 'H' ? '高' : plan.confidence === 'M' ? '中' : '低'}
          </span>
        </div>
      </div>

      {/* Hero metrics */}
      <div className="bg-white border-b border-gray-200 px-5 py-2.5 flex-shrink-0 overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {[
            { label: 'ROI目标', value: plan.roi_target, sub: `止损 ${breakevenRoi.toFixed(1)} / 目标 ${targetRoi.toFixed(1)}` },
            { label: '今日花费', value: `¥${plan.spend_today}`, sub: `预算 ¥${plan.daily_budget}` },
            { label: '今日成交', value: `¥${plan.revenue_today}`, sub: '' },
            { label: '当前费比', value: `${(plan.cost_rate_today*100).toFixed(1)}%`, sub: `目标 ≤${costRateTarget.toFixed(1)}%` },
            { label: 'ROI完成率', value: `${(plan.roi_completion_rate*100).toFixed(0)}%`, sub: plan.roi_completion_rate >= 1.3 ? '✅ 超额完成' : plan.roi_completion_rate >= 0.8 ? '⚠️ 正常区间' : '❌ 未达标' },
            { label: 'Gross毛利率', value: `${(plan.gross_margin_rate*100).toFixed(0)}%`, sub: `盈亏平衡费比 ${costRateBreakeven.toFixed(1)}%` },
          ].map((m, i) => (
            <div key={i} className="px-4 border-r border-gray-200 last:border-r-0 flex flex-col gap-0.5">
              <div className="text-xs text-gray-400 whitespace-nowrap">{m.label}</div>
              <div className="text-lg font-bold leading-tight">{m.value}</div>
              {m.sub && <div className="text-xs text-gray-400">{m.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b-2 border-gray-200 px-5 flex gap-0 flex-shrink-0">
        {tabs.map(t => (
          <button key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 -mb-0.5 transition-colors whitespace-nowrap
              ${activeTab === t.key ? 'text-indigo-800 border-indigo-800' : 'text-gray-500 border-transparent hover:text-indigo-800'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Param cards */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="font-bold text-sm mb-3">当前参数配置</div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { icon: '🎯', label: '净目标投产比', value: plan.roi_target, sub: `费比目标 ${calcCostRateFromRoi(plan.roi_target).toFixed(1)}%` },
                  { icon: '💰', label: '每日预算', value: `¥${plan.daily_budget}`, sub: `已花费 ¥${plan.spend_today}` },
                  { icon: '📡', label: '出价方式', value: plan.bid_mode === 'roi' ? '控投产比' : '最大化拿量', sub: plan.bid_mode === 'roi' ? '全套规则正常' : 'ROI类规则暂停' },
                  { icon: '🛡️', label: '防停投', value: plan.anti_stop_enabled ? '✅ 开启' : '❌ 关闭', sub: plan.anti_stop_enabled ? '系统可自动+10%预算' : '—' },
                ].map((c, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-3 flex items-center gap-3">
                    <span className="text-2xl">{c.icon}</span>
                    <div>
                      <div className="text-xs text-gray-400">{c.label}</div>
                      <div className="font-bold text-sm">{c.value}</div>
                      <div className="text-xs text-gray-400">{c.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Adjust panel */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="font-bold text-sm mb-3">手动调整参数</div>
              <div className="flex gap-4 items-end">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">净目标投产比（当前 {plan.roi_target}）</label>
                  <input
                    type="number" step="0.1" min="1" max="20"
                    value={editRoi} onChange={e => setEditRoi(e.target.value)}
                    placeholder={plan.roi_target.toString()}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-32"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">每日预算（当前 ¥{plan.daily_budget}）</label>
                  <input
                    type="number" step="10" min="0"
                    value={editBudget} onChange={e => setEditBudget(e.target.value)}
                    placeholder={plan.daily_budget.toString()}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-36"
                  />
                </div>
                <button
                  onClick={() => {
                    const roi = editRoi ? parseFloat(editRoi) : plan.roi_target
                    const budget = editBudget ? parseInt(editBudget) : plan.daily_budget
                    onUpdatePlan(plan.id, roi, budget)
                    setEditRoi(''); setEditBudget('')
                    alert(`已更新：ROI=${roi}，预算=¥${budget}`)
                  }}
                  className="bg-indigo-800 text-white rounded-lg px-5 py-2 text-sm font-bold">
                  保存调整
                </button>
                <div className="text-xs text-gray-400">
                  {editRoi && `→ 费比目标 ${calcCostRateFromRoi(parseFloat(editRoi)).toFixed(1)}%`}
                </div>
              </div>
            </div>

            {/* ROI range bar */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="font-bold text-sm mb-3">三区间可视化</div>
              <div className="relative h-3 rounded-full mb-4"
                style={{ background: 'linear-gradient(to right, #c62828 0%, #c62828 33%, #f57f17 33%, #f57f17 60%, #2e7d32 60%, #2e7d32 100%)' }}>
                {/* Current cost rate marker */}
                <div className="absolute top-1/2 -translate-y-1/2 w-1 h-5 bg-black rounded"
                  style={{ left: `${Math.min(plan.cost_rate_today / plan.gross_margin_rate * 60, 100)}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span className="text-red-700">止损 {costRateBreakeven.toFixed(1)}%</span>
                <span className="text-yellow-600">利润目标 {costRateTarget.toFixed(1)}%</span>
                <span className="text-green-700">绿区 ≤{costRateTarget.toFixed(1)}%</span>
              </div>
              <div className="text-xs text-center mt-2 font-semibold">
                当前费比 {(plan.cost_rate_today*100).toFixed(1)}% —
                <span className={plan.zone === 'green' ? 'text-green-700' : plan.zone === 'yellow' ? 'text-yellow-600' : 'text-red-700'}>
                  {' '}{zoneLabel[plan.zone]}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="font-bold text-sm mb-3">今日分时费比趋势</div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockHourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="hour" tickFormatter={h => `${h}:00`} tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={v => `${(v*100).toFixed(0)}%`} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => typeof v === 'number' ? `${(v*100).toFixed(1)}%` : v} />
                    <ReferenceLine y={plan.gross_margin_rate} stroke="#c62828" strokeDasharray="4 2" label={{ value: '止损线', fill: '#c62828', fontSize: 9 }} />
                    <ReferenceLine y={plan.gross_margin_rate - 0.10} stroke="#f57f17" strokeDasharray="4 2" label={{ value: '利润线', fill: '#f57f17', fontSize: 9 }} />
                    <Line type="monotone" dataKey="costRate" stroke="#283593" strokeWidth={2} dot={false} name="费比" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="font-bold text-sm mb-3">近14天日ROI趋势</div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockDailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <ReferenceLine y={targetRoi} stroke="#2e7d32" strokeDasharray="4 2" label={{ value: `目标ROI ${targetRoi.toFixed(1)}`, fill: '#2e7d32', fontSize: 9 }} />
                    <ReferenceLine y={breakevenRoi} stroke="#c62828" strokeDasharray="4 2" label={{ value: `止损ROI ${breakevenRoi.toFixed(1)}`, fill: '#c62828', fontSize: 9 }} />
                    <Line type="monotone" dataKey="roi" stroke="#1565c0" strokeWidth={2} dot={{ r: 3 }} name="实际ROI" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="space-y-3">
            {[
              {
                code: 'R1-A', label: '紧急止损（异常消耗+零转化）', color: 'red',
                condition: '本小时花费 > 28天均值+2σ AND 新增成交=0 AND 加购=0 AND ROI完成率<80%',
                action: '暂停计划 或 今日预算→¥0；关闭防停投；次日恢复ROI上调15%',
              },
              {
                code: 'R1-B', label: '费比偏高预警', color: 'yellow',
                condition: '计划费比 > 全店累计费比 AND 预估全天收益 < 昨日花费',
                action: 'ROI×1.15 | 剩余预算×0.8 | 关闭防停投',
              },
              {
                code: 'R2-A', label: '压量（ROI完成率不足）', color: 'yellow',
                condition: 'ROI完成率<60% AND 花费>100元 AND 出价方式=控投产比',
                action: 'ROI×1.18 | 剩余预算×0.7',
              },
              {
                code: 'R2-B', label: '红区止损', color: 'red',
                condition: '当日累计费比 > Gross毛利率 AND 花费>100元',
                action: 'ROI→max(当前,止损ROI×1.1) | 剩余预算×0.6 | 强制关闭防停投',
              },
              {
                code: 'R2-C', label: '黄区+全店毛利余量不足', color: 'yellow',
                condition: '黄区 AND 全店毛利余量<0%',
                action: 'ROI×1.10 | 剩余预算×0.8',
              },
              {
                code: 'R3', label: '绿区追加预算', color: 'green',
                condition: '绿区 AND ROI完成率≥130% AND 剩余预算<3小时均值花费 AND 高置信度',
                action: '今日预算+15~20% | 确认防停投已开启',
              },
            ].map(r => {
              const cStyle = r.color === 'red'
                ? 'border-red-200 bg-red-50'
                : r.color === 'green'
                ? 'border-green-200 bg-green-50'
                : 'border-yellow-200 bg-yellow-50'
              const badge = r.color === 'red'
                ? 'bg-red-700 text-white'
                : r.color === 'green'
                ? 'bg-green-700 text-white'
                : 'bg-yellow-600 text-white'
              return (
                <div key={r.code} className={`rounded-xl border p-3.5 ${cStyle}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${badge}`}>{r.code}</span>
                    <span className="font-semibold text-sm">{r.label}</span>
                  </div>
                  <div className="text-xs text-gray-600 mb-1.5">
                    <span className="font-semibold text-gray-700">触发条件：</span>{r.condition}
                  </div>
                  <div className="text-xs font-semibold text-indigo-800 bg-indigo-50 rounded px-2.5 py-1.5">
                    → {r.action}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="font-bold text-sm mb-3">操作历史（近30天）</div>
            <div className="text-xs text-gray-400 text-center py-8">暂无历史记录（连接 Supabase 后显示真实数据）</div>
          </div>
        )}
      </div>
    </div>
  )
}
