'use client'
import { useEffect, useState, useCallback } from 'react'
import { SYSTEMS_CONFIG, COUPA_STATES } from '@/lib/actions-config'

interface Action {
  id: string
  system: string
  action: string
  reason: string | null
  date: string
  created_at: string
}

interface Props { collaboratorId: string; currentDate: string }
const font = { fontFamily: 'Montserrat, sans-serif' }

export default function InvoiceActions({ collaboratorId, currentDate }: Props) {
  const [actions, setActions] = useState<Action[]>([])
  const [globalTotals, setGlobalTotals] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [openSystems, setOpenSystems] = useState<Record<string, boolean>>({})

  // Reasons dropdown state (Brainware)
  const [reasonFor, setReasonFor] = useState<string | null>(null)
  const [customReason, setCustomReason] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [reasonQty, setReasonQty] = useState('1')

  // Coupa transition state
  const [coupaOpen, setCoupaOpen] = useState(false)
  const [fromState, setFromState] = useState('')
  const [toState, setToState] = useState('')
  const [coupaQty, setCoupaQty] = useState('1')
  const [coupaError, setCoupaError] = useState('')

  // Bulk add (standard actions without reasons/transition)
  const [bulkFor, setBulkFor] = useState<string | null>(null)
  const [bulkQty, setBulkQty] = useState('')
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkError, setBulkError] = useState('')

  const fetchActions = useCallback(async () => {
    setLoading(true)
    const [myRes, globalRes] = await Promise.all([
      fetch(`/api/actions?collaborator_id=${collaboratorId}&date=${currentDate}`, { cache: 'no-store' }),
      fetch(`/api/global-actions?date=${currentDate}`, { cache: 'no-store' }),
    ])
    const myData = await myRes.json()
    const globalData = await globalRes.json()
    setActions(Array.isArray(myData) ? myData : [])
    setGlobalTotals(typeof globalData === 'object' ? globalData : {})
    setLoading(false)
  }, [collaboratorId, currentDate])

  useEffect(() => { fetchActions() }, [fetchActions])

  async function addAction(system: string, action: string, reason?: string) {
    const res = await fetch('/api/actions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collaborator_id: collaboratorId, system, action, date: currentDate, reason: reason || null }),
    })
    const data = await res.json()
    if (res.ok) {
      setActions(prev => [...prev, data])
      setGlobalTotals(prev => ({ ...prev, [system]: (prev[system] || 0) + 1 }))
    }
  }

  // Carga masiva — crea N registros individuales de una sola vez (auditable: cada uno es una fila propia)
  async function addBulk(system: string, action: string, quantityStr: string, reason?: string) {
    const qty = parseInt(quantityStr, 10)
    if (!qty || qty < 1) { setBulkError('Ingresá una cantidad válida'); return false }
    if (qty > 500) { setBulkError('Máximo 500 por carga'); return false }
    setBulkSaving(true)
    const res = await fetch('/api/actions/bulk', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collaborator_id: collaboratorId, system, action, date: currentDate, reason: reason || null, quantity: qty }),
    })
    const data = await res.json()
    setBulkSaving(false)
    if (res.ok) {
      setActions(prev => [...prev, ...data.rows])
      setGlobalTotals(prev => ({ ...prev, [system]: (prev[system] || 0) + qty }))
      return true
    } else {
      setBulkError(data.error || 'Error al cargar')
      return false
    }
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

  // Brainware reasons
  function handlePlusReasons(sysKey: string, actKey: string) {
    const key = `${sysKey}__${actKey}`
    setReasonFor(reasonFor === key ? null : key)
    setShowCustomInput(false)
    setCustomReason('')
    setReasonQty('1')
  }
  async function pickReason(sysKey: string, actKey: string, reason: string) {
    if (reason === 'Otro') {
      setShowCustomInput(true)
      return
    }
    const qty = parseInt(reasonQty, 10) || 1
    if (qty > 1) await addBulk(sysKey, actKey, String(qty), reason)
    else await addAction(sysKey, actKey, reason)
    setReasonFor(null)
  }
  async function confirmCustomReason(sysKey: string, actKey: string) {
    const r = customReason.trim()
    if (!r) return
    const qty = parseInt(reasonQty, 10) || 1
    if (qty > 1) await addBulk(sysKey, actKey, String(qty), `Otro: ${r}`)
    else await addAction(sysKey, actKey, `Otro: ${r}`)
    setReasonFor(null); setShowCustomInput(false); setCustomReason('')
  }

  // Coupa transition
  async function confirmCoupaTransition() {
    setCoupaError('')
    if (!fromState || !toState) { setCoupaError('Seleccioná ambos estados'); return }
    if (fromState === toState) { setCoupaError('Los estados deben ser distintos'); return }
    const qty = parseInt(coupaQty, 10) || 1
    const label = `${fromState} → ${toState}`
    if (qty > 1) {
      const ok = await addBulk('coupa', 'transicion', String(qty), label)
      if (!ok) return
    } else {
      await addAction('coupa', 'transicion', label)
    }
    setFromState(''); setToState(''); setCoupaQty('1'); setCoupaOpen(false)
  }

  // Standard bulk add (no reasons/transition)
  function openBulk(countKey: string) {
    setBulkFor(bulkFor === countKey ? null : countKey)
    setBulkQty(''); setBulkError('')
  }
  async function confirmBulk(sysKey: string, actKey: string) {
    setBulkError('')
    const ok = await addBulk(sysKey, actKey, bulkQty)
    if (ok) { setBulkFor(null); setBulkQty('') }
  }

  function toggleSystem(key: string) { setOpenSystems(prev => ({ ...prev, [key]: !prev[key] })) }

  const counts: Record<string, number> = {}
  const systemTotals: Record<string, number> = {}
  for (const a of actions) {
    counts[`${a.system}__${a.action}`] = (counts[`${a.system}__${a.action}`] || 0) + 1
    systemTotals[a.system] = (systemTotals[a.system] || 0) + 1
  }
  const total = actions.length

  function formatTime(iso: string) { return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) }

  const selectStyle = { padding: '8px 10px', borderRadius: 8, border: '0.5px solid var(--border)', fontSize: 13, outline: 'none', background: 'var(--input-bg)', color: 'var(--text)', cursor: 'pointer', ...font }
  const qtyInputStyle = { width: 60, padding: '6px 8px', borderRadius: 7, border: '0.5px solid var(--border)', fontSize: 13, outline: 'none', background: 'var(--input-bg)', color: 'var(--text)', textAlign: 'center' as const, ...font }

  return (
    <div style={font}>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ background: 'var(--card)', borderRadius: 10, padding: '9px 14px', border: '0.5px solid var(--border)', textAlign: 'center', minWidth: 52 }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 2 }}>Total</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#534AB7' }}>{total}</div>
        </div>
        {SYSTEMS_CONFIG.map(s => (
          <div key={s.key} style={{ background: 'var(--card)', borderRadius: 10, padding: '9px 11px', border: '0.5px solid var(--border)', textAlign: 'center', minWidth: 52 }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: s.color }}>{systemTotals[s.key] || 0}</div>
            {globalTotals[s.key] > 0 && <div style={{ fontSize: 10, color: 'var(--text4)', fontWeight: 300, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}><i className="ti ti-users" style={{ fontSize: 10 }} />{globalTotals[s.key]}</div>}
          </div>
        ))}
      </div>

      {/* Accordions */}
      {SYSTEMS_CONFIG.map(sys => {
        const isOpen = !!openSystems[sys.key]
        const myTotal = systemTotals[sys.key] || 0
        const globalTotal = globalTotals[sys.key] || 0
        return (
          <div key={sys.key} style={{ marginBottom: 8 }}>
            <button onClick={() => toggleSystem(sys.key)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: isOpen ? '10px 10px 0 0' : 10, border: `0.5px solid ${isOpen ? sys.color : 'var(--border)'}`, background: isOpen ? sys.bg + '33' : 'var(--card)', cursor: 'pointer', ...font }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', padding: '3px 10px', borderRadius: 20, background: sys.bg, color: sys.color }}>{sys.label}</span>
                {myTotal > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: sys.color }}>{myTotal} hoy</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {globalTotal > 0 && <span style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 3 }}><i className="ti ti-users" style={{ fontSize: 12 }} />{globalTotal} equipo</span>}
                <i className={`ti ${isOpen ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: 16, color: isOpen ? sys.color : 'var(--text3)' }} />
              </div>
            </button>

            {isOpen && (
              <div style={{ border: `0.5px solid ${sys.color}`, borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
                {sys.actions.map((act, idx) => {
                  const countKey = `${sys.key}__${act.key}`
                  const count = counts[countKey] || 0

                  // ── COUPA TRANSITION ──
                  if (act.transition) {
                    return (
                      <div key={act.key} style={{ borderTop: idx > 0 ? '0.5px solid var(--border)' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', background: 'var(--card)' }}>
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
                              style={{ width: 24, height: 24, borderRadius: '50%', border: `1.5px solid ${count === 0 ? 'var(--border)' : sys.color}`, background: 'transparent', color: count === 0 ? 'var(--text4)' : sys.color, fontSize: 16, cursor: count === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>−</button>
                            <button onClick={() => { setCoupaOpen(!coupaOpen); setCoupaError('') }}
                              style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: coupaOpen ? sys.color : sys.bg, color: coupaOpen ? 'white' : sys.color, fontSize: 16, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>+</button>
                          </div>
                        </div>

                        {coupaOpen && (
                          <div style={{ padding: '4px 16px 14px 16px', background: sys.bg + '22' }}>
                            <div style={{ fontSize: 11, color: sys.color, fontWeight: 600, marginBottom: 8 }}>Seleccioná la transición de estado:</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <select value={fromState} onChange={e => setFromState(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
                                <option value="">Estado origen</option>
                                {COUPA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <i className="ti ti-arrow-right" style={{ fontSize: 16, color: sys.color, flexShrink: 0 }} />
                              <select value={toState} onChange={e => setToState(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
                                <option value="">Estado destino</option>
                                {COUPA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <label style={{ fontSize: 12, color: sys.color, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
                                <i className="ti ti-stack-2" style={{ fontSize: 14 }} /> Cantidad:
                              </label>
                              <input type="number" min="1" max="500" value={coupaQty} onChange={e => setCoupaQty(e.target.value)} style={qtyInputStyle} />
                              <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 300 }}>toques con esta transición</span>
                            </div>
                            {coupaError && <div style={{ fontSize: 12, color: '#A32D2D', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}><i className="ti ti-alert-circle" style={{ fontSize: 13 }} />{coupaError}</div>}
                            <button onClick={confirmCoupaTransition} disabled={bulkSaving}
                              style={{ width: '100%', padding: '8px', borderRadius: 8, border: 'none', background: sys.color, color: 'white', fontSize: 13, fontWeight: 600, cursor: bulkSaving ? 'not-allowed' : 'pointer', opacity: bulkSaving ? 0.7 : 1, ...font }}>
                              {bulkSaving ? 'Guardando...' : 'Registrar transición'}
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  }

                  // ── BRAINWARE / others ──
                  const showReasons = reasonFor === countKey
                  const showBulk = bulkFor === countKey
                  return (
                    <div key={act.key} style={{ borderTop: idx > 0 ? '0.5px solid var(--border)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', background: 'var(--card)' }}>
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
                            style={{ width: 24, height: 24, borderRadius: '50%', border: `1.5px solid ${count === 0 ? 'var(--border)' : sys.color}`, background: 'transparent', color: count === 0 ? 'var(--text4)' : sys.color, fontSize: 16, cursor: count === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>−</button>
                          <button onClick={() => act.reasons ? handlePlusReasons(sys.key, act.key) : addAction(sys.key, act.key)}
                            style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: showReasons ? sys.color : sys.bg, color: showReasons ? 'white' : sys.color, fontSize: 16, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>+</button>
                          {!act.reasons && (
                            <button onClick={() => openBulk(countKey)} title="Carga masiva"
                              style={{ width: 24, height: 24, borderRadius: 7, border: `1px solid ${showBulk ? sys.color : 'var(--border)'}`, background: showBulk ? sys.color : 'transparent', color: showBulk ? 'white' : 'var(--text3)', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              xN
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Bulk add panel (standard actions) */}
                      {showBulk && !act.reasons && (
                        <div style={{ padding: '4px 16px 12px 16px', background: sys.bg + '22' }}>
                          <div style={{ fontSize: 11, color: sys.color, fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <i className="ti ti-stack-2" style={{ fontSize: 13 }} /> Carga masiva — ej. {act.label} x50
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <input type="number" min="1" max="500" value={bulkQty} onChange={e => setBulkQty(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') confirmBulk(sys.key, act.key) }}
                              placeholder="Cantidad" autoFocus
                              style={{ flex: 1, padding: '7px 11px', borderRadius: 8, border: `0.5px solid ${sys.color}`, fontSize: 13, outline: 'none', background: 'var(--input-bg)', color: 'var(--text)', ...font }} />
                            <button onClick={() => confirmBulk(sys.key, act.key)} disabled={bulkSaving}
                              style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: sys.color, color: 'white', fontSize: 13, fontWeight: 600, cursor: bulkSaving ? 'not-allowed' : 'pointer', opacity: bulkSaving ? 0.7 : 1, ...font }}>
                              {bulkSaving ? '...' : 'Cargar'}
                            </button>
                          </div>
                          {bulkError && <div style={{ fontSize: 12, color: '#A32D2D', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}><i className="ti ti-alert-circle" style={{ fontSize: 13 }} />{bulkError}</div>}
                          <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 300, marginTop: 6 }}>Cada toque queda registrado individualmente para auditoría.</div>
                        </div>
                      )}

                      {showReasons && act.reasons && (
                        <div style={{ padding: '4px 16px 12px 16px', background: sys.bg + '22' }}>
                          <div style={{ fontSize: 11, color: sys.color, fontWeight: 600, marginBottom: 6 }}>Seleccioná la razón:</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                            {act.reasons.map(r => (
                              <button key={r} onClick={() => pickReason(sys.key, act.key, r)}
                                style={{ padding: '6px 12px', borderRadius: 20, border: `1px solid ${sys.color}`, background: r === 'Otro' && showCustomInput ? sys.bg : 'var(--card)', color: sys.color, fontSize: 12, fontWeight: 500, cursor: 'pointer', ...font }}>
                                {r}
                              </button>
                            ))}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: showCustomInput ? 10 : 0 }}>
                            <label style={{ fontSize: 11, color: sys.color, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <i className="ti ti-stack-2" style={{ fontSize: 13 }} /> Cantidad:
                            </label>
                            <input type="number" min="1" max="500" value={reasonQty} onChange={e => setReasonQty(e.target.value)} style={qtyInputStyle} />
                            <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 300 }}>(aplica a la razón que elijas)</span>
                          </div>
                          {showCustomInput && (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <input value={customReason} onChange={e => setCustomReason(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') confirmCustomReason(sys.key, act.key) }}
                                placeholder="Escribí el motivo..." autoFocus
                                style={{ flex: 1, padding: '7px 11px', borderRadius: 8, border: `0.5px solid ${sys.color}`, fontSize: 13, outline: 'none', background: 'var(--input-bg)', color: 'var(--text)', ...font }} />
                              <button onClick={() => confirmCustomReason(sys.key, act.key)}
                                style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: sys.color, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', ...font }}>
                                OK
                              </button>
                            </div>
                          )}
                        </div>
                      )}
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
            const mainLabel = a.system === 'coupa' && a.reason ? a.reason : (act?.label || a.action)
            const extraReason = a.system !== 'coupa' && a.reason ? a.reason : null
            return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: i === 0 ? 'var(--bg)' : 'var(--card)', border: '0.5px solid var(--border)', marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: 'var(--text3)', minWidth: 42, fontWeight: 300 }}>{formatTime(a.created_at)}</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: sys?.bg, color: sys?.color, whiteSpace: 'nowrap' }}>{sys?.label}</span>
                <span style={{ fontSize: 12, color: 'var(--text)', flex: 1 }}>
                  {mainLabel}
                  {extraReason && <span style={{ color: 'var(--text3)', fontWeight: 300 }}> · {extraReason}</span>}
                </span>
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
