import { paramOps } from '../lib/mockData'

const clsBorder: Record<string, string> = {
  act: 'border-indigo-300 bg-indigo-50',
  ok: 'border-green-300 bg-green-50',
  warn: 'border-yellow-300 bg-yellow-50',
}
const clsHeader: Record<string, string> = {
  act: 'text-indigo-800 bg-indigo-100',
  ok: 'text-green-800 bg-green-100',
  warn: 'text-yellow-800 bg-yellow-100',
}
const badgeCls: Record<string, string> = {
  roi: 'bg-indigo-100 text-indigo-800',
  bgt: 'bg-green-100 text-green-800',
  mode: 'bg-yellow-100 text-yellow-800',
  guard: 'bg-blue-100 text-blue-800',
}

export function ParamPanel() {
  return (
    <div className="bg-white rounded-xl shadow-sm mb-2.5 overflow-hidden">
      <div className="px-3 py-2 font-bold text-xs border-b border-gray-100">
        ⚙️ 今日参数操作指令
      </div>
      <div className="grid grid-cols-4 gap-0 divide-x divide-gray-100">
        {paramOps.map(op => (
          <div key={op.name} className={`p-3 border ${clsBorder[op.cls]} border-0`}>
            <div className={`text-xs font-bold px-2 py-1 rounded mb-2 ${clsHeader[op.cls]}`}>
              {op.icon} {op.name}
            </div>
            <div className="space-y-1.5">
              {op.items.map((it, i) => (
                <div key={i} className="text-xs">
                  <div className="text-gray-500 truncate mb-0.5" title={it.plan}>{it.plan}</div>
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="font-semibold text-gray-700">{it.cur}</span>
                    <span className="text-gray-400">→</span>
                    <span className="font-bold text-indigo-800">{it.nw}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${badgeCls[op.type]}`}>{it.badge}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
