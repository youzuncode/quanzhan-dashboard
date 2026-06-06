import { useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts'
import { hours, predicted, actual, hist14, planErr, plans as defaultPlans } from '../lib/mockData'
import type { PlanData, PlanErrRow } from '../lib/mockData'

const hourlyData = hours.map((h, i) => ({
  hour: `${h}:00`,
  predicted: predicted[i],
  actual: actual[i] ?? undefined,
}))

const roiRows = [
  { roi: 4, cls: 'red' }, { roi: 5, cls: 'yellow' }, { roi: 6, cls: '' },
  { roi: 7, cls: 'active' }, { roi: 8, cls: 'green' }, { roi: 10, cls: 'green' },
]

const avgMape = hist14.reduce((s, d) => s + d.mape, 0) / hist14.length
const worst = hist14.reduce((a, b) => a.mape > b.mape ? a : b)
const best = hist14.reduce((a, b) => a.mape < b.mape ? a : b)
const hc = hist14.filter(d => d.conf === 'H').length
const r5 = hist14.slice(-5).map(d => d.mape); const p5 = r5.reduce((a, b) => a + b) / r5.length
const r9 = hist14.slice(0, 9).map(d => d.mape); const p9 = r9.reduce((a, b) => a + b) / r9.length
const trend14 = p5 < p9 - 1 ? '改善' : p5 > p9 + 1 ? '恶化' : '稳定'
const trendColor = { '改善': '#2e7d32', '恶化': '#c62828', '稳定': '#1557b0' }[trend14]

const trendLabel: Record<string, string> = { imp: '改善↑', deg: '恶化↓', stb: '稳定' }

// Compute today MAPE from actual vs predicted where actual exists
let ms = 0, mn = 0
actual.forEach((a, i) => { if (a !== null && predicted[i]) { ms += Math.abs(a - predicted[i]) / predicted[i]; mn++ } })
const todayMape = mn ? (ms / mn * 100) : avgMape

interface Props { plans?: PlanData[]; planErrData?: PlanErrRow[] }

export function ChartPanel({ plans = defaultPlans, planErrData = planErr }: Props) {
  const [forecastTab, setForecastTab] = useState<'hourly' | 'hist14'>('hourly')

  const zoneCounts = { green: 0, yellow: 0, red: 0 }
  plans.forEach(p => { zoneCounts[p.zone]++ })
  const pieData = [
    { name: '绿区', value: zoneCounts.green, fill: '#2e7d32' },
    { name: '黄区', value: zoneCounts.yellow, fill: '#f57f17' },
    { name: '红区', value: zoneCounts.red, fill: '#c62828' },
  ]

  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
      {/* Left: forecast chart */}
      <div style={{ flex: 1, background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ padding: '8px 12px', fontWeight: 700, fontSize: 11 }}>📈 预测评估</div>
          <div style={{ display: 'flex', marginLeft: 'auto', marginRight: 12, gap: 4 }}>
            {([['hourly', '今日小时预测'], ['hist14', '过去14天评估']] as const).map(([k, l]) => (
              <button key={k}
                onClick={() => setForecastTab(k)}
                style={{
                  padding: '4px 10px', fontSize: 10, borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600,
                  background: forecastTab === k ? '#1557b0' : 'transparent',
                  color: forecastTab === k ? '#fff' : '#888',
                }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {forecastTab === 'hourly' && (
          <div style={{ padding: 12 }}>
            {/* MAPE label top-right */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: '#999' }}>蓝色实线=预测 · 绿色虚线=实际</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: todayMape > 20 ? '#c62828' : '#2e7d32', background: todayMape > 20 ? '#ffebee' : '#e8f5e9', padding: '2px 8px', borderRadius: 10 }}>
                今日MAPE: {todayMape.toFixed(1)}% {todayMape > 20 ? '⚠ 超阈值' : '✓ 正常'}
              </div>
            </div>
            <div style={{ height: 176 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => typeof v === 'number' ? `¥${v.toLocaleString('zh-CN')}` : v} />
                  <Line type="monotone" dataKey="predicted" stroke="#1a73e8" strokeWidth={2} dot={false} name="预测花费" connectNulls />
                  <Line type="monotone" dataKey="actual" stroke="#2e7d32" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3 }} name="实际花费" connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {forecastTab === 'hist14' && (
          <div style={{ padding: 12 }}>
            {/* 柱状图 */}
            <div style={{ height: 140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hist14} barSize={10}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => typeof v === 'number' ? `¥${v.toLocaleString('zh-CN')}` : v} />
                  <Bar dataKey="pred" name="预测" fill="#90caf9" />
                  <Bar dataKey="act" name="实际" fill="#a5d6a7" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 4个误差统计卡片 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginTop: 8 }}>
              {[
                {
                  label: '14天均值MAPE', val: avgMape.toFixed(1) + '%',
                  sub: avgMape < 15 ? '✓ 高置信达标' : avgMape < 25 ? '▲ 中置信范围' : '⚠ 超阈值',
                  vc: avgMape < 15 ? '#2e7d32' : avgMape < 25 ? '#f57f17' : '#c62828',
                },
                {
                  label: '最差日', val: worst.mape.toFixed(1) + '%',
                  sub: worst.date + (worst.note ? ' · ' + worst.note : ''),
                  vc: '#c62828',
                },
                {
                  label: '最佳日', val: best.mape.toFixed(1) + '%',
                  sub: best.date + ' · 高置信度',
                  vc: '#2e7d32',
                },
                {
                  label: `高置信天数/14天`, val: hc + '/14',
                  sub: '趋势: ' + trend14,
                  vc: trendColor,
                },
              ].map((s, i) => (
                <div key={i} style={{ background: '#f8f8f8', borderRadius: 8, padding: '6px 8px', border: '1px solid #eee' }}>
                  <div style={{ fontSize: 9, color: '#999' }}>{s.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: s.vc }}>{s.val}</div>
                  <div style={{ fontSize: 9, color: '#aaa', marginTop: 1 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* 各计划误差表 */}
            <div style={{ marginTop: 8, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                <thead>
                  <tr style={{ background: '#f8f8f8', borderBottom: '1px solid #eee' }}>
                    <th style={{ padding: '4px 6px', textAlign: 'left', color: '#888', fontWeight: 700 }}>计划</th>
                    <th style={{ padding: '4px 6px', textAlign: 'left', color: '#888', fontWeight: 700 }}>MAPE</th>
                    <th style={{ padding: '4px 6px', textAlign: 'center', color: '#888', fontWeight: 700 }}>置信度</th>
                    <th style={{ padding: '4px 6px', textAlign: 'center', color: '#888', fontWeight: 700 }}>MAPE图</th>
                    <th style={{ padding: '4px 6px', textAlign: 'center', color: '#888', fontWeight: 700 }}>趋势</th>
                    <th style={{ padding: '4px 6px', textAlign: 'right', color: '#888', fontWeight: 700 }}>偏差方向</th>
                  </tr>
                </thead>
                <tbody>
                  {[...planErrData].sort((a, b) => a.mape - b.mape).map((e, i) => {
                    const barW = Math.min(100, e.mape / 35 * 100)
                    const bc = e.mape < 15 ? '#2e7d32' : e.mape < 25 ? '#f57f17' : '#c62828'
                    const confCls = { H: { bg: '#e8f5e9', c: '#2e7d32' }, M: { bg: '#fff8e1', c: '#f57f17' }, L: { bg: '#ffebee', c: '#c62828' } }[e.conf]
                    const trendCls = { imp: { bg: '#e8f5e9', c: '#2e7d32' }, stb: { bg: '#e3f2fd', c: '#1a73e8' }, deg: { bg: '#ffebee', c: '#c62828' } }[e.trend]
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '4px 6px', fontWeight: 600 }}>{e.name}</td>
                        <td style={{ padding: '4px 6px', fontWeight: 700, color: bc }}>{e.mape}%</td>
                        <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                          <span style={{ background: confCls.bg, color: confCls.c, padding: '1px 6px', borderRadius: 4, fontWeight: 700, fontSize: 9 }}>{e.conf}</span>
                        </td>
                        <td style={{ padding: '4px 6px' }}>
                          <div style={{ height: 4, background: '#f0f0f0', borderRadius: 4, width: 60 }}>
                            <div style={{ height: '100%', width: `${barW}%`, background: bc, borderRadius: 4 }} />
                          </div>
                        </td>
                        <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                          <span style={{ background: trendCls.bg, color: trendCls.c, padding: '1px 6px', borderRadius: 4, fontWeight: 700, fontSize: 9 }}>{trendLabel[e.trend]}</span>
                        </td>
                        <td style={{ padding: '4px 6px', textAlign: 'right', color: e.bias === '偏高' ? '#c62828' : '#1a73e8', fontSize: 10 }}>
                          {e.bias} {e.biasAmt}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Right column: zone pie + roi table */}
      <div style={{ width: 210, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Zone pie */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', padding: 12, flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 8 }}>📊 三区分布</div>
          <div style={{ height: 120 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={44} innerRadius={22} dataKey="value"
                  label={({ name, value }) => `${name}${value}个`} labelLine={false} fontSize={9}>
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, name) => [`${v}个`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, fontSize: 10, marginTop: 4 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2e7d32', display: 'inline-block' }} />绿{zoneCounts.green}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f57f17', display: 'inline-block' }} />黄{zoneCounts.yellow}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#c62828', display: 'inline-block' }} />红{zoneCounts.red}
            </span>
          </div>
        </div>

        {/* ROI↔费比换算表 */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', padding: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 8 }}>💱 ROI↔费比换算</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {roiRows.map(r => {
              const isActive = r.roi === 7
              const isRed = r.roi === 4
              const isYellow = r.roi === 5
              const isGreen = r.roi >= 8
              const rowBg = isActive ? '#1557b0' : isRed ? '#ffebee' : isYellow ? '#fff8e1' : isGreen ? '#e8f5e9' : '#f8f8f8'
              const rowColor = isActive ? '#fff' : isRed ? '#c62828' : isYellow ? '#f57f17' : isGreen ? '#2e7d32' : '#444'
              return (
                <div key={r.roi} style={{ display: 'flex', justifyContent: 'space-between', background: rowBg, color: rowColor, padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: isActive ? 800 : 600 }}>
                  <span>ROI = {r.roi}{isActive ? ' ★当前' : ''}</span>
                  <span>{(100 / r.roi).toFixed(1)}% 费比</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
