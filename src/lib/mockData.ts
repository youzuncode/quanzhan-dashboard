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
  // 商品/货品/条码:前台商品 itemId、货品 skuId 各店独立不可跨店比对;
  // 只有条码 barcode(69码)是跨店唯一锚点,用于跨店同款归并
  itemId?: string
  skuId?: string
  barcode?: string
  // 前台定价(店铺级,各店不同)。同一条码成本一致,价格不同 → 毛利率/盈亏线不同
  price?: number
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

// ═══════════════════════════════════════════════════════
// PLAN DAILY & HOURLY DATA  (直接从 HTML 移植)
// ═══════════════════════════════════════════════════════
export interface DailyRow {
  date: string; spend: number; rev: number; roi: number | null; febi: number | null
  orders: number | null; budget: number; tRoi: number; rule: string; action: string; atype: string
  clicks?: number | null; ctr?: number | null; impr?: number | null
  cpc?: number | null; favs?: number | null; addcart?: number | null; cvr?: number | null
  _enriched?: boolean
}
export interface HourlyRow {
  h: number; spend: number; rev: number | null; roi: number | null; febi: number | null
  orders: number | null; cvr: number | null; threshold: number; rule: string; action: string; atype: string
  clicks?: number | null; ctr?: number | null; impr?: number | null; cpc?: number | null
}

// Deterministic enrich: derive clicks/ctr/impr/cpc/favs/addcart from spend+orders
export function enrichRow(d: DailyRow, seedStr: string): DailyRow {
  if (d._enriched) return d
  let h = 0
  for (let i = 0; i < seedStr.length; i++) h = (Math.imul(31, h) + seedStr.charCodeAt(i)) | 0
  const rng = (min: number, max: number) => { h = (Math.imul(1664525, h) + 1013904223) | 0; return min + ((h >>> 0) / 4294967296) * (max - min) }
  if (d.orders != null && d.orders > 0 && d.spend > 0) {
    const cvr = d.cvr != null ? d.cvr : parseFloat(rng(1.8, 4.5).toFixed(2))
    const clicks = Math.max(1, Math.round(d.orders / (cvr / 100)))
    const ctr = parseFloat(rng(0.65, 1.85).toFixed(2))
    d.cvr = cvr; d.clicks = clicks; d.ctr = ctr
    d.impr = Math.round(clicks / (ctr / 100))
    d.cpc = parseFloat((d.spend / clicks).toFixed(2))
    d.favs = Math.round(d.orders * rng(0.25, 0.55))
    d.addcart = Math.round(d.orders * rng(0.85, 1.70))
  } else {
    d.clicks = null; d.ctr = null; d.impr = null; d.cpc = null; d.favs = null; d.addcart = null
  }
  d._enriched = true
  return d
}

// Deterministic row generator (same algorithm as HTML _genDailyRow)
function genDailyRow(p: PlanData, dt: Date): DailyRow {
  const m = dt.getMonth() + 1, day = dt.getDate()
  let h = (p.roiTarget * 100 | 0) * 10000 + (m * 100 + day)
  const rng = (mn: number, mx: number) => { h = (Math.imul(1664525, h) + 1013904223) | 0; return mn + ((h >>> 0) / 4294967296) * (mx - mn) }
  const roi = parseFloat((p.roiTarget * (0.84 + rng(0, 0.30))).toFixed(2))
  const febi = parseFloat((100 / roi).toFixed(1))
  const spend = Math.round(p.budget * (0.70 + rng(0, 0.48)))
  const zone = febi > p.gross * 100 ? 'red' : febi > (p.gross * 100 - 10) ? 'yellow' : 'green'
  const rule = zone === 'red' ? 'R2-C' : zone === 'yellow' && (m + day) % 4 === 0 ? 'DT1' : zone === 'green' && (m + day) % 3 === 0 ? 'R3' : '—'
  const atype = rule === '—' ? '' : zone
  return {
    date: `${m}/${day}`, spend, rev: Math.round(spend * roi), roi, febi,
    orders: Math.round(spend / 58), budget: p.budget, tRoi: p.roiTarget, rule,
    action: rule === 'R3' ? '预算+15%' : rule === 'DT1' ? 'ROI上调8%|预算×0.90' : rule === 'R2-C' ? 'ROI+10%|剩余×0.80' : '无触发',
    atype,
  }
}

function genAndEnrich30(p: PlanData, explicit: DailyRow[] = []): DailyRow[] {
  const explicitSet = new Set(explicit.map(d => d.date))
  const base = new Date(2026, 3, 29) // April 29
  const rows: DailyRow[] = []
  for (let i = 0; i < 30; i++) {
    const dt = new Date(base); dt.setDate(dt.getDate() + i)
    const dateStr = `${dt.getMonth() + 1}/${dt.getDate()}`
    if (!explicitSet.has(dateStr)) rows.push(genDailyRow(p, dt))
  }
  const all = [...rows, ...explicit].sort((a, b) => {
    const [am, ad] = a.date.split('/').map(Number)
    const [bm, bd] = b.date.split('/').map(Number)
    return (am * 100 + ad) - (bm * 100 + bd)
  })
  all.forEach(d => enrichRow(d, d.date + (d.spend || 0)))
  return all
}

// ── 施华蔻养发精华液 ──────────────────────────────────
const _shCDaily: DailyRow[] = [
  { date: '05/15', spend: 6200,  rev: 21700, roi: 3.50, febi: 28.6, orders: 142, budget: 6000,  tRoi: 3.5,  rule: 'R3',      action: '预算¥6000→¥6900 +15%',              atype: 'green' },
  { date: '05/16', spend: 6900,  rev: 25530, roi: 3.70, febi: 27.0, orders: 168, budget: 7000,  tRoi: 3.5,  rule: 'DT3',     action: '明日预算×1.20',                      atype: 'green' },
  { date: '05/17', spend: 7200,  rev: 26640, roi: 3.70, febi: 27.0, orders: 175, budget: 7000,  tRoi: 3.8,  rule: 'R3',      action: '预算+15%',                           atype: 'green' },
  { date: '05/18', spend: 5200,  rev: 16120, roi: 3.10, febi: 32.3, orders: 122, budget: 5200,  tRoi: 3.8,  rule: '—',      action: '无触发',                              atype: '' },
  { date: '05/19', spend: 5800,  rev: 16820, roi: 2.90, febi: 34.5, orders: 134, budget: 5800,  tRoi: 3.8,  rule: 'R2-C',   action: 'ROI 3.5→3.85 | 剩余×0.80',          atype: 'yellow' },
  { date: '05/20', spend: 6100,  rev: 19091, roi: 3.13, febi: 31.9, orders: 148, budget: 6100,  tRoi: 3.85, rule: 'R2-B',   action: 'ROI→3.13止损 | 预算×0.60',           atype: 'red' },
  { date: '05/21', spend: 4200,  rev: 15960, roi: 3.80, febi: 26.3, orders: 118, budget: 4200,  tRoi: 3.85, rule: 'DT1',    action: 'ROI 3.8→4.10 | 明日预算×0.90',       atype: 'yellow' },
  { date: '05/22', spend: 5400,  rev: 20520, roi: 3.80, febi: 26.3, orders: 156, budget: 5400,  tRoi: 4.10, rule: 'R3',     action: '预算+15%',                           atype: 'green' },
  { date: '05/23', spend: 5800,  rev: 18560, roi: 3.20, febi: 31.3, orders: 142, budget: 6000,  tRoi: 4.10, rule: '—',      action: '无触发',                             atype: '' },
  { date: '05/24', spend: 6200,  rev: 24180, roi: 3.90, febi: 25.6, orders: 168, budget: 6200,  tRoi: 4.10, rule: 'DT3',    action: '明日预算×1.20',                      atype: 'green' },
  { date: '05/25', spend: 7800,  rev: 30420, roi: 3.90, febi: 25.6, orders: 198, budget: 8000,  tRoi: 4.10, rule: 'R3',     action: '预算+15%',                           atype: 'green' },
  { date: '05/26', spend: 8100,  rev: 29160, roi: 3.60, febi: 27.8, orders: 178, budget: 8000,  tRoi: 4.20, rule: 'R2-C',   action: 'ROI 4.0→4.4 | 剩余×0.80',           atype: 'yellow' },
  { date: '05/27', spend: 9200,  rev: 38640, roi: 4.20, febi: 23.8, orders: 201, budget: 9000,  tRoi: 4.20, rule: 'DT1',    action: 'ROI 4.2→4.54 | 明日预算→¥8100',      atype: 'yellow' },
  { date: '05/28', spend: 8400,  rev: 22050, roi: 2.63, febi: 38.1, orders: 156, budget: 8400,  tRoi: 4.54, rule: 'R1-A+R2-B', action: '暂停计划(预算→¥0) | ROI止损→3.45', atype: 'red' },
]

