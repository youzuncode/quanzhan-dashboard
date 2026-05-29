import type { Plan, Zone } from '../types/database'

export function calcZone(costRate: number, grossMarginRate: number): Zone {
  const breakeven = grossMarginRate
  const profitTarget = grossMarginRate - 0.10
  if (costRate <= profitTarget) return 'green'
  if (costRate <= breakeven) return 'yellow'
  return 'red'
}

export function calcRoiFromCostRate(costRate: number): number {
  if (costRate <= 0) return 999
  return +(1 / costRate).toFixed(2)
}

export function calcCostRateFromRoi(roi: number): number {
  if (roi <= 0) return 999
  return +(1 / roi * 100).toFixed(2)
}

export function calcBreakevenRoi(grossMarginRate: number): number {
  return calcRoiFromCostRate(grossMarginRate)
}

export function calcTargetRoi(grossMarginRate: number): number {
  return calcRoiFromCostRate(grossMarginRate - 0.10)
}

export function getStoreMarginMode(actual: number, target: number): string {
  const delta = actual - target
  if (delta > 0.05) return '宽松'
  if (delta > 0.02) return '达标'
  if (delta >= 0) return '紧张'
  if (delta >= -0.03) return '收紧'
  return '强收紧'
}

export function calcNewRoi(currentRoi: number, adjustPct: number): number {
  return +(currentRoi * (1 + adjustPct / 100)).toFixed(2)
}

export function calcRemainingBudget(
  dailyBudget: number,
  spentToday: number,
  factor: number
): number {
  return +(spentToday + (dailyBudget - spentToday) * factor).toFixed(0)
}

export function evalR1A(plan: Plan, hourlySpend: number, baselineMean: number, baselineStd: number, newOrders: number, newCarts: number): boolean {
  const threshold = baselineMean + 2 * baselineStd
  return (
    hourlySpend > threshold &&
    newOrders === 0 &&
    newCarts === 0 &&
    plan.roi_completion_rate < 0.8
  )
}

export function evalR1B(_plan: Plan, hourlyPlanCostRate: number, storeCostRate: number, projectedRevenue: number, yesterdaySpend: number, confidence: string): boolean {
  const base = hourlyPlanCostRate > storeCostRate && projectedRevenue < yesterdaySpend
  if (confidence === 'H') return base
  if (confidence === 'M') return base && projectedRevenue < yesterdaySpend * 0.85
  return false
}

export function evalR2A(plan: Plan): boolean {
  return (
    plan.roi_completion_rate < 0.6 &&
    plan.spend_today > 100 &&
    plan.bid_mode !== 'maximize'
  )
}

export function evalR2B(plan: Plan, grossMarginRate: number): boolean {
  return plan.cost_rate_today > grossMarginRate && plan.spend_today > 100
}

export function evalR3(plan: Plan, _remainingHours: number, hourlyMeanSpend: number): boolean {
  const remainingBudget = plan.daily_budget - plan.spend_today
  return (
    plan.zone === 'green' &&
    plan.roi_completion_rate >= 1.3 &&
    remainingBudget < hourlyMeanSpend * 3 &&
    plan.confidence === 'H'
  )
}

export function getInspectionTimepoints() {
  return [
    { time: '09:00', name: '天规则', confidence: '-', desc: '四步法 + 三区间初始化' },
    { time: '12:00', name: '早间巡检', confidence: 'L', desc: '全部仅预警' },
    { time: '14:00', name: '午间巡检', confidence: 'M', desc: '收严阈值三区间止损' },
    { time: '16:00', name: '晚前巡检', confidence: 'M+', desc: '绿区预算保障' },
    { time: '18:00', name: '⭐ 晚高峰', confidence: 'H', desc: '最重要巡检' },
    { time: '20:00', name: '夜间巡检', confidence: 'H', desc: 'R3最后追加' },
    { time: '22:00', name: '次日规划', confidence: 'H', desc: 'DT1-DT5 明日操作清单' },
  ]
}

export function formatPercent(val: number, decimals = 1): string {
  return (val * 100).toFixed(decimals) + '%'
}

export function formatCurrency(val: number): string {
  return '¥' + val.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function getZoneLabel(zone: Zone): string {
  if (zone === 'green') return '🟢 绿区'
  if (zone === 'yellow') return '🟡 黄区'
  return '🔴 红区'
}

export function getConfidenceLabel(conf: string): string {
  if (conf === 'H') return '高'
  if (conf === 'M') return '中'
  return '低'
}
