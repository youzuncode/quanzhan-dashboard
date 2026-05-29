import { useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts'
import { hours, predicted, actual, hist14, planErr, plans } from '../lib/mockData'

const hourlyData = hours.map((h, i) => ({
  hour: `${h}:00`,
  predicted: predicted[i],
  actual: actual[i] ?? undefined,
}))

const zoneCounts = { green: 0, yellow: 0, red: 0 }
plans.forEach(p => { zoneCounts[p.zone]++ })
const pieData = [
  { name: '绿区', value: zoneCounts.green, fill: '#2e7d32' },
  { name: '黄区', value: zoneCounts.yellow, fill: '#f57f17' },
  { name: '红区', value: zoneCounts.red, fill: '#c62828' },
]

const roiRows = [
  { roi: 4, label: '' }, { roi: 5, label: '' }, { roi: 6, label: '' },
  { roi: 7, label: '' }, { roi: 8, label: '' }, { roi: 10, label: '' },
]

const avgMape = hist14.reduce((s, d) => s + d.mape, 0) / hist14.length
const avgBias = hist14.reduce((s, d) => s + parseFloat(d.biasAmt), 0) / hist14.length

export function ChartPanel() {
  const [forecastTab, setForecastTab] = useState<'hourly' | 'hist14'>('hourly')

  return (
    <div className="flex gap-2.5 mb-2.5">
      {/* Left: forecast chart */}
      <div className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center border-b border-gray-100">
          <div className="px-3 py-2 font-bold text-xs">📈 预测评估</div>
          <div className="flex ml-auto mr-3 gap-1">
            {([['hourly', '今日小时预测'], ['hist14', '过去14天评估']] as const).map(([k, l]) => (
              <button key={k}
                onClick={() => setForecastTab(k)}
                className={`px-2.5 py-1 text-xs rounded font-semibold transition-colors ${forecastTab === k ? 'bg-indigo-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {forecastTab === 'hourly' && (
          <div className="p-3">
            <div className="text-xs text-gray-400 mb-2">
              蓝色=预测 · 绿色虚线=实际 · MAPE {avgMape.toFixed(1)}%
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => typeof v === 'number' ? `¥${v.toLocaleString('zh-CN')}` : v} />
                  <Line type="monotone" dataKey="predicted" stroke="#1565c0" strokeWidth={2} dot={false} name="预测花费" connectNulls />
                  <Line type="monotone" dataKey="actual" stroke="#2e7d32" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3 }} name="实际花费" connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {forecastTab === 'hist14' && (
          <div className="p-3">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hist14} barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip />
                  <Bar dataKey="pred" name="预测" fill="#90caf9" />
                  <Bar dataKey="act" name="实际" fill="#a5d6a7" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex gap-4 text-xs text-gray-500">
              <span>14天均MAPE: <strong>{avgMape.toFixed(1)}%</strong></span>
              <span>均偏差: <strong>{avgBias > 0 ? '+' : ''}{avgBias.toFixed(1)}%</strong></span>
            </div>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-2 py-1 text-left text-gray-500">计划</th>
                    <th className="px-2 py-1 text-right text-gray-500">MAPE</th>
                    <th className="px-2 py-1 text-right text-gray-500">置信度</th>
                    <th className="px-2 py-1 text-right text-gray-500">偏差</th>
                  </tr>
                </thead>
                <tbody>
                  {planErr.map((e, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-2 py-1">{e.name}</td>
                      <td className="px-2 py-1 text-right font-bold">{e.mape}%</td>
                      <td className="px-2 py-1 text-right">
                        <span className={`px-1 rounded text-xs font-bold ${e.conf === 'H' ? 'bg-green-100 text-green-800' : e.conf === 'M' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {e.conf}
                        </span>
                      </td>
                      <td className={`px-2 py-1 text-right text-xs ${e.bias === '偏高' ? 'text-red-600' : 'text-blue-600'}`}>
                        {e.biasAmt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Right column: zone pie + roi table */}
      <div className="w-52 flex flex-col gap-2.5">
        {/* Zone pie */}
        <div className="bg-white rounded-xl shadow-sm p-3 flex-1">
          <div className="font-bold text-xs mb-2">📊 三区分布</div>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={44} dataKey="value" label={({ name, value }) => `${name}${value}`} labelLine={false}
                  fontSize={9}>
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-2 text-xs mt-1">
            <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-green-700 inline-block" />绿{zoneCounts.green}</span>
            <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />黄{zoneCounts.yellow}</span>
            <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-red-700 inline-block" />红{zoneCounts.red}</span>
          </div>
        </div>

        {/* ROI table */}
        <div className="bg-white rounded-xl shadow-sm p-3">
          <div className="font-bold text-xs mb-2">💱 ROI↔费比换算</div>
          <div className="grid grid-cols-3 gap-1">
            {roiRows.map(r => (
              <div key={r.roi} className="text-center p-1 rounded bg-gray-50">
                <div className="text-xs text-gray-400">ROI {r.roi}</div>
                <div className="font-bold text-xs text-indigo-800">{(100 / r.roi).toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