// ── UNO男士控油乳液 ───────────────────────────────────
const _unoCDaily: DailyRow[] = [
  { date: '05/15', spend: 380,  rev: 1672,  roi: 4.40, febi: 22.7, orders: 28, budget: 400,  tRoi: 4.5,  rule: 'R3',      action: '预算¥400→¥480 +20%',              atype: 'green' },
  { date: '05/16', spend: 420,  rev: 1890,  roi: 4.50, febi: 22.2, orders: 32, budget: 480,  tRoi: 4.5,  rule: '—',      action: '无触发',                          atype: '' },
  { date: '05/17', spend: 480,  rev: 2016,  roi: 4.20, febi: 23.8, orders: 35, budget: 480,  tRoi: 4.5,  rule: '—',      action: '无触发',                          atype: '' },
  { date: '05/18', spend: 460,  rev: 2162,  roi: 4.70, febi: 21.3, orders: 36, budget: 500,  tRoi: 4.5,  rule: 'DT3',    action: '明日预算×1.20',                   atype: 'green' },
  { date: '05/19', spend: 500,  rev: 2000,  roi: 4.00, febi: 25.0, orders: 34, budget: 500,  tRoi: 4.5,  rule: '—',      action: '无触发',                          atype: '' },
  { date: '05/20', spend: 480,  rev: 2016,  roi: 4.20, febi: 23.8, orders: 33, budget: 500,  tRoi: 4.5,  rule: 'R1-B',   action: 'ROI 4.0→4.60(×1.15) | 剩余×0.80', atype: 'yellow' },
  { date: '05/21', spend: 420,  rev: 1764,  roi: 4.20, febi: 23.8, orders: 30, budget: 420,  tRoi: 4.60, rule: '—',      action: '无触发',                          atype: '' },
  { date: '05/22', spend: 440,  rev: 1716,  roi: 3.90, febi: 25.6, orders: 28, budget: 500,  tRoi: 4.60, rule: 'R2-C',   action: 'ROI 4.2→4.62 | 剩余×0.80',       atype: 'yellow' },
  { date: '05/23', spend: 480,  rev: 1872,  roi: 3.90, febi: 25.6, orders: 30, budget: 500,  tRoi: 4.62, rule: 'DT1',    action: 'ROI 4.5→4.86 | 明日预算×0.90',    atype: 'yellow' },
  { date: '05/24', spend: 460,  rev: 1656,  roi: 3.60, febi: 27.8, orders: 27, budget: 500,  tRoi: 4.86, rule: '—',      action: '无触发',                          atype: '' },
  { date: '05/25', spend: 490,  rev: 1666,  roi: 3.40, febi: 29.4, orders: 26, budget: 500,  tRoi: 4.86, rule: '—',      action: '无触发',                          atype: '' },
  { date: '05/26', spend: 500,  rev: 1700,  roi: 3.40, febi: 29.4, orders: 25, budget: 500,  tRoi: 4.86, rule: 'R2-C',   action: 'ROI 4.8→5.28 | 剩余×0.80',       atype: 'yellow' },
  { date: '05/27', spend: 490,  rev: 1666,  roi: 3.40, febi: 29.4, orders: 24, budget: 500,  tRoi: 5.28, rule: 'DT1',    action: 'ROI 5.0→5.40 | 明日预算×0.90',    atype: 'yellow' },
  { date: '05/28', spend: 420,  rev: 1234,  roi: 2.94, febi: 34.1, orders: 18, budget: 500,  tRoi: 5.50, rule: 'R2-B待确认', action: 'ROI:5.5→3.44止损 | 剩余×0.60 ⏳待确认', atype: 'red' },
]

// ── 海飞丝去屑洗发水 ──────────────────────────────────
const _hfsCDaily: DailyRow[] = [
  { date: '05/15', spend: 7800,  rev: 35100, roi: 4.50, febi: 22.2, orders: 285, budget: 8000,  tRoi: 4.5,  rule: 'DT1',  action: 'ROI 4.5→4.86 | 明日预算×0.90',     atype: 'yellow' },
  { date: '05/16', spend: 7200,  rev: 32760, roi: 4.55, febi: 22.0, orders: 265, budget: 7200,  tRoi: 4.86, rule: '—',   action: '无触发',                            atype: '' },
  { date: '05/17', spend: 7500,  rev: 37500, roi: 5.00, febi: 20.0, orders: 298, budget: 8000,  tRoi: 4.86, rule: 'R3',  action: '预算+15%',                          atype: 'green' },
  { date: '05/18', spend: 8800,  rev: 40480, roi: 4.60, febi: 21.7, orders: 312, budget: 9000,  tRoi: 4.86, rule: '—',   action: '无触发',                            atype: '' },
  { date: '05/19', spend: 9400,  rev: 47000, roi: 5.00, febi: 20.0, orders: 358, budget: 9400,  tRoi: 4.86, rule: 'DT3', action: '明日预算×1.20',                     atype: 'green' },
  { date: '05/20', spend: 9800,  rev: 42140, roi: 4.30, febi: 23.3, orders: 325, budget: 10000, tRoi: 4.86, rule: 'R2-C',action: 'ROI 4.6→5.06 | 剩余×0.80',         atype: 'yellow' },
  { date: '05/21', spend: 8200,  rev: 38540, roi: 4.70, febi: 21.3, orders: 302, budget: 8500,  tRoi: 5.06, rule: '—',   action: '无触发',                            atype: '' },
  { date: '05/22', spend: 8500,  rev: 40375, roi: 4.75, febi: 21.1, orders: 315, budget: 8500,  tRoi: 5.06, rule: 'R3',  action: '预算+15%',                          atype: 'green' },
  { date: '05/23', spend: 9200,  rev: 37720, roi: 4.10, febi: 24.4, orders: 298, budget: 9200,  tRoi: 5.06, rule: '—',   action: '无触发',                            atype: '' },
  { date: '05/24', spend: 9800,  rev: 44100, roi: 4.50, febi: 22.2, orders: 338, budget: 10000, tRoi: 5.06, rule: 'DT1', action: 'ROI 4.8→5.18 | 明日预算×0.90',      atype: 'yellow' },
  { date: '05/25', spend: 9200,  rev: 49680, roi: 5.40, febi: 18.5, orders: 385, budget: 9000,  tRoi: 5.18, rule: 'R3',  action: '预算+15%',                          atype: 'green' },
  { date: '05/26', spend: 10200, rev: 44880, roi: 4.40, febi: 22.7, orders: 352, budget: 10000, tRoi: 5.18, rule: 'DT3', action: '明日预算¥10000→¥12000 +20%',        atype: 'green' },
  { date: '05/27', spend: 12100, rev: 52030, roi: 4.30, febi: 23.3, orders: 395, budget: 11000, tRoi: 5.18, rule: 'R3',  action: '预算¥11000→¥12650 +15%',            atype: 'green' },
  { date: '05/28', spend: 12100, rev: 31460, roi: 2.60, febi: 26.0, orders: 245, budget: 12650, tRoi: 5.20, rule: 'DT1预执行', action: 'ROI:5.2→5.62（人工预执行） | 明日预算→¥4500', atype: 'yellow' },
]

