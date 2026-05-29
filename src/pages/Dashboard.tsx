import type { Alert, ActionLog as ActionLogType, Plan, StoreConfig } from '../types/database'
import { KPICards } from '../components/dashboard/KPICards'
import { AlertPanel } from '../components/dashboard/AlertPanel'
import { PlanTable } from '../components/dashboard/PlanTable'
import { ActionLog } from '../components/dashboard/ActionLog'
import { InspectionPanel } from '../components/inspection/InspectionPanel'
import { StoreParams } from '../components/dashboard/StoreParams'
import { TopBar } from '../components/layout/TopBar'

interface Props {
  plans: Plan[]
  alerts: Alert[]
  logs: ActionLogType[]
  store: StoreConfig
  onConfirm: (id: string, note: string) => void
  onDismiss: (id: string) => void
}

export function Dashboard({ plans, alerts, logs, store, onConfirm, onDismiss }: Props) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f0f4f8' }}>
      <TopBar
        storeName={store.store_name}
        weeklyMarginActual={store.weekly_actual_margin}
        weeklyMarginTarget={store.weekly_margin_target}
      />
      <div className="p-3 flex-1">
        <KPICards plans={plans} store={store} />
        <StoreParams store={store} />
        <div className="flex gap-2.5 mb-2.5">
          <AlertPanel alerts={alerts} onConfirm={onConfirm} onDismiss={onDismiss} />
          <InspectionPanel alerts={alerts} />
        </div>
        <PlanTable plans={plans} />
        <div className="mt-2.5">
          <ActionLog logs={logs} />
        </div>
      </div>
    </div>
  )
}
