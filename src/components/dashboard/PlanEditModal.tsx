import { useState } from 'react'
import type { PlanData } from '../../lib/mockData'

interface Props {
  plan: PlanData
  onSave: (updated: Partial<PlanData>) => void
  onClose: () => void
}

export function PlanEditModal({ plan, onSave, onClose }: Props) {
  const [roi, setRoi] = useState(String(plan.roiTarget))
  const [budget, setBudget] = useState(String(plan.budget))
  const [gross, setGross] = useState(String((plan.gross * 100).toFixed(0)))
  const [guard, setGuard] = useState(plan.guard)

  function handleSave() {
    const roiVal = parseFloat(roi)
    const budgetVal = parseInt(budget)
    const grossVal = parseFloat(gross) / 100
    if (isNaN(roiVal) || roiVal <= 0) return alert('ROI目标必须大于0')
    if (isNaN(budgetVal) || budgetVal < 0) return alert('预算不能为负')
    if (isNaN(grossVal) || grossVal <= 0 || grossVal >= 1) return alert('毛利率需在1%~99%之间')
    onSave({ roiTarget: roiVal, budget: budgetVal, gross: grossVal, guard })
    onClose()
  }

  const grossNum = parseFloat(gross) / 100
  const roiNum = parseFloat(roi)
  const budgetNum = parseFloat(budget)
  const validAll = !isNaN(grossNum) && grossNum > 0 && grossNum < 1 && !isNaN(roiNum) && roiNum > 0 && !isNaN(budgetNum) && budgetNum >= 0

  const stopLoss = grossNum > 0 ? (1 / grossNum).toFixed(2) : '—'
  const targetFebi = grossNum > 0 ? ((grossNum - 0.1) * 100).toFixed(0) + '%' : '—'

  // ─── 效果预演 ──────────────────────────────────────
  // 当前状态:按当前费比 + 当前预算估算今日 P&L
  const baselinePnl = plan.budget > 0
    ? plan.budget * (plan.gross / plan.febi - 1)  // 预算用满,当前费比,毛利率
    : plan.spend * (plan.gross / plan.febi - 1)
  // 已花费部分锁定亏损/盈利,剩余按新参数估算
  const lockedPnl = plan.spend * (plan.gross / plan.febi - 1)
  // 修改后:剩余预算按"新ROI对应的目标费比"投放,毛利率取新值
  let projectedNewPnl = 0
  let estNewFebi = 0
  if (validAll) {
    estNewFebi = 1 / roiNum  // 简化:实际费比≈目标费比 1/ROI
    const remaining = Math.max(0, budgetNum - plan.spend)
    const restPnl = remaining * (grossNum / estNewFebi - 1)  // = remaining * (gross * ROI − 1)
    projectedNewPnl = lockedPnl + restPnl
  }
  const pnlDelta = projectedNewPnl - baselinePnl
  const fmtMoney = (n: number) => `${n >= 0 ? '+' : '−'}¥${Math.round(Math.abs(n)).toLocaleString()}`
  const colorPos = '#2e7d32', colorNeg = '#c62828'

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-96 pointer-events-auto overflow-hidden">
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg,#1557b0,#1a73e8)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>✏️ 编辑计划参数</div>
              <div style={{ color: 'rgba(255,255,255,.75)', fontSize: 11, marginTop: 2 }}>{plan.name}</div>
            </div>
            <button onClick={onClose} style={{ color: 'rgba(255,255,255,.8)', background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
          </div>

          <div style={{ padding: 20 }}>
            {/* ROI Target */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>
                净目标投产比（ROI）
              </label>
              <input
                type="number" step="0.1" min="0.1"
                value={roi}
                onChange={e => setRoi(e.target.value)}
                style={{ width: '100%', border: '1.5px solid #d1d5db', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => (e.target.style.borderColor = '#1a73e8')}
                onBlur={e => (e.target.style.borderColor = '#d1d5db')}
              />
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>
                止损ROI = {stopLoss}（1 ÷ 毛利率）
              </div>
            </div>

            {/* Daily Budget */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>
                每日预算（元）
              </label>
              <input
                type="number" step="100" min="0"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                style={{ width: '100%', border: '1.5px solid #d1d5db', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => (e.target.style.borderColor = '#1a73e8')}
                onBlur={e => (e.target.style.borderColor = '#d1d5db')}
              />
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>当前花费 ¥{plan.spend.toLocaleString()}</div>
            </div>

            {/* Gross Margin */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>
                毛利率（%）
              </label>
              <input
                type="number" step="1" min="1" max="99"
                value={gross}
                onChange={e => setGross(e.target.value)}
                style={{ width: '100%', border: '1.5px solid #d1d5db', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => (e.target.style.borderColor = '#1a73e8')}
                onBlur={e => (e.target.style.borderColor = '#d1d5db')}
              />
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>
                目标费比 ≤ {targetFebi}（毛利率 − 10%）
              </div>
            </div>

            {/* Guard */}
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>优质计划防停投</label>
              <button
                onClick={() => setGuard(!guard)}
                style={{
                  padding: '4px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
                  background: guard ? '#e8f5e9' : '#f3f4f6',
                  color: guard ? '#2e7d32' : '#9ca3af',
                }}>
                {guard ? '✅ 已开启' : '⭕ 已关闭'}
              </button>
            </div>

            {/* 效果预演 */}
            {validAll && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>📊 效果预演（假设预算用满）</span>
                  <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 500 }}>简化模型</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
                  <div style={{ background: '#fff', borderRadius: 6, padding: '6px 8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ color: '#94a3b8', fontSize: 9, marginBottom: 2 }}>当前预计今日盈亏</div>
                    <div style={{ fontWeight: 800, fontSize: 13, color: baselinePnl >= 0 ? colorPos : colorNeg }}>
                      {fmtMoney(baselinePnl)}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: 9, marginTop: 1 }}>
                      费比 {(plan.febi * 100).toFixed(1)}% · 预算¥{plan.budget.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ background: '#fff', borderRadius: 6, padding: '6px 8px', border: '1px solid #d2e3fc' }}>
                    <div style={{ color: '#1a73e8', fontSize: 9, marginBottom: 2, fontWeight: 600 }}>修改后预计今日盈亏</div>
                    <div style={{ fontWeight: 800, fontSize: 13, color: projectedNewPnl >= 0 ? colorPos : colorNeg }}>
                      {fmtMoney(projectedNewPnl)}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: 9, marginTop: 1 }}>
                      目标费比 {(estNewFebi * 100).toFixed(1)}% · 预算¥{budgetNum.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, background: pnlDelta >= 0 ? '#dcfce7' : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: pnlDelta >= 0 ? colorPos : colorNeg }}>
                    {pnlDelta >= 0 ? '✓ 预计改善' : '⚠ 预计恶化'}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: pnlDelta >= 0 ? colorPos : colorNeg }}>
                    {fmtMoney(pnlDelta)}
                  </span>
                </div>

                {plan.spend > 0 && (
                  <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 6, lineHeight: 1.5 }}>
                    已花费 ¥{plan.spend.toLocaleString()} 按当前费比锁定 {fmtMoney(lockedPnl)};剩余预算按新ROI对应费比 1/ROI 估算。
                  </div>
                )}
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{ flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, border: '1.5px solid #e5e7eb', background: '#fff', color: '#6b7280', cursor: 'pointer' }}>
                取消
              </button>
              <button onClick={handleSave} style={{ flex: 2, padding: '9px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, border: 'none', background: 'linear-gradient(135deg,#1557b0,#1a73e8)', color: '#fff', cursor: 'pointer' }}>
                保存修改
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
