// ═══════════════════════════════════════════════════════
// FULL MOCK DATA – migrated from 全站推广决策看板.html
// ═══════════════════════════════════════════════════════

export const store = {
  febi: 0.187,
  weeklyNetProfit: 0.082,
  weeklyTarget: 0.10,
  grossMargin: 0.31,
  targetFebi: 0.21,
  storeMarginGap: -0.018,
  totalSpend: 48600,
  totalRevenue: 259893,
  triggeredRulesCount: 6,
}

export interface TimepointResult {
  id: string
  plan: string
  rule: string
  zone: 'red' | 'yellow' | 'green' | 'gray'
  trigger: string
  actionText: string
  type: 'auto' | 'confirm' | 'info'
  initStatus: 'executed' | 'confirmed' | 'pending'
  execTime?: string
  operator?: string
  confirmNote?: string
}

export interface Timepoint {
  time: string
  name: string
  status: 'done' | 'now' | 'pending'
  conf: 'H' | 'M' | 'L'
  summary: string
  results: TimepointResult[]
}

export const timepoints: Timepoint[] = [
  {
    time: '09:00', name: '晨检', status: 'done', conf: 'H',
    summary: '3条规则，2条自动执行，1条已记录',
    results: [
      { id: 'r0901', plan: '施华蔻养发精华液', rule: 'R1-A', zone: 'red',
        trigger: '小时花费¥1,240 > 动态阈值¥892（28日均值+2σ），当小时零成交+零加购，累计ROI完成率61%',
        actionText: '暂停计划（今日每日预算→¥0）｜ 关闭优质计划防停投',
        type: 'auto', initStatus: 'executed', execTime: '09:02:14', operator: '系统自动' },
      { id: 'r0902', plan: '全店毛利余量', rule: '余量计算', zone: 'yellow',
        trigger: '本周净毛利率8.2% < 10%目标，余量-1.8%，触发"收紧模式"',
        actionText: '切换至收紧模式：黄区禁止扩量，绿区R3要求ROI完成率≥130%，18:00黄区禁入晚高峰',
        type: 'auto', initStatus: 'executed', execTime: '09:01:30', operator: '系统自动' },
      { id: 'r0903', plan: 'UNO男士控油乳液', rule: 'R4 CTR监控', zone: 'yellow',
        trigger: 'CTR 0.8% < 动态阈值1.4%（28日均值-2σ），花费速率正常，ROI暂达标',
        actionText: '记录日志，推送[CTR突降预警]，等12:00复核',
        type: 'info', initStatus: 'executed', execTime: '09:02:14', operator: '系统自动' },
    ]
  },
  {
    time: '12:00', name: '午检', status: 'done', conf: 'L',
    summary: '低置信度，2条预警推送，1条人工已确认',
    results: [
      { id: 'r1201', plan: '海飞丝去屑洗发水', rule: 'DT1 预判', zone: 'yellow',
        trigger: '当前费比23.1% > 目标费比21%，且费比趋势上升，预测22:00将触发DT1。低置信度，推送预警',
        actionText: '人工预执行：ROI 5.2→5.62（×1.08）｜ 明日预算¥5000→¥4500（×0.90）',
        type: 'confirm', initStatus: 'confirmed', execTime: '12:15:33', operator: '操作员',
        confirmNote: '已提前执行，避免22:00被动触发' },
      { id: 'r1202', plan: 'UNO男士控油乳液', rule: 'R2-B 预警', zone: 'red',
        trigger: '费比32.1%逼近Gross毛利率32%（-0.1pp），低置信度，不自动执行',
        actionText: '推送[红区临界预警]，等14:00中置信度确认后执行R2-B止损',
        type: 'info', initStatus: 'executed', execTime: '12:02:01', operator: '系统自动' },
    ]
  },
  {
    time: '14:00', name: '午后检', status: 'now', conf: 'M',
    summary: '4条结果，1条已自动执行，3条待人工确认',
    results: [
      { id: 'r1401', plan: '施华蔻养发精华液', rule: 'R2-B', zone: 'red',
        trigger: '费比38% >> Gross毛利率29%，中置信度。09:00已暂停，本时点确认暂停状态持续',
        actionText: '维持暂停状态（今日预算仍为¥0）｜ ROI目标更新为3.45（止损ROI×1.1），等明日复查',
        type: 'auto', initStatus: 'executed', execTime: '14:01:22', operator: '系统自动' },
      { id: 'r1402', plan: 'UNO男士控油乳液', rule: 'R2-B 止损', zone: 'red',
        trigger: '费比34.1% > Gross毛利率32%，中置信度，红区确认。止损ROI = 1÷0.32 = 3.13，建议ROI→3.44（×1.1）',
        actionText: '净目标投产比：5.5 → 3.44（止损线×1.10）｜ 剩余日预算 ¥500→¥300（×0.60）｜ 防停投关闭',
        type: 'confirm', initStatus: 'pending' },
      { id: 'r1403', plan: '护发品类整体', rule: '类目费比异常', zone: 'yellow',
        trigger: '护发品类今日均值费比22.1% vs 历史同期19.3%，上升14.5%（接近15%预警阈值），可能竞争加剧',
        actionText: '建议人工研判：若确认竞争加剧，可考虑对黄区护发计划整体ROI目标上调5%，或维持观察至16:00',
        type: 'confirm', initStatus: 'pending' },
      { id: 'r1404', plan: '潘婷修护发膜', rule: 'R2-C', zone: 'yellow',
        trigger: '黄区 + 全店毛利余量-1.8%（收紧模式），中置信度R2-C触发',
        actionText: '净目标投产比：5.5 → 6.05（×1.10）｜ 当日剩余预算 ¥2100→¥1680（×0.80）',
        type: 'confirm', initStatus: 'pending' },
    ]
  },
  {
    time: '16:00', name: '下午检', status: 'pending', conf: 'H',
    summary: '待执行',
    results: [
      { id: 'r1601', plan: '绿区计划（清扬/力士/舒肤佳）', rule: 'R3 预算保障', zone: 'green',
        trigger: '距晚高峰<3小时，检查绿区计划剩余预算是否充足（<小时均值×3则追加）',
        actionText: '每日预算各+15~20%（具体值待16:00实时数据确认）',
        type: 'confirm', initStatus: 'pending' },
      { id: 'r1602', plan: '全店余量确认', rule: '18:00 黄区禁入', zone: 'yellow',
        trigger: '预检：若16:00全店毛利余量仍<0%，18:00将对黄区计划强制上调ROI 10%',
        actionText: '推送预告：[18:00黄区禁入晚高峰] 将于18:00执行，请提前确认各黄区计划库存充足',
        type: 'info', initStatus: 'pending' },
    ]
  },
  {
    time: '18:00', name: '晚高峰前', status: 'pending', conf: 'H',
    summary: '待执行',
    results: [
      { id: 'r1801', plan: '清扬/力士/舒肤佳', rule: 'R3 强制追加', zone: 'green',
        trigger: '绿区+ROI完成率≥130%+余量不足（待16:00数据确认）',
        actionText: '每日预算强制追加，金额依16:00确认结果执行',
        type: 'auto', initStatus: 'pending' },
      { id: 'r1802', plan: '海飞丝/潘婷/VS沙宣', rule: '黄区禁入晚高峰', zone: 'yellow',
        trigger: '全店毛利余量<0%（收紧模式），黄区计划不进晚高峰',
        actionText: '净目标投产比统一上调10%｜ 剩余日预算缩减至已花费+剩余×0.50（实际停止晚高峰竞价）',
        type: 'confirm', initStatus: 'pending' },
    ]
  },
  {
    time: '20:00', name: '晚高峰中', status: 'pending', conf: 'H',
    summary: '待执行',
    results: [
      { id: 'r2001', plan: '绿区计划（如有）', rule: 'R3 最后追加', zone: 'green',
        trigger: '20:00最后一次追加机会（22:00已无意义）',
        actionText: '绿区+高置信度+余量极低：每日预算最后追加，金额依实时数据',
        type: 'confirm', initStatus: 'pending' },
      { id: 'r2002', plan: '红黄区超标计划', rule: '连续性标记', zone: 'red',
        trigger: '连续当日费比超利润目标费比≥2次的计划，标记[今日超利润目标]',
        actionText: '记录标记，明日09:00四步法第四步（连续性升级）使用',
        type: 'auto', initStatus: 'pending' },
    ]
  },
  {
    time: '22:00', name: '日终结算', status: 'pending', conf: 'H',
    summary: '待执行',
    results: [
      { id: 'r2201', plan: '全部计划', rule: 'DT1 执行', zone: 'yellow',
        trigger: '今日费比超利润目标费比且花费>200元且加购数<品类保护阈值',
        actionText: '明日净目标投产比×1.08（上调8%）｜ 明日预算×0.90',
        type: 'auto', initStatus: 'pending' },
      { id: 'r2202', plan: '清扬/力士/舒肤佳', rule: 'DT3 预算充足确认', zone: 'green',
        trigger: '预测明日耗尽时间是否<18:00',
        actionText: '若预测耗尽<18:00：明日预算×1.20｜ 净目标投产比维持',
        type: 'auto', initStatus: 'pending' },
      { id: 'r2203', plan: '全部计划', rule: '预测误差记录', zone: 'gray',
        trigger: '22:00时点记录今日各时点预测值→实际值差异',
        actionText: '更新各计划14天滚动预测误差均值；更新置信度级别；更新全店周毛利余量',
        type: 'auto', initStatus: 'pending' },
      { id: 'r2204', plan: '全部计划', rule: '明日参数清单', zone: 'green',
        trigger: '每日22:00输出明日完整参数调整清单',
        actionText: '输出：各计划净目标投产比建议值 + 每日预算建议值 → 明日09:30批量执行',
        type: 'auto', initStatus: 'pending' },
    ]
  },
]

