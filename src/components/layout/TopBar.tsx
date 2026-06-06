import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { RefreshCw, Settings, Clock, Bell, ChevronDown, FileText, Shuffle } from 'lucide-react'
import { sidePanelAlerts, STORES } from '../../lib/mockData'

interface Props {
  onOpenRuleEngine: () => void
  onOpenInspection?: () => void
  onOpenAlerts: () => void
  onOpenActionLog: () => void
  onOpenCoop: () => void
  actionLogCount: number
  selectedStoreId: string
  onSelectStore: (id: string) => void
}

export function TopBar({ onOpenRuleEngine, onOpenInspection, onOpenAlerts, onOpenActionLog, onOpenCoop, actionLogCount, selectedStoreId, onSelectStore }: Props) {
  const [now, setNow] = useState(new Date())
  const [showStorePicker, setShowStorePicker] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const pendingAlerts = sidePanelAlerts.filter(a => a.status === 'pending').length
  const currentStore = STORES.find(s => s.id === selectedStoreId) || STORES[0]

  return (
    <div className="flex items-center justify-between px-5 py-3 text-white flex-shrink-0 relative"
      style={{ background: '#11294d', borderBottom: '2px solid #1a73e8' }}>
      {/* Left: title */}
      <div>
        <h1 className="text-base font-bold tracking-wide">🚀 全站推广决策看板 <span className="text-xs opacity-70">v3.5</span></h1>
        <div className="text-xs opacity-70 mt-0.5">可操作参数：净目标投产比 + 每日预算 + 出价方式</div>
      </div>

      {/* Center: store selector */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <button
          onClick={() => setShowStorePicker(!showStorePicker)}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold border border-white/40 transition-colors"
          style={{ background: 'rgba(255,255,255,.18)' }}>
          <span style={{ background: currentStore.tagColor, color: '#fff', fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 10 }}>
            {currentStore.tag}
          </span>
          {currentStore.name}
          <ChevronDown size={13} className={`transition-transform ${showStorePicker ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown */}
        {showStorePicker && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowStorePicker(false)} />
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100"
              style={{ minWidth: 260 }}>
              {STORES.map(s => (
                <button
                  key={s.id}
                  onClick={() => { onSelectStore(s.id); setShowStorePicker(false) }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors"
                  style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ background: s.tagColor, color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 10, flexShrink: 0 }}>
                    {s.tag}
                  </span>
                  <div>
                    <div className="text-sm font-bold text-gray-800"
                      style={{ color: s.id === selectedStoreId ? s.tagColor : undefined }}>
                      {s.name}
                      {s.id === selectedStoreId && <span className="ml-2 text-xs font-normal text-blue-400">当前</span>}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {s.plans.length}个计划 · 费比{(s.storeConfig.febi * 100).toFixed(1)}% · 毛利{(s.storeConfig.grossMargin * 100).toFixed(0)}%
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <div className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: 'rgba(255,255,255,.15)' }}>
          {format(now, 'MM月dd日 HH:mm', { locale: zhCN })}
        </div>
        <button onClick={onOpenRuleEngine}
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-white/30"
          style={{ background: 'rgba(255,255,255,.15)' }}>
          <Settings size={11} /> 规则引擎
        </button>
        <button onClick={onOpenInspection}
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-white/30"
          style={{ background: 'rgba(255,255,255,.15)' }}>
          <Clock size={11} /> 巡检
        </button>
        <button onClick={onOpenCoop}
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-white/30"
          style={{ background: 'rgba(255,255,255,.15)' }}>
          <Shuffle size={11} /> 竞合协调
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
        <button onClick={onOpenActionLog}
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-white/30 relative"
          style={{ background: 'rgba(255,255,255,.15)' }}>
          <FileText size={11} /> 操作日志
          {actionLogCount > 0 && (
            <span style={{ marginLeft: 2, fontSize: 10, opacity: 0.85, fontWeight: 700 }}>
              {actionLogCount}
            </span>
          )}
        </button>
        <button className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-white/30"
          style={{ background: 'rgba(255,255,255,.15)' }}>
          <RefreshCw size={11} /> 刷新
        </button>
      </div>
    </div>
  )
}