// ── 清扬男士洗发水 ────────────────────────────────────
const _qyCDaily: DailyRow[] = [
  { date: '05/15', spend: 1450, rev: 9280,  roi: 6.40, febi: 15.6, orders: 96,  budget: 1500, tRoi: 6.5, rule: 'R3',  action: '预算¥1400→¥1610 +15%',      atype: 'green' },
  { date: '05/16', spend: 1580, rev: 11218, roi: 7.10, febi: 14.1, orders: 112, budget: 1600, tRoi: 6.5, rule: 'DT3', action: '明日预算×1.20',              atype: 'green' },
  { date: '05/17', spend: 1720, rev: 12040, roi: 7.00, febi: 14.3, orders: 118, budget: 1700, tRoi: 6.8, rule: 'R3',  action: '预算+15%',                   atype: 'green' },
  { date: '05/18', spend: 1650, rev: 11220, roi: 6.80, febi: 14.7, orders: 108, budget: 1700, tRoi: 6.8, rule: '—',  action: '无触发',                      atype: '' },
  { date: '05/19', spend: 1600, rev: 11840, roi: 7.40, febi: 13.5, orders: 115, budget: 1600, tRoi: 6.8, rule: 'R3',  action: '预算+15%',                   atype: 'green' },
  { date: '05/20', spend: 1840, rev: 13800, roi: 7.50, febi: 13.3, orders: 128, budget: 1900, tRoi: 6.8, rule: 'DT3', action: '明日预算×1.20',              atype: 'green' },
  { date: '05/21', spend: 1820, rev: 14196, roi: 7.80, febi: 12.8, orders: 135, budget: 2000, tRoi: 7.0, rule: 'R3',  action: '预算+15%',                   atype: 'green' },
  { date: '05/22', spend: 2000, rev: 15400, roi: 7.70, febi: 13.0, orders: 145, budget: 2000, tRoi: 7.0, rule: '—',  action: '无触发',                      atype: '' },
  { date: '05/23', spend: 2000, rev: 15200, roi: 7.60, febi: 13.2, orders: 140, budget: 2000, tRoi: 7.0, rule: 'R3',  action: '预算+15%',                   atype: 'green' },
  { date: '05/24', spend: 2300, rev: 17480, roi: 7.60, febi: 13.2, orders: 158, budget: 2400, tRoi: 7.0, rule: 'DT3', action: '明日预算×1.20',              atype: 'green' },
  { date: '05/25', spend: 2400, rev: 19200, roi: 8.00, febi: 12.5, orders: 172, budget: 2500, tRoi: 7.0, rule: 'R3',  action: '预算+15%',                   atype: 'green' },
  { date: '05/26', spend: 2500, rev: 19500, roi: 7.80, febi: 12.8, orders: 168, budget: 2500, tRoi: 7.0, rule: '—',  action: '无触发',                      atype: '' },
  { date: '05/27', spend: 2700, rev: 21600, roi: 8.00, febi: 12.5, orders: 180, budget: 2700, tRoi: 7.0, rule: 'DT3', action: '明日预算¥2700→¥3240 +20%',  atype: 'green' },
  { date: '05/28', spend: 9300, rev: 65100, roi: 7.00, febi: 14.3, orders: 158, budget: 3000, tRoi: 7.0, rule: 'R3待执行', action: '预算¥3000→¥3450 +15%（16:00执行）', atype: 'green' },
]

// Build PLAN_DAILY_DATA: explicit plans extended to 30 days, others generated
export const PLAN_DAILY_DATA: Record<string, DailyRow[]> = {}

const _explicitPlans: Record<string, DailyRow[]> = {
  '施华蔻养发精华液': _shCDaily,
  'UNO男士控油乳液': _unoCDaily,
  '海飞丝去屑洗发水': _hfsCDaily,
  '清扬男士洗发水': _qyCDaily,
}

plans.forEach(p => {
  const explicit = _explicitPlans[p.name] || []
  PLAN_DAILY_DATA[p.name] = genAndEnrich30(p, explicit)
})

// ── Hourly data (今日分时) ─────────────────────────────
export const PLAN_HOURLY_DATA: Record<string, HourlyRow[]> = {
  '施华蔻养发精华液': [
    { h: 9,  spend: 1240, rev: 2046, roi: 1.65, febi: 60.6, orders: 12, cvr: 1.35, threshold: 892,  rule: 'R1-A',      action: '小时花费超阈值+零成交→暂停计划',                 atype: 'red' },
    { h: 10, spend: 0,    rev: 0,    roi: null,  febi: null, orders: 0,  cvr: null,  threshold: 920,  rule: '—',        action: '已暂停（R1-A执行中）',                         atype: 'pause' },
    { h: 11, spend: 0,    rev: 0,    roi: null,  febi: null, orders: 0,  cvr: null,  threshold: 905,  rule: '—',        action: '已暂停',                                       atype: 'pause' },
    { h: 12, spend: 0,    rev: 0,    roi: null,  febi: null, orders: 0,  cvr: null,  threshold: 898,  rule: '—',        action: '已暂停',                                       atype: 'pause' },
    { h: 13, spend: 0,    rev: 0,    roi: null,  febi: null, orders: 0,  cvr: null,  threshold: 912,  rule: '—',        action: '已暂停',                                       atype: 'pause' },
    { h: 14, spend: 0,    rev: 0,    roi: null,  febi: null, orders: 0,  cvr: null,  threshold: 925,  rule: 'R2-B',     action: '14:00确认：维持暂停 | ROI目标→3.45（止损×1.1）', atype: 'red' },
  ],
  'UNO男士控油乳液': [
    { h: 9,  spend: 52,  rev: 156,  roi: 3.00, febi: 33.3, orders: 2, cvr: 0.71, threshold: 68, rule: '—',           action: '监控中，费比偏高',                              atype: 'yellow' },
    { h: 10, spend: 61,  rev: 172,  roi: 2.82, febi: 35.5, orders: 2, cvr: 0.65, threshold: 72, rule: '—',           action: '费比持续升高',                                 atype: 'yellow' },
    { h: 11, spend: 58,  rev: 162,  roi: 2.79, febi: 35.8, orders: 2, cvr: 0.68, threshold: 70, rule: '—',           action: '监控中',                                       atype: 'yellow' },
    { h: 12, spend: 72,  rev: 194,  roi: 2.69, febi: 37.1, orders: 2, cvr: 0.56, threshold: 74, rule: 'R2-B预警',    action: '费比32.1%逼近Gross止损线，推送预警',             atype: 'red' },
    { h: 13, spend: 65,  rev: 182,  roi: 2.80, febi: 35.7, orders: 2, cvr: 0.61, threshold: 72, rule: '—',           action: '等待中置信度确认',                             atype: 'yellow' },
    { h: 14, spend: 112, rev: 291,  roi: 2.60, febi: 38.5, orders: 3, cvr: 0.58, threshold: 76, rule: 'R2-B待确认', action: '费比34.1%>Gross32%，待人工确认执行止损',         atype: 'red' },
  ],
  '海飞丝去屑洗发水': [
    { h: 9,  spend: 980,  rev: 3920, roi: 4.00, febi: 25.0, orders: 28, cvr: 0.74, threshold: 1050, rule: '—',             action: '正常运行',                                     atype: 'green' },
    { h: 10, spend: 1120, rev: 4816, roi: 4.30, febi: 23.3, orders: 34, cvr: 0.81, threshold: 1080, rule: '—',             action: '正常运行',                                     atype: 'green' },
    { h: 11, spend: 1050, rev: 4410, roi: 4.20, febi: 23.8, orders: 32, cvr: 0.80, threshold: 1060, rule: '—',             action: '正常运行',                                     atype: 'green' },
    { h: 12, spend: 1380, rev: 4554, roi: 3.30, febi: 30.3, orders: 38, cvr: 0.79, threshold: 1100, rule: 'DT1触发→预执行', action: '费比超目标趋势上升，12:15人工预执行DT1：ROI:5.2→5.62', atype: 'yellow' },
    { h: 13, spend: 1240, rev: 4464, roi: 3.60, febi: 27.8, orders: 35, cvr: 0.80, threshold: 1090, rule: '—',             action: '已执行DT1，观察中',                            atype: 'yellow' },
    { h: 14, spend: 7330, rev: null, roi: null,  febi: null, orders: null, cvr: null, threshold: 1120, rule: '—',           action: '截至14:00累计数据',                            atype: '' },
  ],
  '清扬男士洗发水': [
    { h: 9,  spend: 720,  rev: 5040, roi: 7.00, febi: 14.3, orders: 62,   cvr: 1.94, threshold: 780, rule: '—',      action: '正常运行',                           atype: 'green' },
    { h: 10, spend: 840,  rev: 6048, roi: 7.20, febi: 13.9, orders: 72,   cvr: 2.00, threshold: 800, rule: '—',      action: '正常运行',                           atype: 'green' },
    { h: 11, spend: 780,  rev: 5460, roi: 7.00, febi: 14.3, orders: 65,   cvr: 1.91, threshold: 790, rule: '—',      action: '正常运行',                           atype: 'green' },
    { h: 12, spend: 920,  rev: 6624, roi: 7.20, febi: 13.9, orders: 78,   cvr: 2.00, threshold: 820, rule: '—',      action: '正常运行',                           atype: 'green' },
    { h: 13, spend: 860,  rev: 6020, roi: 7.00, febi: 14.3, orders: 70,   cvr: 1.89, threshold: 810, rule: '—',      action: '正常运行',                           atype: 'green' },
    { h: 14, spend: 5180, rev: null, roi: null,  febi: null, orders: null, cvr: null, threshold: 840, rule: 'R3预检', action: '16:00将执行R3预算追加：¥3000→¥3450', atype: 'green' },
  ],
}