// Mock API parameter specs per result id
export const MOCK_API_PARAMS: Record<string, { params: { key: string; before: string; after: string; change: string; dir: 'up' | 'down' | 'neutral' }[] }> = {
  r0901: { params: [
    { key: '每日预算', before: '¥8,400', after: '¥0', change: '计划暂停', dir: 'down' },
    { key: '优质计划防停投', before: '已开启', after: '已关闭', change: '强制关闭', dir: 'down' },
  ]},
  r0902: { params: [
    { key: '全店余量模式', before: '平衡模式', after: '收紧模式', change: '模式升级', dir: 'neutral' },
    { key: '黄区扩量', before: '允许', after: '禁止', change: '限制生效', dir: 'down' },
    { key: '绿区扩量阈值', before: 'ROI≥100%', after: 'ROI≥130%', change: '提高门槛', dir: 'up' },
  ]},
  r0903: { params: [{ key: 'CTR监控日志', before: '—', after: '已记录', change: '推送预警', dir: 'neutral' }]},
  r1201: { params: [
    { key: '净目标投产比', before: '5.2', after: '5.62', change: '+8.1%', dir: 'up' },
    { key: '明日每日预算', before: '¥5,000', after: '¥4,500', change: '−10%', dir: 'down' },
  ]},
  r1202: { params: [{ key: '预警日志', before: '—', after: '已推送', change: '红区临界', dir: 'neutral' }]},
  r1401: { params: [
    { key: '净目标投产比', before: '4.0', after: '3.45', change: '止损ROI×1.1', dir: 'neutral' },
    { key: '今日每日预算', before: '¥300', after: '¥0（维持）', change: '维持暂停', dir: 'down' },
    { key: '明日参数', before: '—', after: '待复查', change: '标记明日复查', dir: 'neutral' },
  ]},
  r1402: { params: [
    { key: '净目标投产比', before: '5.5', after: '3.44', change: '止损×1.10', dir: 'down' },
    { key: '每日预算（剩余）', before: '¥500', after: '¥300', change: '剩余×0.60', dir: 'down' },
    { key: '优质计划防停投', before: '已开启', after: '已关闭', change: '红区强制关闭', dir: 'down' },
  ]},
  r1403: { params: [{ key: '护发品类黄区ROI', before: '各计划维持', after: '统一上调5%', change: '手动研判', dir: 'up' }]},
  r1404: { params: [
    { key: '净目标投产比', before: '5.5', after: '6.05', change: '+10.0%', dir: 'up' },
    { key: '每日预算（剩余）', before: '¥2,100', after: '¥1,680', change: '×0.80', dir: 'down' },
  ]},
  r1601: { params: [
    { key: '清扬 每日预算', before: '¥3,000', after: '¥3,450', change: '+15%', dir: 'up' },
    { key: '力士 每日预算', before: '¥3,000', after: '¥3,600', change: '+20%', dir: 'up' },
    { key: '舒肤佳 每日预算', before: '¥1,000', after: '¥1,250', change: '+25%', dir: 'up' },
  ]},
  r1602: { params: [{ key: '18:00黄区禁入预告', before: '—', after: '已推送', change: '通知生效', dir: 'neutral' }]},
  r1801: { params: [{ key: '绿区计划预算', before: '各计划维持', after: '强制追加', change: '晚高峰备量', dir: 'up' }]},
  r1802: { params: [
    { key: '黄区净目标投产比', before: '各计划当前值', after: '统一×1.10', change: '+10%', dir: 'up' },
    { key: '黄区剩余预算', before: '各计划当前值', after: '已花费+剩余×0.50', change: '压缩晚高峰', dir: 'down' },
  ]},
  r2001: { params: [{ key: '绿区预算最终追加', before: '当前值', after: '视实时数据', change: '最后窗口', dir: 'up' }]},
  r2002: { params: [{ key: '连续超标标记', before: '—', after: '已标记 2计划', change: '明日升级', dir: 'neutral' }]},
  r2201: { params: [
    { key: '明日净目标投产比', before: '各计划', after: '各计划×1.08', change: 'DT1触发', dir: 'up' },
    { key: '明日每日预算', before: '各计划', after: '各计划×0.90', change: '收紧10%', dir: 'down' },
  ]},
  r2202: { params: [{ key: '清扬/力士/舒肤佳 明日预算', before: '各计划', after: '各计划×1.20', change: 'DT3追量', dir: 'up' }]},
  r2203: { params: [{ key: '14天预测误差均值', before: '滚动更新', after: '已更新', change: '置信度刷新', dir: 'neutral' }]},
  r2204: { params: [{ key: '明日参数清单', before: '—', after: '已生成', change: '09:30批量执行', dir: 'neutral' }]},
}

