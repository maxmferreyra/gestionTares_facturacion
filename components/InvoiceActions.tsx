'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { SYSTEMS_CONFIG } from '@/lib/actions-config'

interface Action {
  id: string
  system: string
  action: string
  invoice_number: string | null
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
  const [allActions, setAllActions] = useState<Action[]>([]) // all history for autocomplete
  const [loading, setLoading] = useState(true)

  // Per-action mini form state: key = `${sysKey}__${actKey}`
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [invoiceInput, setInvoiceInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const fetchActions = useCallback(async () => {
    setLoading(true)
    const [todayRes, allRes] = await Promise.all([
      fetch(`/api/actions?collaborator_id=${collaboratorId}&date=${currentDate}`),
      fetch(`/api/actions?collaborator_id=${collaboratorId}`),
    ])
    const todayData = await todayRes.json()
    const allData = await allRes.json()
    setActions(Array.isArray(todayData) ? todayData : [])
    setAllActions(Array.isArray(allData) ? allData : [])
    setLoading(false)
  }, [collaboratorId, currentDate])

  useEffect(() => { fetchActions() }, [fetchActions])

  // Unique invoice numbers from all history
  const allInvoiceNumbers = Array.from(
    new Set(allActions.map(a => a.invoice_number).filter(Boolean) as string[])
  ).sort()

  function openMiniForm(key: string) {
    setPendingKey(key)
    setInvoiceInput('')
    setSuggestions([])
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function handleInvoiceTyping(val: string) {
    setInvoiceInput(val)
    if (val.trim().length > 0) {
      setSuggestions(allInvoiceNumbers.filter(n => n.toLowerCase().includes(val.toLowerCase())).slice(0, 6))
    } else {
      setSuggestions([])
    }
  }

  async function confirmAction(key: string, invoiceNum: string) {
    const [system, action] = key.split('__')
    const res = await fetch('/api/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collaborator_id: collaboratorId, system, action, date: currentDate, invoice_number: invoiceNum || null }),
    })
    const data = await res.json()
    if (res.ok) {
      setActions(prev => [...prev, data])
      setAllActions(prev => [...prev, data])
    }
    setPendingKey(null)
    setInvoiceInput('')
    setSuggestions([])
  }

  async function removeAction(system: string, action: string) {
    // Find last action of this type today
    const last = [...actions].reverse().find(a => a.system === system && a.action === action)
    if (!last) return
    const res = await fetch(`/api/actions/${last.id}`, { method: 'DELETE' })
    if (res.ok) {
      setActions(prev => {
        const idx = [...prev].map(a => a.id).lastIndexOf(last.id)
        return prev.filter((_, i) => i !== idx)
      })
      setAllActions(prev => prev.filter(a => a.id !== last.id))
    }
  }

  // Search
  function handleSearchTyping(val: string) {
    setSearchQuery(val)
    setSelectedInvoice(null)
    if (val.trim().length > 0) {
      setSearchSuggestions(allInvoiceNumbers.filter(n => n.toLowerCase().includes(val.toLowerCase())).slice(0, 8))
    } else {
      setSearchSuggestions([])
    }
  }

  function selectInvoice(num: string) {
    setSelectedInvoice(num)
    setSearchQuery(num)
    setSearchSuggestions([])
  }

  // Invoice history for selected
  const invoiceHistory = selectedInvoice
    ? allActions.filter(a => a.invoice_number === selectedInvoice).sort((a, b) => a.created_at.localeCompare(b.created_at))
    : []

  // Counts for today
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
  function formatDateTime(iso: string) {
    const d = new Date(iso)
    return `${d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`
  }

  return (
    <div style={font}>

      {/* ── BUSCADOR DE FACTURAS ── */}
      <div style={{ background: 'white', borderRadius: 12, border: '0.5px solid #e5e3db', padding: '14px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#888780', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className="ti ti-search" style={{ fontSize: 13 }} /> Buscar factura
        </div>
        <div style={{ position: 'relative' }}>
          <input
            ref={searchRef}
            value={searchQuery}
            onChange={e => handleSearchTyping(e.target.value)}
            placeholder="Ingresá el número de factura..."
            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '0.5px solid #d3d1c7', fontSize: 14, outline: 'none', ...font }}
          />
          {searchSuggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '0.5px solid #d3d1c7', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,.08)', zIndex: 10, marginTop: 4 }}>
              {searchSuggestions.map(s => (
                <button key={s} onClick={() => selectInvoice(s)}
                  style={{ display: 'block', width: '100%', padding: '9px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: '#1a1a18', ...font }}
                  onMouseOver={e => (e.currentTarget.style.background = '#f5f4f0')}
                  onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                  <i className="ti ti-file-invoice" style={{ fontSize: 13, marginRight: 8, color: '#534AB7' }} />
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Invoice history table */}
        {selectedInvoice && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a18' }}>{selectedInvoice}</span>
              <span style={{ fontSize: 11, background: '#CECBF6', color: '#3C3489', padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>{invoiceHistory.length} acciones</span>
            </div>
            {invoiceHistory.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '0.5px solid #e5e3db' }}>
                      {['#', 'Fecha y hora', 'Sistema', 'Acción'].map(h => (
                        <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, color: '#888780', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceHistory.map((a, i) => {
                      const sys = SYSTEMS_CONFIG.find(s => s.key === a.system)
                      const act = sys?.actions.find(x => x.key === a.action)
                      return (
                        <tr key={a.id} style={{ borderBottom: '0.5px solid #f5f4f0' }}>
                          <td style={{ padding: '7px 10px', color: '#b4b2a9', fontWeight: 300 }}>{i + 1}</td>
                          <td style={{ padding: '7px 10px', color: '#5f5e5a', whiteSpace: 'nowrap' }}>{formatDateTime(a.created_at)}</td>
                          <td style={{ padding: '7px 10px' }}>
                            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: sys?.bg, color: sys?.color, whiteSpace: 'nowrap' }}>
                              {sys?.label || a.system}
                            </span>
                          </td>
                          <td style={{ padding: '7px 10px', color: '#1a1a18' }}>{act?.label || a.action}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#b4b2a9', fontWeight: 300 }}>No se encontraron acciones para esta factura.</div>
            )}
          </div>
        )}
      </div>

      {/* ── STATS ROW ── */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ background: 'white', borderRadius: 10, padding: '9px 14px', border: '0.5px solid #e5e3db', textAlign: 'center', minWidth: 56 }}>
          <div style={{ fontSize: 10, color: '#888780', fontWeight: 500, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 2 }}>Total</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#534AB7' }}>{total}</div>
        </div>
        {SYSTEMS_CONFIG.map(s => (
          <div key={s.key} style={{ background: 'white', borderRadius: 10, padding: '9px 12px', border: '0.5px solid #e5e3db', textAlign: 'center', minWidth: 56 }}>
            <div style={{ fontSize: 10, color: '#888780', fontWeight: 500, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: s.color }}>{systemTotals[s.key] || 0}</div>
          </div>
        ))}
      </div>

      {/* ── SYSTEMS BOTONERA ── */}
      {SYSTEMS_CONFIG.map((sys, si) => (
        <div key={sys.key} style={{ marginBottom: 4 }}>
          {si > 0 && <div style={{ borderTop: '0.5px solid #e5e3db', margin: '14px 0' }} />}
          <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', padding: '3px 10px', borderRadius: 20, background: sys.bg, color: sys.color }}>
              {sys.label}
            </span>
            {systemTotals[sys.key] > 0 && (
              <span style={{ fontSize: 11, color: '#888780', fontWeight: 300 }}>{systemTotals[sys.key]} hoy</span>
            )}
          </div>

          {sys.actions.map(act => {
            const countKey = `${sys.key}__${act.key}`
            const count = counts[countKey] || 0
            const isOpen = pendingKey === countKey

            return (
              <div key={act.key} style={{ marginBottom: 7 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderRadius: isOpen ? '10px 10px 0 0' : 10, border: `0.5px solid ${isOpen ? sys.color : '#e5e3db'}`, borderBottom: isOpen ? 'none' : undefined, background: 'white', transition: 'all .15s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: sys.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`ti ${act.icon}`} style={{ fontSize: 15, color: sys.color }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a18' }}>{act.label}</div>
                      {act.sublabel && <div style={{ fontSize: 11, color: '#888780', fontWeight: 300, marginTop: 1 }}>{act.sublabel}</div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20, fontWeight: 600, color: sys.color, minWidth: 28, textAlign: 'right' }}>{count}</span>
                    {/* Minus button */}
                    <button onClick={() => removeAction(sys.key, act.key)} disabled={count === 0}
                      style={{ width: 28, height: 28, borderRadius: '50%', border: `1.5px solid ${count === 0 ? '#e5e3db' : sys.color}`, background: 'white', color: count === 0 ? '#d3d1c7' : sys.color, fontSize: 18, fontWeight: 400, cursor: count === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1 }}
                      aria-label={`Restar ${act.label}`}>
                      −
                    </button>
                    {/* Plus button */}
                    <button onClick={() => isOpen ? setPendingKey(null) : openMiniForm(countKey)}
                      style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: isOpen ? sys.color : sys.bg, color: isOpen ? 'white' : sys.color, fontSize: 18, fontWeight: 400, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                      aria-label={`Sumar ${act.label}`}>
                      +
                    </button>
                  </div>
                </div>

                {/* Mini form for invoice number */}
                {isOpen && (
                  <div style={{ border: `0.5px solid ${sys.color}`, borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '10px 14px', background: sys.bg + '33' }}>
                    <div style={{ fontSize: 11, color: sys.color, fontWeight: 600, marginBottom: 6 }}>Número de factura (opcional)</div>
                    <div style={{ position: 'relative' }}>
                      <input ref={inputRef} value={invoiceInput} onChange={e => handleInvoiceTyping(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') confirmAction(countKey, invoiceInput) }}
                        placeholder="Ej: FC-0001A o dejá vacío"
                        style={{ width: '100%', padding: '8px 11px', borderRadius: 7, border: `0.5px solid ${sys.color}`, fontSize: 13, outline: 'none', background: 'white', ...font, marginBottom: suggestions.length > 0 ? 0 : 8 }} />
                      {suggestions.length > 0 && (
                        <div style={{ background: 'white', border: '0.5px solid #d3d1c7', borderRadius: '0 0 8px 8px', marginBottom: 8 }}>
                          {suggestions.map(s => (
                            <button key={s} onClick={() => { setInvoiceInput(s); setSuggestions([]) }}
                              style={{ display: 'block', width: '100%', padding: '7px 11px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 12, color: '#1a1a18', ...font }}
                              onMouseOver={e => (e.currentTarget.style.background = '#f5f4f0')}
                              onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                              <i className="ti ti-file-invoice" style={{ fontSize: 12, marginRight: 6, color: sys.color }} />{s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => confirmAction(countKey, invoiceInput)}
                        style={{ flex: 1, padding: '7px', borderRadius: 7, border: 'none', background: sys.color, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', ...font }}>
                        Confirmar
                      </button>
                      <button onClick={() => { setPendingKey(null); setInvoiceInput(''); setSuggestions([]) }}
                        style={{ padding: '7px 12px', borderRadius: 7, border: '0.5px solid #d3d1c7', background: 'white', fontSize: 13, cursor: 'pointer', color: '#888780', ...font }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}

      {/* ── HISTORIAL DE HOY ── */}
      {actions.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#888780', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="ti ti-history" style={{ fontSize: 13 }} /> Historial de hoy
          </div>
          {[...actions].reverse().slice(0, 10).map((a, i) => {
            const sys = SYSTEMS_CONFIG.find(s => s.key === a.system)
            const act = sys?.actions.find(x => x.key === a.action)
            return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: i === 0 ? '#f5f4f0' : 'white', border: '0.5px solid #e5e3db', marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: '#888780', minWidth: 42, fontWeight: 300 }}>{formatTime(a.created_at)}</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: sys?.bg, color: sys?.color, whiteSpace: 'nowrap' }}>{sys?.label}</span>
                <span style={{ fontSize: 12, color: '#1a1a18', flex: 1 }}>{act?.label || a.action}</span>
                {a.invoice_number && (
                  <span style={{ fontSize: 11, background: '#f5f4f0', color: '#534AB7', padding: '1px 7px', borderRadius: 6, fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {a.invoice_number}
                  </span>
                )}
                <span style={{ fontSize: 10, color: '#b4b2a9' }}>#{actions.length - i}</span>
              </div>
            )
          })}
        </div>
      )}

      {!loading && actions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#b4b2a9' }}>
          <i className="ti ti-file-invoice" style={{ fontSize: 36, display: 'block', marginBottom: 8 }} />
          <div style={{ fontSize: 14, fontWeight: 300 }}>Todavía no registraste acciones hoy</div>
        </div>
      )}
    </div>
  )
}
