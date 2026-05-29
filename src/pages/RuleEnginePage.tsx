import { useState, useMemo } from 'react'
import { RULE_DEFS, PLAN_HIST_LOG, plans as defaultPlans } from '../lib/mockData'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Line, ComposedChart, Bar } from 'recharts'

import type { PlanData } from '../lib/mockData'
import { loadJSON, saveJSON } from '../lib/persist'

interface Props {
  onClose: () => void
  plans?: PlanData[]
}

type Tab = 'overview' | 'log' | 'eval' | 'config' | 'backtest'

const layerStyle = (layer: string) => ({
  H: { bg: '#fff3e0', color: '#e65100' },
  D: { bg: '#e8eaf6', color: '#283593' },
  W: { bg: '#e8f5e9', color: '#2e7d32' },
}[layer] ?? { bg: '#f5f5f5', color: '#666' })

// ── Collect all executions from PLAN_HIST_LOG ─────────
function collectExecs() {
  const execs: {
    date: string; plan: string; rule: string; rDef: typeof RULE_DEFS[0];
    layer: string; action: string; pending: boolean; idx: number;
    planLog: typeof PLAN_HIST_LOG[string];
  }[] = []

  Object.entries(PLAN_HIST_LOG).forEach(([planName, log]) => {
    log.forEach((row, idx) => {
      if (!row.rule || row.rule === '—') return
      // strip suffixes like 预警/待确认/预执行/预判
      const rk = row.rule.replace(/[预警执行待确认判检\s]/g, '').trim()
      const rDef = RULE_DEFS.find(rd => rk.includes(rd.key) || row.rule.includes(rd.key))
      if (!rDef) return
      const pending = row.result === 'warn' || row.operator?.includes('待')
      execs.push({
        date: row.date, plan: planName, rule: row.rule,
        rDef, layer: rDef.layer, action: row.action,
        pending, idx, planLog: log,
      })
    })
  })
  return execs
}

// ── Compute per-rule effectiveness ─────────────────────
function computeEffects(execs: ReturnType<typeof collectExecs>) {
  const eff: Record<string, {
    triggers: number; pending: number; auto: number
    roiDeltas: number[]; febiDeltas: number[]; spendDeltas: number[]
    planHits: Record<string, number>
    avgRoiDelta: number | null; avgFebiDelta: number | null; avgSpendDelta: number | null
    successRate: number
  }> = {}

  RULE_DEFS.forEach(rd => {
    eff[rd.key] = { triggers: 0, pending: 0, auto: 0, roiDeltas: [], febiDeltas: [], spendDeltas: [], planHits: {}, avgRoiDelta: null, avgFebiDelta: null, avgSpendDelta: null, successRate: 0 }
  })

  execs.forEach(ex => {
    const k = ex.rDef.key
    const e = eff[k]; if (!e) return
    e.triggers++
    e.planHits[ex.plan] = (e.planHits[ex.plan] || 0) + 1
    if (ex.pending) { e.pending++; return }
    if (ex.rDef.auto) e.auto++
  })

  // Use deterministic seed-based deltas per rule for realistic display
  const scaleUp = new Set(['R3', 'DT3', 'WK2'])
  RULE_DEFS.forEach(rd => {
    const e = eff[rd.key]
    let h = 0
    for (let i = 0; i < rd.key.length; i++) h = (Math.imul(31, h) + rd.key.charCodeAt(i)) | 0
    const rng = (mn: number, mx: number) => { h = (Math.imul(1664525, h) + 1013904223) | 0; return mn + ((h >>> 0) / 4294967296) * (mx - mn) }
    if (e.triggers > 0) {
      e.avgRoiDelta = scaleUp.has(rd.key) ? +rng(0, 0.8).toFixed(2) : +rng(-0.6, 0.05).toFixed(2)
      e.avgFebiDelta = scaleUp.has(rd.key) ? +rng(-2, 0).toFixed(1) : +rng(-4, 0.5).toFixed(1)
      e.avgSpendDelta = scaleUp.has(rd.key) ? +rng(5, 30).toFixed(1) : +rng(-25, -3).toFixed(1)
    }
    e.successRate = e.triggers > 0 ? Math.round(((e.triggers - e.pending) / e.triggers) * 100) : 0
  })

  return eff
}

// ─── 规则分类 & 影响权重（模拟模型,确定性） ──────────────
// 控本类:降低费比;放量类:费比略升但 ROI 中性;其余:监控/记录类,≈无费比影响
const SCALE_UP = new Set(['R3', 'DT3', 'WK2'])
const COST_CUT = new Set(['R1-A', 'R1-B', 'R2-A', 'R2-B', 'R2-C', 'DT1', 'DT4', 'WK1', 'WK3'])
// 每条规则的费比影响权重（pp/天,正=降费比/控本,负=抬费比/放量,0=中性）
const RULE_WEIGHT: Record<string, number> = {
  'R1-A': 1.2, 'R1-B': 0.9, 'R2-A': 1.0, 'R2-B': 1.4, 'R2-C': 0.7,
  'DT1': 0.6, 'DT4': 0.5, 'WK1': 0.8, 'WK3': 0.6,
  'R3': -0.4, 'DT3': -0.3, 'WK2': -0.5,
  // R4 / DT2 / DT5 / WK4 / WK5 等监控类默认 0
}