export interface PlanData {
  name: string
  zone: 'red' | 'yellow' | 'green'
  roiTarget: number
  febi: number
  gross: number
  budget: number
  spend: number
  conf: 'H' | 'M' | 'L'
  guard: boolean
  rule: string
  action: string
}

export const plans: PlanData[] = [
  { name: '施华蔻养发精华液', zone: 'red',    roiTarget: 4.0, febi: 0.38, gross: 0.29, budget: 300,  spend: 8400,  conf: 'M', guard: false, rule: 'R1-A,R2-B', action: '暂停（预算→¥0）\nROI:4.0→3.45（止损×1.1）' },
  { name: 'UNO男士控油乳液',  zone: 'red',    roiTarget: 5.5, febi: 0.34, gross: 0.32, budget: 500,  spend: 6200,  conf: 'L', guard: false, rule: 'R2-B待确认', action: 'ROI:5.5→3.44 | 剩余×0.60\n待人工确认→' },
  { name: '海飞丝去屑洗发水', zone: 'yellow', roiTarget: 5.62, febi: 0.26, gross: 0.31, budget: 4500, spend: 12100, conf: 'H', guard: false, rule: 'DT1已预执行', action: 'ROI已调5.2→5.62\n明日预算¥5000→¥4500' },
  { name: '潘婷修护发膜',     zone: 'yellow', roiTarget: 5.5, febi: 0.24, gross: 0.30, budget: 3000, spend: 7800,  conf: 'H', guard: false, rule: 'R2-C待确认', action: 'ROI:5.5→6.05 | 剩余×0.80\n待人工确认→' },
  { name: 'VS沙宣护发素',     zone: 'yellow', roiTarget: 5.8, febi: 0.22, gross: 0.28, budget: 2000, spend: 4200,  conf: 'M', guard: false, rule: '—', action: 'ROI维持5.8 | 预算维持' },
  { name: '清扬男士洗发水',   zone: 'green',  roiTarget: 7.0, febi: 0.16, gross: 0.33, budget: 3000, spend: 9300,  conf: 'H', guard: true,  rule: 'R3触发中', action: 'ROI维持7.0\n预算+15%→¥3,450' },
  { name: '力士香薰沐浴露',   zone: 'green',  roiTarget: 7.5, febi: 0.14, gross: 0.35, budget: 3000, spend: 5800,  conf: 'H', guard: true,  rule: 'R3触发中', action: 'ROI维持7.5\n预算+20%→¥3,600' },
  { name: '多芬身体乳',       zone: 'green',  roiTarget: 6.5, febi: 0.19, gross: 0.30, budget: 2000, spend: 3100,  conf: 'M', guard: true,  rule: '—', action: 'ROI维持6.5 | 预算维持' },
  { name: '飘柔柔顺洗发水',   zone: 'green',  roiTarget: 6.8, febi: 0.17, gross: 0.28, budget: 2000, spend: 4600,  conf: 'H', guard: true,  rule: '—', action: 'ROI维持6.8 | 预算维持' },
  { name: '舒肤佳抑菌香皂',   zone: 'green',  roiTarget: 8.0, febi: 0.13, gross: 0.37, budget: 1000, spend: 2100,  conf: 'H', guard: true,  rule: 'R3触发中', action: 'ROI维持8.0\n预算+25%→¥1,250' },
]

// Hourly prediction data
export const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]
export const predicted = [1800, 2100, 2400, 3200, 3100, 2900, 2800, 3400, 3600, 4200, 4800, 5200, 4100, 3800]
export const actual = [1650, 2050, 2550, 3100, null, null, null, null, null, null, null, null, null, null]

// 14-day history
export interface Hist14Row { date: string; pred: number; act: number; mape: number; conf: 'H' | 'M' | 'L'; note: string; bias: string; biasAmt: string }
export const hist14: Hist14Row[] = [
  { pred: 47200, act: 51300, note: '' },
  { pred: 49800, act: 47200, note: '' },
  { pred: 52100, act: 58400, note: '大促预热，实际远超预测' },
  { pred: 61200, act: 68900, note: '618大促日，误差偏高' },
  { pred: 65000, act: 59200, note: '' },
  { pred: 48300, act: 45700, note: '' },
  { pred: 46100, act: 48900, note: '' },
  { pred: 44800, act: 43200, note: '' },
  { pred: 45500, act: 47100, note: '' },
  { pred: 46200, act: 44800, note: '' },
  { pred: 47800, act: 50200, note: '' },
  { pred: 48600, act: 46100, note: '' },
  { pred: 49100, act: 51800, note: '' },
  { pred: 50200, act: 48600, note: '今日（截至14:00）' },
].map((d, i) => {
  const base = new Date(); base.setDate(base.getDate() - 14 + i)
  const mape = Math.abs(d.pred - d.act) / d.act * 100
  return {
    date: `${base.getMonth() + 1}/${base.getDate()}`,
    pred: d.pred, act: d.act,
    mape: parseFloat(mape.toFixed(1)),
    conf: mape < 15 ? 'H' : mape < 25 ? 'M' : 'L',
    note: d.note,
    bias: d.pred > d.act ? '偏高' : '偏低',
    biasAmt: ((d.pred - d.act) / d.act * 100).toFixed(1),
  }
})

