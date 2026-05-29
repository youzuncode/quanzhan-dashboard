import { useState, useCallback } from 'react'
import { PersistedMap, loadJSON, saveJSON } from '../lib/persist'

// Persistent caches so state survives across modal close/open AND full page reloads
const _triggerStateCache = new PersistedMap<Record<string, { status: string; operator: string; execTime?: string }>>('plandetail.triggerStates')
const _apiResultCache = new PersistedMap<Record<string, { status: string; message: string; params: { key: string; before: string; after: string; change: string; dir: string }[] }>>('plandetail.apiResults')
function _getCmpCache(name: string) {
  // Compare-toggle: per-plan boolean, also persisted
  const all = loadJSON<Record<string, boolean>>('plandetail.cmpEnabled', {})
  return {
    get value() { return all[name] ?? false },
    set value(v: boolean) {
      const next = loadJSON<Record<string, boolean>>('plandetail.cmpEnabled', {})
      next[name] = v
      saveJSON('plandetail.cmpEnabled', next)
    },
  }
}
import { ArrowLeft } from 'lucide-react'
import { plans, PLAN_PARAMS, PLAN_TODAY_TRIGGERS, PLAN_HIST_LOG, planErr, MOCK_API_PARAMS, PLAN_DAILY_DATA, PLAN_HOURLY_DATA, enrichRow } from '../lib/mockData'
import type { TodayTrigger, DailyRow, HourlyRow } from '../lib/mockData'

// PlanData imported below in DataPane section
interface Props { planName: string; storePlans?: import('../lib/mockData').PlanData[]; onClose: () => void }
type Tab = 'info' | 'params' | 'today' | 'history' | 'data'

function fmtNum(v: number | null | undefined) { if (v == null) return '—'; return v >= 10000 ? (v / 10000).toFixed(1) + '万' : v.toLocaleString() }

// ─── A4: 操作闭环回查 ─────────────────────────────────
// 给定触发时刻 T 和该计划的小时数据,对比 触发前 vs 触发后 的费比/ROI
// 用"触发时刻之前最近1小时"作为基线,"之后最近1小时"作为效果
function computeEffect(hourlyData: HourlyRow[], triggerTime: string) {
  const m = triggerTime.match(/(\d{1,2})/)
  if (!m) return null
  const tH = parseInt(m[1])
  const valid = hourlyData.filter(r => r.febi != null && r.roi != null)
  // before = 触发前最近 1 小时的有效数据
  const before = [...valid].reverse().find(r => r.h < tH)
  // after = 触发后(严格大于触发时刻)最近 1 小时的有效数据
  // 不取 r.h === tH,因为那是触发瞬间本身,不是"操作后效果"
  const after = valid.find(r => r.h > tH)
  // 最新非空数据
  const latest = valid[valid.length - 1]
  // 衡量"暂停/止损"类规则:触发时刻及之后的零消耗小时数,且后续无新花费
  const stoppedHours = hourlyData.filter(r => r.h >= tH && r.spend === 0).length
  const hasPositiveAfter = hourlyData.some(r => r.h > tH && r.spend > 0)
  return { before, after, latest, triggerHour: tH, stoppedHours, hasPositiveAfter }
}