// Generate hourly for remaining plans (deterministic)
function genHourlyForPlan(p: PlanData): HourlyRow[] {
  let h = (p.roiTarget * 100 | 0) * 777 + 12345
  const rng = (mn: number, mx: number) => { h = (Math.imul(1664525, h) + 1013904223) | 0; return mn + ((h >>> 0) / 4294967296) * (mx - mn) }
  return [9, 10, 11, 12, 13, 14].map(hour => {
    const spend = Math.round(p.budget / 14 * (0.08 + rng(0, 0.05)))
    const roi = parseFloat((p.roiTarget * (0.88 + rng(0, 0.28))).toFixed(2))
    const febi = parseFloat((100 / roi).toFixed(1))
    const zone = febi > p.gross * 100 ? 'red' : febi > (p.gross * 100 - 10) ? 'yellow' : 'green'
    const orders = Math.round(spend / 70)
    const cvr = parseFloat((1.2 + rng(0, 0.9)).toFixed(2))
    return {
      h: hour, spend, rev: Math.round(spend * roi), roi, febi, orders, cvr,
      threshold: Math.round(spend * 1.2), rule: '—', action: '正常运行', atype: zone,
    }
  })
}

;['潘婷修护发膜', 'VS沙宣护发素', '力士香薰沐浴露', '多芬身体乳', '飘柔柔顺洗发水', '舒肤佳抑菌香皂'].forEach(name => {
  if (!PLAN_HOURLY_DATA[name]) {
    const p = plans.find(pl => pl.name === name)
    if (p) PLAN_HOURLY_DATA[name] = genHourlyForPlan(p)
  }
})

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

// ═══════════════════════════════════════════════════════
// MULTI-STORE SUPPORT
// ═══════════════════════════════════════════════════════

export interface StoreInfo {
  id: string
  name: string
  tag: string
  tagColor: string
  storeConfig: typeof store
  plans: PlanData[]
}

const store2Config = { febi: 0.212, weeklyNetProfit: 0.071, weeklyTarget: 0.10, grossMargin: 0.34, targetFebi: 0.24, storeMarginGap: -0.029, totalSpend: 31200, totalRevenue: 147170, triggeredRulesCount: 4 }
const store3Config = { febi: 0.163, weeklyNetProfit: 0.118, weeklyTarget: 0.10, grossMargin: 0.29, targetFebi: 0.19, storeMarginGap: 0.018, totalSpend: 18900, totalRevenue: 115950, triggeredRulesCount: 2 }

const plans2: PlanData[] = [
  { name: '玉兰油多效修护霜',   zone: 'red',    roiTarget: 3.8, febi: 0.36, gross: 0.32, budget: 800,  spend: 9200,  conf: 'M', guard: false, rule: 'R2-B待确认', action: 'ROI:3.8→3.13 | 剩余×0.60\n待人工确认→' },
  { name: '雅诗兰黛小棕瓶精华', zone: 'yellow', roiTarget: 4.2, febi: 0.27, gross: 0.35, budget: 3500, spend: 8400,  conf: 'H', guard: false, rule: 'DT1已预执行', action: 'ROI已调4.0→4.2\n明日预算¥3500→¥3150' },
  { name: '兰蔻小黑瓶精华液',   zone: 'yellow', roiTarget: 4.5, febi: 0.25, gross: 0.33, budget: 2800, spend: 6300,  conf: 'H', guard: false, rule: '—',           action: 'ROI维持4.5 | 预算维持' },
  { name: 'SK-II神仙水',        zone: 'green',  roiTarget: 5.5, febi: 0.19, gross: 0.38, budget: 4000, spend: 10800, conf: 'H', guard: true,  rule: 'R3触发中',    action: 'ROI维持5.5\n预算+15%→¥4,600' },
  { name: '科颜氏高保湿面霜',   zone: 'green',  roiTarget: 5.0, febi: 0.21, gross: 0.36, budget: 2500, spend: 5800,  conf: 'H', guard: true,  rule: '—',           action: 'ROI维持5.0 | 预算维持' },
  { name: '珀莱雅双抗精华',     zone: 'green',  roiTarget: 6.0, febi: 0.17, gross: 0.40, budget: 2000, spend: 4100,  conf: 'M', guard: true,  rule: 'R3触发中',    action: 'ROI维持6.0\n预算+18%→¥2,360' },
  { name: '修丽可色修精华',     zone: 'red',    roiTarget: 3.5, febi: 0.41, gross: 0.30, budget: 0,    spend: 5100,  conf: 'L', guard: false, rule: 'R1-A,R2-B',   action: '暂停（预算→¥0）\nROI:3.5→3.33（止损×1.1）' },
  { name: '悦木之源菌菇水',     zone: 'green',  roiTarget: 5.8, febi: 0.18, gross: 0.37, budget: 1800, spend: 3600,  conf: 'H', guard: true,  rule: '—',           action: 'ROI维持5.8 | 预算维持' },
]