export interface PlanErrRow { name: string; mape: number; conf: 'H' | 'M' | 'L'; trend: 'imp' | 'stb' | 'deg'; bias: string; biasAmt: string }
export const planErr: PlanErrRow[] = [
  { name: '清扬男士洗发水',   mape: 11.2, conf: 'H', trend: 'imp', bias: '偏低', biasAmt: '-3.1%' },
  { name: '力士香薰沐浴露',   mape: 13.8, conf: 'H', trend: 'stb', bias: '偏高', biasAmt: '+5.2%' },
  { name: '舒肤佳抑菌香皂',   mape: 9.4,  conf: 'H', trend: 'imp', bias: '偏低', biasAmt: '-2.8%' },
  { name: '海飞丝去屑洗发水', mape: 18.3, conf: 'M', trend: 'stb', bias: '偏低', biasAmt: '-7.4%' },
  { name: '飘柔柔顺洗发水',   mape: 15.6, conf: 'M', trend: 'stb', bias: '偏高', biasAmt: '+6.1%' },
  { name: '多芬身体乳',       mape: 16.2, conf: 'M', trend: 'deg', bias: '偏低', biasAmt: '-9.2%' },
  { name: '潘婷修护发膜',     mape: 22.7, conf: 'M', trend: 'deg', bias: '偏低', biasAmt: '-12.3%' },
  { name: 'VS沙宣护发素',     mape: 19.1, conf: 'M', trend: 'stb', bias: '偏高', biasAmt: '+8.4%' },
  { name: '施华蔻养发精华液', mape: 27.4, conf: 'L', trend: 'deg', bias: '偏低', biasAmt: '-18.6%' },
  { name: 'UNO男士控油乳液',  mape: 31.2, conf: 'L', trend: 'deg', bias: '偏高', biasAmt: '+22.1%' },
]

export interface ParamOp {
  name: string; icon: string; type: string; cls: 'act' | 'ok' | 'warn'
  items: { plan: string; cur: string; nw: string; badge: string }[]
}
export const paramOps: ParamOp[] = [
  { name: '净目标投产比', icon: '🎯', type: 'roi', cls: 'act',
    items: [
      { plan: '施华蔻养发精华液', cur: '4.0', nw: '3.45', badge: '止损×1.1' },
      { plan: '海飞丝（已执行）', cur: '5.2', nw: '5.62', badge: 'DT1预执行' },
      { plan: 'UNO（待确认）',    cur: '5.5', nw: '3.44', badge: '止损待确认' },
    ]},
  { name: '每日预算', icon: '💰', type: 'bgt', cls: 'ok',
    items: [
      { plan: '清扬 R3追加',  cur: '¥3000', nw: '¥3,450', badge: '+15%' },
      { plan: '力士 R3追加',  cur: '¥3000', nw: '¥3,600', badge: '+20%' },
      { plan: '舒肤佳 R3追加', cur: '¥1000', nw: '¥1,250', badge: '+25%' },
    ]},
  { name: '出价方式', icon: '⚡', type: 'mode', cls: 'warn',
    items: [
      { plan: '全部计划',     cur: '控投产比', nw: '维持', badge: '默认' },
      { plan: '大促绿区场景', cur: '—', nw: '可切换最大化拿量', badge: '特殊场景' },
    ]},
  { name: '防停投开关', icon: '🛡', type: 'guard', cls: 'ok',
    items: [
      { plan: '绿区5计划', cur: '—', nw: '✅ 开启', badge: '防断货' },
      { plan: '红区2计划', cur: '—', nw: '❌ 关闭', badge: '强制关闭' },
    ]},
]

export interface AlertItem { level: 'red' | 'yellow' | 'green'; title: string; tag: string; detail: string; action: string }
export const probsData: AlertItem[] = [
  { level: 'red', title: '施华蔻养发精华液 · 真实亏损（R2-B）', tag: '红区',
    detail: '费比38% > Gross29%，亏损9pp。09:00已暂停，14:00确认持续。',
    action: 'ROI→3.45 | 今日预算→¥0 | 防停投关闭' },
  { level: 'red', title: 'UNO男士控油乳液 · 红区待确认', tag: '红区',
    detail: '费比34% > Gross32%，待14:00人工确认R2-B执行。置信度L。',
    action: 'ROI:5.5→3.44 | 剩余×0.60 → 点击14:00时点操作' },
  { level: 'yellow', title: '海飞丝去屑洗发水 · 12:00已预执行DT1', tag: '黄区',
    detail: '费比26% > 目标21%，12:00已提前执行ROI上调。',
    action: 'ROI:5.2→5.62（已执行）| 明日预算¥5000→¥4500' },
  { level: 'yellow', title: '全店毛利余量−1.8% · 收紧模式', tag: '店铺',
    detail: '8.2% < 目标10%。黄区禁扩量，绿区ROI≥130%才扩。',
    action: '18:00黄区ROI强制上调10% | 禁入晚高峰' },
]

export const oppsData: AlertItem[] = [
  { level: 'green', title: '舒肤佳抑菌香皂 · ROI最优', tag: '绿区',
    detail: 'ROI=8.0，费比13% vs 目标27%，余量14pp。转化率5.2%。置信度H。',
    action: '今日预算: ¥1000→¥1,250（+25%）| ROI维持8.0' },
  { level: 'green', title: '力士香薰沐浴露 · 高ROI连续5日', tag: '绿区',
    detail: 'ROI=7.5，费比14%，Gross35%，余量21pp。置信度H。',
    action: '今日预算: ¥3000→¥3,600（+20%）| ROI维持7.5' },
  { level: 'green', title: '清扬男士洗发水 · 稳定绿区', tag: '绿区',
    detail: 'ROI=7.0，费比16% vs 目标23%，余量7pp。置信度H，误差<12%。',
    action: '今日预算: ¥3000→¥3,450（+15%）| ROI维持7.0' },
]

export interface AlgoItem { title: string; detail: string; formula: string }
export const algoData: AlgoItem[] = [
  { title: '📉 施华蔻/UNO预测误差偏高→置信度L',
    detail: '过去14天误差均值27%/31%，超20%阈值，已降至L级。自动操作暂停，需人工操作。',
    formula: '置信度L → R1-B/R3禁止自动执行' },
  { title: '⚖️ R1动态阈值自适应（大促备货期）',
    detail: '近7天花费均值上移18%，R1阈值自动上调，避免正常备货流量被误触发。',
    formula: 'threshold = rolling_mean(28d) + 2×rolling_std(28d)' },
  { title: '🎯 增量ROI分糖：红区释放→绿区',
    detail: '红区释放预算¥3200/天，等边际原则分给舒肤佳/力士/清扬（优先级依序）。',
    formula: 'b_i* : MR(舒肤佳)=MR(力士)=MR(清扬)' },
  { title: '🏷️ VS沙宣预算利用率52%→ROI目标偏高',
    detail: '周均利用率52%<60%（WK4A），系统出价竞争力不足，建议小幅下调ROI目标。',
    formula: '建议：ROI 5.8→5.38（×0.93）提升竞争力' },
]

