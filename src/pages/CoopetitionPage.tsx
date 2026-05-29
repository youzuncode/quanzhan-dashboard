import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { getCoopetitionGroups } from '../lib/mockData'
import type { CoopGroup, CoopMember } from '../lib/mockData'
import { loadJSON, saveJSON } from '../lib/persist'

interface Props { onClose: () => void }

type Role = '主推' | '防御' | '清仓'
const LS_ROLES = 'coop.roles'
const roleKey = (barcode: string, storeId: string) => `${barcode}::${storeId}`

const ovLabel = { high: '高', mid: '中', low: '低' }
const ovColor = { high: '#c62828', mid: '#f57f17', low: '#2e7d32' }
const roleStyle: Record<Role, { bg: string; color: string }> = {
  主推: { bg: '#e8f5e9', color: '#2e7d32' },
  防御: { bg: '#e3f2fd', color: '#1565c0' },
  清仓: { bg: '#fff3e0', color: '#e65100' },
}

const zoneOf = (febi: number, gross: number) => (febi > gross ? 'red' : febi > gross - 0.1 ? 'yellow' : 'green')
const zoneCN = { red: '红区', yellow: '黄区', green: '绿区' }
const zoneClr = { red: '#c62828', yellow: '#f57f17', green: '#2e7d32' }

