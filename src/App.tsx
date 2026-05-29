import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import { PlanDetail } from './pages/PlanDetail'
import type { Plan, Alert, ActionLog, StoreConfig } from './types/database'
import { mockPlans, mockAlerts, mockActionLog, mockStoreConfig } from './lib/mockData'
import './index.css'

export default function App() {
  const [plans, setPlans] = useState<Plan[]>(mockPlans)
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts)
  const [logs, setLogs] = useState<ActionLog[]>(mockActionLog)
  const [store] = useState<StoreConfig>(mockStoreConfig)

  function handleConfirm(id: string, note: string) {
    const alert = alerts.find(a => a.id === id)
    setAlerts(prev => prev.map(a =>
      a.id === id ? { ...a, status: 'confirmed', confirmed_at: new Date().toISOString(), confirmed_note: note || null } : a
    ))
    if (alert) {
      setLogs(prev => [{
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        plan_id: alert.plan_id,
        plan_name: alert.plan_name,
        rule_code: alert.rule_code,
        action: alert.action_text,
        old_roi: null, new_roi: null,
        old_budget: null, new_budget: null,
        status: 'confirmed',
        note: note || null,
        operator: '人工确认',
      }, ...prev])
    }
  }

  function handleDismiss(id: string) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'dismissed' } : a))
  }

  function handleUpdatePlan(planId: string, roi: number, budget: number) {
    const plan = plans.find(p => p.id === planId)
    if (!plan) return
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, roi_target: roi, daily_budget: budget } : p))
    setLogs(prev => [{
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      plan_id: planId,
      plan_name: plan.name,
      rule_code: 'MANUAL',
      action: '手动调整参数',
      old_roi: plan.roi_target,
      new_roi: roi,
      old_budget: plan.daily_budget,
      new_budget: budget,
      status: 'confirmed',
      note: '手动操作',
      operator: '运营人员',
    }, ...prev])
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <Dashboard
            plans={plans} alerts={alerts} logs={logs} store={store}
            onConfirm={handleConfirm} onDismiss={handleDismiss}
          />
        } />
        <Route path="/plan/:id" element={
          <PlanDetail plans={plans} onUpdatePlan={handleUpdatePlan} />
        } />
      </Routes>
    </BrowserRouter>
  )
}