// Plan bid params
export interface PlanParams { mode: string; multiTarget: boolean; oneKey: boolean; budgetType: string; guard: boolean }
export const PLAN_PARAMS: Record<string, PlanParams> = {
  '施华蔻养发精华液': { mode: '控投产比', multiTarget: false, oneKey: false, budgetType: '日预算', guard: false },
  'UNO男士控油乳液':  { mode: '控投产比', multiTarget: false, oneKey: false, budgetType: '日预算', guard: false },
  '海飞丝去屑洗发水': { mode: '控投产比', multiTarget: true,  oneKey: false, budgetType: '日预算', guard: false },
  '潘婷修护发膜':     { mode: '控投产比', multiTarget: false, oneKey: false, budgetType: '日预算', guard: false },
  'VS沙宣护发素':     { mode: '控投产比', multiTarget: false, oneKey: false, budgetType: '日预算', guard: false },
  '清扬男士洗发水':   { mode: '控投产比', multiTarget: true,  oneKey: false, budgetType: '日预算', guard: true },
  '力士香薰沐浴露':   { mode: '控投产比', multiTarget: true,  oneKey: false, budgetType: '日预算', guard: true },
  '多芬身体乳':       { mode: '控投产比', multiTarget: false, oneKey: false, budgetType: '日预算', guard: true },
  '飘柔柔顺洗发水':   { mode: '控投产比', multiTarget: false, oneKey: false, budgetType: '日预算', guard: true },
  '舒肤佳抑菌香皂':   { mode: '最大化拿量', multiTarget: false, oneKey: false, budgetType: '日预算', guard: true },
}

export interface TodayTrigger { time: string; rule: string; zone: string; action: string; status: 'ok' | 'pending'; operator: string }
export const PLAN_TODAY_TRIGGERS: Record<string, TodayTrigger[]> = {
  '施华蔻养发精华液': [
    { time: '09:00', rule: 'R1-A', zone: 'red', action: '暂停计划（预算→¥0）｜ 关闭防停投', status: 'ok', operator: '系统自动' },
    { time: '14:00', rule: 'R2-B', zone: 'red', action: '维持暂停 ｜ ROI→3.45（止损×1.1），明日复查', status: 'ok', operator: '系统自动' },
  ],
  'UNO男士控油乳液': [
    { time: '12:00', rule: 'R2-B预警', zone: 'red', action: '费比32.1%逼近Gross，推送预警日志', status: 'ok', operator: '系统自动' },
    { time: '14:00', rule: 'R2-B止损', zone: 'red', action: 'ROI:5.5→3.44 ｜ 剩余预算×0.60 ｜ 防停投关闭', status: 'pending', operator: '待人工确认' },
  ],
  '海飞丝去屑洗发水': [
    { time: '12:00', rule: 'DT1预判', zone: 'yellow', action: 'ROI:5.2→5.62（×1.08）｜ 明日预算¥5000→¥4500', status: 'ok', operator: '操作员' },
  ],
  '潘婷修护发膜': [
    { time: '14:00', rule: 'R2-C', zone: 'yellow', action: 'ROI:5.5→6.05（×1.10）｜ 剩余预算×0.80', status: 'pending', operator: '待人工确认' },
  ],
  'VS沙宣护发素': [
    { time: '09:00', rule: 'WK4A监控', zone: 'yellow', action: '利用率52%<60%，记录日志，暂无触发', status: 'ok', operator: '系统自动' },
  ],
  '清扬男士洗发水': [
    { time: '09:00', rule: '余量模式', zone: 'green', action: '收紧模式：扩量阈值→ROI完成率≥130%', status: 'ok', operator: '系统自动' },
    { time: '16:00', rule: 'R3预算保障', zone: 'green', action: '每日预算¥3000→¥3450（+15%）', status: 'pending', operator: '待16:00执行' },
  ],
  '力士香薰沐浴露': [
    { time: '16:00', rule: 'R3预算保障', zone: 'green', action: '每日预算¥3000→¥3600（+20%）', status: 'pending', operator: '待16:00执行' },
  ],
  '多芬身体乳': [],
  '飘柔柔顺洗发水': [],
  '舒肤佳抑菌香皂': [
    { time: '16:00', rule: 'R3预算保障', zone: 'green', action: '每日预算¥1000→¥1250（+25%）', status: 'pending', operator: '待16:00执行' },
  ],
}

