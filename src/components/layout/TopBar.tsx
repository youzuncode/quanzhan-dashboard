import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { RefreshCw, Settings } from 'lucide-react'

interface Props {
  storeName: string
  weeklyMarginActual: number
  weeklyMarginTarget: number
}

export function TopBar({ storeName, weeklyMarginActual, weeklyMarginTarget }: Props) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const marginMode = (() => {
    const delta = weeklyMarginActual - weeklyMarginTarget
    if (delta > 0.05) return { label: '宽松', color: 'bg-green-500' }
    if (delta > 0.02) return { label: '达标', color: 'bg-green-400' }
    if (delta >= 0) return { label: '紧张', color: 'bg-yellow-500' }
    if (delta >= -0.03) return { label: '收紧', color: 'bg-orange-500' }
    return { label: '强收紧', color: 'bg-red-600' }
  })()

  return (
    <div className="flex items-center justify-between px-5 py-3 text-white"
      style={{ background: 'linear-gradient(135deg,#0d3c61,#1a5f8a)' }}>
      <div>
        <h1 className="text-base font-bold tracking-wide">📊 全站推广决策看板 <span className="text-xs opacity-70">v3.5</span></h1>
        <div className="text-xs opacity-70 mt-0.5">{storeName} · 可操作参数：净目标投产比 + 每日预算 + 出价方式</div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="opacity-70">周毛利余量</span>
          <span className={`px-2 py-0.5 rounded-full font-bold text-white text-xs ${marginMode.color}`}>
            {marginMode.label} · {(weeklyMarginActual * 100).toFixed(1)}%
          </span>
        </div>
        <div className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: 'rgba(255,255,255,.15)' }}>
          {format(now, 'MM月dd日 HH:mm', { locale: zhCN })}
        </div>
        <button className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-white/30"
          style={{ background: 'rgba(255,255,255,.15)' }}>
          <RefreshCw size={11} /> 刷新
        </button>
        <button className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-white/30"
          style={{ background: 'rgba(255,255,255,.15)' }}>
          <Settings size={11} /> 设置
        </button>
      </div>
    </div>
  )
}
