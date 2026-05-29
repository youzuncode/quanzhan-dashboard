export type Zone = 'green' | 'yellow' | 'red'
export type Confidence = 'H' | 'M' | 'L'
export type BidMode = 'roi' | 'maximize'
export type ActionStatus = 'auto' | 'confirmed' | 'dismissed' | 'pending' | 'info'

export interface Database {
  public: {
    Tables: {
      store_config: {
        Row: StoreConfig
        Insert: Omit<StoreConfig, 'id' | 'created_at'>
        Update: Partial<Omit<StoreConfig, 'id' | 'created_at'>>
      }
      plans: {
        Row: Plan
        Insert: Omit<Plan, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Plan, 'id' | 'created_at'>>
      }
      plan_daily_metrics: {
        Row: PlanDailyMetrics
        Insert: Omit<PlanDailyMetrics, 'id' | 'created_at'>
        Update: Partial<Omit<PlanDailyMetrics, 'id' | 'created_at'>>
      }
      plan_hourly_metrics: {
        Row: PlanHourlyMetrics
        Insert: Omit<PlanHourlyMetrics, 'id' | 'created_at'>
        Update: Partial<Omit<PlanHourlyMetrics, 'id' | 'created_at'>>
      }
      alerts: {
        Row: Alert
        Insert: Omit<Alert, 'id' | 'created_at'>
        Update: Partial<Omit<Alert, 'id' | 'created_at'>>
      }
      action_log: {
        Row: ActionLog
        Insert: Omit<ActionLog, 'id' | 'created_at'>
        Update: Partial<Omit<ActionLog, 'id' | 'created_at'>>
      }
      categories: {
        Row: Category
        Insert: Omit<Category, 'id' | 'created_at'>
        Update: Partial<Omit<Category, 'id' | 'created_at'>>
      }
    }
  }
}

export interface StoreConfig {
  id: string
  created_at: string
  store_name: string
  gross_margin_rate: number
  t2_net_margin_rate: number
  t2_cost_rate: number
  weekly_margin_target: number
  weekly_actual_margin: number
}

export interface Plan {
  id: string
  created_at: string
  updated_at: string
  name: string
  category_id: string | null
  roi_target: number
  daily_budget: number
  bid_mode: BidMode
  bid_objective: 'net' | 'total'
  anti_stop_enabled: boolean
  multi_target_enabled: boolean
  quick_boost_enabled: boolean
  budget_type: 'daily'
  zone: Zone
  confidence: Confidence
  is_active: boolean
  gross_margin_rate: number
  spend_today: number
  revenue_today: number
  roi_completion_rate: number
  cost_rate_today: number
}

export interface PlanDailyMetrics {
  id: string
  created_at: string
  plan_id: string
  date: string
  spend: number
  revenue: number
  net_revenue: number
  cost_rate: number
  roi_actual: number
  roi_target: number
  daily_budget: number
  zone: Zone
  add_to_cart: number
  orders: number
  impressions: number
  clicks: number
  ctr: number
}

export interface PlanHourlyMetrics {
  id: string
  created_at: string
  plan_id: string
  date: string
  hour: number
  spend: number
  revenue: number
  cost_rate: number
  orders: number
  add_to_cart: number
  impressions: number
  clicks: number
  ctr: number
  spend_baseline: number
  spend_std: number
  ctr_baseline: number
  ctr_std: number
}

export interface Alert {
  id: string
  created_at: string
  plan_id: string | null
  plan_name: string
  rule_code: string
  severity: 'red' | 'yellow' | 'green' | 'indigo'
  title: string
  detail: string
  action_text: string
  status: ActionStatus
  confirmed_at: string | null
  confirmed_note: string | null
  inspection_point: string | null
}

export interface ActionLog {
  id: string
  created_at: string
  plan_id: string | null
  plan_name: string
  rule_code: string
  action: string
  old_roi: number | null
  new_roi: number | null
  old_budget: number | null
  new_budget: number | null
  status: ActionStatus
  note: string | null
  operator: string
}

export interface Category {
  id: string
  created_at: string
  name: string
  avg_add_to_cart_rate: number
  avg_conversion_rate: number
  avg_unit_price: number
  avg_cost_rate: number
  cart_to_order_delay_p50: number
  cart_to_order_delay_p80: number
  coldstart_days_p80: number
}
