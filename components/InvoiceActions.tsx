'use client'
import { useEffect, useState, useCallback } from 'react'
import { SYSTEMS_CONFIG } from '@/lib/actions-config'

interface Action {
  id: string
  system: string
  action: string
  date: string
  created_at: string
}

interface Props {
  collaboratorId: string
  currentDate: string
}

const font = { fontFamily: 'Montserrat, sans-serif' }

export default function InvoiceActions({ collaboratorId, currentDate }: Props) {
  const [actions, setActions] = useState<Action[]>([])
  const [globalTotals, setGlobalTotals] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [openSystems, setOpenSystems] = useState<Record<string, boolean>>({})
  const [adding, setAdding] = useState<string | null>(null)

  const fetchActions = useCallback(async () => {
    setLoading(true)
    const [myRes, globalRes] = await Promise.all([
      fetch(`/api/actions?collaborator_id=${collaboratorId}&date=${currentDate}`),
      fetch(`/api/global-actions?date=${currentDate}`),
    ])
    const myData = await myRes.json()
    const globalData = await globalRes.json()
    setActions(Array.isArray(myData) ? myData : [])
    setGlobalTotals(typeof globalData === 'object' ? globalData : {})
    setLoading(false)
  }, [collaboratorId, currentDate])

  useEffect(() => { fetchActions() }, [fetchActions])

  async function addAction(system: string, action: string) {
    const key = `${system}__${action}`
    setAdding(key)
    const res = await fetch('/api/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collaborator_id: collaboratorId, system, action, date: currentDate }),
    })
    const data = await res.json()
    if (res.ok) {
      setActions(prev => [...prev, data])
      setGlobalTotals(prev => ({ ...prev, [system]: (prev[system] || 0) + 1 }))
    }
    setAdding(null)
  }

  async function removeAction(system: string, action: string) {
    const last = [...actions].reverse().find(a => a.system === system && a.action === action)
    if (!last) return
    const res = await fetch(`/api/actions/${last.id}`, { method: 'DELETE' })
    if (res.ok) {
      setActions(prev => prev.filter(a => a.id !== last.id))
      setGlobalTotals(prev => ({ ...prev, [system]: Math.max(0, (prev[system] || 0) - 1) }))
    }
  }

  function toggleSystem(key: string) {
    setOpenSystems(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const counts: Record<string, number> = {}
  const systemTotals: Record<string, number> = {}
  for (const a of actions) {
    const key = `${a.system}__${a.action}`
    counts[key] = (counts[key] || 0) + 1
    systemTotals[a.system] = (systemTotals[a.system] || 0) + 1
  }
  const total = actions.length

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={font}>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ background: 'var(--card)', borderRadius: 10, padding: '9px 14px', border: '0.5px solid var(--border)', textAlign: 'center', minWidth: 52 }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 2 }}>Total</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#534AB7' }}>{total}</div>
        </div>
        {SYSTEMS_CONFIG.map(s => (
          <div key={s.key} style={{ background: 'var(--card)', borderRadius: 10, padding: '9px 10px', border: '0.5px solid var(--border)', textAlign: 'center', minWidth: 52 }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: s.color }}>{systemTotals[s.key] || 0}</div>
            {globalTotals[s.key] > 0 && (
              <div style={{ fontSize: 10, color: 'var(--text4)', fontWeight: 300, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <i className="ti ti-users" style={{ fontSize: 10 }} />{globalTotals[s.key]}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Accordion systems */}
      {SYSTEMS_CONFIG.map(sys => {
        const isOpen = !!openSystems[sys.key]
        const myTotal = systemTotals[sys.key] || 0
        const globalTotal = globalTotals[sys.key] || 0

        return (
          <div key={sys.key} style={{ marginBottom: 8 }}>
            {/* System header - clickable */}
            <button onClick={() => toggleSystem(sys.key)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: isOpen ? '10px 10px 0 0' : 10, border: `0.5px solid ${isOpen ? sys.color : 'var(--border)'}`, background: isOpen ? sys.bg + '33' : 'var(--card)', cursor: 'pointer', transition: 'all .15s', ...font }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', padding: '3px 10px', borderRadius: 20, background: sys.bg, color: sys.color }}>
                  {sys.label}
                </span>
                {myTotal > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: sys.color }}>{myTotal} hoy</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {globalTotal > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <i className="ti ti-users" style={{ fontSize: 12 }} />{globalTotal} equipo
                  </span>
                )}
                <i className={`ti ${isOpen ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: 16, color: isOpen ? sys.color : 'var(--text3)' }} />
              </div>
            </button>

            {/* Actions inside accordion */}
            {isOpen && (
              <div style={{ border: `0.5px solid ${sys.color}`, borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
                {sys.actions.map((act, idx) => {
                  const countKey = `${sys.key}__${act.key}`
                  const count = counts[countKey] || 0
                  const isAdding = adding === countKey

                  return (
                    <div key={act.key} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '11px 16px',
                      background: 'var(--card)',
                      borderTop: idx > 0 ? '0.5px solid var(--border)' : 'none',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: sys.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <i className={`ti ${act.icon}`} style={{ fontSize: 14, color: sys.color }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{act.label}</div>
                          {act.sublabel && <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 300, marginTop: 1 }}>{act.sublabel}</div>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 18, fontWeight: 600, color: sys.color, minWidth: 24, textAlign: 'right' }}>{count}</span>
                        <button onClick={() => removeAction(sys.key, act.key)} disabled={count === 0}
                          style={{ width: 24, height: 24, borderRadius: '50%', border: `1.5px solid ${count === 0 ? 'var(--border)' : sys.color}`, background: 'transparent', color: count === 0 ? 'var(--text4)' : sys.color, fontSize: 16, cursor: count === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                          aria-label={`Restar ${act.label}`}>−</button>
                        <button onClick={() => !isAdding && addAction(sys.key, act.key)} disabled={isAdding}
                          style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: isAdding ? 'var(--border)' : sys.bg, color: sys.color, fontSize: 16, fontWeight: 500, cursor: isAdding ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                          aria-label={`Sumar ${act.label}`}>+</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* History */}
      {actions.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="ti ti-history" style={{ fontSize: 13 }} /> Historial de hoy
          </div>
          {[...actions].reverse().slice(0, 12).map((a, i) => {
            const sys = SYSTEMS_CONFIG.find(s => s.key === a.system)
            const act = sys?.actions.find(x => x.key === a.action)
            return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: i === 0 ? 'var(--bg)' : 'var(--card)', border: '0.5px solid var(--border)', marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: 'var(--text3)', minWidth: 42, fontWeight: 300 }}>{formatTime(a.created_at)}</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: sys?.bg, color: sys?.color, whiteSpace: 'nowrap' }}>{sys?.label}</span>
                <span style={{ fontSize: 12, color: 'var(--text)', flex: 1 }}>{act?.label || a.action}</span>
                <span style={{ fontSize: 10, color: 'var(--text4)' }}>#{actions.length - i}</span>
              </div>
            )
          })}
        </div>
      )}

      {!loading && actions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text4)' }}>
          <i className="ti ti-file-invoice" style={{ fontSize: 36, display: 'block', marginBottom: 8 }} />
          <div style={{ fontSize: 14, fontWeight: 300 }}>Todavía no registraste acciones hoy</div>
        </div>
      )}
    </div>
  )
}
