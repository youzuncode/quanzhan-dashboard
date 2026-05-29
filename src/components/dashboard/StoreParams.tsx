import type { StoreConfig } from '../../types/database'

interface Props {
  store: StoreConfig
}

export function StoreParams({ store }: Props) {
  const breakeven = (store.gross_margin_rate * 100).toFixed(1)
  const target = ((store.gross_margin_rate - 0.10) * 100).toFixed(1)
  const breakevenRoi = (1 / store.gross_margin_rate).toFixed(2)
  const targetRoi = (1 / (store.gross_margin_rate - 0.10)).toFixed(2)
  const marginDelta = store.weekly_actual_margin - store.weekly_margin_target

  const modeInfo = (() => {
    if (marginDelta > 0.05) return { label: '宽松模式', color: 'ok', desc: '黄区预算维持或小幅追加×1.0~1.1' }
    if (marginDelta > 0.02) return { label: '达标模式', color: 'ok', desc: '黄区预算维持，费比恶化才轻压×0.9' }
    if (marginDelta >= 0) return { label: '紧张模式', color: 'warn', desc: '黄区预算×0.85 + ROI上调5%；禁R3追加' }
    if (marginDelta >= -0.03) return { label: '收紧模式', color: 'warn', desc: '黄区预算×0.75 + ROI上调10%；18:00黄区禁入' }
    return { label: '强收紧', color: 'act', desc: '黄区预算×0.6 + ROI上调15%；或暂停计划' }
  })()

  const cardClass: Record<string, string> = {
    ok: 'border border-green-300 bg-green-50',
    warn: 'border border-yellow-400 bg-yellow-50',
    act: 'border border-indigo-400 bg-indigo-50',
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-3 mb-2.5">
      <div className="text-xs font-bold text-indigo-800 mb-2">⚙️ 全店参数 · 三线管控</div>
      <div className="grid grid-cols-4 gap-2">
        <div className="border border-gray-200 rounded-lg p-2">
          <div className="text-xs text-gray-400 mb-1">T-2 Gross毛利率</div>
          <div className="text-xs flex items-center gap-1 mb-1">
            <span className="bg-purple-100 text-purple-700 font-bold text-xs px-1.5 py-0.5 rounded">
              {(store.gross_margin_rate * 100).toFixed(1)}%
            </span>
          </div>
          <div className="text-xs text-gray-400">净毛利{(store.t2_net_margin_rate*100).toFixed(0)}% + 费比{(store.t2_cost_rate*100).toFixed(0)}%</div>
        </div>
        <div className="border border-gray-200 rounded-lg p-2">
          <div className="text-xs text-gray-400 mb-1">三线管控</div>
          <div className="text-xs space-y-0.5">
            <div className="flex justify-between">
              <span className="text-red-600 font-bold">🔴 止损</span>
              <span>费比 &gt;{breakeven}% / ROI &lt;{breakevenRoi}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-600 font-bold">🟡 黄区</span>
              <span>费比 {target}%~{breakeven}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700 font-bold">🟢 目标</span>
              <span>费比 ≤{target}% / ROI ≥{targetRoi}</span>
            </div>
          </div>
        </div>
        <div className={`rounded-lg p-2 ${cardClass[modeInfo.color]}`}>
          <div className="text-xs text-gray-400 mb-1">全店毛利余量模式</div>
          <div className="text-xs font-bold mb-1">{modeInfo.label}</div>
          <div className="text-xs text-gray-500">本周 {(store.weekly_actual_margin*100).toFixed(1)}% / 目标 {(store.weekly_margin_target*100).toFixed(1)}%</div>
          <div className="text-xs text-gray-500 mt-0.5">{modeInfo.desc}</div>
        </div>
        <div className="border border-gray-200 rounded-lg p-2">
          <div className="text-xs text-gray-400 mb-1">ROI ↔ 费比换算</div>
          <div className="text-xs space-y-0.5 font-mono">
            {[4,5,6,7,8,10].map(roi => (
              <div key={roi} className={`flex justify-between px-1 py-0.5 rounded
                ${roi === 7 ? 'bg-indigo-100 font-bold text-indigo-800' : 'text-gray-600'}`}>
                <span>ROI {roi}</span>
                <span>{(100/roi).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
