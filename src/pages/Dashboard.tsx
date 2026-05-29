import { useState } from 'react'
import { loadJSON, saveJSON } from '../lib/persist'

type MainView = 'home' | 'plans'
const LS_VIEW = 'dashboard.mainView'
import { TopBar } from '../components/layout/TopBar'
import { KPICards } from '../components/dashboard/KPICards'
import { StoreBar } from '../components/StoreBar'
import { ParamPanel } from '../components/ParamPanel'
import { ProblemsOpps } from '../components/ProblemsOpps'
import { ChartPanel } from '../components/ChartPanel'
import { InspectionPanel } from '../components/inspection/InspectionPanel'
import { PlanTable } from '../components/dashboard/PlanTable'
import { TodoQueue } from '../components/dashboard/TodoQueue'
import { AlertSidePanel } from '../components/AlertSidePanel'
import { RuleEnginePage } from './RuleEnginePage'
import { InspectPage } from './InspectPage'
import { PlanDetail } from './PlanDetail'
import { ActionLogPage } from './ActionLogPage'
import {
  initialActionLog, generateActionLog, STORES,
  paramOps, probsData, oppsData, algoData, planErr, timepoints,
  generateParamOps, generateProblems, generateOpps, generateAlgo, generatePlanErr, generateTimepoints,
} from '../lib/mockData'

export function Dashboard() {
  const [selectedStoreId, setSelectedStoreId] = useState('store1')
  const [view, setViewRaw] = useState<MainView>(() => loadJSON<MainView>(LS_VIEW, 'home'))
  const setView = (v: MainView) => { setViewRaw(v); saveJSON(LS_VIEW, v) }
  const [showRuleEngine, setShowRuleEngine] = useState(false)
  const [showInspect, setShowInspect] = useState(false)
  const [showAlerts, setShowAlerts] = useState(false)
  const [showActionLog, setShowActionLog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const currentStore = STORES.find(s => s.id === selectedStoreId) || STORES[0]
  const isMain = selectedStoreId === 'store1'
  const cfg = currentStore.storeConfig
  const sp = currentStore.plans

  // Store1 uses the hand-authored mock; other stores derive from their plans
  const actionLog = isMain ? initialActionLog : generateActionLog(sp)
  const ops = isMain ? paramOps : generateParamOps(sp)
  const probs = isMain ? probsData : generateProblems(sp, cfg)
  const opps = isMain ? oppsData : generateOpps(sp)
  const algos = isMain ? algoData : generateAlgo(sp, cfg)
  const planErrData = isMain ? planErr : generatePlanErr(sp)
  const tps = isMain ? timepoints : generateTimepoints(sp)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f0f4f8' }}>
      <TopBar
        onOpenRuleEngine={() => setShowRuleEngine(true)}
        onOpenInspection={() => setShowInspect(true)}
        onOpenAlerts={() => setShowAlerts(true)}
        onOpenActionLog={() => setShowActionLog(true)}
        actionLogCount={actionLog.length}
        selectedStoreId={selectedStoreId}
        onSelectStore={setSelectedStoreId}
      />
      {/* Main view tab strip */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 12px', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {([
          { k: 'home' as MainView, label: '📊 决策看板', sub: 'KPI · 待办 · 巡检 · 图表' },
          { k: 'plans' as MainView, label: '📋 推广计划', sub: `${sp.length} 个计划 · 含搜索筛选` },
        ]).map(t => {
          const active = view === t.k
          return (
            <button key={t.k} onClick={() => setView(t.k)}
              style={{
                padding: '10px 18px 9px',
                color: active ? '#3730a3' : '#6b7280',
                background: 'none',
                border: 'none',
                borderBottom: `2.5px solid ${active ? '#3730a3' : 'transparent'}`,
                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1,
              }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{t.label}</span>
              <span style={{ fontSize: 9.5, color: active ? '#6366f1' : '#9ca3af', fontWeight: 500 }}>{t.sub}</span>
            </button>
          )
        })}
      </div>

      {view === 'home' && (
      <div className="p-3 flex-1">
        <KPICards storeConfig={cfg} storePlans={sp} />
        <TodoQueue plans={sp} storeConfig={cfg} onSelectPlan={name => setSelectedPlan(name)} />
        <StoreBar storeConfig={cfg} storePlans={sp} />
        <ParamPanel ops={ops} />
        <ProblemsOpps probs={probs} opps={opps} algos={algos} />
        <ChartPanel plans={sp} planErrData={planErrData} />
        <div className="flex gap-2.5 mb-2.5">
          <InspectionPanel timepoints={tps} />
        </div>
      </div>
      )}

      {view === 'plans' && (
      <div className="p-3 flex-1">
        <PlanTable
          plans={currentStore.plans}
          onSelectPlan={name => setSelectedPlan(name)}
        />
      </div>
      )}

      {/* Overlays */}
      {showAlerts && <AlertSidePanel plans={sp} onClose={() => setShowAlerts(false)} />}
      {showRuleEngine && <RuleEnginePage plans={sp} onClose={() => setShowRuleEngine(false)} />}
      {showInspect && <InspectPage plans={sp} onClose={() => setShowInspect(false)} />}
      {showActionLog && <ActionLogPage entries={actionLog} onClose={() => setShowActionLog(false)} />}
      {selectedPlan && <PlanDetail planName={selectedPlan} storePlans={sp} onClose={() => setSelectedPlan(null)} />}
    </div>
  )
}