const plans3: PlanData[] = [
  { name: '舒肤佳沐浴露家庭装', zone: 'green',  roiTarget: 7.2, febi: 0.14, gross: 0.30, budget: 1500, spend: 3800,  conf: 'H', guard: true,  rule: 'R3触发中',  action: 'ROI维持7.2\n预算+20%→¥1,800' },
  { name: '蓝月亮洗衣液',       zone: 'yellow', roiTarget: 5.5, febi: 0.21, gross: 0.25, budget: 2000, spend: 5200,  conf: 'M', guard: false, rule: '—',         action: 'ROI维持5.5 | 预算维持' },
  { name: '立白洗洁精大桶装',   zone: 'green',  roiTarget: 8.0, febi: 0.13, gross: 0.28, budget: 800,  spend: 1900,  conf: 'H', guard: true,  rule: '—',         action: 'ROI维持8.0 | 预算维持' },
  { name: '云南白药牙膏',       zone: 'red',    roiTarget: 4.5, febi: 0.32, gross: 0.28, budget: 600,  spend: 4200,  conf: 'L', guard: false, rule: 'R2-B待确认', action: 'ROI:4.5→3.57 | 剩余×0.60\n待人工确认→' },
  { name: '滴露消毒洗手液',     zone: 'green',  roiTarget: 6.8, febi: 0.15, gross: 0.31, budget: 1200, spend: 2800,  conf: 'H', guard: true,  rule: '—',         action: 'ROI维持6.8 | 预算维持' },
  { name: '花王洁霸洗衣凝珠',   zone: 'yellow', roiTarget: 5.2, febi: 0.22, gross: 0.26, budget: 1600, spend: 3500,  conf: 'M', guard: false, rule: 'DT1触发',   action: 'ROI+8%→5.62\n明日预算×0.90' },
]

// Generate a store-specific action log from any store's plans
export function generateActionLog(storePlans: PlanData[]): ActionLogEntry[] {
  const log: ActionLogEntry[] = []
  const timeLabels = [
    ['09:12', '09:00 天层参数'], ['11:45', '12:00 低置信巡检'],
    ['14:03', '14:00 止损巡检'], ['16:20', '16:00 绿区保障'],
    ['18:05', '18:00 ⭐最重要巡检'], ['20:18', '20:00 最后追加'],
  ]
  let seed = storePlans.length * 17
  const rng = () => { seed = (seed * 1664525 + 1013904223) & 0x7fffffff; return seed / 0x7fffffff }

  storePlans.forEach((p, i) => {
    if (!p.rule || p.rule === '—') return
    const ruleKey = p.rule.replace(/[待确认已预执行触发中]/g, '').trim() || p.rule
    const isPending = p.rule.includes('待确认')
    const isExecuted = p.rule.includes('已预执行') || p.rule.includes('已执行') || p.rule.includes('触发中')
    const [time, timepoint] = timeLabels[i % timeLabels.length]
    const type = isPending ? 'info' : isExecuted ? 'executed' : 'confirmed'
    const operator = isPending ? '待人工确认' : rng() > 0.5 ? '系统自动' : '操作员'
    log.push({
      time,
      timepoint,
      plan: p.name,
      rule: ruleKey,
      action: p.action.replace(/\n/g, ' | '),
      type,
      operator,
      note: isPending ? '需在截止时间前确认' : '',
    })
  })
  return log
}

// ── Per-store derived data generators ──────────────────
// All deterministic: same plans → same output.
function _seedFromPlans(plans: PlanData[]): () => number {
  let seed = plans.reduce((s, p) => s + p.name.length * 13 + Math.round(p.febi * 1000), 7)
  return () => { seed = (seed * 1664525 + 1013904223) & 0x7fffffff; return seed / 0x7fffffff }
}
function _zoneOf(p: PlanData): 'red' | 'yellow' | 'green' {
  const sl = p.gross, pt = p.gross - 0.1
  return p.febi > sl ? 'red' : p.febi > pt ? 'yellow' : 'green'
}

// 今日参数操作指令
export function generateParamOps(plans: PlanData[]): ParamOp[] {
  const roiItems = plans
    .filter(p => p.rule && p.rule !== '—' && (_zoneOf(p) === 'red' || p.rule.includes('DT1')))
    .slice(0, 3)
    .map(p => {
      const red = _zoneOf(p) === 'red'
      const nw = red ? (1 / p.gross * 1.1).toFixed(2) : (p.roiTarget * 1.08).toFixed(2)
      return { plan: p.name, cur: String(p.roiTarget), nw, badge: p.rule.includes('待确认') ? '止损待确认' : red ? '止损×1.1' : 'DT1预执行' }
    })
  const bgtItems = plans
    .filter(p => _zoneOf(p) === 'green' && (p.rule.includes('R3') || p.guard))
    .slice(0, 3)
    .map((p, i) => {
      const pct = [15, 20, 25][i % 3]
      return { plan: `${p.name} R3追加`, cur: `¥${p.budget.toLocaleString()}`, nw: `¥${Math.round(p.budget * (1 + pct / 100)).toLocaleString()}`, badge: `+${pct}%` }
    })
  const greenGuard = plans.filter(p => _zoneOf(p) === 'green' && p.guard).length
  const redGuard = plans.filter(p => _zoneOf(p) === 'red').length
  return [
    { name: '净目标投产比', icon: '🎯', type: 'roi', cls: 'act', items: roiItems.length ? roiItems : [{ plan: '全部计划', cur: '—', nw: '维持', badge: '无需调整' }] },
    { name: '每日预算', icon: '💰', type: 'bgt', cls: 'ok', items: bgtItems.length ? bgtItems : [{ plan: '全部计划', cur: '—', nw: '维持', badge: '无追加' }] },
    { name: '出价方式', icon: '⚡', type: 'mode', cls: 'warn', items: [
      { plan: '全部计划', cur: '控投产比', nw: '维持', badge: '默认' },
      { plan: '大促绿区场景', cur: '—', nw: '可切换最大化拿量', badge: '特殊场景' },
    ]},
    { name: '防停投开关', icon: '🛡', type: 'guard', cls: 'ok', items: [
      { plan: `绿区${greenGuard}计划`, cur: '—', nw: '✅ 开启', badge: '防断货' },
      { plan: `红区${redGuard}计划`, cur: '—', nw: '❌ 关闭', badge: '强制关闭' },
    ]},
  ]
}

// 主要问题
export function generateProblems(plans: PlanData[], cfg: typeof store): AlertItem[] {
  const out: AlertItem[] = []
  plans.filter(p => _zoneOf(p) === 'red').slice(0, 3).forEach(p => {
    const gap = ((p.febi - p.gross) * 100).toFixed(1)
    out.push({
      level: 'red', title: `${p.name} · ${p.rule.includes('待确认') ? '红区待确认' : '真实亏损（R2-B）'}`, tag: '红区',
      detail: `费比${(p.febi * 100).toFixed(0)}% > Gross${(p.gross * 100).toFixed(0)}%，亏损${gap}pp。${p.budget === 0 ? '已暂停。' : '待14:00确认止损。'}`,
      action: `ROI→${(1 / p.gross * 1.1).toFixed(2)} | ${p.budget === 0 ? '今日预算→¥0' : '剩余×0.60'} | 防停投关闭`,
    })
  })
  plans.filter(p => _zoneOf(p) === 'yellow' && p.rule && p.rule !== '—').slice(0, 1).forEach(p => {
    out.push({
      level: 'yellow', title: `${p.name} · ${p.rule}`, tag: '黄区',
      detail: `费比${(p.febi * 100).toFixed(0)}% > 目标${((p.gross - 0.1) * 100).toFixed(0)}%，已进入黄区预警。`,
      action: p.action.split('\n')[0] || 'ROI上调 | 明日预算压缩',
    })
  })
  if (cfg.storeMarginGap < 0) {
    out.push({
      level: 'yellow', title: `全店毛利余量${(cfg.storeMarginGap * 100).toFixed(1)}% · 收紧模式`, tag: '店铺',
      detail: `本周净毛利率${(cfg.weeklyNetProfit * 100).toFixed(1)}% < 目标${(cfg.weeklyTarget * 100).toFixed(0)}%。黄区禁扩量，绿区ROI≥130%才扩。`,
      action: '18:00黄区ROI强制上调10% | 禁入晚高峰',
    })
  }
  return out
}