// ─── Backtest simulation（模拟模型,非真实历史） ──────────
function runBacktest(
  startDate: string, endDate: string, gross: number, weeklyTarget: number,
  selectedRules: Set<string>, planNames: string[] = defaultPlans.map(p => p.name),
  plansData: { spend: number }[] = [],
) {
  // 生成日期序列
  const dates: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(`${d.getMonth() + 1}/${d.getDate()}`)
  }
  if (dates.length === 0) return null  // 开始>结束 → 无效

  // 按所选规则聚合费比影响（pp/天）,带衰减与上下限
  let netImpactPP = 0
  selectedRules.forEach(k => { netImpactPP += (RULE_WEIGHT[k] || 0) })
  const improvePP = Math.max(-3, Math.min(6, netImpactPP * 0.6))  // 净改善上限6pp,可为负
  const improve = improvePP / 100

  // 基线费比锚定到 Gross:无规则时略高于盈亏平衡线(持续小幅亏损)
  const baseFebi = gross + 0.03
  // 周毛利目标 → 利润目标费比线(Gross − 周目标)
  const targetFebi = Math.max(0.03, gross - weeklyTarget)

  const trendData = dates.map((date, i) => {
    const wave = Math.sin(i * 0.4) * 0.012
    const noRule = +(baseFebi + wave).toFixed(4)
    const ramp = Math.min(1, (i + 1) / Math.min(7, dates.length))  // 规则数日内逐步生效
    const withRule = +(noRule - improve * ramp).toFixed(4)
    return { date, withRule, noRule, target: +targetFebi.toFixed(4) }
  })

  // 明细行 — 确定性 seeded,行数随所选规则数与回测天数缩放(上限40)
  const ruleKeys = [...selectedRules].sort()
  let seed = (startDate + endDate + ruleKeys.join() + planNames.join()).split('')
    .reduce((h, c) => (Math.imul(31, h) + c.charCodeAt(0)) | 0, 7)
  const rng = () => { seed = (Math.imul(1664525, seed) + 1013904223) | 0; return (seed >>> 0) / 4294967296 }
  const detailRows: { date: string; plan: string; rule: string; rDef: typeof RULE_DEFS[0]; action: string; estRoiDelta: number; estFebiDelta: number; auto: boolean }[] = []
  const rowCount = ruleKeys.length === 0 ? 0 : Math.min(40, Math.max(ruleKeys.length, Math.round(dates.length / 3)))
  for (let n = 0; n < rowCount; n++) {
    const rKey = ruleKeys[n % ruleKeys.length]
    const rDef = RULE_DEFS.find(r => r.key === rKey)
    if (!rDef) continue
    const w = RULE_WEIGHT[rKey] || 0
    const date = dates[Math.floor(rng() * dates.length)]
    const plan = planNames[Math.floor(rng() * planNames.length)] || '—'
    detailRows.push({
      date, plan, rule: rKey, rDef, action: rDef.action,
      // 控本类提升 ROI;放量类 ROI 中性偏正
      estRoiDelta: +(Math.abs(w) * 0.3 + rng() * 0.25).toFixed(2),
      // 费比变化与规则权重挂钩:控本类降费比(负),放量类抬费比(正)
      estFebiDelta: +(-(w * 0.6) + (rng() - 0.5) * 0.3).toFixed(1),
      auto: rDef.auto,
    })
  }

  const autoCount = detailRows.filter(r => r.auto).length
  const totalTriggers = detailRows.length
  const avgFebiImprove = trendData.reduce((s, d) => s + (d.noRule - d.withRule), 0) / trendData.length
  // ROI 改善由费比改善反推:ROI ≈ 1/费比
  const roiNo = 1 / baseFebi
  const roiWith = 1 / Math.max(0.03, baseFebi - avgFebiImprove)
  const avgRoiImprove = roiWith - roiNo
  // 预算优化额:基于真实计划日花费反推日营收 × 费比改善 × 天数
  const totalSpend = plansData.reduce((s, p) => s + p.spend, 0)
  const dailyRevenue = baseFebi > 0 ? totalSpend / baseFebi : 0
  const budgetSaved = dailyRevenue * avgFebiImprove * dates.length

  return { trendData, detailRows, autoCount, totalTriggers, avgFebiImprove, avgRoiImprove, budgetSaved, days: dates.length, improvePP }
}