export interface HistLogRow { date: string; rule: string; action: string; result: 'ok' | 'fail' | 'warn' | 'skip'; operator: string; note: string }
export const PLAN_HIST_LOG: Record<string, HistLogRow[]> = {
  '施华蔻养发精华液': [
    { date: '05/28', rule: 'R1-A', action: '暂停计划 预算→¥0', result: 'ok', operator: '系统自动', note: '' },
    { date: '05/28', rule: 'R2-B', action: 'ROI→3.45 止损×1.1', result: 'ok', operator: '操作员', note: '' },
    { date: '05/27', rule: 'DT1', action: 'ROI 4.2→4.54 | 明日预算¥9000→¥8100', result: 'ok', operator: '系统自动', note: '' },
    { date: '05/26', rule: 'R2-C', action: 'ROI 4.0→4.4 | 剩余预算×0.80', result: 'ok', operator: '操作员', note: '大促后正常回调' },
    { date: '05/25', rule: 'R3', action: '预算¥8000→¥9200 +15%', result: 'ok', operator: '系统自动', note: '大促备货' },
    { date: '05/24', rule: 'DT3', action: '明日预算¥7000→¥8400 +20%', result: 'ok', operator: '系统自动', note: '' },
    { date: '05/23', rule: '—', action: '无触发，参数维持', result: 'skip', operator: '—', note: '' },
    { date: '05/22', rule: 'R3', action: '预算¥6000→¥6900 +15%', result: 'ok', operator: '系统自动', note: '' },
    { date: '05/21', rule: 'DT1', action: 'ROI 3.8→4.10 | 明日预算×0.90', result: 'ok', operator: '系统自动', note: '' },
    { date: '05/20', rule: 'R2-B', action: 'ROI→3.13（止损线）| 预算×0.60', result: 'ok', operator: '操作员', note: '当日费比超Gross' },
    { date: '05/19', rule: 'R2-C', action: 'ROI 3.5→3.85 | 剩余×0.80', result: 'ok', operator: '操作员', note: '' },
    { date: '05/18', rule: '—', action: '无触发，参数维持', result: 'skip', operator: '—', note: '' },
    { date: '05/17', rule: 'R3', action: '预算¥5000→¥5750 +15%', result: 'ok', operator: '系统自动', note: '' },
    { date: '05/16', rule: 'DT3', action: '明日预算×1.20', result: 'ok', operator: '系统自动', note: '' },
  ],
  'UNO男士控油乳液': [
    { date: '05/28', rule: 'R2-B预警', action: '费比临界推送预警', result: 'ok', operator: '系统自动', note: '' },
    { date: '05/28', rule: 'R2-B待确认', action: 'ROI:5.5→3.44 | 剩余×0.60（待确认）', result: 'warn', operator: '待人工', note: '' },
    { date: '05/27', rule: 'DT1', action: 'ROI 5.0→5.40 | 明日预算×0.90', result: 'ok', operator: '系统自动', note: '' },
    { date: '05/26', rule: 'R2-C', action: 'ROI 4.8→5.28 | 剩余×0.80', result: 'ok', operator: '操作员', note: '' },
    { date: '05/25', rule: '—', action: '无触发，参数维持', result: 'skip', operator: '—', note: '' },
    { date: '05/24', rule: 'R3', action: '预算¥500→¥575 +15%', result: 'ok', operator: '系统自动', note: '' },
    { date: '05/23', rule: 'DT1', action: 'ROI 4.5→4.86 | 明日预算×0.90', result: 'ok', operator: '系统自动', note: '' },
    { date: '05/22', rule: '—', action: '无触发，参数维持', result: 'skip', operator: '—', note: '' },
    { date: '05/21', rule: 'R2-C', action: 'ROI 4.2→4.62 | 剩余×0.80', result: 'ok', operator: '操作员', note: '' },
    { date: '05/20', rule: 'R1-B', action: 'ROI 4.0→4.60（×1.15）| 剩余×0.80', result: 'ok', operator: '系统自动', note: '当日CTR突降' },
    { date: '05/19', rule: '—', action: '无触发，参数维持', result: 'skip', operator: '—', note: '' },
    { date: '05/18', rule: 'DT3', action: '明日预算×1.20', result: 'ok', operator: '系统自动', note: '' },
    { date: '05/17', rule: '—', action: '无触发，参数维持', result: 'skip', operator: '—', note: '' },
    { date: '05/16', rule: 'R3', action: '预算¥400→¥480 +20%', result: 'ok', operator: '系统自动', note: '' },
  ],
  '海飞丝去屑洗发水': [
    { date: '05/28', rule: 'DT1预执行', action: 'ROI:5.2→5.62 | 明日预算¥5000→¥4500', result: 'ok', operator: '操作员', note: '提前执行避免22:00触发' },
    { date: '05/27', rule: 'R3', action: '预算¥11000→¥12650 +15%', result: 'ok', operator: '系统自动', note: '' },
    { date: '05/26', rule: 'DT3', action: '明日预算¥10000→¥12000 +20%', result: 'ok', operator: '系统自动', note: '大促备货' },
    { date: '05/25', rule: 'R3', action: '预算¥9000→¥10350 +15%', result: 'ok', operator: '系统自动', note: '' },
    { date: '05/24', rule: 'DT1', action: 'ROI 4.8→5.18 | 明日预算×0.90', result: 'ok', operator: '系统自动', note: '' },
    { date: '05/23', rule: '—', action: '无触发，参数维持', result: 'skip', operator: '—', note: '' },
    { date: '05/22', rule: 'R3', action: '预算¥8500→¥9775 +15%', result: 'ok', operator: '系统自动', note: '' },
    { date: '05/21', rule: '—', action: '无触发，参数维持', result: 'skip', operator: '—', note: '' },
    { date: '05/20', rule: 'R2-C', action: 'ROI 4.6→5.06 | 剩余×0.80', result: 'ok', operator: '操作员', note: '' },
    { date: '05/19', rule: 'DT3', action: '明日预算×1.20', result: 'ok', operator: '系统自动', note: '' },
    { date: '05/18', rule: '—', action: '无触发，参数维持', result: 'skip', operator: '—', note: '' },
    { date: '05/17', rule: 'R3', action: '预算¥8000→¥9200 +15%', result: 'ok', operator: '系统自动', note: '' },
    { date: '05/16', rule: '—', action: '无触发，参数维持', result: 'skip', operator: '—', note: '' },
    { date: '05/15', rule: 'DT1', action: 'ROI 4.5→4.86 | 明日预算×0.90', result: 'ok', operator: '系统自动', note: '' },
  ],
  '清扬男士洗发水': [
    { date: '05/28', rule: 'R3', action: '预算¥3000→¥3450 +15%（16:00待执行）', result: 'warn', operator: '待执行', note: '' },
    { date: '05/27', rule: 'DT3', action: '明日预算¥2700→¥3240 +20%', result: 'ok', operator: '系统自动', note: '' },
    { date: '05/26', rule: 'R3', action: '预算¥2500→¥2875 +15%', result: 'ok', operator: '系统自动', note: '大促追量' },
    { date: '05/25', rule: 'R3', action: '预算¥2200→¥2530 +15%', result: 'ok', operator: '系统自动', note: '' },
    { date: '05/24', rule: 'DT3', action: '明日预算¥2000→¥2400 +20%', result: 'ok', operator: '系统自动', note: '' },
    { date: '05/23', rule: 'R3', action: '预算¥2000→¥2300 +15%', result: 'ok', operator: '系统自动', note: '' },
    { date: '05/22', rule: '—', action: '无触发，参数维持', result: 'skip', operator: '—', note: '' },
    { date: '05/21', rule: 'R3', action: '预算¥1800→¥2070 +15%', result: 'ok', operator: '系统自动', note: '' },
    { date: '05/20', rule: 'DT3', action: '明日预算×1.20', result: 'ok', operator: '系统自动', note: '' },
    { date: '05/19', rule: 'R3', action: '预算¥1600→¥1840 +15%', result: 'ok', operator: '系统自动', note: '' },
    { date: '05/18', rule: '—', action: '无触发，参数维持', result: 'skip', operator: '—', note: '' },
    { date: '05/17', rule: 'R3', action: '预算¥1500→¥1725 +15%', result: 'ok', operator: '系统自动', note: '' },
    { date: '05/16', rule: 'DT3', action: '明日预算×1.20', result: 'ok', operator: '系统自动', note: '' },
    { date: '05/15', rule: 'R3', action: '预算¥1400→¥1610 +15%', result: 'ok', operator: '系统自动', note: '' },
  ],
}

