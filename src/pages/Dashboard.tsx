import { useState } from 'react'
import { TopBar } from '../components/layout/TopBar'
import { StoreBar } from '../components/StoreBar'
import { ParamPanel } from '../components/ParamPanel'
import { ProblemsOpps } from '../components/ProblemsOpps'
import { ChartPanel } from '../components/ChartPanel'
import { InspectionPanel } from '../components/inspection/InspectionPanel'
import { PlanTable } from '../components/dashboard/PlanTable'
import { AlertSidePanel } from '../components/AlertSidePanel'
import { RuleEnginePage } from './RuleEnginePage'
import { PlanDetail } from './PlanDetail'
import { initialActionLog } from '../lib/mockData'
import type { ActionLogEntry } from '../lib/mockData'

export function Dashboard() {
  const [showRuleEngine, setShowRuleEngine] = useState(false)
  const [showAlerts, setShowAlerts] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [actionLog] = useState<ActionLogEntry[]>(initialActionLog)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f0f4f8' }}>
      <TopBar
        onOpenRuleEngine={() => setShowRuleEngine(true)}
        onOpenAlerts={() => setShowAlerts(true)}
      />
      <div className="p-3 flex-1">
        <StoreBar />
        <ParamPanel />
        <ProblemsOpps />
        <ChartPanel />
        <div className="flex gap-2.5 mb-2.5">
          <InspectionPanel />
        </div>
        <PlanTable onSelectPlan={name => setSelectedPlan(name)} />

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
                {actionLog.map((l, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-2 py-1.5 text-gray-400 whitespace-nowrap">{l.time}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{l.timepoint}</td>
                    <td className="px-2 py-1.5 font-semibold">{l.plan}</td>
                    <td className="px-2 py-1.5"><span className="text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">{l.rule}</span></td>
                    <td className="px-2 py-1.5 text-gray-600 max-w-52 truncate">{l.action}</td>
                    <td className="px-2 py-1.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-semibold
                        ${l.type === 'executed' ? 'bg-green-100 text-green-800' :
                          l.type === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          l.type === 'dismissed' ? 'bg-gray-100 text-gray-500' : 'bg-gray-100 text-gray-700'}`}>
                        {l.type === 'executed' ? '自动执行' : l.type === 'confirmed' ? '已确认' : l.type === 'dismissed' ? '已忽略' : l.type}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-gray-400">{l.operator}</td>
                    <td className="px-2 py-1.5 text-gray-400">{l.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Overlays */}
      {showAlerts && <AlertSidePanel onClose={() => setShowAlerts(false)} />}
      {showRuleEngine && <RuleEnginePage onClose={() => setShowRuleEngine(false)} />}
      {selectedPlan && <PlanDetail planName={selectedPlan} onClose={() => setSelectedPlan(null)} />}
    </div>
  )
}