export function CoopetitionPage({ onClose }: Props) {
  const groups = getCoopetitionGroups()
  const [roles, setRolesRaw] = useState<Record<string, Role>>(() => loadJSON<Record<string, Role>>(LS_ROLES, {}))
  function setRole(barcode: string, storeId: string, role: Role) {
    const next = { ...roles, [roleKey(barcode, storeId)]: role }
    setRolesRaw(next); saveJSON(LS_ROLES, next)
  }

  // 计算每组的派生指标
  function analyze(g: CoopGroup) {
    // 赛马:按毛利余量(gross−febi)降序,余量大=更高效
    const ranked = [...g.members].sort((a, b) => (b.plan.gross - b.plan.febi) - (a.plan.gross - a.plan.febi))
    const rankMap: Record<string, number> = {}
    ranked.forEach((m, i) => { rankMap[m.storeId] = i + 1 })
    // 默认角色:赛马第1=主推,红区=清仓,其余=防御
    const roleOf = (m: CoopMember): Role => {
      const k = roleKey(g.barcode, m.storeId)
      if (roles[k]) return roles[k]
      if (zoneOf(m.plan.febi, m.plan.gross) === 'red') return '清仓'
      return rankMap[m.storeId] === 1 ? '主推' : '防御'
    }
    // 合并费比 = Σ花费 / Σ营收(营收=花费/费比)
    const totalSpend = g.members.reduce((s, m) => s + m.plan.spend, 0)
    const totalRev = g.members.reduce((s, m) => s + (m.plan.febi > 0 ? m.plan.spend / m.plan.febi : 0), 0)
    const mergedFebi = totalRev > 0 ? totalSpend / totalRev : 0
    const totalBudget = g.members.reduce((s, m) => s + m.plan.budget, 0)
    // 同时追量:绿区且 R3/追量中
    const simulTui = g.members.filter(m => zoneOf(m.plan.febi, m.plan.gross) === 'green' && /R3|追量/.test(m.plan.rule)).length
    const highOv = (['kw', 'crowd', 'time', 'price'] as const).filter(d => g.overlap[d] === 'high').length
    const overGross = mergedFebi > g.gross
    const priceWar = g.overlap.price === 'high' && (overGross || g.members.some(m => zoneOf(m.plan.febi, m.plan.gross) === 'red'))

    // 竞合判定
    let verdict: { level: 'good' | 'warn' | 'bad'; tag: string; advice: string }
    const leader = ranked[0]
    if (priceWar || overGross) {
      verdict = { level: 'bad', tag: '🔴 价格战/合并亏损', advice: `合并费比${(mergedFebi * 100).toFixed(1)}% ${overGross ? '已破' : '逼近'}盈亏线${(g.gross * 100).toFixed(0)}%。建议:统一最低价防自杀式压价 + 两店同步收紧ROI,先止血再谈分工。` }
    } else if (simulTui >= 2) {
      verdict = { level: 'bad', tag: '🔴 多店同时追量', advice: `${simulTui}家店同款同时绿区追量,在同竞价场互相抬价。建议:仅保留主推店「${leader.storeName}」(赛马第1)追量,其余店该款冻结 R3/DT3。` }
    } else if (highOv >= 2) {
      verdict = { level: 'warn', tag: '⚠️ 重叠偏高·建议错位', advice: `词/人群等${highOv}个维度高度重叠,正面对撞。建议:错位竞争——分管不同关键词包/人群/时段,保留双店但减少碰撞。` }
    } else {
      verdict = { level: 'good', tag: '✅ 良性竞争·放开赛马', advice: `各维度重叠低,覆盖不同流量,1+1>2。建议:放开赛马,谁合并ROI高给谁倾斜预算。` }
    }
    return { ranked, rankMap, roleOf, mergedFebi, totalSpend, totalBudget, simulTui, highOv, overGross, verdict }
  }

  const analyzed = groups.map(g => ({ g, a: analyze(g) }))
  const warnCount = analyzed.filter(x => x.a.verdict.level !== 'good').length
  const overLineCount = analyzed.filter(x => x.a.overGross).length

  const verdictBg = { good: '#e8f5e9', warn: '#fff8e1', bad: '#fef2f2' }
  const verdictBorder = { good: '#a5d6a7', warn: '#ffe0b2', bad: '#fecaca' }
  const verdictColor = { good: '#2e7d32', warn: '#e65100', bad: '#c62828' }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#4338ca,#6d28d9)', padding: '12px 18px', color: '#fff', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', color: '#fff', cursor: 'pointer' }}>
          <ArrowLeft size={13} /> 返回看板
        </button>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>🔀 跨店竞合协调</div>
          <div style={{ fontSize: 11, opacity: 0.8, marginTop: 1 }}>
            按条码归并跨店同款 · {groups.length} 组同款
            {warnCount > 0 && <span style={{ color: '#fde68a', fontWeight: 700 }}> · {warnCount} 组需协调</span>}
            {overLineCount > 0 && <span style={{ color: '#fecaca', fontWeight: 700 }}> · {overLineCount} 组合并费比超线</span>}
          </div>
        </div>
      </div>

      {/* 说明条 */}
      <div style={{ flexShrink: 0, background: '#faf5ff', borderBottom: '1px solid #f3e8ff', padding: '6px 18px', fontSize: 11, color: '#6b21a8' }}>
        前台商品(skuId)各店独立、不可跨店比对 — 这里以<strong>条码(69码)</strong>为唯一锚点归并同款。原则:<strong>低重叠放开竞争,碰撞点协同。</strong>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {analyzed.length === 0 && (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '60px 0', fontSize: 13 }}>暂无跨店同款(无共享条码的计划)</div>
        )}

        {analyzed.map(({ g, a }) => (
          <div key={g.barcode} style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,.08)', overflow: 'hidden', border: `1px solid ${verdictBorder[a.verdict.level]}` }}>
            {/* group head */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{g.title}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>条码 {g.barcode} · 涉及 {g.members.length} 家店 · 盈亏线 {(g.gross * 100).toFixed(0)}%</div>
              </div>
              {/* 合并指标 */}
              <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: a.overGross ? '#c62828' : '#2e7d32' }}>{(a.mergedFebi * 100).toFixed(1)}%</div>
                  <div style={{ color: '#9ca3af' }}>合并费比{a.overGross ? ' ⚠超线' : ''}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#374151' }}>¥{a.totalSpend.toLocaleString()}</div>
                  <div style={{ color: '#9ca3af' }}>合并花费</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: a.simulTui >= 2 ? '#c62828' : '#374151' }}>{a.simulTui}</div>
                  <div style={{ color: '#9ca3af' }}>同时追量</div>
                </div>
              </div>
              {/* 重叠度 */}
              <div style={{ display: 'flex', gap: 6 }}>
                {([['kw', '词'], ['crowd', '人群'], ['time', '时段'], ['price', '价格']] as [keyof typeof g.overlap, string][]).map(([d, l]) => (
                  <div key={d} style={{ textAlign: 'center' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: ovColor[g.overlap[d]] + '22', color: ovColor[g.overlap[d]], fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>{ovLabel[g.overlap[d]]}</div>
                    <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 各店赛马表 */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['赛马', '店铺', '前台商品(skuId各异)', '区间', '费比', 'ROI目标', '今日花费', '规则', '角色'].map(h => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: '#6b7280', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {g.members.map(m => {
                    const rank = a.rankMap[m.storeId]
                    const z = zoneOf(m.plan.febi, m.plan.gross)
                    const role = a.roleOf(m)
                    return (
                      <tr key={m.storeId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '6px 10px' }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: rank === 1 ? '#2e7d32' : '#9ca3af' }}>{rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'} {rank}</span>
                        </td>
                        <td style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: m.storeColor, padding: '1px 6px', borderRadius: 10, marginRight: 6 }}>{m.storeTag}</span>
                          {m.storeName}
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <div style={{ fontWeight: 600 }}>{m.plan.name}</div>
                          <div style={{ fontSize: 10, color: '#9ca3af' }}>{m.plan.skuId}</div>
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: zoneClr[z] }}>{zoneCN[z]}</span>
                        </td>
                        <td style={{ padding: '6px 10px', fontWeight: 700, color: zoneClr[z] }}>{(m.plan.febi * 100).toFixed(1)}%</td>
                        <td style={{ padding: '6px 10px' }}>{m.plan.roiTarget}</td>
                        <td style={{ padding: '6px 10px' }}>¥{m.plan.spend.toLocaleString()}</td>
                        <td style={{ padding: '6px 10px' }}>
                          {m.plan.rule && m.plan.rule !== '—'
                            ? <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: /R3|追量/.test(m.plan.rule) ? '#e8f5e9' : '#fff3e0', color: /R3|追量/.test(m.plan.rule) ? '#2e7d32' : '#e65100' }}>{m.plan.rule}</span>
                            : <span style={{ color: '#cbd5e1' }}>—</span>}
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <select value={role} onChange={e => setRole(g.barcode, m.storeId, e.target.value as Role)}
                            style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 6, border: 'none', cursor: 'pointer', background: roleStyle[role].bg, color: roleStyle[role].color }}>
                            {(['主推', '防御', '清仓'] as Role[]).map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* 竞合判定 + 建议 */}
            <div style={{ padding: '10px 16px', background: verdictBg[a.verdict.level], display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: verdictColor[a.verdict.level], whiteSpace: 'nowrap' }}>{a.verdict.tag}</span>
              <span style={{ fontSize: 11.5, color: '#4b5563', lineHeight: 1.6 }}>{a.verdict.advice}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