// Default history for plans without specific data
const _defaultHistPlans = ['潘婷修护发膜', 'VS沙宣护发素', '力士香薰沐浴露', '多芬身体乳', '飘柔柔顺洗发水', '舒肤佳抑菌香皂']
_defaultHistPlans.forEach(n => {
  if (!PLAN_HIST_LOG[n]) PLAN_HIST_LOG[n] = [
    { date: '05/27', rule: '—', action: '无触发，参数维持', result: 'skip', operator: '—', note: '' },
    { date: '05/26', rule: 'R3', action: '预算适量追加', result: 'ok', operator: '系统自动', note: '' },
    { date: '05/25', rule: '—', action: '无触发，参数维持', result: 'skip', operator: '—', note: '' },
  ]
})

// Action log built from timepoints
export interface ActionLogEntry {
  time: string; timepoint: string; plan: string; rule: string; action: string
  type: string; operator: string; note: string
}
export const initialActionLog: ActionLogEntry[] = []
timepoints.forEach(tp => {
  tp.results.forEach(r => {
    if (r.initStatus === 'executed' || r.initStatus === 'confirmed') {
      initialActionLog.push({
        time: r.execTime || '—',
        timepoint: tp.time + ' ' + tp.name,
        plan: r.plan, rule: r.rule, action: r.actionText,
        type: r.initStatus, operator: r.operator || '系统自动', note: r.confirmNote || '',
      })
    }
  })
})

// Rule definitions
export interface RuleDef {
  key: string; label: string; layer: 'H' | 'D' | 'W'; layerFull: string; color: string
  auto: boolean; icon: string; trigger: string; action: string; desc: string
}
export const RULE_DEFS: RuleDef[] = [
  { key: 'R1-A', label: '紧急止损（异常消耗+零转化）', layer: 'H', layerFull: '小时层', color: '#c62828',
    auto: true,  icon: '🚨',
    trigger: '本小时花费 > 28天同段均值+2σ 且 新增成交=0 且 加购=0 且 ROI完成率<80%',
    action: '今日预算→¥0（暂停）｜关闭优质计划防停投；次日ROI上调15%后恢复',
    desc: '小时花费异常飙升且零转化，系统判定无效流量，立即暂停计划避免继续亏损。' },
  { key: 'R1-B', label: '费比偏高+预估全天亏损', layer: 'H', layerFull: '小时层', color: '#e65100',
    auto: true,  icon: '⚡',
    trigger: '计划费比 > 全店累计费比 且 预估全天收益 < 昨日全天花费',
    action: '净目标投产比×1.15（+15%）+ 剩余预算×0.80 + 关闭防停投',
    desc: '实时费比高于全店均值且预估全天ROI转负，提前压量防止当日大幅亏损。' },
  { key: 'R2-A', label: 'ROI完成率不足（压量）', layer: 'H', layerFull: '小时层', color: '#f57f17',
    auto: false, icon: '📉',
    trigger: 'ROI完成率<60% 且 花费>100元 且 出价方式=控投产比',
    action: '净目标投产比×1.18（+18%）+ 剩余预算×0.70',
    desc: '累计ROI完成率严重不足，强力压量收紧出价18%，大幅削减剩余预算70%。' },
  { key: 'R2-B', label: '红区止损（费比突破Gross）', layer: 'H', layerFull: '小时层', color: '#c62828',
    auto: false, icon: '⚠️',
    trigger: '当日累计费比 > Gross毛利率（进入红区）且当日花费>100元',
    action: '净目标投产比→止损ROI×1.10 + 剩余预算×0.60 + 强制关闭防停投；严重时直接暂停',
    desc: '费比突破盈亏平衡线（Gross毛利率），系统立即触发止损，ROI调至止损线×1.1，剩余预算削减60%。' },
  { key: 'R2-C', label: '黄区+全店余量不足', layer: 'H', layerFull: '小时层', color: '#f57f17',
    auto: true,  icon: '🟡',
    trigger: '计划处于黄区 且 全店毛利余量 < 0% 且当日花费>100元',
    action: '净目标投产比×1.10（上调10%）+ 当日剩余预算×0.80',
    desc: '计划费比偏高（黄区）且全店整体毛利余量已告负，联动收紧ROI目标10%并压缩剩余预算。' },
  { key: 'R3', label: '绿区紧急追量', layer: 'H', layerFull: '小时层', color: '#2e7d32',
    auto: true,  icon: '🚀',
    trigger: '计划绿区 且 ROI完成率≥130% 且 剩余预算<小时均值花费×3 且 高置信度',
    action: '今日预算+15~20% + 确认防停投已开启；ROI目标不变',
    desc: '绿区高置信度计划剩余预算即将耗尽，追加15~20%预算抓住高效流量窗口，净目标投产比维持不变。' },
  { key: 'R4', label: 'CTR异常记录', layer: 'H', layerFull: '小时层', color: '#546e7a',
    auto: true,  icon: '📋',
    trigger: 'CTR < 28日同段均值−2σ；或花费突增但ROI未达标',
    action: '记录日志+推送预警（不操作ROI或预算）；ROI未达标时升级R2-A处理',
    desc: '点击率突然跌破动态下阈值时仅记录观察，不轻易操作出价。若同时ROI未达标则升级为R2-A处理。' },
  { key: 'DT1', label: '日毛利目标超线', layer: 'D', layerFull: '日层', color: '#f57f17',
    auto: false, icon: '📊',
    trigger: '今日费比 > 利润目标费比(Gross-10%) 且花费>200元 且加购数<品类延迟保护阈值',
    action: '净目标投产比×1.08（上调8%）+ 明日预算×0.90',
    desc: '当日费比超过利润目标线（Gross毛利率-10%）但仍在绿黄交界，轻度收紧ROI目标8%并压缩次日预算。需人工确认。' },
  { key: 'DT2', label: '高加购保护', layer: 'D', layerFull: '日层', color: '#00897b',
    auto: true,  icon: '🛡️',
    trigger: '昨日加购率>品类均值×1.5 或 加购数>品类历史成交拉动阈值×1.2',
    action: '标记[培养保护]，每日预算维持不压，净目标投产比不变；覆盖DT1/R2-A',
    desc: '高加购信号预示未来转化，保护该计划预算不受ROI压降影响，等待延迟转化兑现。禁止同期执行DT1/R2-A。' },
  { key: 'DT3', label: '预算烧尽过早', layer: 'D', layerFull: '日层', color: '#1565c0',
    auto: true,  icon: '💰',
    trigger: '预测耗尽时间 < 18:00 且ROI≥80% 且绿区（中/高置信度）',
    action: '明日预算×1.20（+20%）+ 净目标投产比维持 + 确认防停投已开启',
    desc: '基于历史花费曲线预测当日预算将在晚高峰前耗尽，提前追加次日预算20%防断货，ROI达标才有此场景。' },
  { key: 'DT4', label: '全天零转化', layer: 'D', layerFull: '日层', color: '#ad1457',
    auto: false, icon: '🚫',
    trigger: '当日花费>200元 且成交=0 且加购=0 且投放≥3天',
    action: '直接暂停计划（预算→¥0）或净目标投产比×1.30 + 预算×0.50；关闭防停投',
    desc: '计划已有足够消耗但零成交零加购，判定为严重异常，优先暂停待次日人工复核，避免持续亏损。' },
  { key: 'DT5', label: '新品冷启动豁免', layer: 'D', layerFull: '日层', color: '#6a1fa2',
    auto: true,  icon: '🌱',
    trigger: '上线天数 ≤ 品类冷启动期（历史P80天数）',
    action: 'ROI下调至费比容忍Gross×1.2对应值；禁止DT1/DT4；开启多目标优化',
    desc: '新品处于冷启动期，允许费比超目标至Gross毛利率×1.2，禁止强制止损/暂停，开启多目标优化积累数据。' },
  { key: 'WK1', label: '全店周毛利复盘', layer: 'W', layerFull: '周层', color: '#1565c0',
    auto: false, icon: '📈',
    trigger: '每周一09:00，计算上周全店净毛利率 vs 目标（默认10%）',
    action: '超额→黄区ROI下调5%；不达标红区ROI上调15%+预算×0.70，黄区ROI上调8%+预算×0.85',
    desc: '每周复盘全店整体毛利达成情况，根据超额或不达标程度批量调整各区间计划的ROI目标和周预算。' },
  { key: 'WK2', label: '高潜力链接识别', layer: 'W', layerFull: '周层', color: '#00838f',
    auto: true,  icon: '⭐',
    trigger: '加购率>品类均值×1.3 且 即时ROI<目标ROI 且 预估转化价值>当周花费×目标费比',
    action: '标记[重点培养]，本周预算+30%，净目标投产比下调8%（放量）',
    desc: '加购率高但ROI暂时不达标的计划，预估转化价值已超目标，判定为高潜力链接，主动追加预算放量培养。' },
  { key: 'WK3', label: '持续亏损建议下线', layer: 'W', layerFull: '周层', color: '#6d4c41',
    auto: false, icon: '🔴',
    trigger: '连续3周红区 且 周加购数<品类均值×0.3 且 上线>冷启动期×2',
    action: '标记[建议下线]，预算×0.30，ROI上调至止损线+20%；冻结R3/DT3；触发人工审核',
    desc: '连续三周亏损且加购量极低，已过冷启动期保护，极端保守处理并冻结追量规则，等待人工决策是否下线。' },
  { key: 'WK4', label: '预算利用率异常', layer: 'W', layerFull: '周层', color: '#37474f',
    auto: false, icon: '📏',
    trigger: 'A：周均利用率<60%；B：日均12:00前耗尽',
    action: 'A→建议ROI下调5~10%（人工确认）；B→建议预算×1.50（人工确认）',
    desc: '利用率过低说明ROI目标设太高出价没竞争力；利用率过高易断货。两种异常各推送建议，人工确认后执行。' },
  { key: 'WK5', label: '生命周期+预算分配', layer: 'W', layerFull: '周层', color: '#283593',
    auto: true,  icon: '🗂️',
    trigger: '每周一09:00必执行，基于上周完整7天数据',
    action: '更新生命周期标签 + 重新拟合增量ROI曲线 + 输出各计划本周建议每日预算上限(b_i*)',
    desc: '每周自动更新计划生命周期标签（培养/成长/成熟/衰退），用增量ROI等边际原则最优分配全店周预算。' },
]