export function RuleEnginePage({ onClose, plans: propPlans }: Props) {
  const plans = propPlans || defaultPlans
  const [tab, setTab] = useState<Tab>('overview')
  const [fltPlan, setFltPlan] = useState('')
  const [fltRule, setFltRule] = useState('')
  const [fltLayer, setFltLayer] = useState('')
  const [fltStatus, setFltStatus] = useState('')

  // Config tab: editable threshold params
  type ThresholdRow = { name: string; val: string; desc: string; layer: 'H' | 'D' | 'W' }
  const defaultParams: ThresholdRow[] = [
    { layer: 'H', name: 'R1-A 动态阈值窗口', val: '28天', desc: '计算同段均值±2σ所用历史天数' },
    { layer: 'H', name: 'R1-A ROI完成率上限', val: '< 80%', desc: '同时满足零成交+零加购才触发暂停' },
    { layer: 'H', name: 'R1-B ROI上调幅度', val: '×1.15', desc: '净目标投产比自动上调比例' },
    { layer: 'H', name: 'R1-B 剩余预算收缩', val: '×0.80', desc: '当日已花费+剩余×0.8=新预算' },
    { layer: 'H', name: 'R2-A ROI完成率触发线', val: '< 60%', desc: '累计成交额÷花费÷目标ROI' },
    { layer: 'H', name: 'R2-A ROI上调幅度', val: '×1.18', desc: '完成率过低时强力收紧出价' },
    { layer: 'H', name: 'R2-A 剩余预算收缩', val: '×0.70', desc: '剩余预算大幅削减' },
    { layer: 'H', name: 'R2-B 止损ROI缓冲', val: '×1.10', desc: '止损ROI×1.10作为新ROI目标' },
    { layer: 'H', name: 'R2-B 剩余预算收缩', val: '×0.60', desc: '红区止损最强预算压力' },
    { layer: 'H', name: 'R2-C ROI上调幅度', val: '×1.10', desc: '黄区+全店余量不足时联动收紧' },
    { layer: 'H', name: 'R2-C 剩余预算收缩', val: '×0.80', desc: '配合ROI收紧的预算压力' },
    { layer: 'H', name: 'R3 ROI完成率触发线', val: '≥ 130%', desc: '绿区且ROI明显超目标才追量' },
    { layer: 'H', name: 'R3 预算追加幅度', val: '+15~20%', desc: '按过去3小时均花费×剩余小时数×15%' },
    { layer: 'H', name: 'R4 CTR动态阈值', val: '28日 −2σ', desc: '低于此值记录预警，不操作出价' },
    { layer: 'D', name: 'DT1 ROI上调幅度', val: '×1.08', desc: '超目标费比时轻度收紧出价' },
    { layer: 'D', name: 'DT1 次日预算压缩', val: '×0.90', desc: '配合ROI收紧的次日预算' },
    { layer: 'D', name: 'DT2 加购率触发倍数', val: '×1.5', desc: '加购率超品类均值此倍数触发保护' },
    { layer: 'D', name: 'DT3 预算耗尽预测时点', val: '< 18:00', desc: '晚高峰前耗尽才触发预算追加' },
    { layer: 'D', name: 'DT3 次日预算追加', val: '×1.20', desc: '需绿区且中/高置信度才执行' },
    { layer: 'D', name: 'DT4 零转化花费门槛', val: '> 200元', desc: '低于此值的零转化不处理' },
    { layer: 'D', name: 'DT5 费比容忍上限', val: 'Gross×1.20', desc: '冷启动期允许费比超目标至此' },
    { layer: 'W', name: 'WK1 全店周毛利目标', val: '10%', desc: '顶层约束；旺季+2%，淡季-2%' },
    { layer: 'W', name: 'WK1 超额松绑幅度', val: 'ROI−5%', desc: '超额>+3%才松绑黄区B类计划' },
    { layer: 'W', name: 'WK1 不达标红区操作', val: 'ROI+15% ×0.70', desc: '红区计划本周收紧' },
    { layer: 'W', name: 'WK1 不达标黄区操作', val: 'ROI+8% ×0.85', desc: '黄区计划本周轻压' },
    { layer: 'W', name: 'WK2 加购率触发倍数', val: '×1.30', desc: '高加购+低即时ROI判定高潜力' },
    { layer: 'W', name: 'WK2 预算追加幅度', val: '+30%', desc: '本周每日预算大幅追加' },
    { layer: 'W', name: 'WK2 ROI下调幅度', val: '×0.92', desc: '降低ROI目标放量捕获潜在转化' },
    { layer: 'W', name: 'WK3 红区连续周数', val: '≥ 3周', desc: '连续三周费比超盈亏平衡才触发' },
    { layer: 'W', name: 'WK3 最低预算维持', val: '×0.30', desc: '保留最低消耗积累数据' },
    { layer: 'W', name: 'WK4 利用率过低触发线', val: '< 60%', desc: '建议ROI下调5~10%提升竞争力' },
    { layer: 'W', name: 'WK5 模型拟合质量要求', val: 'R² ≥ 0.50', desc: '低于0.5降权结合规则方法' },
  ]
  const allEnabled = () => Object.fromEntries(RULE_DEFS.map(r => [r.key, true]))
  // 持久化:参数值(仅 val,按 name 索引) + 规则启停
  const savedValMap = loadJSON<Record<string, string>>('ruleengine.params', {})
  const savedEnabledInit = loadJSON<Record<string, boolean>>('ruleengine.enabled', allEnabled())
  const [params, setParams] = useState<ThresholdRow[]>(
    () => defaultParams.map(p => ({ ...p, val: savedValMap[p.name] ?? p.val }))
  )
  const [savedParams, setSavedParams] = useState<ThresholdRow[]>(
    () => defaultParams.map(p => ({ ...p, val: savedValMap[p.name] ?? p.val }))
  )
  const [ruleEnabled, setRuleEnabled] = useState<Record<string, boolean>>(() => ({ ...allEnabled(), ...savedEnabledInit }))
  const [savedEnabled, setSavedEnabled] = useState<Record<string, boolean>>(() => ({ ...allEnabled(), ...savedEnabledInit }))
  const [saveFlash, setSaveFlash] = useState(false)

  // 参数改动 与 规则启停改动 分开计数(相对"已保存"状态,而非默认值)
  const paramDirty = params.filter((p, i) => p.val !== savedParams[i]?.val).length
  const enabledDirty = RULE_DEFS.filter(r => (ruleEnabled[r.key] !== false) !== (savedEnabled[r.key] !== false)).length
  const dirtyCount = paramDirty + enabledDirty
  const disabledCount = RULE_DEFS.filter(r => ruleEnabled[r.key] === false).length

  function saveParams() {
    setSavedParams([...params])
    setSavedEnabled({ ...ruleEnabled })
    saveJSON('ruleengine.params', Object.fromEntries(params.map(p => [p.name, p.val])))
    saveJSON('ruleengine.enabled', ruleEnabled)
    setSaveFlash(true)
    setTimeout(() => setSaveFlash(false), 1800)
  }
  function resetParams() {
    setParams([...defaultParams]); setSavedParams([...defaultParams])
    setRuleEnabled(allEnabled()); setSavedEnabled(allEnabled())
    saveJSON('ruleengine.params', undefined)
    saveJSON('ruleengine.enabled', undefined)
  }

  // Backtest state
  const [btStart, setBtStart] = useState('2026-04-29')
  const [btEnd, setBtEnd] = useState('2026-05-28')
  const [btGross, setBtGross] = useState(31)
  const [btWeekly, setBtWeekly] = useState(10)
  const [btRules, setBtRules] = useState<Set<string>>(new Set(RULE_DEFS.map(r => r.key)))
  const [btResult, setBtResult] = useState<ReturnType<typeof runBacktest> | null>(null)

  // 回测有效性:已启用且勾选的规则 + 日期合法
  const effectiveBtRules = new Set([...btRules].filter(k => ruleEnabled[k] !== false))
  const dateValid = new Date(btStart) <= new Date(btEnd)
  const btError = !dateValid ? '开始日期需早于或等于结束日期'
    : effectiveBtRules.size === 0 ? '请至少选择一条已启用的规则'
    : ''
  function handleRunBacktest() {
    if (btError) return
    setBtResult(runBacktest(btStart, btEnd, btGross / 100, btWeekly / 100, effectiveBtRules, plans.map(p => p.name), plans))
  }

  const execs = useMemo(() => collectExecs(), [])
  const eff = useMemo(() => computeEffects(execs), [execs])

  const totalTriggers = execs.length
  const totalPending = execs.filter(e => e.pending).length
  const autoRate = totalTriggers > 0 ? Math.round(execs.filter(e => e.rDef.auto).length / totalTriggers * 100) : 0
  const activePlans = new Set(execs.map(e => e.plan)).size

  const scaleUp = SCALE_UP
  const costCut = COST_CUT

  // Log filtering
  const planNames = [...new Set(execs.map(e => e.plan))]
  const ruleKeys = [...new Set(execs.map(e => e.rDef.key))]
  const filteredLog = execs.filter(r =>
    (!fltPlan || r.plan === fltPlan) &&
    (!fltRule || r.rDef.key === fltRule) &&
    (!fltLayer || r.layer === fltLayer) &&
    (!fltStatus || (fltStatus === 'ok' ? !r.pending : r.pending))
  )

  // Chart data for eval
  const chartData = RULE_DEFS.map(rd => {
    const e = eff[rd.key]
    const d = e?.avgRoiDelta ?? null
    const fill = d == null ? 'rgba(158,158,158,.5)'
      : scaleUp.has(rd.key) ? (d >= -0.05 ? 'rgba(46,125,50,.7)' : 'rgba(198,40,40,.6)')
      : d < 0 ? 'rgba(46,125,50,.7)' : d > 0.2 ? 'rgba(198,40,40,.6)' : 'rgba(245,127,23,.6)'
    return { key: rd.key, roiDelta: d ?? 0, triggers: e?.triggers ?? 0, fill }
  })

  const tabs: { k: Tab; l: string }[] = [
    { k: 'overview', l: '📋 规则总览' },
    { k: 'log', l: '📜 执行日志' },
    { k: 'eval', l: '📊 效果评估' },
    { k: 'config', l: '🔧 规则参数' },
    { k: 'backtest', l: '🧪 历史回测' },
  ]

  const selStyle: React.CSSProperties = {
    fontSize: 11, border: '1px solid #ddd', borderRadius: 4, padding: '3px 6px', background: '#fff',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#f3f4f6', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', height: 56, flexShrink: 0, background: 'linear-gradient(135deg,#283593,#1565c0)', color: '#fff' }}>
        <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', color: '#fff', cursor: 'pointer' }}>
          ← 返回看板
        </button>
        <div style={{ fontWeight: 700, fontSize: 17, flex: 1 }}>⚙️ 规则引擎管理</div>
        <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
          <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(76,175,80,.6)' }}>{totalTriggers}次触发</span>
          {totalPending > 0 && <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(198,40,40,.6)' }}>{totalPending}项待确认</span>}
          <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,.2)' }}>自动执行率{autoRate}%</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ background: '#fff', borderBottom: '2px solid #e5e7eb', padding: '0 20px', display: 'flex', flexShrink: 0 }}>
        {tabs.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            style={{
              padding: '10px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              borderBottom: tab === t.k ? '2px solid #283593' : '2px solid transparent',
              marginBottom: -2, background: 'none', border: 'none',
              borderBottomStyle: 'solid',
              borderBottomWidth: 2,
              borderBottomColor: tab === t.k ? '#283593' : 'transparent',
              color: tab === t.k ? '#283593' : '#6b7280', whiteSpace: 'nowrap',
            }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

        {/* ══ 规则总览 ══ */}
        {tab === 'overview' && (
          <div>
            {/* KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
              {([
                ['总触发次数', totalTriggers, '#283593'],
                ['待确认', totalPending, totalPending ? '#c62828' : '#2e7d32'],
                ['自动执行率', autoRate + '%', '#2e7d32'],
                ['涉及计划数', activePlans, '#283593'],
                ['规则条数', RULE_DEFS.length, '#666'],
              ] as [string, string | number, string][]).map(([l, v, c], i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '12px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: c }}>{v}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>

            {/* Rule cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
              {RULE_DEFS.map(rd => {
                const e = eff[rd.key] || { triggers: 0, pending: 0, auto: 0, avgRoiDelta: null, avgFebiDelta: null, successRate: 0, planHits: {} }
                const ls = layerStyle(rd.layer)
                const topPlans = Object.entries(e.planHits || {}).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([n, c]) => `${n.slice(0, 4)}(${c})`).join(' ')
                const effCls = e.avgRoiDelta == null ? 'neu'
                  : scaleUp.has(rd.key) ? (e.avgRoiDelta >= -0.1 ? 'pos' : 'neg')
                  : e.avgRoiDelta < 0 ? 'pos' : e.avgRoiDelta > 0.3 ? 'neg' : 'neu'
                const roiEffTxt = e.avgRoiDelta == null ? '暂无效果数据'
                  : `估算ROI ${e.avgRoiDelta > 0 ? '↑' : '↓'}${Math.abs(e.avgRoiDelta)} | 费比${e.avgFebiDelta != null ? (e.avgFebiDelta > 0 ? '↑' : '↓') + Math.abs(e.avgFebiDelta) : '—'}%`
                const effBg = effCls === 'pos' ? '#e8f5e9' : effCls === 'neg' ? '#ffebee' : '#f5f5f5'
                const effColor = effCls === 'pos' ? '#2e7d32' : effCls === 'neg' ? '#c62828' : '#666'
                return (
                  <div key={rd.key} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', overflow: 'hidden', transition: 'box-shadow .15s' }}
                    onMouseEnter={e2 => (e2.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.15)')}
                    onMouseLeave={e2 => (e2.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,.08)')}>
                    {/* card head */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderBottom: '1px solid #f0f0f0', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 16 }}>{rd.icon}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: ls.bg, color: ls.color }}>{rd.layerFull}</span>
                      <span style={{ fontWeight: 700, fontSize: 11, flex: 1 }}>{rd.key} · {rd.label}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: rd.auto ? '#e8f5e9' : '#fff8e1', color: rd.auto ? '#2e7d32' : '#f57f17' }}>
                        {rd.auto ? '自动' : '确认'}
                      </span>
                    </div>
                    {/* card body */}
                    <div style={{ padding: '8px 12px' }}>
                      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8, lineHeight: 1.4 }}>{rd.desc}</div>
                      {/* stats row */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 8 }}>
                        <div style={{ textAlign: 'center', padding: '4px', background: '#fafafa', borderRadius: 6 }}>
                          <div style={{ fontWeight: 800, fontSize: 14, color: rd.color }}>{e.triggers}</div>
                          <div style={{ fontSize: 10, color: '#9ca3af' }}>触发次数</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '4px', background: '#fafafa', borderRadius: 6 }}>
                          <div style={{ fontWeight: 800, fontSize: 14, color: e.pending ? '#c62828' : '#2e7d32' }}>{e.pending}</div>
                          <div style={{ fontSize: 10, color: '#9ca3af' }}>待确认</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '4px', background: '#fafafa', borderRadius: 6 }}>
                          <div style={{ fontWeight: 800, fontSize: 14, color: '#283593' }}>{e.successRate}%</div>
                          <div style={{ fontSize: 10, color: '#9ca3af' }}>执行率</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '4px', background: '#fafafa', borderRadius: 6 }}>
                          <div style={{ fontWeight: 700, fontSize: 10, color: '#9ca3af' }}>{topPlans || '—'}</div>
                          <div style={{ fontSize: 10, color: '#9ca3af' }}>高频计划</div>
                        </div>
                      </div>
                      {/* progress bar */}
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9ca3af', marginBottom: 3 }}>
                          <span>执行率</span><span>{e.successRate}%</span>
                        </div>
                        <div style={{ height: 5, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.max(4, e.successRate)}%`, background: rd.color, borderRadius: 4 }} />
                        </div>
                      </div>
                      {/* effect label */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '4px 8px', borderRadius: 6, background: effBg, color: effColor }}>
                        <span>{effCls === 'pos' ? '✅' : effCls === 'neg' ? '⚠️' : 'ℹ️'}</span>
                        <span>{roiEffTxt}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ══ 执行日志 ══ */}
        {tab === 'log' && (
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', overflow: 'hidden' }}>
            {/* filter row */}
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af' }}>筛选：</span>
              <select style={selStyle} value={fltPlan} onChange={e => setFltPlan(e.target.value)}>
                <option value="">全部计划</option>
                {planNames.map(n => <option key={n}>{n}</option>)}
              </select>
              <select style={selStyle} value={fltRule} onChange={e => setFltRule(e.target.value)}>
                <option value="">全部规则</option>
                {ruleKeys.map(k => <option key={k}>{k}</option>)}
              </select>
              <select style={selStyle} value={fltLayer} onChange={e => setFltLayer(e.target.value)}>
                <option value="">全部层级</option>
                <option value="H">小时层</option>
                <option value="D">日层</option>
                <option value="W">周层</option>
              </select>
              <select style={selStyle} value={fltStatus} onChange={e => setFltStatus(e.target.value)}>
                <option value="">全部状态</option>
                <option value="ok">已执行</option>
                <option value="pending">待确认</option>
              </select>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9ca3af' }}>共 <strong style={{ color: '#374151' }}>{filteredLog.length}</strong> 条记录</span>
            </div>
            {/* table */}
            <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
              <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', position: 'sticky', top: 0 }}>
                    {['时间', '计划', '规则', '层级', '触发条件', '执行动作', '状态'].map(h => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 700, color: '#6b7280', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLog.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0', fontSize: 12 }}>
                        没有符合筛选条件的执行记录
                      </td>
                    </tr>
                  )}
                  {filteredLog.map((r, i) => {
                    const ls = layerStyle(r.layer)
                    const ok = !r.pending
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}
                        onMouseEnter={e2 => (e2.currentTarget.style.background = '#fafafa')}
                        onMouseLeave={e2 => (e2.currentTarget.style.background = '')}>
                        <td style={{ padding: '6px 8px', color: '#9ca3af', whiteSpace: 'nowrap' }}>{r.date}</td>
                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>{r.plan}</td>
                        <td style={{ padding: '6px 8px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: r.rDef.color + '22', color: r.rDef.color, border: `1px solid ${r.rDef.color}44` }}>{r.rDef.key}</span>
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: ls.bg, color: ls.color }}>{r.rDef.layerFull}</span>
                        </td>
                        <td style={{ padding: '6px 8px', fontSize: 10, color: '#9ca3af', maxWidth: 180 }}>{r.rDef.trigger}</td>
                        <td style={{ padding: '6px 8px', fontSize: 10, maxWidth: 200 }}>{r.action}</td>
                        <td style={{ padding: '6px 8px' }}>
                          <span style={{ fontWeight: 700, color: ok ? '#2e7d32' : '#f57f17' }}>{ok ? '✅ 已执行' : '⏳ 待确认'}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ 效果评估 ══ */}
        {tab === 'eval' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#92400e', background: '#fef3c7', padding: '2px 8px', borderRadius: 4 }}>模拟估算</span>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>
                当前为模型估算值（演示用）。接入真实执行数据后，将改为对比触发日前 3 日均值 vs 执行后 3 日均值。
              </span>
            </div>
            {/* chart */}
            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', padding: 16, marginBottom: 16 }}>
              <div style={{ height: 240 }}>
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
                    <Line yAxisId="right" type="monotone" dataKey="triggers" stroke="rgba(63,81,181,.7)" strokeWidth={2} dot={{ r: 3 }} name="触发次数" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* eval cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {RULE_DEFS.map(rd => {
                const e = eff[rd.key] || { triggers: 0, pending: 0, successRate: 0, avgRoiDelta: null, avgFebiDelta: null, avgSpendDelta: null }
                const fmt = (v: number | null, unit: string) => v == null ? '—' : `${v > 0 ? '+' : ''}${v}${unit}`
                const roiCls = e.avgRoiDelta == null ? 'neu' : scaleUp.has(rd.key) ? (e.avgRoiDelta >= -0.05 ? 'pos' : 'neg') : (e.avgRoiDelta < 0 ? 'pos' : e.avgRoiDelta > 0.2 ? 'neg' : 'neu')
                const febiCls = e.avgFebiDelta == null ? 'neu' : scaleUp.has(rd.key) ? 'pos' : (e.avgFebiDelta < 0 ? 'pos' : e.avgFebiDelta > 2 ? 'neg' : 'neu')
                const spendCls = e.avgSpendDelta == null ? 'neu' : costCut.has(rd.key) ? (e.avgSpendDelta < 0 ? 'pos' : 'neg') : (e.avgSpendDelta > 0 ? 'pos' : 'neu')
                const clsColor = (c: string) => c === 'pos' ? '#2e7d32' : c === 'neg' ? '#c62828' : '#666'
                const clsBg = (c: string) => c === 'pos' ? '#e8f5e9' : c === 'neg' ? '#ffebee' : '#f5f5f5'
                return (
                  <div key={rd.key} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 15 }}>{rd.icon}</span>
                      <span style={{ fontWeight: 800, fontSize: 12, color: rd.color }}>{rd.key}</span>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>{rd.label}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 10, color: '#9ca3af', background: '#f5f5f5', padding: '1px 5px', borderRadius: 4 }}>n={e.triggers}</span>
                    </div>
                    {[
                      ['触发后ROI均变化', fmt(e.avgRoiDelta, ''), roiCls],
                      ['费比均变化', fmt(e.avgFebiDelta, '%'), febiCls],
                      ['花费均变化', fmt(e.avgSpendDelta, '%'), spendCls],
                    ].map(([label, val, cls]) => (
                      <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, borderBottom: '1px solid #f3f4f6', padding: '5px 0' }}>
                        <span style={{ color: '#6b7280' }}>{String(label)}</span>
                        <span style={{ fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: clsBg(String(cls)), color: clsColor(String(cls)) }}>{String(val)}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '5px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ color: '#6b7280' }}>执行率</span>
                      <span style={{ fontWeight: 700, color: '#283593' }}>{e.successRate}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '5px 0' }}>
                      <span style={{ color: '#6b7280' }}>待确认</span>
                      <span style={{ color: (e.pending ?? 0) > 0 ? '#c62828' : '#2e7d32', fontWeight: 700 }}>{e.pending ?? 0} 项</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ══ 规则参数（可编辑） ══ */}
        {tab === 'config' && (
          <div style={{ paddingBottom: (dirtyCount > 0 || saveFlash) ? 64 : 0 }}>
            {/* Section 1: rule enable/disable */}
            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 16, overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', fontWeight: 700, fontSize: 13, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>📋 规则启停控制</span>
                <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 400 }}>点击开关可单独启停规则</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 14 }}>
                {RULE_DEFS.map(rd => {
                  const enabled = ruleEnabled[rd.key] !== false
                  const ls = layerStyle(rd.layer)
                  return (
                    <button key={rd.key}
                      onClick={() => setRuleEnabled(prev => ({ ...prev, [rd.key]: !enabled }))}
                      style={{
                        padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1.5px solid',
                        borderColor: enabled ? ls.color : '#e5e7eb',
                        background: enabled ? ls.bg : '#f9fafb',
                        color: enabled ? ls.color : '#9ca3af',
                        opacity: enabled ? 1 : 0.6,
                        transition: 'all .15s',
                      }}>
                      {rd.icon} {rd.key} {enabled ? '✓' : '✕'}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Section 2: editable threshold params */}
            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', fontWeight: 700, fontSize: 13, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>⚙️ 阈值参数配置</span>
                <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 400 }}>直接修改参数值，底部保存生效</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      {['参数名', '当前值（可编辑）', '说明'].map(h => (
                        <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(['H', 'D', 'W'] as const).map(layer => {
                      const layerParams = params.filter(p => p.layer === layer)
                      const headers = { H: { bg: '#fff3e0', color: '#e65100', label: '🕐 小时层规则（H）' }, D: { bg: '#e8eaf6', color: '#283593', label: '📅 日层规则（D）' }, W: { bg: '#e8f5e9', color: '#2e7d32', label: '📆 周层规则（W）' } }
                      const h = headers[layer]
                      return [
                        <tr key={`hdr-${layer}`} style={{ background: h.bg }}>
                          <td colSpan={3} style={{ padding: '4px 10px', fontWeight: 700, color: h.color, fontSize: 10 }}>{h.label}</td>
                        </tr>,
                        ...layerParams.map(p => {
                          const idx = params.findIndex(x => x.name === p.name)
                          const isDirty = p.val !== defaultParams[idx]?.val
                          return (
                            <tr key={p.name} style={{ borderBottom: '1px solid #f3f4f6', background: isDirty ? '#fffde7' : '' }}>
                              <td style={{ padding: '5px 10px', color: '#374151', whiteSpace: 'nowrap' }}>
                                {isDirty && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', marginRight: 6, verticalAlign: 'middle' }} />}
                                {p.name}
                              </td>
                              <td style={{ padding: '4px 8px' }}>
                                <input
                                  value={p.val}
                                  onChange={e => setParams(prev => prev.map((x, i) => i === idx ? { ...x, val: e.target.value } : x))}
                                  style={{
                                    width: '100%', minWidth: 120, border: `1.5px solid ${isDirty ? '#f59e0b' : '#e5e7eb'}`,
                                    borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700,
                                    color: isDirty ? '#92400e' : '#283593', background: isDirty ? '#fffde7' : '#f9fafb',
                                    outline: 'none', boxSizing: 'border-box',
                                  }}
                                  onFocus={e => (e.target.style.borderColor = '#3b82f6')}
                                  onBlur={e => (e.target.style.borderColor = isDirty ? '#f59e0b' : '#e5e7eb')}
                                />
                              </td>
                              <td style={{ padding: '5px 10px', color: '#9ca3af', fontSize: 10 }}>{p.desc}</td>
                            </tr>
                          )
                        })
                      ]
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Floating save bar */}
            {(dirtyCount > 0 || saveFlash) && (
              <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20, background: 'rgba(255,255,255,.95)', backdropFilter: 'blur(8px)', borderTop: '1px solid #e5e7eb', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {saveFlash ? (
                  <span style={{ fontSize: 12, color: '#2e7d32', fontWeight: 700 }}>
                    ✓ 已保存到本地（刷新后保留）
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: '#92400e', fontWeight: 600 }}>
                    ⚠️ 未保存：
                    {paramDirty > 0 && `${paramDirty} 项参数修改`}
                    {paramDirty > 0 && enabledDirty > 0 && '、'}
                    {enabledDirty > 0 && `${enabledDirty} 项规则启停变更`}
                  </span>
                )}
                {!saveFlash && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={resetParams} style={{ padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: '1.5px solid #e5e7eb', background: '#fff', color: '#6b7280', cursor: 'pointer' }}>
                      重置默认
                    </button>
                    <button onClick={saveParams} style={{ padding: '6px 20px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: 'none', background: 'linear-gradient(135deg,#283593,#1565c0)', color: '#fff', cursor: 'pointer' }}>
                      ✓ 保存配置
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══ 历史回测 ══ */}
        {tab === 'backtest' && (
          <div style={{ display: 'flex', gap: 16 }}>
            {/* Left control panel */}
            <div style={{ width: 268, flexShrink: 0, background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', padding: 16, alignSelf: 'flex-start' }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>🔧 模拟参数</div>

              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>开始日期</div>
              <input type="date" value={btStart} onChange={e => setBtStart(e.target.value)}
                style={{ width: '100%', fontSize: 11, border: '1px solid #ddd', borderRadius: 6, padding: '4px 8px', marginBottom: 10, boxSizing: 'border-box' }} />

              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>结束日期</div>
              <input type="date" value={btEnd} onChange={e => setBtEnd(e.target.value)}
                style={{ width: '100%', fontSize: 11, border: '1px solid #ddd', borderRadius: 6, padding: '4px 8px', marginBottom: 10, boxSizing: 'border-box' }} />

              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Gross毛利率%</div>
                  <input type="number" value={btGross} onChange={e => setBtGross(+e.target.value)}
                    style={{ width: '100%', fontSize: 11, border: '1px solid #ddd', borderRadius: 6, padding: '4px 8px', boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>周毛利目标%</div>
                  <input type="number" value={btWeekly} onChange={e => setBtWeekly(+e.target.value)}
                    style={{ width: '100%', fontSize: 11, border: '1px solid #ddd', borderRadius: 6, padding: '4px 8px', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8, marginTop: 4 }}>📋 规则选择</div>
              {/* Presets */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 4 }}>快捷预设：</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {[
                    { label: '🟢 宽松模式', keys: ['R3', 'DT3', 'WK2', 'WK4'] },
                    { label: '🔴 强收紧', keys: ['R1-A', 'R1-B', 'R2-A', 'R2-B', 'R2-C', 'DT1', 'DT4', 'WK1', 'WK3'] },
                    { label: '📅 仅日层', keys: RULE_DEFS.filter(r => r.layer === 'D').map(r => r.key) },
                    { label: '📆 仅周层', keys: RULE_DEFS.filter(r => r.layer === 'W').map(r => r.key) },
                    { label: '全选', keys: RULE_DEFS.map(r => r.key) },
                    { label: '清空', keys: [] },
                  ].map(preset => (
                    <button key={preset.label} onClick={() => setBtRules(new Set(preset.keys))}
                      style={{ fontSize: 10, padding: '3px 8px', borderRadius: 12, border: '1px solid #e5e7eb', cursor: 'pointer', background: '#f9fafb', fontWeight: 600 }}>
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* H layer */}
              <div style={{ fontSize: 10, fontWeight: 700, color: '#e65100', background: '#fff3e0', padding: '3px 6px', borderRadius: 4, marginBottom: 4 }}>🕐 小时层</div>
              {RULE_DEFS.filter(r => r.layer === 'H').map(r => (
                <label key={r.key} title={ruleEnabled[r.key] === false ? '该规则已在「规则参数」中停用' : undefined}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: ruleEnabled[r.key] === false ? 'not-allowed' : 'pointer', marginBottom: 4, opacity: ruleEnabled[r.key] === false ? 0.4 : 1 }}>
                  <input type="checkbox" disabled={ruleEnabled[r.key] === false} checked={ruleEnabled[r.key] !== false && btRules.has(r.key)} onChange={e => {
                    const s = new Set(btRules); e.target.checked ? s.add(r.key) : s.delete(r.key); setBtRules(s)
                  }} style={{ margin: 0 }} />
                  <span>{r.icon}</span>
                  <span style={{ color: r.color, fontWeight: 700 }}>{r.key}</span>
                  <span style={{ color: '#6b7280' }}>{r.label}</span>
                  {ruleEnabled[r.key] === false && <span style={{ marginLeft: 'auto', fontSize: 9, color: '#9ca3af' }}>已停用</span>}
                </label>
              ))}

              {/* D layer */}
              <div style={{ fontSize: 10, fontWeight: 700, color: '#283593', background: '#e8eaf6', padding: '3px 6px', borderRadius: 4, marginBottom: 4, marginTop: 8 }}>📅 日层</div>
              {RULE_DEFS.filter(r => r.layer === 'D').map(r => (
                <label key={r.key} title={ruleEnabled[r.key] === false ? '该规则已在「规则参数」中停用' : undefined}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: ruleEnabled[r.key] === false ? 'not-allowed' : 'pointer', marginBottom: 4, opacity: ruleEnabled[r.key] === false ? 0.4 : 1 }}>
                  <input type="checkbox" disabled={ruleEnabled[r.key] === false} checked={ruleEnabled[r.key] !== false && btRules.has(r.key)} onChange={e => {
                    const s = new Set(btRules); e.target.checked ? s.add(r.key) : s.delete(r.key); setBtRules(s)
                  }} style={{ margin: 0 }} />
                  <span>{r.icon}</span>
                  <span style={{ color: r.color, fontWeight: 700 }}>{r.key}</span>
                  <span style={{ color: '#6b7280' }}>{r.label}</span>
                  {ruleEnabled[r.key] === false && <span style={{ marginLeft: 'auto', fontSize: 9, color: '#9ca3af' }}>已停用</span>}
                </label>
              ))}

              {/* W layer */}
              <div style={{ fontSize: 10, fontWeight: 700, color: '#2e7d32', background: '#e8f5e9', padding: '3px 6px', borderRadius: 4, marginBottom: 4, marginTop: 8 }}>📆 周层</div>
              {RULE_DEFS.filter(r => r.layer === 'W').map(r => (
                <label key={r.key} title={ruleEnabled[r.key] === false ? '该规则已在「规则参数」中停用' : undefined}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: ruleEnabled[r.key] === false ? 'not-allowed' : 'pointer', marginBottom: 4, opacity: ruleEnabled[r.key] === false ? 0.4 : 1 }}>
                  <input type="checkbox" disabled={ruleEnabled[r.key] === false} checked={ruleEnabled[r.key] !== false && btRules.has(r.key)} onChange={e => {
                    const s = new Set(btRules); e.target.checked ? s.add(r.key) : s.delete(r.key); setBtRules(s)
                  }} style={{ margin: 0 }} />
                  <span>{r.icon}</span>
                  <span style={{ color: r.color, fontWeight: 700 }}>{r.key}</span>
                  <span style={{ color: '#6b7280' }}>{r.label}</span>
                  {ruleEnabled[r.key] === false && <span style={{ marginLeft: 'auto', fontSize: 9, color: '#9ca3af' }}>已停用</span>}
                </label>
              ))}

              {btError && (
                <div style={{ marginTop: 12, padding: '6px 10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: 10.5, color: '#c62828', fontWeight: 600 }}>
                  ⚠️ {btError}
                </div>
              )}
              <button
                onClick={handleRunBacktest}
                disabled={!!btError}
                style={{ width: '100%', padding: '9px', marginTop: btError ? 8 : 14, borderRadius: 8, background: btError ? '#cbd5e1' : '#3730a3', color: '#fff', fontWeight: 700, fontSize: 12, cursor: btError ? 'not-allowed' : 'pointer', border: 'none' }}>
                ▶ 运行回测
              </button>
              <div style={{ marginTop: 8, fontSize: 9, color: '#9ca3af', lineHeight: 1.5 }}>
                已启用并选中 <strong style={{ color: '#475569' }}>{effectiveBtRules.size}</strong> 条规则参与回测{disabledCount > 0 ? `（${disabledCount} 条在规则参数中已停用）` : ''}
              </div>
            </div>

            {/* Right result panel */}
            <div style={{ flex: 1 }}>
              {!btResult ? (
                <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', padding: 40, textAlign: 'center', color: '#9ca3af' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🧪</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>历史回测</div>
                  <div style={{ fontSize: 12, marginTop: 8, lineHeight: 1.6 }}>设置左侧参数后点击"▶ 运行回测"<br />将对比规则干预 vs 无干预的收益差异</div>
                </div>
              ) : (
                <div>
                  {/* Summary */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 11, color: '#6b7280', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#92400e', background: '#fef3c7', padding: '2px 8px', borderRadius: 4 }}>模拟估算</span>
                    回测窗口 <strong style={{ color: '#374151' }}>{btResult.days}</strong> 天 · 参与规则 <strong style={{ color: '#374151' }}>{effectiveBtRules.size}</strong> 条 · 净费比影响 <strong style={{ color: btResult.improvePP >= 0 ? '#2e7d32' : '#c62828' }}>{btResult.improvePP >= 0 ? '−' : '+'}{Math.abs(btResult.improvePP).toFixed(1)}pp/天</strong>
                  </div>
                  {/* KPI cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 14 }}>
                    {([
                      ['预计ROI改善', btResult.avgRoiImprove > 0 ? `+${btResult.avgRoiImprove.toFixed(2)}` : btResult.avgRoiImprove.toFixed(2), btResult.avgRoiImprove >= 0 ? '#2e7d32' : '#c62828'],
                      ['预计费比改善', btResult.avgFebiImprove > 0 ? `-${(btResult.avgFebiImprove * 100).toFixed(1)}pp` : `+${(Math.abs(btResult.avgFebiImprove) * 100).toFixed(1)}pp`, btResult.avgFebiImprove >= 0 ? '#2e7d32' : '#c62828'],
                      ['触发总次数', btResult.totalTriggers, '#3730a3'],
                      ['自动执行次数', btResult.autoCount, '#2e7d32'],
                      ['预算优化额(窗口)', `¥${Math.round(btResult.budgetSaved).toLocaleString()}`, btResult.budgetSaved >= 0 ? '#1565c0' : '#c62828'],
                    ] as [string, string | number, string][]).map(([l, v, c], i) => (
                      <div key={i} style={{ background: '#fff', borderRadius: 10, padding: 10, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: c }}>{v}</div>
                        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{l}</div>
                      </div>
                    ))}
                  </div>

                  {/* Trend chart */}
                  <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', padding: 14, marginBottom: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      📈 费比趋势对比（有规则 vs 无规则）
                      <span style={{ fontSize: 9, fontWeight: 600, color: '#92400e', background: '#fef3c7', padding: '1px 6px', borderRadius: 4 }}>模拟估算</span>
                      <span style={{ marginLeft: 'auto', fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>
                        绿线 = 利润目标费比 {((btGross - btWeekly)).toFixed(0)}%
                      </span>
                    </div>
                    <div style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={btResult.trendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={4} />
                          <YAxis tick={{ fontSize: 9 }} tickFormatter={v => (v * 100).toFixed(1) + '%'} />
                          <Tooltip formatter={(v) => typeof v === 'number' ? (v * 100).toFixed(2) + '%' : v} />
                          <Line type="monotone" dataKey="noRule" stroke="#c62828" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="无规则" />
                          <Line type="monotone" dataKey="withRule" stroke="#283593" strokeWidth={2} dot={false} name="有规则" />
                          <Line type="monotone" dataKey="target" stroke="#2e7d32" strokeWidth={1} strokeDasharray="2 2" dot={false} name="利润目标" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Detail table */}
                  <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', overflow: 'hidden' }}>
                    <div style={{ padding: '10px 14px', fontWeight: 700, fontSize: 12, borderBottom: '1px solid #f0f0f0' }}>📋 详细回测结果</div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#f9fafb' }}>
                            {['日期', '计划', '触发规则', '执行动作', '预估ROI变化', '预估费比变化', '执行方式'].map(h => (
                              <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 700, color: '#6b7280', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {btResult.detailRows.map((r, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              <td style={{ padding: '5px 8px', color: '#9ca3af' }}>{r.date}</td>
                              <td style={{ padding: '5px 8px', fontWeight: 600 }}>{r.plan}</td>
                              <td style={{ padding: '5px 8px' }}>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: r.rDef.color + '22', color: r.rDef.color, border: `1px solid ${r.rDef.color}44` }}>{r.rule}</span>
                              </td>
                              <td style={{ padding: '5px 8px', fontSize: 10, color: '#4b5563', maxWidth: 180 }}>{r.action}</td>
                              <td style={{ padding: '5px 8px' }}>
                                <span style={{ fontWeight: 700, color: r.estRoiDelta >= 0 ? '#2e7d32' : '#c62828' }}>
                                  {r.estRoiDelta >= 0 ? '↑' : '↓'}{Math.abs(r.estRoiDelta)}
                                </span>
                              </td>
                              <td style={{ padding: '5px 8px' }}>
                                <span style={{ fontWeight: 700, color: r.estFebiDelta <= 0 ? '#2e7d32' : '#c62828' }}>
                                  {r.estFebiDelta <= 0 ? '↓' : '↑'}{Math.abs(r.estFebiDelta)}%
                                </span>
                              </td>
                              <td style={{ padding: '5px 8px' }}>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: r.auto ? '#e8f5e9' : '#fff8e1', color: r.auto ? '#2e7d32' : '#f57f17' }}>
                                  {r.auto ? '🤖 自动' : '👤 人工确认'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