interface VerifyProps { hourlyData: HourlyRow[]; triggerTime: string; rule: string }
function EffectVerify({ hourlyData, triggerTime, rule }: VerifyProps) {
  const e = computeEffect(hourlyData, triggerTime)
  if (!e) return null
  const { before, after, latest, stoppedHours, hasPositiveAfter } = e

  // 优先判定:暂停/止损类规则
  // 触发时刻起出现零消耗,且后续没有再产生新花费 → 暂停生效
  // 适用 R1-A(触发当时h花费>0,之后归零)和 R2-B(维持暂停,触发当时已是0)两种模式
  if (stoppedHours >= 1 && !hasPositiveAfter) {
    return (
      <div style={{ marginTop: 8, padding: '8px 10px', background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#1b5e20', marginBottom: 4 }}>
          🔍 效果回查 · 暂停生效
        </div>
        <div style={{ fontSize: 10.5, color: '#2e7d32' }}>
          {triggerTime} 起连续 {stoppedHours} 小时零消耗,止血成功,等待次日 DT 复查。
        </div>
      </div>
    )
  }

  // 数据尚未累积
  if (!after) {
    return (
      <div style={{ marginTop: 8, padding: '8px 10px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 8, fontSize: 10.5, color: '#64748b' }}>
        🔍 效果回查 · 数据待累积,下一小时后可查看 {rule} 实际效果。
      </div>
    )
  }
  if (!before) {
    return (
      <div style={{ marginTop: 8, padding: '8px 10px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 8, fontSize: 10.5, color: '#64748b' }}>
        🔍 效果回查 · {triggerTime} 之前无基线数据,无法对比。
      </div>
    )
  }

  const febiBefore = before.febi!, febiAfter = after.febi!
  const roiBefore = before.roi!, roiAfter = after.roi!
  const febiDelta = febiAfter - febiBefore
  const roiDelta = roiAfter - roiBefore
  // 对于"压量类"规则(R1-*,R2-*,R2-C),期望费比↓ ROI↑
  // 对于"追量类"规则(R3,DT3),允许费比↑但ROI仍要保持
  const isLoosen = /R3|DT3|WK2/.test(rule)
  const febiImproved = isLoosen ? febiDelta < 1.5 : febiDelta < 0
  const roiImproved = isLoosen ? roiAfter >= roiBefore * 0.95 : roiDelta > 0
  const overall = febiImproved && roiImproved
  const ok = '#2e7d32', bad = '#c62828', neutral = '#64748b'

  // 与最新对比 — 若 after 不是最新,补充"持续中"提示
  const continuing = latest && after && latest.h > after.h && latest.febi != null
  const latestFebi = continuing ? latest.febi! : null

  return (
    <div style={{ marginTop: 8, padding: '8px 10px', background: overall ? '#e8f5e9' : '#fff3e0', border: `1px solid ${overall ? '#a5d6a7' : '#ffcc80'}`, borderRadius: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: overall ? ok : '#e65100', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>🔍 效果回查 · {overall ? '改善生效' : febiImproved || roiImproved ? '部分改善' : '效果不明显'}</span>
        <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 500 }}>{before.h}:00 → {after.h}:00{continuing ? `(持续至 ${latest!.h}:00)` : ''}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 10.5 }}>
        <div style={{ background: '#fff', padding: '4px 8px', borderRadius: 5, border: '1px solid #e5e7eb' }}>
          <div style={{ color: '#94a3b8', fontSize: 9 }}>费比</div>
          <div>
            <span style={{ color: '#6b7280' }}>{febiBefore.toFixed(1)}%</span>
            <span style={{ color: '#94a3b8' }}> → </span>
            <span style={{ color: febiImproved ? ok : bad, fontWeight: 800 }}>{febiAfter.toFixed(1)}%</span>
            {latestFebi != null && (
              <span style={{ color: neutral, fontSize: 9 }}> → {latestFebi.toFixed(1)}%</span>
            )}
            <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: febiImproved ? ok : bad }}>
              ({febiDelta >= 0 ? '+' : ''}{febiDelta.toFixed(1)}pp)
            </span>
          </div>
        </div>
        <div style={{ background: '#fff', padding: '4px 8px', borderRadius: 5, border: '1px solid #e5e7eb' }}>
          <div style={{ color: '#94a3b8', fontSize: 9 }}>ROI</div>
          <div>
            <span style={{ color: '#6b7280' }}>{roiBefore.toFixed(2)}</span>
            <span style={{ color: '#94a3b8' }}> → </span>
            <span style={{ color: roiImproved ? ok : bad, fontWeight: 800 }}>{roiAfter.toFixed(2)}</span>
            <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: roiImproved ? ok : bad }}>
              ({roiDelta >= 0 ? '+' : ''}{roiDelta.toFixed(2)})
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PlanDetail({ planName, storePlans, onClose }: Props) {
  const plan = (storePlans || plans).find(p => p.name === planName)
  const [activeTab, setActiveTab] = useState<Tab>('info')
  const [triggerStates, setTriggerStatesRaw] = useState<Record<string, { status: string; operator: string; execTime?: string }>>(() => _triggerStateCache.get(planName) || {})
  const [apiResults, setApiResultsRaw] = useState<Record<string, { status: string; message: string; params: { key: string; before: string; after: string; change: string; dir: string }[] }>>(() => _apiResultCache.get(planName) || {})

  // Persist to module cache on every change
  function setTriggerStates(updater: (prev: typeof triggerStates) => typeof triggerStates) {
    setTriggerStatesRaw(prev => {
      const next = updater(prev)
      _triggerStateCache.set(planName, next)
      return next
    })
  }
  function setApiResults(updater: (prev: typeof apiResults) => typeof apiResults) {
    setApiResultsRaw(prev => {
      const next = updater(prev)
      _apiResultCache.set(planName, next)
      return next
    })
  }

  if (!plan) return (
    <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
      <button onClick={onClose} className="text-indigo-800 underline text-sm">返回看板</button>
    </div>
  )

  const pp = PLAN_PARAMS[plan.name] || { mode: '控投产比', multiTarget: false, oneKey: false, budgetType: '日预算', guard: false }
  const triggers = PLAN_TODAY_TRIGGERS[plan.name] || []
  const hist = PLAN_HIST_LOG[plan.name] || []
  const mapeInfo = planErr.find(e => e.name === plan.name)

  const stopLossROI = parseFloat((1 / plan.gross).toFixed(2))
  const targetROI = parseFloat((1 / (plan.gross - 0.1)).toFixed(2))
  const roiGap = ((plan.roiTarget - stopLossROI) / stopLossROI * 100).toFixed(1)
  const fc = plan.febi > plan.gross ? 'red' : plan.febi > (plan.gross - 0.1) ? 'yellow' : 'green'
  const fcColor = { red: '#c62828', yellow: '#f57f17', green: '#2e7d32' }[fc]
  const zoneStyle = { red: 'bg-red-700', yellow: 'bg-yellow-600', green: 'bg-green-700' }
  const zoneLabel = { red: '🔴 红区', yellow: '🟡 黄区', green: '🟢 绿区' }

  const pendingCount = triggers.filter(t => {
    const st = triggerStates[t.time + t.rule]
    return (st?.status || t.status) === 'pending'
  }).length

  // Use real mock data from mockData.ts
  // Use real mock data from mockData.ts
  const allDailyRaw: DailyRow[] = PLAN_DAILY_DATA[plan.name] || []
  const hourlyData: HourlyRow[] = PLAN_HOURLY_DATA[plan.name] || []
  const allDailyData = allDailyRaw.map(d => enrichRow(d, plan.name + d.date))

  const maxROI = Math.max(plan.roiTarget * 1.3, targetROI * 1.2)
  const pct = (v: number) => Math.min(100, Math.max(0, v / maxROI * 100)).toFixed(1)

  const confirmTrigger = useCallback(async (t: TodayTrigger) => {
    const key = t.time + t.rule
    setTriggerStates(prev => ({ ...prev, [key]: { status: 'loading', operator: '操作员' } }))
    await new Promise(res => setTimeout(res, 800))
    // find matching mock api params
    const spec = Object.values(MOCK_API_PARAMS).find((_, i) => i === 0)
    const params = spec?.params || [{ key: '参数已更新', before: '旧值', after: '新值', change: '完成', dir: 'neutral' }]
    setApiResults(prev => ({ ...prev, [key]: { status: 'success', message: '参数设置成功', params } }))
    setTriggerStates(prev => ({ ...prev, [key]: { status: 'confirmed', operator: '操作员', execTime: new Date().toLocaleTimeString('zh-CN') } }))
  }, [])

  const dismissTrigger = useCallback((t: TodayTrigger) => {
    const key = t.time + t.rule
    setTriggerStates(prev => ({ ...prev, [key]: { status: 'dismissed', operator: '操作员' } }))
  }, [])

  const tabs: { k: Tab; l: string; badge?: number }[] = [
    { k: 'info', l: '📊 基本信息' },
    { k: 'params', l: '⚙️ 出价参数' },
    { k: 'today', l: '🔔 今日规则', badge: pendingCount },
    { k: 'history', l: '📋 历史操作日志' },
    { k: 'data', l: '📈 推广数据' },
  ]

  const resultCls: Record<string, string> = { ok: 'text-green-700 font-bold', fail: 'text-red-700 font-bold', warn: 'text-yellow-600 font-bold', skip: 'text-gray-400' }
  const resultLbl: Record<string, string> = { ok: '✅ 成功', fail: '❌ 失败', warn: '⏳ 待确认', skip: '— 无触发' }

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
          <span className={`text-xs font-bold px-2.5 py-1 rounded text-white ${zoneStyle[plan.zone]}`}>{zoneLabel[plan.zone]}</span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded text-white ${plan.conf === 'H' ? 'bg-green-600' : plan.conf === 'M' ? 'bg-yellow-500' : 'bg-red-600'}`}>
            {plan.conf}级置信度
          </span>
          {mapeInfo && <span className="text-xs opacity-70">MAPE {mapeInfo.mape}%</span>}
        </div>
      </div>

      {/* Hero metrics bar */}
      <div className="bg-white border-b border-gray-200 px-5 py-2.5 flex-shrink-0 overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {[
            { label: '净目标投产比', val: plan.roiTarget.toFixed(1), sub: `≈${(100 / plan.roiTarget).toFixed(1)}%费比`, color: '#283593' },
            { label: '今日费比', val: `${(plan.febi * 100).toFixed(1)}%`, sub: `止损线${(plan.gross * 100).toFixed(0)}%`, color: fcColor },
            { label: 'Gross毛利率', val: `${(plan.gross * 100).toFixed(0)}%`, sub: `目标费比${(plan.gross * 100 - 10).toFixed(0)}%`, color: '#212121' },
            { label: '止损ROI', val: String(stopLossROI), sub: '=1÷Gross', color: '#c62828' },
            { label: '目标ROI', val: String(targetROI), sub: '=1÷(Gross−10%)', color: '#2e7d32' },
            { label: 'ROI余量', val: `${+roiGap > 0 ? '+' : ''}${roiGap}pp`, sub: plan.zone === 'red' ? '⚠ 已超止损' : plan.zone === 'yellow' ? '▲ 接近止损' : '✓ 安全', color: { red: '#c62828', yellow: '#f57f17', green: '#2e7d32' }[plan.zone] },
            { label: '每日预算', val: plan.budget === 0 ? '暂停' : `¥${plan.budget.toLocaleString()}`, sub: plan.budget > 0 ? `利用率${Math.round(plan.spend / plan.budget * 100)}%` : '今日已暂停', color: plan.budget === 0 ? '#c62828' : '#212121' },
            { label: '今日花费', val: `¥${plan.spend.toLocaleString()}`, sub: '', color: '#212121' },
          ].map((m, i) => (
            <div key={i} className="px-4 border-r border-gray-200 last:border-r-0 flex flex-col gap-0.5 min-w-max py-1">
              <div className="text-xs text-gray-400 whitespace-nowrap">{m.label}</div>
              <div className="text-base font-bold leading-tight" style={{ color: m.color }}>{m.val}</div>
              {m.sub && <div className="text-xs text-gray-400">{m.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b-2 border-gray-200 px-5 flex gap-0 flex-shrink-0">
        {tabs.map(t => (
          <button key={t.k} onClick={() => setActiveTab(t.k)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 -mb-0.5 transition-colors whitespace-nowrap flex items-center gap-1
              ${activeTab === t.k ? 'text-indigo-800 border-indigo-800' : 'text-gray-500 border-transparent hover:text-indigo-800'}`}>
            {t.l}
            {t.badge != null && t.badge > 0 && (
              <span className="bg-yellow-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 leading-none">{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">

        {/* ══ 基本信息 ══ */}
        {activeTab === 'info' && (
          <div className="p-4 space-y-3">
            {/* ROI区间可视化 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 font-bold text-sm border-b border-gray-100">📐 ROI区间可视化</div>
              <div className="px-5 pb-5 pt-4">
                <div className="relative h-3 rounded-full overflow-hidden border border-gray-200"
                  style={{
                    background: `linear-gradient(to right,
                      #ffcdd2 0%, #ffcdd2 ${pct(stopLossROI)}%,
                      #fff9c4 ${pct(stopLossROI)}%, #fff9c4 ${pct(targetROI)}%,
                      #c8e6c9 ${pct(targetROI)}%, #c8e6c9 100%)`
                  }}>
                  <div className="absolute top-0 h-full bg-indigo-800 rounded"
                    style={{ left: `${pct(plan.roiTarget)}%`, width: 3, marginTop: -4, height: 20 }} />
                </div>
                <div className="relative h-7 mt-1">
                  {[
                    { val: stopLossROI, label: `止损 ${stopLossROI}`, color: '#c62828' },
                    { val: targetROI, label: `目标 ${targetROI}`, color: '#2e7d32' },
                    { val: plan.roiTarget, label: `当前 ${plan.roiTarget}`, color: '#283593' },
                  ].map((m, i) => (
                    <div key={i} className="absolute text-center" style={{ left: `${pct(m.val)}%`, transform: 'translateX(-50%)' }}>
                      <div className="text-xs font-bold whitespace-nowrap" style={{ color: m.color }}>{m.label}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 text-xs mt-2">
                  <span className="text-red-700">■ 亏损区（费比&gt;Gross）</span>
                  <span className="text-yellow-600">■ 黄区（目标~止损之间）</span>
                  <span className="text-green-700">■ 绿区（费比&lt;目标费比）</span>
                  <span className="text-indigo-800 font-bold">│ 当前ROI</span>
                </div>
              </div>
            </div>

            {/* 核心指标 - 两行4列 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 font-bold text-sm border-b border-gray-100">📊 核心指标</div>
              <div className="p-3 space-y-2">
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '净目标投产比', val: plan.roiTarget.toFixed(1), sub: `≈${(100 / plan.roiTarget).toFixed(1)}% 费比`, color: '#283593', bg: '#e8eaf6' },
                    { label: '今日费比', val: `${(plan.febi * 100).toFixed(1)}%`, sub: `止损线 ${(plan.gross * 100).toFixed(0)}%`, color: fcColor, bg: fc === 'red' ? '#ffebee' : fc === 'yellow' ? '#fff8e1' : '#e8f5e9' },
                    { label: 'Gross毛利率', val: `${(plan.gross * 100).toFixed(0)}%`, sub: `目标费比 ${(plan.gross * 100 - 10).toFixed(0)}%`, color: '#212121', bg: '#f5f5f5' },
                    { label: 'ROI余量', val: `${+roiGap > 0 ? '+' : ''}${roiGap}pp`, sub: plan.zone === 'red' ? '⚠ 亏损' : plan.zone === 'yellow' ? '▲ 接近止损' : '✓ 安全余量', color: { red: '#c62828', yellow: '#f57f17', green: '#2e7d32' }[plan.zone], bg: plan.zone === 'red' ? '#ffebee' : plan.zone === 'yellow' ? '#fff8e1' : '#e8f5e9' },
                  ].map((m, i) => (
                    <div key={i} className="rounded-lg p-3" style={{ background: m.bg }}>
                      <div className="text-xs text-gray-500 mb-1">{m.label}</div>
                      <div className="text-xl font-bold" style={{ color: m.color }}>{m.val}</div>
                      <div className="text-xs text-gray-400 mt-1">{m.sub}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '每日预算', val: plan.budget === 0 ? '¥0' : `¥${plan.budget.toLocaleString()}`, sub: plan.budget === 0 ? '⏸ 已暂停' : '运行中', color: plan.budget === 0 ? '#c62828' : '#212121', bg: '#f5f5f5' },
                    { label: '今日花费', val: `¥${plan.spend.toLocaleString()}`, sub: `利用率 ${plan.budget > 0 ? Math.round(plan.spend / plan.budget * 100) + '%' : '—'}`, color: '#212121', bg: '#f5f5f5' },
                    { label: '优质计划防停投', val: plan.guard ? '✅' : '❌', sub: plan.guard ? '已开启' : '已关闭', color: plan.guard ? '#2e7d32' : '#c62828', bg: plan.guard ? '#e8f5e9' : '#ffebee' },
                    { label: '置信度', val: `${plan.conf}级`, sub: mapeInfo ? `14天MAPE ${mapeInfo.mape}%` : '—', color: plan.conf === 'H' ? '#2e7d32' : plan.conf === 'M' ? '#f57f17' : '#c62828', bg: '#f5f5f5' },
                  ].map((m, i) => (
                    <div key={i} className="rounded-lg p-3" style={{ background: m.bg }}>
                      <div className="text-xs text-gray-500 mb-1">{m.label}</div>
                      <div className="text-xl font-bold" style={{ color: m.color }}>{m.val}</div>
                      <div className="text-xs text-gray-400 mt-1">{m.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ 出价参数 ══ */}
        {activeTab === 'params' && (
          <div className="p-4 space-y-3">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 font-bold text-sm border-b border-gray-100">⚙️ 当前出价参数（共8项）</div>
              <div className="p-3 grid grid-cols-4 gap-2.5">
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
                  <div key={i} className="border border-gray-200 rounded-lg p-3 flex flex-col gap-1">
                    <div className="text-2xl">{c.icon}</div>
                    <div className="text-xs text-gray-400">{c.label}</div>
                    <div className="font-bold text-sm">{c.val}</div>
                    <div className="text-xs text-gray-400">{c.sub}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 font-bold text-sm border-b border-gray-100">💡 ROI↔费比换算</div>
              <div className="p-3 grid grid-cols-6 gap-2">
                {[
                  { roi: stopLossROI, label: '止损ROI', cls: 'red' },
                  { roi: targetROI, label: '目标ROI', cls: 'green' },
                  { roi: plan.roiTarget, label: '当前ROI', cls: 'indigo' },
                  { roi: 5, label: 'ROI 5', cls: '' },
                  { roi: 7, label: 'ROI 7', cls: '' },
                  { roi: 10, label: 'ROI 10', cls: '' },
                ].map((r, i) => {
                  const color = r.cls === 'red' ? '#c62828' : r.cls === 'green' ? '#2e7d32' : r.cls === 'indigo' ? '#283593' : '#546e7a'
                  const bg = r.cls === 'red' ? '#ffebee' : r.cls === 'green' ? '#e8f5e9' : r.cls === 'indigo' ? '#e8eaf6' : '#f5f5f5'
                  return (
                    <div key={i} className="rounded-lg p-2 text-center" style={{ background: bg }}>
                      <div className="text-xs text-gray-500 mb-1">{r.label}</div>
                      <div className="font-bold text-sm" style={{ color }}>{r.roi}</div>
                      <div className="text-xs text-gray-400 mt-1">{(100 / +r.roi).toFixed(1)}% 费比</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══ 今日规则 ══ */}
        {activeTab === 'today' && (
          <div className="p-4">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 font-bold text-sm flex items-center gap-2">
                🔔 今日规则触发时间线
                <span className="text-xs font-normal text-gray-400">{triggers.length}条 · 待确认{pendingCount}条</span>
              </div>
              {triggers.length === 0 ? (
                <div className="text-center text-gray-400 py-12 text-sm">今日暂无规则触发</div>
              ) : (
                <div className="p-4">
                  {triggers.map(t => {
                    const key = t.time + t.rule
                    const st = triggerStates[key]
                    const status = st?.status || t.status
                    const apiRes = apiResults[key]
                    const zoneColor = t.zone === 'red' ? '#c62828' : t.zone === 'yellow' ? '#f57f17' : '#2e7d32'
                    const dotCls = status === 'ok' || status === 'confirmed' ? 'ok' : status === 'pending' ? 'pending' : 'auto-pending'

                    return (
                      <div key={key} className="flex gap-4 py-3 border-b border-gray-100 last:border-0">
                        {/* Timeline left col */}
                        <div className="flex flex-col items-center flex-shrink-0" style={{ width: 52 }}>
                          <div className="text-xs font-bold text-indigo-800">{t.time}</div>
                          <div className={`w-2.5 h-2.5 rounded-full mt-1.5
                            ${dotCls === 'ok' ? 'bg-green-600' : dotCls === 'pending' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-300'}`} />
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="font-bold text-sm">{t.rule}</span>
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded text-white"
                              style={{ background: zoneColor }}>
                              {t.zone === 'red' ? '红区' : t.zone === 'yellow' ? '黄区' : '绿区'}
                            </span>
                            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold
                              ${status === 'ok' || status === 'confirmed' ? 'bg-green-100 text-green-800'
                                : status === 'pending' ? 'bg-yellow-100 text-yellow-800 animate-pulse'
                                : status === 'loading' ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-500 line-through'}`}>
                              {status === 'ok' ? '✅ 已执行'
                                : status === 'confirmed' ? `✅ 已确认 · ${st?.execTime}`
                                : status === 'pending' ? '⏳ 待执行'
                                : status === 'loading' ? '📡 API调用中…'
                                : '✗ 已忽略'}
                            </span>
                          </div>
                          <div className="text-xs text-indigo-800 font-semibold bg-indigo-50 rounded px-2 py-1.5 mb-2">
                            ⚙️ {t.action}
                          </div>
                          <div className="text-xs text-gray-500 mb-2">操作方：{st?.operator || t.operator}</div>

                          {status === 'pending' && (
                            <div className="flex gap-2">
                              <button onClick={() => confirmTrigger(t)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1"
                                style={{ background: '#2e7d32' }}>
                                ✓ 确认执行
                              </button>
                              <button onClick={() => dismissTrigger(t)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                ✗ 忽略
                              </button>
                            </div>
                          )}
                          {status === 'loading' && (
                            <div className="flex items-center gap-2 text-blue-700 text-xs">
                              <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              正在调用平台 API…
                            </div>
                          )}
                          {/* A4: 操作闭环回查 — 已确认/已执行的动作显示真实效果 */}
                          {(status === 'ok' || status === 'confirmed') && hourlyData.length > 0 && (
                            <EffectVerify hourlyData={hourlyData} triggerTime={t.time} rule={t.rule} />
                          )}
                          {apiRes && (
                            <div className="border border-green-200 rounded-lg bg-green-50 p-2.5 mt-2">
                              <div className="text-xs font-bold text-green-800 mb-2">✅ API成功：{apiRes.message}</div>
                              <div className="border border-gray-200 rounded overflow-hidden bg-white">
                                <div className="grid text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1" style={{ gridTemplateColumns: '110px 1fr auto auto auto' }}>
                                  <span>参数</span><span>变更说明</span><span>变更前</span><span className="px-2">→</span><span>变更后</span>
                                </div>
                                {apiRes.params.map((p, i) => (
                                  <div key={i} className="grid text-xs px-2 py-1.5 border-t border-gray-100 items-center" style={{ gridTemplateColumns: '110px 1fr auto auto auto' }}>
                                    <span className="text-gray-600">{p.key}</span>
                                    <span className="text-gray-400 text-xs px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-bold w-fit">{p.change}</span>
                                    <span className="text-gray-400 line-through">{p.before}</span>
                                    <span className="text-gray-400 px-2">→</span>
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
          </div>
        )}

        {/* ══ 历史操作日志 ══ */}
        {activeTab === 'history' && (
          <div className="p-4">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 font-bold text-sm border-b border-gray-100 flex items-center gap-2">
                📋 近14天操作日志
                <span className="text-xs font-normal text-gray-400">{hist.length}条记录</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-200 sticky top-0">
                      {['日期', '规则', '执行动作', '结果', '操作方', '备注'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-bold text-gray-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hist.map((h, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-1.5 font-bold whitespace-nowrap">{h.date}</td>
                        <td className="px-3 py-1.5">
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">{h.rule}</span>
                        </td>
                        <td className="px-3 py-1.5 text-indigo-800 max-w-xs">{h.action}</td>
                        <td className={`px-3 py-1.5 whitespace-nowrap ${resultCls[h.result] || ''}`}>{resultLbl[h.result] || h.result}</td>
                        <td className="px-3 py-1.5 text-gray-400 whitespace-nowrap">{h.operator}</td>
                        <td className="px-3 py-1.5 text-gray-400 text-xs">{h.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ 推广数据 ══ */}
        {activeTab === 'data' && (
          <DataPane plan={plan} stopLossROI={stopLossROI} targetROI={targetROI} allDailyData={allDailyData} hourlyData={hourlyData} />
        )}

      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════
// DataPane – 完整推广数据面板
// ══════════════════════════════════════════════════════
import { useRef, useEffect } from 'react'
import type { PlanData } from '../lib/mockData'

function parseDate(s: string): Date {
  const [m, d] = s.split('/').map(Number)
  return new Date(2026, m - 1, d)
}
function fmtDate(dt: Date) { return `${dt.getMonth() + 1}/${dt.getDate()}` }
function toInputVal(s: string) {
  const [m, d] = s.split('/').map(Number)
  return `2026-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
function fromInputVal(s: string) {
  const [, m, d] = s.split('-')
  return `${+m}/${+d}`
}
function filterRange(rows: DailyRow[], start: string, end: string) {
  const s = parseDate(start).getTime(), e = parseDate(end).getTime()
  return rows.filter(r => { const t = parseDate(r.date).getTime(); return t >= s && t <= e })
}
function pctDelta(cur: number | null | undefined, cmp: number | null | undefined, goodUp = true): string {
  if (cur == null || cmp == null || cmp === 0) return ''
  const diff = cur - cmp, pct = diff / Math.abs(cmp) * 100
  const isPos = goodUp ? diff > 0 : diff < 0
  const cls = Math.abs(pct) < 0.1 ? 'neu' : isPos ? 'pos' : 'neg'
  const color = cls === 'pos' ? '#2e7d32' : cls === 'neg' ? '#c62828' : '#9e9e9e'
  return ` <span style="font-size:9px;font-weight:600;color:${color}">${diff > 0 ? '↑' : '↓'}${Math.abs(pct).toFixed(1)}%</span>`
}

interface DataPaneProps {
  plan: PlanData
  stopLossROI: number
  targetROI: number
  allDailyData: DailyRow[]
  hourlyData: HourlyRow[]
}

function DataPane({ plan, stopLossROI, targetROI, allDailyData, hourlyData }: DataPaneProps) {
  const _cmpCache = _getCmpCache(plan.name)
  const [dataSub, setDataSub] = useState<'daily' | 'hourly'>('daily')
  const [agg, setAgg] = useState<'day' | 'week' | 'month'>('day')
  const [metricKey, setMetricKey] = useState<'roi' | 'febi' | 'spend' | 'rev' | 'orders' | 'ctr' | 'cvr' | 'impr' | 'clicks' | 'cpc' | 'favs' | 'addcart'>('roi')
  const [cmpEnabled, setCmpEnabledRaw] = useState(_cmpCache.value)
  function setCmpEnabled(v: boolean) { _cmpCache.value = v; setCmpEnabledRaw(v) }

  // Date range state
  const lastDate = allDailyData.length ? allDailyData[allDailyData.length - 1].date : '5/28'
  const lastDt = parseDate(lastDate)
  const defStart = fmtDate(new Date(lastDt.getFullYear(), lastDt.getMonth(), lastDt.getDate() - 29))
  const [startDate, setStartDate] = useState(defStart)
  const [endDate, setEndDate] = useState(lastDate)
  const [presetDays, setPresetDays] = useState<7 | 14 | 30 | null>(30)

  // Comparison range
  const defCmpEnd = fmtDate(new Date(parseDate(defStart).getFullYear(), parseDate(defStart).getMonth(), parseDate(defStart).getDate() - 1))
  const defCmpStart = fmtDate(new Date(parseDate(defCmpEnd).getFullYear(), parseDate(defCmpEnd).getMonth(), parseDate(defCmpEnd).getDate() - 29))
  const [cmpStart, setCmpStart] = useState(defCmpStart)
  const [cmpEnd, setCmpEnd] = useState(defCmpEnd)

  function setPreset(days: 7 | 14 | 30) {
    const end = lastDate
    const startDt = new Date(lastDt); startDt.setDate(startDt.getDate() - (days - 1))
    setStartDate(fmtDate(startDt)); setEndDate(end); setPresetDays(days)
  }
  function setPrevPeriod() {
    const s = parseDate(startDate), e = parseDate(endDate)
    const days = Math.round((e.getTime() - s.getTime()) / 86400000) + 1
    const ce = new Date(s); ce.setDate(ce.getDate() - 1)
    const cs = new Date(ce); cs.setDate(cs.getDate() - (days - 1))
    setCmpEnd(fmtDate(ce)); setCmpStart(fmtDate(cs))
  }

  function aggRows(rows: DailyRow[]): DailyRow[] {
    if (agg === 'day') return rows
    const grp: Record<string, DailyRow[]> = {}, order: string[] = []
    rows.forEach(r => {
      const dt = parseDate(r.date)
      let key: string
      if (agg === 'week') {
        const day = dt.getDay() || 7
        const mon = new Date(dt); mon.setDate(dt.getDate() - day + 1)
        key = fmtDate(mon)
      } else {
        key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
      }
      if (!grp[key]) { grp[key] = []; order.push(key) }
      grp[key].push(r)
    })
    return order.map(k => {
      const rs = grp[k]
      const sum = (f: keyof DailyRow) => rs.reduce((a, r) => a + ((r[f] as number) || 0), 0)
      const spend = sum('spend'), rev = sum('rev'), orders = sum('orders')
      const clicks = sum('clicks'), impr = sum('impr'), favs = sum('favs'), addcart = sum('addcart')
      const roi = spend > 0 ? parseFloat((rev / spend).toFixed(2)) : null
      const febi = spend > 0 && rev > 0 ? parseFloat((spend / rev * 100).toFixed(1)) : null
      const ctr = impr > 0 ? parseFloat((clicks / impr * 100).toFixed(2)) : null
      const cpc = clicks > 0 ? parseFloat((spend / clicks).toFixed(2)) : null
      const cvr = clicks > 0 && orders > 0 ? parseFloat((orders / clicks * 100).toFixed(2)) : null
      const atype = rs.some(r => r.atype === 'red') ? 'red' : rs.some(r => r.atype === 'yellow') ? 'yellow' : rs.some(r => r.atype === 'green') ? 'green' : ''
      const rCnt = rs.filter(r => r.rule && r.rule !== '—').length
      const label = agg === 'week' ? `${rs[0].date}~${rs[rs.length - 1].date}` : `${parseDate(rs[0].date).getMonth() + 1}月`
      return { date: label, spend, rev, orders, clicks, impr, favs, addcart, roi, febi, ctr, cpc, cvr, budget: sum('budget'), tRoi: rs[0].tRoi, rule: rCnt > 0 ? `${rCnt}次触发` : '—', action: rCnt > 0 ? `共${rCnt}次规则执行` : '无触发', atype, _enriched: true } as DailyRow
    })
  }

  const curRaw = filterRange(allDailyData, startDate, endDate)
  const curData = aggRows(curRaw)
  const cmpRaw = cmpEnabled ? filterRange(allDailyData, cmpStart, cmpEnd) : []
  const cmpData = cmpEnabled ? aggRows(cmpRaw) : []

  const stopLossFebi = plan.gross * 100, targetFebi = plan.gross * 100 - 10

  // Chart canvas ref
  const dailyChartRef = useRef<HTMLCanvasElement>(null)
  const hourlyChartRef = useRef<HTMLCanvasElement>(null)

  // Custom chart rendering using canvas directly
  useEffect(() => {
    const canvas = dailyChartRef.current
    if (!canvas || dataSub !== 'daily' || curData.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.offsetWidth, H = canvas.offsetHeight
    canvas.width = W; canvas.height = H
    const pad = { top: 36, right: 60, bottom: 32, left: 52 }
    const cw = W - pad.left - pad.right, ch = H - pad.top - pad.bottom
    ctx.clearRect(0, 0, W, H)
    if (curData.length === 0) return
    const maxSpend = Math.max(...curData.map(d => d.spend))
    const getMetricVal = (d: DailyRow): number | null => {
      const v = d[metricKey as keyof DailyRow]
      return typeof v === 'number' ? v : null
    }
    const metricVals = curData.map(getMetricVal).filter(v => v != null) as number[]
    const maxMetric = metricVals.length ? Math.max(...metricVals) * 1.1 : 10
    const minMetric = metricVals.length ? Math.min(0, Math.min(...metricVals) * 0.9) : 0
    const barW = Math.max(4, cw / curData.length * 0.6)
    const step = cw / curData.length
    // Draw gridlines
    ctx.strokeStyle = 'rgba(0,0,0,.06)'; ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + ch - (i / 4) * ch
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cw, y); ctx.stroke()
    }
    // Draw bars
    curData.forEach((d, i) => {
      const x = pad.left + i * step + step / 2
      const barH = maxSpend > 0 ? (d.spend / maxSpend) * ch : 0
      const barColor = d.atype === 'red' ? 'rgba(198,40,40,.68)' : d.atype === 'yellow' ? 'rgba(245,127,23,.62)' : d.atype === 'green' ? 'rgba(46,125,50,.58)' : 'rgba(21,101,192,.45)'
      ctx.fillStyle = barColor
      ctx.fillRect(x - barW / 2, pad.top + ch - barH, barW, barH)
    })
    // Draw metric line
    ctx.strokeStyle = metricKey === 'roi' ? '#283593' : metricKey === 'febi' ? '#f57f17' : '#1565c0'
    ctx.lineWidth = 2; ctx.setLineDash([])
    ctx.beginPath()
    curData.forEach((d, i) => {
      const v = getMetricVal(d)
      if (v == null) return
      const x = pad.left + i * step + step / 2
      const y = pad.top + ch - ((v - minMetric) / (maxMetric - minMetric)) * ch
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()
    // Draw event markers (circles on bars with rule labels)
    curData.forEach((d, i) => {
      if (!d.atype || d.atype === '') return
      const x = pad.left + i * step + step / 2
      const color = d.atype === 'red' ? '#c62828' : d.atype === 'yellow' ? '#f57f17' : '#2e7d32'
      ctx.fillStyle = color
      ctx.beginPath(); ctx.arc(x, pad.top + 12, 7, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 7px PingFang SC, sans-serif'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      const label = (d.rule || '').split('+')[0].replace(/[^A-Z0-9\-]/g, '').slice(0, 4)
      ctx.fillText(label, x, pad.top + 12)
      // Vertical dashed line
      ctx.strokeStyle = color + '88'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3])
      ctx.beginPath(); ctx.moveTo(x, pad.top + 20); ctx.lineTo(x, pad.top + ch); ctx.stroke()
      ctx.setLineDash([])
    })
    // Draw reference lines (target ROI, stop-loss ROI)
    if (metricKey === 'roi') {
      [[targetROI, '#2e7d32', '目标ROI'], [stopLossROI, '#c62828', '止损ROI']].forEach(([val, color, label]) => {
        const y = pad.top + ch - ((+val - minMetric) / (maxMetric - minMetric)) * ch
        ctx.strokeStyle = color as string; ctx.lineWidth = 1; ctx.setLineDash([5, 3])
        ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cw, y); ctx.stroke()
        ctx.fillStyle = color as string; ctx.font = '8px PingFang SC'; ctx.textAlign = 'left'
        ctx.fillText(`${label} ${val}`, pad.left + 2, y - 3)
        ctx.setLineDash([])
      })
    }
    if (metricKey === 'febi') {
      [[stopLossFebi, '#c62828', `止损${stopLossFebi.toFixed(0)}%`], [targetFebi, '#2e7d32', `目标${targetFebi.toFixed(0)}%`]].forEach(([val, color, label]) => {
        const y = pad.top + ch - ((+val - minMetric) / (maxMetric - minMetric)) * ch
        ctx.strokeStyle = color as string; ctx.lineWidth = 1; ctx.setLineDash([5, 3])
        ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cw, y); ctx.stroke()
        ctx.fillStyle = color as string; ctx.font = '8px PingFang SC'; ctx.textAlign = 'left'
        ctx.fillText(label as string, pad.left + 2, y - 3)
        ctx.setLineDash([])
      })
    }
    // X axis labels
    ctx.fillStyle = '#888'; ctx.font = '9px PingFang SC'; ctx.textAlign = 'center'
    curData.forEach((d, i) => {
      if (i % Math.max(1, Math.floor(curData.length / 8)) !== 0) return
      ctx.fillText(d.date, pad.left + i * step + step / 2, pad.top + ch + 12)
    })
    // Y axis right (metric)
    ctx.textAlign = 'right'; ctx.fillStyle = '#283593'
    for (let i = 0; i <= 4; i++) {
      const v = minMetric + (maxMetric - minMetric) * (i / 4)
      const y = pad.top + ch - (i / 4) * ch
      const label = metricKey === 'febi' ? v.toFixed(1) + '%' : metricKey === 'roi' ? v.toFixed(1) : v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v.toFixed(0)
      ctx.fillText(label, W - 4, y + 3)
    }
    // Y axis left (spend)
    ctx.textAlign = 'left'; ctx.fillStyle = '#666'
    for (let i = 0; i <= 3; i++) {
      const v = maxSpend * (i / 3)
      const y = pad.top + ch - (v / maxSpend) * ch
      ctx.fillText(v >= 10000 ? (v / 10000).toFixed(0) + 'w' : v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v.toFixed(0), 2, y + 3)
    }
  }, [curData, metricKey, dataSub, stopLossROI, targetROI, stopLossFebi, targetFebi])

  // Hourly chart
  useEffect(() => {
    const canvas = hourlyChartRef.current
    if (!canvas || dataSub !== 'hourly' || hourlyData.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.offsetWidth, H = canvas.offsetHeight
    canvas.width = W; canvas.height = H
    const pad = { top: 36, right: 60, bottom: 32, left: 52 }
    const cw = W - pad.left - pad.right, ch = H - pad.top - pad.bottom
    ctx.clearRect(0, 0, W, H)
    const maxSpend = Math.max(...hourlyData.map(d => d.spend || 0), 1)
    const maxThresh = Math.max(...hourlyData.map(d => d.threshold || 0))
    const yMax = Math.max(maxSpend, maxThresh) * 1.1
    const barW = cw / hourlyData.length * 0.55
    const step = cw / hourlyData.length
    // Gridlines
    ctx.strokeStyle = 'rgba(0,0,0,.06)'; ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + ch - (i / 4) * ch
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cw, y); ctx.stroke()
    }
    // Bars
    hourlyData.forEach((d, i) => {
      const x = pad.left + i * step + step / 2
      const barH = yMax > 0 ? ((d.spend || 0) / yMax) * ch : 0
      const bc = d.atype === 'pause' ? 'rgba(180,180,180,.5)' : d.atype === 'red' ? 'rgba(198,40,40,.72)' : d.atype === 'yellow' ? 'rgba(245,127,23,.65)' : 'rgba(46,125,50,.62)'
      ctx.fillStyle = bc
      ctx.fillRect(x - barW / 2, pad.top + ch - barH, barW, barH)
    })
    // Threshold dashed line
    ctx.strokeStyle = 'rgba(198,40,40,.6)'; ctx.lineWidth = 1.8; ctx.setLineDash([5, 4])
    ctx.beginPath()
    hourlyData.forEach((d, i) => {
      const x = pad.left + i * step + step / 2
      const y = pad.top + ch - (d.threshold / yMax) * ch
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke(); ctx.setLineDash([])
    // Event markers
    hourlyData.forEach((d, i) => {
      if (!d.atype || d.atype === '' || d.atype === 'pause' || !d.rule || d.rule === '—') return
      const x = pad.left + i * step + step / 2
      const color = d.atype === 'red' ? '#c62828' : '#f57f17'
      ctx.fillStyle = color
      ctx.beginPath(); ctx.arc(x, pad.top + 12, 7, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#fff'; ctx.font = 'bold 6px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(d.rule.replace(/[^A-Z0-9\-]/g, '').slice(0, 4), x, pad.top + 12)
      ctx.strokeStyle = color + '88'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3])
      ctx.beginPath(); ctx.moveTo(x, pad.top + 20); ctx.lineTo(x, pad.top + ch); ctx.stroke()
      ctx.setLineDash([])
    })
    // X labels
    ctx.fillStyle = '#888'; ctx.font = '9px PingFang SC'; ctx.textAlign = 'center'
    hourlyData.forEach((d, i) => {
      ctx.fillText(`${d.h}:00`, pad.left + i * step + step / 2, pad.top + ch + 12)
    })
    // Y labels (left = spend)
    ctx.textAlign = 'left'; ctx.fillStyle = '#666'
    for (let i = 0; i <= 3; i++) {
      const v = yMax * (i / 3)
      const y = pad.top + ch - (v / yMax) * ch
      ctx.fillText(v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v.toFixed(0), 2, y + 3)
    }
  }, [hourlyData, dataSub, stopLossFebi, targetFebi])

  // Totals
  const totSpend = curData.reduce((a, d) => a + (d.spend || 0), 0)
  const totRev = curData.reduce((a, d) => a + (d.rev || 0), 0)
  const totOrders = curData.reduce((a, d) => a + (d.orders || 0), 0)
  const totImpr = curData.reduce((a, d) => a + (d.impr || 0), 0)
  const totClicks = curData.reduce((a, d) => a + (d.clicks || 0), 0)
  const totFavs = curData.reduce((a, d) => a + (d.favs || 0), 0)
  const totAddcart = curData.reduce((a, d) => a + (d.addcart || 0), 0)
  const avgRoi = totSpend > 0 ? (totRev / totSpend).toFixed(2) : '—'
  const avgFebi = totSpend > 0 && totRev > 0 ? (totSpend / totRev * 100).toFixed(1) : '—'
  const cS = cmpData.reduce((a, d) => a + (d.spend || 0), 0)
  const cR = cmpData.reduce((a, d) => a + (d.rev || 0), 0)
  const cO = cmpData.reduce((a, d) => a + (d.orders || 0), 0)

  const METRIC_PILLS = [
    { key: 'roi', label: 'ROI', color: '#283593' },
    { key: 'febi', label: '费比', color: '#f57f17' },
    { key: 'spend', label: '花费', color: '#1565c0' },
    { key: 'rev', label: '成交额', color: '#2e7d32' },
    { key: 'orders', label: '成交笔数', color: '#00838f' },
    { key: 'ctr', label: '点击率', color: '#546e7a' },
    { key: 'cvr', label: '转化率', color: '#6a1fa2' },
    { key: 'impr', label: '展示数', color: '#37474f' },
    { key: 'clicks', label: '点击数', color: '#37474f' },
    { key: 'addcart', label: '加购数', color: '#ad1457' },
    { key: 'favs', label: '收藏数', color: '#558b2f' },
  ] as const

  return (
          <div className="p-4 space-y-3">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Header with sub-tabs */}
              <div className="px-4 py-2.5 font-bold text-sm border-b border-gray-100 flex items-center gap-3 flex-wrap">
                📈 推广效果数据
                <div className="ml-auto flex rounded-lg overflow-hidden border border-gray-200">
                  <button onClick={() => setDataSub('daily')}
                    className={`px-3 py-1 text-xs font-semibold ${dataSub === 'daily' ? 'bg-indigo-800 text-white' : 'bg-white text-gray-600'}`}>
                    📅 日数据（{curData.length}{agg === 'day' ? '天' : agg === 'week' ? '周' : '月'}）
                  </button>
                  <button onClick={() => setDataSub('hourly')}
                    className={`px-3 py-1 text-xs font-semibold border-l border-gray-200 ${dataSub === 'hourly' ? 'bg-indigo-800 text-white' : 'bg-white text-gray-600'}`}>
                    ⏰ 时数据（今日）
                  </button>
                </div>
              </div>

              {/* ── 日数据 ── */}
              {dataSub === 'daily' && (
                <div className="p-3.5">
                  {/* Controls */}
                  <div className="border border-gray-200 rounded-lg px-3 py-2 mb-3 bg-gray-50 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-500">时间范围</span>
                      <input type="date" value={toInputVal(startDate)} onChange={e => { setStartDate(fromInputVal(e.target.value)); setPresetDays(null) }}
                        className="border border-gray-200 rounded px-1.5 py-0.5 text-xs outline-none focus:border-indigo-400" />
                      <span className="text-gray-400">~</span>
                      <input type="date" value={toInputVal(endDate)} onChange={e => { setEndDate(fromInputVal(e.target.value)); setPresetDays(null) }}
                        className="border border-gray-200 rounded px-1.5 py-0.5 text-xs outline-none focus:border-indigo-400" />
                      <span className="text-gray-300">|</span>
                      {([7, 14, 30] as const).map(n => (
                        <button key={n} onClick={() => setPreset(n)}
                          className={`px-2 py-0.5 rounded-full border text-xs font-medium transition-all ${presetDays === n ? 'bg-indigo-800 text-white border-indigo-800' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-400'}`}>
                          {n === 7 ? '近7天' : n === 14 ? '近14天' : '近30天'}
                        </button>
                      ))}
                      <span className="text-gray-300">|</span>
                      <span className="font-semibold text-gray-500">聚合</span>
                      {(['day', 'week', 'month'] as const).map(a => (
                        <button key={a} onClick={() => setAgg(a)}
                          className={`px-2 py-0.5 rounded-full border text-xs font-medium transition-all ${agg === a ? 'bg-indigo-800 text-white border-indigo-800' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-400'}`}>
                          {a === 'day' ? '日' : a === 'week' ? '周' : '月'}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-500">对比区间</span>
                      <label className="relative inline-block w-8 h-4 cursor-pointer">
                        <input type="checkbox" className="sr-only" checked={cmpEnabled} onChange={e => setCmpEnabled(e.target.checked)} />
                        <div className={`absolute inset-0 rounded-full transition-colors ${cmpEnabled ? 'bg-indigo-700' : 'bg-gray-300'}`} />
                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${cmpEnabled ? 'translate-x-4' : ''}`} />
                      </label>
                      {cmpEnabled && (
                        <>
                          <input type="date" value={toInputVal(cmpStart)} onChange={e => setCmpStart(fromInputVal(e.target.value))}
                            className="border border-gray-200 rounded px-1.5 py-0.5 text-xs outline-none focus:border-indigo-400" />
                          <span className="text-gray-400">~</span>
                          <input type="date" value={toInputVal(cmpEnd)} onChange={e => setCmpEnd(fromInputVal(e.target.value))}
                            className="border border-gray-200 rounded px-1.5 py-0.5 text-xs outline-none focus:border-indigo-400" />
                          <button onClick={setPrevPeriod}
                            className="px-2 py-0.5 rounded-full border border-gray-200 bg-white text-gray-500 hover:border-indigo-400 text-xs">
                            ↩ 上一同期
                          </button>
                          <span className="text-indigo-700 text-xs">对比期显示Δ%</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex gap-4 text-xs text-gray-500 mb-2">
                    <span><span className="inline-block w-2.5 h-2.5 rounded-sm mr-1 align-middle" style={{ background: 'rgba(21,101,192,.45)' }} />花费（柱）</span>
                    <span style={{ color: '#c62828' }}>■ 红区</span>
                    <span style={{ color: '#f57f17' }}>■ 黄区</span>
                    <span style={{ color: '#2e7d32' }}>■ 绿区</span>
                    <span className="text-gray-400 text-xs ml-2">圆圈标记 = 规则触发（可点击）</span>
                  </div>

                  {/* Canvas chart */}
                  <div className="relative mb-1" style={{ height: 200 }}>
                    <canvas ref={dailyChartRef} style={{ width: '100%', height: 200 }} />
                  </div>
                  <div className="text-center text-xs text-gray-400 mb-2">点击图中彩色圆圈标记查看前后对比 | 点击指标切换趋势线</div>

                  {/* Metric pills */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="text-xs text-gray-400 mr-1 self-center">指标：</span>
                    {METRIC_PILLS.map(m => (
                      <button key={m.key} onClick={() => setMetricKey(m.key as typeof metricKey)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium transition-all"
                        style={metricKey === m.key ? { background: m.color, color: '#fff', borderColor: m.color, fontWeight: 700 } : { background: '#fff', color: '#666', borderColor: '#e0e0e0' }}>
                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: m.color }} />
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {/* Daily table */}
                  <div className="overflow-x-auto max-h-80 overflow-y-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-gray-50 border-b-2 border-gray-200">
                          {['日期', '展示数', '点击数', '点击率', '均CPC', '花费', '成交额', 'ROI', '费比', '目标ROI', '成交笔数', '转化率', '收藏数', '加购数', 'ROI完成率', '规则/执行动作'].map(h => (
                            <th key={h} className={`px-2 py-1.5 font-bold text-gray-500 whitespace-nowrap ${h === '日期' || h === '规则/执行动作' ? 'text-left' : 'text-right'}`}
                              style={h !== '日期' && h !== '规则/执行动作' ? { cursor: 'pointer' } : {}}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {curData.map((d, i) => {
                          const c = cmpData[i] ?? null
                          const rowCls = d.atype === 'red' ? 'bg-red-50' : d.atype === 'yellow' ? 'bg-yellow-50' : d.atype === 'green' ? 'bg-green-50/20' : ''
                          const roiOk = d.roi != null && d.roi >= d.tRoi
                          const roiPct = d.roi != null && d.tRoi > 0 ? Math.min(150, Math.round(d.roi / d.tRoi * 100)) : 0
                          const barW = Math.min(60, roiPct * 0.4)
                          const barColor = roiOk ? '#2e7d32' : d.febi != null && d.febi > plan.gross * 100 ? '#c62828' : '#f57f17'
                          return (
                            <tr key={i} className={`border-b border-gray-100 hover:brightness-95 ${rowCls}`}>
                              <td className="px-2 py-1 font-semibold whitespace-nowrap">{d.date}</td>
                              <td className="px-2 py-1 text-right text-gray-500" dangerouslySetInnerHTML={{ __html: `${fmtNum(d.impr)}${c ? pctDelta(d.impr, c.impr) : ''}` }} />
                              <td className="px-2 py-1 text-right text-gray-500" dangerouslySetInnerHTML={{ __html: `${d.clicks != null ? d.clicks.toLocaleString() : '—'}${c ? pctDelta(d.clicks, c.clicks) : ''}` }} />
                              <td className="px-2 py-1 text-right text-gray-500" dangerouslySetInnerHTML={{ __html: `${d.ctr != null ? d.ctr + '%' : '—'}${c ? pctDelta(d.ctr, c.ctr) : ''}` }} />
                              <td className="px-2 py-1 text-right text-gray-500" dangerouslySetInnerHTML={{ __html: `${d.cpc != null ? '¥' + d.cpc : '—'}${c ? pctDelta(d.cpc, c.cpc, false) : ''}` }} />
                              <td className="px-2 py-1 text-right font-semibold" dangerouslySetInnerHTML={{ __html: `¥${d.spend.toLocaleString()}${c ? pctDelta(d.spend, c.spend) : ''}` }} />
                              <td className="px-2 py-1 text-right" dangerouslySetInnerHTML={{ __html: `${d.rev != null ? '¥' + d.rev.toLocaleString() : '—'}${c ? pctDelta(d.rev, c.rev) : ''}` }} />
                              <td className="px-2 py-1 text-right font-bold" style={{ color: d.roi == null ? '#9e9e9e' : roiOk ? '#2e7d32' : d.febi != null && d.febi > plan.gross * 100 ? '#c62828' : '#f57f17' }}
                                dangerouslySetInnerHTML={{ __html: `${d.roi ?? '—'}${c ? pctDelta(d.roi, c.roi) : ''}` }} />
                              <td className="px-2 py-1 text-right" style={{ color: d.febi == null ? '#9e9e9e' : d.febi > stopLossFebi ? '#c62828' : d.febi > targetFebi ? '#f57f17' : '#2e7d32' }}
                                dangerouslySetInnerHTML={{ __html: `${d.febi != null ? d.febi + '%' : '—'}${c ? pctDelta(d.febi, c.febi, false) : ''}` }} />
                              <td className="px-2 py-1 text-right text-gray-500">{d.tRoi}</td>
                              <td className="px-2 py-1 text-right font-semibold" dangerouslySetInnerHTML={{ __html: `${d.orders ?? '—'}${c ? pctDelta(d.orders, c.orders) : ''}` }} />
                              <td className="px-2 py-1 text-right text-gray-500" dangerouslySetInnerHTML={{ __html: `${d.cvr != null ? d.cvr + '%' : '—'}${c ? pctDelta(d.cvr, c.cvr) : ''}` }} />
                              <td className="px-2 py-1 text-right text-gray-500" dangerouslySetInnerHTML={{ __html: `${d.favs ?? '—'}${c ? pctDelta(d.favs, c.favs) : ''}` }} />
                              <td className="px-2 py-1 text-right text-gray-500" dangerouslySetInnerHTML={{ __html: `${d.addcart ?? '—'}${c ? pctDelta(d.addcart, c.addcart) : ''}` }} />
                              <td className="px-2 py-1 text-right">
                                <div className="flex items-center gap-1 justify-end">
                                  <span className="text-xs font-semibold" style={{ color: barColor, minWidth: 28 }}>{roiPct}%</span>
                                  <span className="inline-block rounded-sm h-1.5" style={{ width: barW, background: barColor }} />
                                </div>
                              </td>
                              <td className="px-2 py-1 text-left min-w-max">
                                {d.rule && d.rule !== '—' && (
                                  <span className="text-xs font-bold px-1 py-0.5 rounded mr-1 bg-indigo-100 text-indigo-800">{d.rule}</span>
                                )}
                                <span className={`text-xs px-1.5 py-0.5 rounded ${d.atype === 'red' ? 'bg-red-50 text-red-700 border border-red-200' : d.atype === 'yellow' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : d.atype === 'green' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500'}`}>
                                  {d.action}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                        {/* Summary row */}
                        <tr className="border-t-2 border-indigo-200 font-bold" style={{ background: '#e8eaf6' }}>
                          <td className="px-2 py-1 text-indigo-800">合计/均值</td>
                          <td className="px-2 py-1 text-right">{fmtNum(totImpr)}</td>
                          <td className="px-2 py-1 text-right">{totClicks.toLocaleString()}</td>
                          <td className="px-2 py-1 text-right text-gray-400">—</td>
                          <td className="px-2 py-1 text-right text-gray-400">—</td>
                          <td className="px-2 py-1 text-right" dangerouslySetInnerHTML={{ __html: `¥${totSpend.toLocaleString()}${cmpEnabled ? pctDelta(totSpend, cS) : ''}` }} />
                          <td className="px-2 py-1 text-right" dangerouslySetInnerHTML={{ __html: `¥${totRev.toLocaleString()}${cmpEnabled ? pctDelta(totRev, cR) : ''}` }} />
                          <td className="px-2 py-1 text-right">{avgRoi}</td>
                          <td className="px-2 py-1 text-right">{avgFebi}%</td>
                          <td className="px-2 py-1 text-right text-gray-400">—</td>
                          <td className="px-2 py-1 text-right" dangerouslySetInnerHTML={{ __html: `${totOrders.toLocaleString()}${cmpEnabled ? pctDelta(totOrders, cO) : ''}` }} />
                          <td className="px-2 py-1 text-right text-gray-400">—</td>
                          <td className="px-2 py-1 text-right">{totFavs.toLocaleString()}</td>
                          <td className="px-2 py-1 text-right">{totAddcart.toLocaleString()}</td>
                          <td className="px-2 py-1" />
                          <td className="px-2 py-1" />
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── 时数据 ── */}
              {dataSub === 'hourly' && (
                <div className="p-3.5">
                  <div className="flex items-center gap-4 mb-2 flex-wrap text-xs">
                    <div className="flex gap-3 text-gray-500">
                      <span><span className="inline-block w-2.5 h-2.5 rounded-sm mr-1 align-middle" style={{ background: 'rgba(21,101,192,.6)' }} />小时花费（柱）</span>
                      <span style={{ color: '#c62828' }}>- - 动态阈值</span>
                      <span>● 规则触发标记</span>
                      <span style={{ color: '#bdbdbd' }}>■ 已暂停</span>
                    </div>
                    <div className="ml-auto text-gray-500">
                      止损费比: <strong style={{ color: '#c62828' }}>{stopLossFebi.toFixed(1)}%</strong>
                      &nbsp;&nbsp;目标费比: <strong style={{ color: '#2e7d32' }}>{targetFebi.toFixed(1)}%</strong>
                    </div>
                  </div>
                  <div className="relative mb-1" style={{ height: 200 }}>
                    <canvas ref={hourlyChartRef} style={{ width: '100%', height: 200 }} />
                  </div>
                  <div className="text-center text-xs text-gray-400 mb-3">点击图中彩色圆圈查看前后对比</div>
                  {/* Hourly table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead className="sticky top-0 bg-gray-50 z-10">
                        <tr className="border-b-2 border-gray-200">
                          {['时段', '展示数', '点击数', '点击率', '均CPC', '花费', '动态阈值', '成交额', 'ROI', '费比', '成交笔数', '转化率', '收藏', '加购', '规则触发/执行动作'].map(h => (
                            <th key={h} className={`px-2 py-1.5 font-bold text-gray-500 whitespace-nowrap ${h === '时段' || h.includes('规则') ? 'text-left' : 'text-right'}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {hourlyData.map((d, i) => {
                          const at = d.atype
                          const isPause = at === 'pause'
                          const rowCls = isPause ? 'bg-gray-100 opacity-60' : at === 'red' ? 'bg-red-50' : at === 'yellow' ? 'bg-yellow-50' : at === 'green' ? 'bg-green-50/20' : ''
                          const overThresh = d.spend > d.threshold && d.spend > 0
                          return (
                            <tr key={i} className={`border-b border-gray-100 hover:brightness-95 ${rowCls}`}>
                              <td className="px-2 py-1.5 font-bold whitespace-nowrap">{d.h}:00</td>
                              <td className="px-2 py-1.5 text-right text-gray-500">{isPause ? '—' : fmtNum(d.impr)}</td>
                              <td className="px-2 py-1.5 text-right text-gray-500">{isPause ? '—' : d.clicks != null ? d.clicks.toLocaleString() : '—'}</td>
                              <td className="px-2 py-1.5 text-right text-gray-500">{d.ctr != null ? d.ctr + '%' : '—'}</td>
                              <td className="px-2 py-1.5 text-right text-gray-500">{d.cpc != null ? '¥' + d.cpc : '—'}</td>
                              <td className="px-2 py-1.5 text-right font-bold">
                                {d.spend > 0 ? '¥' + d.spend.toLocaleString() : '¥0'}
                                {overThresh && <span style={{ color: '#c62828', fontSize: 9 }} className="ml-1">▲超阈</span>}
                              </td>
                              <td className="px-2 py-1.5 text-right text-gray-500">¥{d.threshold.toLocaleString()}</td>
                              <td className="px-2 py-1.5 text-right">{d.rev != null && d.rev > 0 ? '¥' + d.rev.toLocaleString() : '—'}</td>
                              <td className="px-2 py-1.5 text-right font-bold" style={{ color: d.roi == null ? '#9e9e9e' : d.roi > plan.roiTarget ? '#2e7d32' : d.febi != null && d.febi > stopLossFebi ? '#c62828' : '#f57f17' }}>
                                {d.roi ?? '—'}
                              </td>
                              <td className="px-2 py-1.5 text-right" style={{ color: d.febi == null ? '#9e9e9e' : d.febi > stopLossFebi ? '#c62828' : d.febi > targetFebi ? '#f57f17' : '#2e7d32' }}>
                                {d.febi != null ? d.febi + '%' : '—'}
                              </td>
                              <td className="px-2 py-1.5 text-right">{d.orders ?? '—'}</td>
                              <td className="px-2 py-1.5 text-right text-gray-500">{d.cvr != null ? d.cvr + '%' : '—'}</td>
                              <td className="px-2 py-1.5 text-right text-gray-500">{d.orders != null ? Math.round(d.orders * 0.35) : '—'}</td>
                              <td className="px-2 py-1.5 text-right text-gray-500">{d.orders != null ? Math.round(d.orders * 1.2) : '—'}</td>
                              <td className="px-2 py-1.5 text-left min-w-max">
                                {d.rule && d.rule !== '—' && (
                                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded mr-1 ${at === 'red' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{d.rule}</span>
                                )}
                                <span className={`text-xs px-1.5 py-0.5 rounded ${isPause ? 'bg-gray-100 text-gray-400' : at === 'red' ? 'bg-red-50 text-red-700 border border-red-200' : at === 'yellow' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                                  {d.action}
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
            </div>
          </div>
  )
}