// Alert items for side panel
export interface SidePanelAlert {
  id: string; plan: string; rule: string; zone: 'red' | 'yellow' | 'green'; deadline: string
  detail: string; actionText: string; status: 'pending' | 'done'
}
export const sidePanelAlerts: SidePanelAlert[] = [
  { id: 'r1402', plan: 'UNO男士控油乳液', rule: 'R2-B 止损', zone: 'red', deadline: '14:00 今日',
    detail: '费比34.1% > Gross32%，中置信度，红区确认止损', actionText: 'ROI:5.5→3.44 | 剩余×0.60 | 防停投关闭', status: 'pending' },
  { id: 'r1403', plan: '护发品类整体', rule: '类目费比异常', zone: 'yellow', deadline: '14:00 今日',
    detail: '护发品类费比22.1% vs 历史19.3%，上升14.5%', actionText: '黄区护发计划整体ROI上调5% 或 维持观察至16:00', status: 'pending' },
  { id: 'r1404', plan: '潘婷修护发膜', rule: 'R2-C', zone: 'yellow', deadline: '14:00 今日',
    detail: '黄区+全店余量-1.8%，收紧模式', actionText: 'ROI:5.5→6.05 | 剩余×0.80', status: 'pending' },
  { id: 'r0901', plan: '施华蔻养发精华液', rule: 'R1-A', zone: 'red', deadline: '09:02 今日',
    detail: '小时花费异常+零成交，已暂停计划', actionText: '今日预算→¥0 | 防停投已关闭', status: 'done' },
  { id: 'r1201', plan: '海飞丝去屑洗发水', rule: 'DT1 预执行', zone: 'yellow', deadline: '12:15 今日',
    detail: '费比趋势上升，人工预执行DT1', actionText: 'ROI:5.2→5.62 | 明日预算→¥4500', status: 'done' },
]

// Legacy exports for compatibility
export const mockStoreConfig = {
  id: '1',
  created_at: new Date().toISOString(),
  store_name: '全站推广店铺',
  gross_margin_rate: store.grossMargin,
  t2_net_margin_rate: 0.06,
  t2_cost_rate: 0.25,
  weekly_margin_target: store.weeklyTarget,
  weekly_actual_margin: store.weeklyNetProfit,
}
export const mockPlans = plans.map((p, i) => ({
  id: String(i + 1), created_at: '', updated_at: '',
  name: p.name, category_id: '1',
  roi_target: p.roiTarget, daily_budget: p.budget,
  bid_mode: p.guard ? 'roi' : 'roi',
  bid_objective: 'net',
  anti_stop_enabled: p.guard,
  multi_target_enabled: PLAN_PARAMS[p.name]?.multiTarget || false,
  quick_boost_enabled: false, budget_type: 'daily',
  zone: p.zone, confidence: p.conf, is_active: true,
  gross_margin_rate: p.gross,
  spend_today: p.spend, revenue_today: Math.round(p.spend / p.febi),
  roi_completion_rate: (p.spend / p.febi / p.spend) / p.roiTarget,
  cost_rate_today: p.febi,
}))
export const mockAlerts: import('../types/database').Alert[] = []
export const mockActionLog: import('../types/database').ActionLog[] = []