// 机会点
export function generateOpps(plans: PlanData[]): AlertItem[] {
  return plans
    .filter(p => _zoneOf(p) === 'green' && p.conf === 'H')
    .sort((a, b) => b.roiTarget - a.roiTarget)
    .slice(0, 3)
    .map((p, i) => {
      const pct = [25, 20, 15][i % 3]
      const margin = ((p.gross - 0.1 - p.febi) * 100).toFixed(0)
      return {
        level: 'green' as const, title: `${p.name} · ${i === 0 ? 'ROI最优' : '稳定绿区'}`, tag: '绿区',
        detail: `ROI=${p.roiTarget}，费比${(p.febi * 100).toFixed(0)}% vs 目标${((p.gross - 0.1) * 100).toFixed(0)}%，余量${margin}pp。置信度H。`,
        action: `今日预算: ¥${p.budget.toLocaleString()}→¥${Math.round(p.budget * (1 + pct / 100)).toLocaleString()}（+${pct}%）| ROI维持${p.roiTarget}`,
      }
    })
}

// 算法调整方向
export function generateAlgo(plans: PlanData[], cfg: typeof store): AlgoItem[] {
  const out: AlgoItem[] = []
  const lowConf = plans.filter(p => p.conf === 'L')
  if (lowConf.length) {
    out.push({
      title: `📉 ${lowConf.map(p => p.name).slice(0, 2).join('/')}预测误差偏高→置信度L`,
      detail: `过去14天误差均值超20%阈值，已降至L级。自动操作暂停，需人工操作。`,
      formula: '置信度L → R1-B/R3禁止自动执行',
    })
  }
  out.push({
    title: '⚖️ R1动态阈值自适应',
    detail: '近7天花费均值上移，R1阈值自动上调，避免正常备货流量被误触发。',
    formula: 'threshold = rolling_mean(28d) + 2×rolling_std(28d)',
  })
  const redBudget = plans.filter(p => _zoneOf(p) === 'red').reduce((s, p) => s + p.spend * 0.4, 0)
  if (redBudget > 0) {
    const greens = plans.filter(p => _zoneOf(p) === 'green' && p.conf === 'H').map(p => p.name).slice(0, 3)
    out.push({
      title: '🎯 增量ROI分糖：红区释放→绿区',
      detail: `红区释放预算约¥${Math.round(redBudget).toLocaleString()}/天，按边际原则分给${greens.join('/')}。`,
      formula: `b_i* : MR(${greens.join(')=MR(')})`,
    })
  }
  out.push({
    title: `🏷️ 全店毛利余量${(cfg.storeMarginGap * 100).toFixed(1)}%`,
    detail: cfg.storeMarginGap < 0 ? '余量告负，整体收紧出价竞争力，优先保绿区。' : '余量为正，可适度放量绿区计划。',
    formula: cfg.storeMarginGap < 0 ? '模式 = 收紧（黄区禁扩量）' : '模式 = 宽松（绿区可追量）',
  })
  return out
}

// 各计划预测误差（ChartPanel hist14 表）
export function generatePlanErr(plans: PlanData[]): PlanErrRow[] {
  const rng = _seedFromPlans(plans)
  return plans.map(p => {
    const base = p.conf === 'H' ? 8 + rng() * 7 : p.conf === 'M' ? 15 + rng() * 8 : 25 + rng() * 8
    const mape = +base.toFixed(1)
    const trend: PlanErrRow['trend'] = p.conf === 'H' ? (rng() > 0.5 ? 'imp' : 'stb') : p.conf === 'L' ? 'deg' : (rng() > 0.6 ? 'deg' : 'stb')
    const high = rng() > 0.5
    const amt = (rng() * (p.conf === 'L' ? 20 : 8) + 2).toFixed(1)
    return { name: p.name, mape, conf: p.conf, trend, bias: high ? '偏高' : '偏低', biasAmt: (high ? '+' : '-') + amt + '%' }
  })
}

// 日内7时点巡检（按 plans 生成）
export function generateTimepoints(plans: PlanData[]): Timepoint[] {
  const meta: { time: string; name: string; conf: 'H' | 'M' | 'L' }[] = [
    { time: '09:00', name: '晨检', conf: 'H' }, { time: '12:00', name: '午检', conf: 'L' },
    { time: '14:00', name: '午后检', conf: 'M' }, { time: '16:00', name: '下午检', conf: 'H' },
    { time: '18:00', name: '晚高峰前', conf: 'H' }, { time: '20:00', name: '夜间检', conf: 'H' },
    { time: '22:00', name: '次日规划', conf: 'H' },
  ]
  const buckets: TimepointResult[][] = meta.map(() => [])
  const assign = (p: PlanData): number => {
    const z = _zoneOf(p)
    if (p.rule.includes('R1') ) return 0
    if (z === 'red') return 2          // 14:00 止损
    if (z === 'yellow') return p.rule.includes('DT1') ? 1 : 2
    if (p.rule.includes('R3') || p.guard) return 4  // 18:00 绿区追量
    return 5
  }
  plans.filter(p => p.rule && p.rule !== '—').forEach((p, i) => {
    const idx = assign(p)
    const z = _zoneOf(p)
    const pending = p.rule.includes('待确认')
    const executed = p.rule.includes('已预执行') || p.rule.includes('已执行') || p.rule.includes('触发中')
    buckets[idx].push({
      id: `${meta[idx].time.replace(':', '')}-${i}`,
      plan: p.name, rule: p.rule.split(/[,，]/)[0],
      zone: z,
      trigger: `费比${(p.febi * 100).toFixed(0)}% / Gross${(p.gross * 100).toFixed(0)}%，ROI目标${p.roiTarget}，今日花费¥${p.spend.toLocaleString()}`,
      actionText: p.action.replace(/\n/g, ' ｜ '),
      type: pending ? 'confirm' : 'auto',
      initStatus: pending ? 'pending' : executed ? 'executed' : 'confirmed',
      execTime: pending ? undefined : meta[idx].time + ':10',
      operator: pending ? undefined : '系统自动',
    })
  })
  return meta.map((m, idx) => {
    const results = buckets[idx]
    const pend = results.filter(r => r.initStatus === 'pending').length
    return {
      time: m.time, name: m.name, status: 'pending', conf: m.conf,
      summary: results.length ? `${results.length}条结果${pend ? `，${pend}条待确认` : '，已处理'}` : '此时点暂无规则结果',
      results,
    }
  })
}

