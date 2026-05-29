-- 全站推广决策系统 v3.5 数据库初始化

-- 店铺配置
create table if not exists store_config (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  store_name text not null default '全站推广店铺',
  gross_margin_rate numeric(5,4) not null default 0.31,
  t2_net_margin_rate numeric(5,4) not null default 0.06,
  t2_cost_rate numeric(5,4) not null default 0.25,
  weekly_margin_target numeric(5,4) not null default 0.10,
  weekly_actual_margin numeric(5,4) not null default 0.082
);

-- 品类基准
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  avg_add_to_cart_rate numeric(6,4) default 0.08,
  avg_conversion_rate numeric(6,4) default 0.12,
  avg_unit_price numeric(10,2) default 180,
  avg_cost_rate numeric(6,4) default 0.18,
  cart_to_order_delay_p50 int default 2,
  cart_to_order_delay_p80 int default 7,
  coldstart_days_p80 int default 14
);

-- 推广计划
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  name text not null,
  category_id uuid references categories(id),
  roi_target numeric(6,2) not null default 7.0,
  daily_budget numeric(10,2) not null default 300,
  bid_mode text not null default 'roi' check (bid_mode in ('roi','maximize')),
  bid_objective text not null default 'net' check (bid_objective in ('net','total')),
  anti_stop_enabled boolean default false,
  multi_target_enabled boolean default false,
  quick_boost_enabled boolean default false,
  budget_type text not null default 'daily',
  zone text not null default 'yellow' check (zone in ('green','yellow','red')),
  confidence text not null default 'M' check (confidence in ('H','M','L')),
  is_active boolean default true,
  gross_margin_rate numeric(5,4) not null default 0.31,
  spend_today numeric(10,2) default 0,
  revenue_today numeric(10,2) default 0,
  roi_completion_rate numeric(6,4) default 0,
  cost_rate_today numeric(6,4) default 0
);

-- 计划每日数据
create table if not exists plan_daily_metrics (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  plan_id uuid not null references plans(id) on delete cascade,
  date date not null,
  spend numeric(10,2) default 0,
  revenue numeric(10,2) default 0,
  net_revenue numeric(10,2) default 0,
  cost_rate numeric(6,4) default 0,
  roi_actual numeric(6,2) default 0,
  roi_target numeric(6,2) default 0,
  daily_budget numeric(10,2) default 0,
  zone text default 'yellow',
  add_to_cart int default 0,
  orders int default 0,
  impressions int default 0,
  clicks int default 0,
  ctr numeric(6,4) default 0,
  unique(plan_id, date)
);

-- 计划分时数据
create table if not exists plan_hourly_metrics (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  plan_id uuid not null references plans(id) on delete cascade,
  date date not null,
  hour int not null check (hour >= 0 and hour <= 23),
  spend numeric(10,2) default 0,
  revenue numeric(10,2) default 0,
  cost_rate numeric(6,4) default 0,
  orders int default 0,
  add_to_cart int default 0,
  impressions int default 0,
  clicks int default 0,
  ctr numeric(6,4) default 0,
  spend_baseline numeric(10,2) default 0,
  spend_std numeric(10,2) default 0,
  ctr_baseline numeric(6,4) default 0,
  ctr_std numeric(6,4) default 0,
  unique(plan_id, date, hour)
);

-- 告警
create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  plan_id uuid references plans(id),
  plan_name text not null,
  rule_code text not null,
  severity text not null default 'yellow' check (severity in ('red','yellow','green','indigo')),
  title text not null,
  detail text not null,
  action_text text not null,
  status text not null default 'pending' check (status in ('auto','confirmed','dismissed','pending','info')),
  confirmed_at timestamptz,
  confirmed_note text,
  inspection_point text
);

-- 操作日志
create table if not exists action_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  plan_id uuid references plans(id),
  plan_name text not null,
  rule_code text not null,
  action text not null,
  old_roi numeric(6,2),
  new_roi numeric(6,2),
  old_budget numeric(10,2),
  new_budget numeric(10,2),
  status text not null default 'auto',
  note text,
  operator text not null default '系统自动'
);

-- RLS
alter table store_config enable row level security;
alter table plans enable row level security;
alter table plan_daily_metrics enable row level security;
alter table plan_hourly_metrics enable row level security;
alter table alerts enable row level security;
alter table action_log enable row level security;
alter table categories enable row level security;

-- 开放读写（实际生产中应添加 auth 约束）
create policy "allow_all" on store_config for all using (true) with check (true);
create policy "allow_all" on plans for all using (true) with check (true);
create policy "allow_all" on plan_daily_metrics for all using (true) with check (true);
create policy "allow_all" on plan_hourly_metrics for all using (true) with check (true);
create policy "allow_all" on alerts for all using (true) with check (true);
create policy "allow_all" on action_log for all using (true) with check (true);
create policy "allow_all" on categories for all using (true) with check (true);

-- 触发器：更新 plans.updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger plans_updated_at
before update on plans
for each row execute function update_updated_at();

-- 示例数据
insert into store_config (store_name, gross_margin_rate, t2_net_margin_rate, t2_cost_rate, weekly_margin_target, weekly_actual_margin)
values ('全站推广店铺', 0.31, 0.06, 0.25, 0.10, 0.082)
on conflict do nothing;

insert into categories (name, avg_add_to_cart_rate, avg_conversion_rate, avg_unit_price, avg_cost_rate, cart_to_order_delay_p50, cart_to_order_delay_p80, coldstart_days_p80)
values
  ('女装', 0.08, 0.12, 180, 0.18, 2, 7, 14),
  ('配饰', 0.05, 0.15, 80, 0.22, 1, 4, 10),
  ('鞋靴', 0.06, 0.10, 280, 0.20, 3, 10, 18)
on conflict do nothing;
