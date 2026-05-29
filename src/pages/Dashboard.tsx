import { useState } from 'react'
import { TopBar } from '../components/layout/TopBar'
import { KPICards } from '../components/dashboard/KPICards'
import { StoreBar } from '../components/StoreBar'
import { ParamPanel } from '../components/ParamPanel'
import { ProblemsOpps } from '../components/ProblemsOpps'
import { ChartPanel } from '../components/ChartPanel'
import { InspectionPanel } from '../components/inspection/InspectionPanel'
import { PlanTable } from '../components/dashboard/PlanTable'
import { AlertSidePanel } from '../components/AlertSidePanel'
import { RuleEnginePage } from './RuleEnginePage'
import { InspectPage } from './InspectPage'
import { PlanDetail } from './PlanDetail'
import { initialActionLog, generateActionLog, STORES } from '../lib/mockData'

export function Dashboard() {
  const [selectedStoreId, setSelectedStoreId] = useState('store1')
  const [showRuleEngine, setShowRuleEngine] = useState(false)
  const [showInspect, setShowInspect] = useState(false)
  const [showAlerts, setShowAlerts] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const currentStore = STORES.find(s => s.id === selectedStoreId) || STORES[0]
  const actionLog = selectedStoreId === 'store1' ? initialActionLog : generateActionLog(currentStore.plans)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f0f4f8' }}>
      <TopBar
        onOpenRuleEngine={() => setShowRuleEngine(true)}
        onOpenInspection={() => setShowInspect(true)}
        onOpenAlerts={() => setShowAlerts(true)}
        selectedStoreId={selectedStoreId}
        onSelectStore={setSelectedStoreId}
      />
      <div className="p-3 flex-1">
        <KPICards storeConfig={currentStore.storeConfig} storePlans={currentStore.plans} />
        <StoreBar storeConfig={currentStore.storeConfig} storePlans={currentStore.plans} />
        <ParamPanel />
        <ProblemsOpps />
        <ChartPanel />
        <div className="flex gap-2.5 mb-2.5">
          <InspectionPanel />
        </div>
        <PlanTable
          plans={currentStore.plans}
          onSelectPlan={name => setSelectedPlan(name)}
        />

        {/* Action log */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-3 py-2 font-bold text-xs border-b border-gray-100 flex items-center justify-between">
            <span>📝 操作日志</span>
            <span className="text-gray-400 font-normal">{actionLog.length}条记录</span>
          </div>
          <div className="overflow-x-auto max-h-44 overflow-y-auto">
            <table className="w-full text-xs border-collapse">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="border-b border-gray-200">
                  {['时间', '时点', '计划', '规则', '操作内容', '类型', '操作方', '备注'].map(h => (
                    <th key={h} className="px-2 py-1.5 text-left font-bold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...actionLog].reverse().map((l, i) => {
                  const isDismissed = l.type === 'dismissed'
                  const isConfirmed = l.type === 'confirmed'
                  const typeLbl: Record<string, string> = { executed: '🤖 自动执行', confirmed: '✅ 人工确认', dismissed: '✗ 已忽略', info: '📋 记录', api_error: '❌ API失败' }
                  const typeCls: Record<string, string> = { executed: 'bg-gray-100 text-gray-600', confirmed: 'bg-green-100 text-green-800', dismissed: 'bg-gray-100 text-gray-400', info: 'bg-blue-50 text-blue-700', api_error: 'bg-red-100 text-red-800' }
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f0f0f0', textDecoration: isDismissed ? 'line-through' : 'none', fontWeight: isConfirmed ? 600 : 400 }}>
                      <td className="px-2 py-1.5 whitespace-nowrap font-semibold">{l.time}</td>
                      <td className="px-2 py-1.5 whitespace-nowrap">{l.timepoint}</td>
                      <td className="px-2 py-1.5 font-semibold whitespace-nowrap">{l.plan}</td>
                      <td className="px-2 py-1.5"><span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold" style={{ fontSize: 8 }}>{l.rule}</span></td>
                      <td className="px-2 py-1.5 text-indigo-800" style={{ fontSize: 10, maxWidth: 240 }}>
                        <span title={l.action} className="block truncate">{l.action}</span>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${typeCls[l.type] || 'bg-gray-100 text-gray-600'}`}>
                          {typeLbl[l.type] || l.type}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">{l.operator}</td>
                      <td className="px-2 py-1.5 text-gray-400 whitespace-nowrap">{l.note || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Overlays */}
      {showAlerts && <AlertSidePanel plans={currentStore.plans} onClose={() => setShowAlerts(false)} />}
      {showRuleEngine && <RuleEnginePage plans={currentStore.plans} onClose={() => setShowRuleEngine(false)} />}
      {showInspect && <InspectPage plans={currentStore.plans} onClose={() => setShowInspect(false)} />}
      {selectedPlan && <PlanDetail planName={selectedPlan} storePlans={currentStore.plans} onClose={() => setSelectedPlan(null)} />}
    </div>
  )
}