// ─── 100-plan stress-test store ────────────────────────
// 确定性生成:同名前缀循环 + seeded RNG → 每次刷新结果相同
function _genStressPlans(): PlanData[] {
  const out: PlanData[] = []
  const categories = [
    ['美妆', ['口红', '粉底液', '气垫', '眼影盘', '腮红', '香水', '卸妆水', '面膜', '精华', '面霜']],
    ['母婴', ['奶粉', '尿不湿', '湿巾', '婴儿洗发', '辅食', '奶瓶', '玩具', '童装', '推车', '安抚奶嘴']],
    ['食品', ['坚果', '饼干', '巧克力', '咖啡', '茶叶', '麦片', '蜂蜜', '酸奶', '橄榄油', '挂面']],
    ['家电', ['吹风机', '电饭煲', '空气炸锅', '榨汁机', '电动牙刷', '剃须刀', '扫地机', '加湿器', '电烤箱', '咖啡机']],
    ['服饰', ['连衣裙', 'T恤', '牛仔裤', '运动鞋', '帆布鞋', '毛衣', '羽绒服', '内衣', '袜子', '衬衫']],
    ['宠物', ['猫粮', '狗粮', '猫砂', '宠物零食', '驱虫药', '宠物玩具', '猫爬架', '宠物床', '牵引绳', '宠物洗护']],
  ] as const
  const brands = ['优选', '优品', '臻选', '严选', '甄选', '甄品', '匠造', '臻享', '日记', '良品']
  let seed = 20260529
  const rng = () => { seed = (seed * 1664525 + 1013904223) & 0x7fffffff; return seed / 0x7fffffff }
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rng() * arr.length)]

  for (let i = 0; i < 100; i++) {
    const [, items] = pick(categories)
    const brand = pick(brands)
    const item = pick(items)
    const name = `${brand}${item}-${String(i + 1).padStart(3, '0')}`

    // 区间分布:大致 15% 红 30% 黄 55% 绿(模拟真实店铺健康度)
    const r = rng()
    const zone: 'red' | 'yellow' | 'green' = r < 0.15 ? 'red' : r < 0.45 ? 'yellow' : 'green'
    const gross = +(0.25 + rng() * 0.18).toFixed(2)
    let febi: number, roiTarget: number, ruleStr: string, action: string, conf: 'H' | 'M' | 'L', guard: boolean
    const budget = Math.round((500 + rng() * 4500) / 100) * 100
    const spend = Math.round(budget * (0.3 + rng() * 1.8))

    if (zone === 'red') {
      febi = +(gross + 0.02 + rng() * 0.08).toFixed(2)
      roiTarget = +(2.5 + rng() * 2).toFixed(1)
      const pending = rng() < 0.45
      ruleStr = pending ? 'R2-B待确认' : (rng() < 0.5 ? 'R1-A,R2-B' : 'R2-B')
      action = pending ? `ROI:${roiTarget}→${(1 / gross * 1.1).toFixed(2)} | 剩余×0.60\n待人工确认→` : `暂停（预算→¥0）\nROI:${roiTarget}→${(1 / gross * 1.1).toFixed(2)}`
      conf = rng() < 0.3 ? 'L' : 'M'
      guard = false
    } else if (zone === 'yellow') {
      febi = +(gross - 0.1 + rng() * 0.07).toFixed(2)
      roiTarget = +(4 + rng() * 1.5).toFixed(1)
      const r2 = rng()
      ruleStr = r2 < 0.25 ? 'DT1已预执行' : r2 < 0.45 ? 'R2-C待确认' : r2 < 0.55 ? 'DT1触发' : '—'
      action = ruleStr === '—' ? `ROI维持${roiTarget} | 预算维持` :
               ruleStr.includes('待确认') ? `ROI:${roiTarget}→${(roiTarget * 1.1).toFixed(2)} | 剩余×0.80\n待人工确认→` :
               `ROI已调${roiTarget}→${(roiTarget * 1.08).toFixed(2)}\n明日预算×0.90`
      conf = rng() < 0.65 ? 'H' : 'M'
      guard = false
    } else {
      febi = +(0.1 + rng() * (gross - 0.12)).toFixed(2)
      roiTarget = +(5 + rng() * 3).toFixed(1)
      const r2 = rng()
      ruleStr = r2 < 0.35 ? 'R3触发中' : '—'
      action = ruleStr === '—' ? `ROI维持${roiTarget} | 预算维持` :
               `ROI维持${roiTarget}\n预算+${Math.round(15 + rng() * 15)}%→¥${Math.round(budget * 1.18).toLocaleString()}`
      conf = rng() < 0.75 ? 'H' : 'M'
      guard = true
    }

    out.push({ name, zone, roiTarget, febi, gross, budget, spend, conf, guard, rule: ruleStr, action })
  }
  return out
}
const plans4 = _genStressPlans()
const store4Config = (() => {
  const totalSpend = plans4.reduce((s, p) => s + p.spend, 0)
  const totalRevenue = plans4.reduce((s, p) => s + (p.febi > 0 ? p.spend / p.febi : 0), 0)
  const wFebi = totalSpend / totalRevenue
  const grossMargin = 0.32
  return {
    febi: +wFebi.toFixed(3),
    weeklyNetProfit: +(grossMargin - wFebi).toFixed(3),
    weeklyTarget: 0.10,
    grossMargin,
    targetFebi: +(grossMargin - 0.1).toFixed(2),
    storeMarginGap: +(grossMargin - wFebi - 0.10).toFixed(3),
    totalSpend: Math.round(totalSpend),
    totalRevenue: Math.round(totalRevenue),
    triggeredRulesCount: plans4.filter(p => p.rule && p.rule !== '—').length,
  }
})()

// ═══════════════════════════════════════════════════════
// 跨店同款（共享条码）— 竞合协调演示数据
// 前台商品名 / skuId / itemId 各店独立,只有 barcode 可跨店比对
// 4 组剧情:良性竞争 / 建议错位 / 多店抢量 / 价格战
// ═══════════════════════════════════════════════════════
type OvLvl = 'high' | 'mid' | 'low'
export interface BarcodeMeta {
  barcode: string; title: string
  cost: number            // 单位成本(条码级,跨店一致)
  overlap: { kw: OvLvl; crowd: OvLvl; time: OvLvl; price: OvLvl }
}
// 成本是条码级、跨店一致;各店前台定价不同 → 毛利率(gross)=(price−cost)/price 各不相同
export const BARCODE_META: Record<string, BarcodeMeta> = {
  '6901234500011': { barcode: '6901234500011', title: '氨基酸洗发水 500ml', cost: 51, overlap: { kw: 'low', crowd: 'low', time: 'mid', price: 'low' } },
  '6901234500028': { barcode: '6901234500028', title: '玻尿酸补水面膜 30片', cost: 59, overlap: { kw: 'high', crowd: 'high', time: 'mid', price: 'mid' } },
  '6901234500035': { barcode: '6901234500035', title: '益生菌牙膏 120g', cost: 26, overlap: { kw: 'high', crowd: 'mid', time: 'high', price: 'mid' } },
  '6901234500042': { barcode: '6901234500042', title: '深层洁净沐浴露 1L', cost: 33, overlap: { kw: 'high', crowd: 'mid', time: 'mid', price: 'high' } },
}

