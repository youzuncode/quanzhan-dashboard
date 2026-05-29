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

  const stopLoss = gross ? (1 / (parseFloat(gross) / 100)).toFixed(2) : '—'
  const targetFebi = gross ? (parseFloat(gross) - 10).toFixed(0) + '%' : '—'

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-96 pointer-events-auto overflow-hidden">
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg,#283593,#1565c0)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                onFocus={e => (e.target.style.borderColor = '#3b82f6')}
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
                onFocus={e => (e.target.style.borderColor = '#3b82f6')}
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
                onFocus={e => (e.target.style.borderColor = '#3b82f6')}
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

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{ flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, border: '1.5px solid #e5e7eb', background: '#fff', color: '#6b7280', cursor: 'pointer' }}>
                取消
              </button>
              <button onClick={handleSave} style={{ flex: 2, padding: '9px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, border: 'none', background: 'linear-gradient(135deg,#283593,#1565c0)', color: '#fff', cursor: 'pointer' }}>
                保存修改
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
