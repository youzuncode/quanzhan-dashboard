import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { RefreshCw, Settings, Clock, Bell } from 'lucide-react'
import { sidePanelAlerts } from '../../lib/mockData'

interface Props {
  onOpenRuleEngine: () => void
  onOpenInspection?: () => void
  onOpenAlerts: () => void
}

export function TopBar({ onOpenRuleEngine, onOpenAlerts }: Props) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const pendingAlerts = sidePanelAlerts.filter(a => a.status === 'pending').length

  return (
    <div className="flex items-center justify-between px-5 py-3 text-white flex-shrink-0"
      style={{ background: 'linear-gradient(135deg,#0d3c61,#1a5f8a)' }}>
      <div>
        <h1 className="text-base font-bold tracking-wide">🚀 全站推广决策看板 <span className="text-xs opacity-70">v3.5</span></h1>
        <div className="text-xs opacity-70 mt-0.5">可操作参数：净目标投产比 + 每日预算 + 出价方式</div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: 'rgba(255,255,255,.15)' }}>
          {format(now, 'MM月dd日 HH:mm', { locale: zhCN })}
        </div>
        <button onClick={onOpenRuleEngine}
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-white/30"
          style={{ background: 'rgba(255,255,255,.15)' }}>
          <Settings size={11} /> 规则引擎
        </button>
        <button
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-white/30"
          style={{ background: 'rgba(255,255,255,.15)' }}>
          <Clock size={11} /> 巡检
        </button>
        <button onClick={onOpenAlerts}
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-white/30 relative"
          style={{ background: pendingAlerts > 0 ? 'rgba(198,40,40,.8)' : 'rgba(255,255,255,.15)' }}>
          <Bell size={11} /> 消息中心
          {pendingAlerts > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-400 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {pendingAlerts}
            </span>
          )}
        </button>
        <button className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-white/30"
          style={{ background: 'rgba(255,255,255,.15)' }}>
          <RefreshCw size={11} /> 刷新
        </button>
        <button className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-white/30"
          style={{ background: 'rgba(255,255,255,.15)' }}>
          ↓ 导出日志
        </button>
      </div>
    </div>
  )
}