// A 氨基酸洗发水(成本¥51)— 良性竞争。旗舰定价高(毛利35%)/ 专营定价低(毛利30%),重叠低
plans.push(
  { name: '陆老师氨基酸洗发水500ml·旗舰正装', zone: 'green', roiTarget: 7.0, febi: 0.16, gross: 0.35, budget: 3000, spend: 8200, conf: 'H', guard: true, rule: '—', action: 'ROI维持7.0 | 预算维持', itemId: 'IT60011', skuId: 'SKU-LS-AS500', barcode: '6901234500011', price: 79 },
)
plans2.push(
  { name: '氨基酸洗发水500ml·专营装', zone: 'green', roiTarget: 6.5, febi: 0.18, gross: 0.30, budget: 2500, spend: 6000, conf: 'H', guard: true, rule: '—', action: 'ROI维持6.5 | 预算维持', itemId: 'IT70011', skuId: 'SKU-LY-AS500', barcode: '6901234500011', price: 73 },
)
// B 玻尿酸面膜(成本¥59)— 建议错位(词/人群重叠高)
plans2.push(
  { name: '玻尿酸补水面膜30片·专营', zone: 'yellow', roiTarget: 5.0, febi: 0.25, gross: 0.33, budget: 2000, spend: 5200, conf: 'M', guard: false, rule: '—', action: 'ROI维持5.0 | 预算维持', itemId: 'IT70028', skuId: 'SKU-LY-HA30', barcode: '6901234500028', price: 88 },
)
plans3.push(
  { name: '玻尿酸面膜30片·家庭装', zone: 'yellow', roiTarget: 5.2, febi: 0.26, gross: 0.30, budget: 1800, spend: 4600, conf: 'M', guard: false, rule: '—', action: 'ROI维持5.2 | 预算维持', itemId: 'IT80028', skuId: 'SKU-JJ-HA30', barcode: '6901234500028', price: 84 },
)
// C 益生菌牙膏(成本¥26)— 多店同时追量(3店都 R3 绿区追量),定价递减毛利递减
plans.push(
  { name: '益生菌牙膏120g·旗舰', zone: 'green', roiTarget: 7.5, febi: 0.15, gross: 0.32, budget: 1500, spend: 4000, conf: 'H', guard: true, rule: 'R3触发中', action: 'ROI维持7.5\n预算+20%→¥1,800', itemId: 'IT60035', skuId: 'SKU-LS-TP120', barcode: '6901234500035', price: 39 },
)
plans2.push(
  { name: '益生菌牙膏120g·专营', zone: 'green', roiTarget: 7.0, febi: 0.17, gross: 0.30, budget: 1200, spend: 3200, conf: 'H', guard: true, rule: 'R3触发中', action: 'ROI维持7.0\n预算+18%→¥1,416', itemId: 'IT70035', skuId: 'SKU-LY-TP120', barcode: '6901234500035', price: 37 },
)
plans3.push(
  { name: '益生菌牙膏120g·日用', zone: 'green', roiTarget: 8.0, febi: 0.14, gross: 0.28, budget: 1000, spend: 2800, conf: 'H', guard: true, rule: 'R3触发中', action: 'ROI维持8.0\n预算+20%→¥1,200', itemId: 'IT80035', skuId: 'SKU-JJ-TP120', barcode: '6901234500035', price: 36 },
)
// D 深层洁净沐浴露(成本¥33)— 价格战/合并亏损。日用定价更低→毛利更薄→红得更深
plans.push(
  { name: '深层洁净沐浴露1L·旗舰', zone: 'red', roiTarget: 3.5, febi: 0.34, gross: 0.32, budget: 600, spend: 4200, conf: 'L', guard: false, rule: 'R2-B待确认', action: 'ROI:3.5→3.44 | 剩余×0.60\n待人工确认→', itemId: 'IT60042', skuId: 'SKU-LS-BW1L', barcode: '6901234500042', price: 49 },
)
plans3.push(
  { name: '深层洁净沐浴露1L·日用', zone: 'red', roiTarget: 3.8, febi: 0.33, gross: 0.28, budget: 800, spend: 4500, conf: 'M', guard: false, rule: 'R2-B待确认', action: 'ROI:3.8→3.93 | 剩余×0.60\n待人工确认→', itemId: 'IT80042', skuId: 'SKU-JJ-BW1L', barcode: '6901234500042', price: 46 },
)

export const STORES: StoreInfo[] = [
  {
    id: 'store1',
    name: '陆老师护发旗舰店',
    tag: '主店',
    tagColor: '#1565c0',
    storeConfig: store,
    plans,
  },
  {
    id: 'store2',
    name: '璃颜护肤专营店',
    tag: '副店',
    tagColor: '#6a1b9a',
    storeConfig: store2Config,
    plans: plans2,
  },
  {
    id: 'store3',
    name: '净居洗护日用店',
    tag: '新店',
    tagColor: '#2e7d32',
    storeConfig: store3Config,
    plans: plans3,
  },
  {
    id: 'store4',
    name: '压测店铺',
    tag: '压测',
    tagColor: '#ea580c',
    storeConfig: store4Config,
    plans: plans4,
  },
]

// ═══════════════════════════════════════════════════════
// 今日待办决策队列 — 跨面板统一动作清单
// 按 截止时间 × 预计影响金额 排序
// ═══════════════════════════════════════════════════════
export interface TodoItem {
  id: string
  priority: 'urgent' | 'high' | 'opportunity'
  deadline: string
  deadlineSort: number
  plan: string
  rule: string
  title: string
  action: string
  pending: boolean
  impact: number              // 预计影响金额（元）
  impactKind: 'save' | 'gain' | 'watch'
}

export function generateTodoQueue(plans: PlanData[], _cfg: typeof store): TodoItem[] {
  const items: TodoItem[] = []
  plans.forEach((p, i) => {
    const sl = p.gross, pt = p.gross - 0.1
    const z: 'red' | 'yellow' | 'green' = p.febi > sl ? 'red' : p.febi > pt ? 'yellow' : 'green'
    const pending = p.rule.includes('待确认')

    if (z === 'red' && p.spend > 100) {
      const lossRate = p.febi - p.gross
      // 减亏 = 已亏 + 若不止损按当前速率剩余预算继续亏的部分
      const save = Math.round(Math.max(p.spend * lossRate, (Math.max(0, p.budget - p.spend)) * lossRate * 0.6 + p.spend * lossRate))
      items.push({
        id: `td-r-${i}`, priority: 'urgent', deadline: '14:00', deadlineSort: 14,
        plan: p.name, rule: pending ? 'R2-B 待确认' : 'R2-B', title: '🔴 红区止损',
        action: `ROI→${(1 / p.gross * 1.1).toFixed(2)}，${p.budget === 0 ? '已暂停' : '剩余预算×0.60'}，关闭防停投`,
        pending, impact: save, impactKind: 'save',
      })
    } else if (z === 'yellow' && p.spend > 100) {
      const save = Math.round(p.spend * Math.max(0.005, p.febi - pt))
      items.push({
        id: `td-y-${i}`, priority: 'high', deadline: '16:00', deadlineSort: 16,
        plan: p.name, rule: pending ? 'R2-C 待确认' : 'R2-C', title: '🟡 黄区压量',
        action: `费比${(p.febi * 100).toFixed(0)}% > 目标${(pt * 100).toFixed(0)}%，全店余量<0则ROI上调10%`,
        pending, impact: save, impactKind: 'watch',
      })
    } else if (z === 'green' && p.conf === 'H') {
      const util = p.budget > 0 ? p.spend / p.budget : 0
      if (p.rule.includes('R3') || util > 0.6) {
        const add = Math.round(p.budget * 0.18)
        const gain = Math.round(add * Math.max(0.02, pt - p.febi))
        items.push({
          id: `td-g-${i}`, priority: 'opportunity', deadline: '18:00', deadlineSort: 18,
          plan: p.name, rule: 'R3', title: '🟢 绿区追量',
          action: `预算+18%→¥${(p.budget + add).toLocaleString()}，抓晚高峰高效流量`,
          pending: false, impact: gain, impactKind: 'gain',
        })
      }
    }
  })
  // 待确认优先；其次截止时间早的在前；再次影响金额大的在前
  return items.sort((a, b) =>
    (Number(b.pending) - Number(a.pending)) ||
    (a.deadlineSort - b.deadlineSort) ||
    (b.impact - a.impact)
  )
}

// ═══════════════════════════════════════════════════════
// 跨店竞合:按条码归并各店同款计划
// ═══════════════════════════════════════════════════════
export interface CoopMember {
  storeId: string; storeName: string; storeTag: string; storeColor: string
  plan: PlanData
}
export interface CoopGroup {
  barcode: string; title: string; cost: number
  overlap: BarcodeMeta['overlap']
  members: CoopMember[]
}

// 扫描所有店铺,按条码归并出现在 ≥2 家店的同款
export function getCoopetitionGroups(): CoopGroup[] {
  const byBarcode: Record<string, CoopMember[]> = {}
  STORES.forEach(s => {
    s.plans.forEach(p => {
      if (!p.barcode) return
      ;(byBarcode[p.barcode] ||= []).push({
        storeId: s.id, storeName: s.name, storeTag: s.tag, storeColor: s.tagColor, plan: p,
      })
    })
  })
  const groups: CoopGroup[] = []
  Object.entries(byBarcode).forEach(([barcode, members]) => {
    const stores = new Set(members.map(m => m.storeId))
    if (stores.size < 2) return  // 仅一家店,不构成跨店竞合
    const meta = BARCODE_META[barcode]
    groups.push({
      barcode,
      title: meta?.title || barcode,
      cost: meta?.cost || 0,
      overlap: meta?.overlap || { kw: 'mid', crowd: 'mid', time: 'mid', price: 'mid' },
      members,
    })
  })
  return groups
}
