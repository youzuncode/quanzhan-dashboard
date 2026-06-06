import { probsData, oppsData, algoData } from '../lib/mockData'
import type { AlertItem, AlgoItem } from '../lib/mockData'

interface Props { probs?: AlertItem[]; opps?: AlertItem[]; algos?: AlgoItem[] }

export function ProblemsOpps({ probs = probsData, opps = oppsData, algos = algoData }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2.5 mb-2.5">
      {/* Problems */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-3 py-2 font-bold text-xs border-b border-red-100 bg-red-50 text-red-800 flex items-center justify-between">
          <span>🔴 主要问题</span>
          <span className="bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
            {probs.length}
          </span>
        </div>
        <div className="p-2 space-y-2 max-h-60 overflow-y-auto">
          {probs.map((p, i) => (
            <div key={i} className={`rounded-lg border overflow-hidden ${p.level === 'red' ? 'border-red-200' : 'border-yellow-200'}`}>
              <div className={`px-2.5 py-1.5 flex items-center gap-1.5 flex-wrap ${p.level === 'red' ? 'bg-red-50' : 'bg-yellow-50'}`}>
                <span className="font-bold text-xs flex-1">{p.title}</span>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded text-white ${p.level === 'red' ? 'bg-red-700' : 'bg-yellow-600'}`}>{p.tag}</span>
              </div>
              <div className="px-2.5 py-1.5 bg-white">
                <div className="text-xs text-gray-600 mb-1">{p.detail}</div>
                <div className={`text-xs font-semibold px-2 py-1 rounded ${p.level === 'red' ? 'bg-red-50 text-red-800' : 'bg-yellow-50 text-yellow-800'}`}>
                  → {p.action}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Opportunities */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-3 py-2 font-bold text-xs border-b border-green-100 bg-green-50 text-green-800 flex items-center justify-between">
          <span>🟢 机会点</span>
          <span className="bg-green-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
            {opps.length}
          </span>
        </div>
        <div className="p-2 space-y-2 max-h-60 overflow-y-auto">
          {opps.map((o, i) => (
            <div key={i} className="rounded-lg border border-green-200 overflow-hidden">
              <div className="px-2.5 py-1.5 bg-green-50 flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-xs flex-1">{o.title}</span>
                <span className="text-xs font-bold px-1.5 py-0.5 rounded text-white bg-green-700">{o.tag}</span>
              </div>
              <div className="px-2.5 py-1.5 bg-white">
                <div className="text-xs text-gray-600 mb-1">{o.detail}</div>
                <div className="text-xs font-semibold px-2 py-1 rounded bg-green-50 text-green-800">
                  → {o.action}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Algorithm */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-3 py-2 font-bold text-xs border-b border-blue-100 bg-blue-50 text-blue-800">
          🔧 算法调整方向
        </div>
        <div className="p-2 space-y-2 max-h-60 overflow-y-auto">
          {algos.map((a, i) => (
            <div key={i} className="rounded-lg border border-blue-100 p-2.5 bg-blue-50">
              <div className="font-bold text-xs mb-1">{a.title}</div>
              <div className="text-xs text-gray-600 mb-1.5">{a.detail}</div>
              <div className="text-xs font-mono px-2 py-1 rounded bg-white border border-blue-200 text-blue-800">
                {a.formula}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
