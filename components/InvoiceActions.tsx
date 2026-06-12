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

interface Invoice {
  id: string
  invoice_number: string
  origin: string
  created_at: string
}

interface Props {
  collaboratorId: string
  currentDate: string
}

const font = { fontFamily: 'Montserrat, sans-serif' }

export default function InvoiceActions({ collaboratorId, currentDate }: Props) {
  const [actions, setActions] = useState<Action[]>([])
  const [allActions, setAllActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(true)

  // Mini form per action
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [invoiceInput, setInvoiceInput] = useState('')
  const [invoiceSuggestions, setInvoiceSuggestions] = useState<Invoice[]>([])
  const [invoiceError, setInvoiceError] = useState('')
  const [savingAction, setSavingAction] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState<Invoice[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)

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

  // Search invoices from DB
  async function searchInvoices(q: string): Promise<Invoice[]> {
    if (!q.trim()) return []
    const res = await fetch(`/api/invoices?collaborator_id=${collaboratorId}&q=${encodeURIComponent(q)}`)
    const data = await res.json()
    return Array.isArray(data) ? data : []
  }

  // Mini form handlers
  function openMiniForm(key: string) {
    setPendingKey(key)
    setInvoiceInput('')
    setInvoiceSuggestions([])
    setInvoiceError('')
    setTimeout(() => inputRef.current?.focus(), 60)
  }

  async function handleInvoiceTyping(val: string) {
    setInvoiceInput(val)
    setInvoiceError('')
    if (val.trim().length >= 1) {
      const results = await searchInvoices(val)
      setInvoiceSuggestions(results)
    } else {
      setInvoiceSuggestions([])
    }
  }

  async function confirmAction(key: string) {
    setSavingAction(true)
    setInvoiceError('')
    const [system, action] = key.split('__')
    const trimmed = invoiceInput.trim()

    // If invoice number provided, ensure it exists or create it
    if (trimmed) {
      const checkRes = await fetch(`/api/invoices?collaborator_id=${collaboratorId}&q=${encodeURIComponent(trimmed)}`)
      const checkData = await checkRes.json()
      const exact = Array.isArray(checkData) ? checkData.find((i: Invoice) => i.invoice_number.toLowerCase() === trimmed.toLowerCase()) : null

      if (!exact) {
        // Create new invoice
        const createRes = await fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ collaborator_id: collaboratorId, invoice_number: trimmed }),
        })
        const createData = await createRes.json()
        if (!createRes.ok) {
          setInvoiceError(createData.error || 'Error al registrar factura')
          setSavingAction(false)
          return
        }
      }
    }

    // Register the action
    const res = await fetch('/api/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        collaborator_id: collaboratorId,
        system,
        action,
        date: currentDate,
        invoice_number: trimmed || null,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setActions(prev => [...prev, data])
      setAllActions(prev => [...prev, data])
      setPendingKey(null)
      setInvoiceInput('')
      setInvoiceSuggestions([])
      setInvoiceError('')
    } else {
      setInvoiceError(data.error || 'Error al registrar acción')
    }
    setSavingAction(false)
  }

  async function removeAction(system: string, action: string) {
    const last = [...actions].reverse().find(a => a.system === system && a.action === action)
    if (!last) return
    const res = await fetch(`/api/actions/${last.id}`, { method: 'DELETE' })
    if (res.ok) {
      setActions(prev => prev.filter(a => a.id !== last.id))
      setAllActions(prev => prev.filter(a => a.id !== last.id))
    }
  }

  // Search bar handlers
  async function handleSearchTyping(val: string) {
    setSearchQuery(val)
    setSelectedInvoice(null)
    if (val.trim().length >= 1) {
      setSearchLoading(true)
      const results = await searchInvoices(val)
      setSearchSuggestions(results)
      setSearchLoading(false)
    } else {
      setSearchSuggestions([])
    }
  }

  function selectInvoice(num: string) {
    setSelectedInvoice(num)
    setSearchQuery(num)
    setSearchSuggestions([])
  }

  const invoiceHistory = selectedInvoice
    ? allActions.filter(a => a.invoice_number?.toLowerCase() === selectedInvoice.toLowerCase())
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
    : []

  // Counts
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

      {/* ── BUSCADOR ── */}
      <div style={{ background: 'white', borderRadius: 12, border: '0.5px solid #e5e3db', padding: '14px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#888780', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className="ti ti-search" style={{ fontSize: 13 }} /> Buscar factura
        </div>
        <div style={{ position: 'relative' }}>
          <input
            value={searchQuery}
            onChange={e => handleSearchTyping(e.target.value)}
            placeholder="Ingresá el número de factura..."
            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '0.5px solid #d3d1c7', fontSize: 14, outline: 'none', ...font }}
          />
          {searchLoading && (
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#888780' }}>
              <i className="ti ti-loader-2" style={{ fontSize: 14 }} />
            </div>
          )}
          {searchSuggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '0.5px solid #d3d1c7', borderRadius: '0 0 8px 8px', zIndex: 20, marginTop: 0 }}>
              {searchSuggestions.map(s => (
                <button key={s.id} onClick={() => selectInvoice(s.invoice_number)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', ...font }}
                  onMouseOver={e => (e.currentTarget.style.background = '#f5f4f0')}
                  onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                  <i className="ti ti-file-invoice" style={{ fontSize: 14, color: '#534AB7' }} />
                  <span style={{ fontSize: 13, color: '#1a1a18', fontWeight: 500 }}>{s.invoice_number}</span>
                  <span style={{ fontSize: 11, color: '#888780', marginLeft: 'auto' }}>{s.origin}</span>
                </button>
              ))}
            </div>
          )}
          {searchQuery.trim().length >= 1 && searchSuggestions.length === 0 && !searchLoading && !selectedInvoice && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '0.5px solid #d3d1c7', borderRadius: '0 0 8px 8px', zIndex: 20, padding: '10px 12px' }}>
              <span style={{ fontSize: 13, color: '#b4b2a9' }}>No se encontraron facturas con ese número</span>
            </div>
          )}
        </div>

        {/* Invoice history table */}
        {selectedInvoice && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a18' }}>{selectedInvoice}</span>
              <span style={{ fontSize: 11, background: '#CECBF6', color: '#3C3489', padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>{invoiceHistory.length} acción{invoiceHistory.length !== 1 ? 'es' : ''}</span>
            </div>
            {invoiceHistory.length > 0 ? (
              <div style={{ overflowX: 'auto', borderRadius: 8, border: '0.5px solid #e5e3db' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#f5f4f0' }}>
                      {['#', 'Fecha y hora', 'Sistema', 'Acción'].map(h => (
                        <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600, color: '#888780', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceHistory.map((a, i) => {
                      const sys = SYSTEMS_CONFIG.find(s => s.key === a.system)
                      const act = sys?.actions.find(x => x.key === a.action)
                      return (
                        <tr key={a.id} style={{ borderTop: '0.5px solid #f5f4f0' }}>
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
              <div style={{ fontSize: 13, color: '#b4b2a9', fontWeight: 300 }}>No hay acciones registradas para esta factura.</div>
            )}
          </div>
        )}
      </div>

      {/* ── STATS ROW ── */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ background: 'white', borderRadius: 10, padding: '9px 14px', border: '0.5px solid #e5e3db', textAlign: 'center', minWidth: 52 }}>
          <div style={{ fontSize: 10, color: '#888780', fontWeight: 500, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 2 }}>Total</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#534AB7' }}>{total}</div>
        </div>
        {SYSTEMS_CONFIG.map(s => (
          <div key={s.key} style={{ background: 'white', borderRadius: 10, padding: '9px 10px', border: '0.5px solid #e5e3db', textAlign: 'center', minWidth: 52 }}>
            <div style={{ fontSize: 10, color: '#888780', fontWeight: 500, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: s.color }}>{systemTotals[s.key] || 0}</div>
          </div>
        ))}
      </div>

      {/* ── BOTONERA ── */}
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
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: isOpen ? '10px 10px 0 0' : 10,
                  border: `0.5px solid ${isOpen ? sys.color : '#e5e3db'}`,
                  borderBottom: isOpen ? 'none' : `0.5px solid ${isOpen ? sys.color : '#e5e3db'}`,
                  background: 'white',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: sys.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`ti ${act.icon}`} style={{ fontSize: 14, color: sys.color }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a18' }}>{act.label}</div>
                      {act.sublabel && <div style={{ fontSize: 11, color: '#888780', fontWeight: 300, marginTop: 1 }}>{act.sublabel}</div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 18, fontWeight: 600, color: sys.color, minWidth: 24, textAlign: 'right' }}>{count}</span>
                    {/* − button */}
                    <button onClick={() => removeAction(sys.key, act.key)} disabled={count === 0}
                      style={{ width: 24, height: 24, borderRadius: '50%', border: `1.5px solid ${count === 0 ? '#e5e3db' : sys.color}`, background: 'white', color: count === 0 ? '#d3d1c7' : sys.color, fontSize: 16, fontWeight: 400, cursor: count === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1 }}
                      aria-label={`Restar ${act.label}`}>−</button>
                    {/* + button */}
                    <button onClick={() => isOpen ? setPendingKey(null) : openMiniForm(countKey)}
                      style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: isOpen ? sys.color : sys.bg, color: isOpen ? 'white' : sys.color, fontSize: 16, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                      aria-label={`Sumar ${act.label}`}>+</button>
                  </div>
                </div>

                {/* Mini form */}
                {isOpen && (
                  <div style={{ border: `0.5px solid ${sys.color}`, borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '10px 14px', background: sys.bg + '22' }}>
                    <div style={{ fontSize: 11, color: sys.color, fontWeight: 600, marginBottom: 6 }}>Número de factura (opcional)</div>
                    <div style={{ position: 'relative', marginBottom: 8 }}>
                      <input
                        ref={inputRef}
                        value={invoiceInput}
                        onChange={e => handleInvoiceTyping(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !savingAction) confirmAction(countKey) }}
                        placeholder="Ej: FC-0001A o dejá vacío"
                        style={{ width: '100%', padding: '8px 11px', borderRadius: invoiceSuggestions.length > 0 ? '7px 7px 0 0' : 7, border: `0.5px solid ${invoiceError ? '#e24b4a' : sys.color}`, fontSize: 13, outline: 'none', background: 'white', ...font }}
                      />
                      {invoiceSuggestions.length > 0 && (
                        <div style={{ background: 'white', border: `0.5px solid ${sys.color}`, borderTop: 'none', borderRadius: '0 0 7px 7px' }}>
                          {invoiceSuggestions.map(s => (
                            <button key={s.id} onClick={() => { setInvoiceInput(s.invoice_number); setInvoiceSuggestions([]) }}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '7px 11px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', ...font }}
                              onMouseOver={e => (e.currentTarget.style.background = '#f5f4f0')}
                              onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                              <i className="ti ti-file-invoice" style={{ fontSize: 12, color: sys.color }} />
                              <span style={{ fontSize: 12, color: '#1a1a18' }}>{s.invoice_number}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {invoiceError && (
                      <div style={{ fontSize: 12, color: '#A32D2D', background: '#FCEBEB', padding: '5px 9px', borderRadius: 6, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <i className="ti ti-alert-circle" style={{ fontSize: 13 }} /> {invoiceError}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => !savingAction && confirmAction(countKey)} disabled={savingAction}
                        style={{ flex: 1, padding: '7px', borderRadius: 7, border: 'none', background: sys.color, color: 'white', fontSize: 13, fontWeight: 600, cursor: savingAction ? 'not-allowed' : 'pointer', opacity: savingAction ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, ...font }}>
                        {savingAction ? <><i className="ti ti-loader-2" style={{ fontSize: 13 }} /> Guardando...</> : <><i className="ti ti-check" style={{ fontSize: 13 }} /> Confirmar</>}
                      </button>
                      <button onClick={() => { setPendingKey(null); setInvoiceInput(''); setInvoiceSuggestions([]); setInvoiceError('') }}
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
          {[...actions].reverse().slice(0, 12).map((a, i) => {
            const sys = SYSTEMS_CONFIG.find(s => s.key === a.system)
            const act = sys?.actions.find(x => x.key === a.action)
            return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: i === 0 ? '#f5f4f0' : 'white', border: '0.5px solid #e5e3db', marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: '#888780', minWidth: 42, fontWeight: 300 }}>{formatTime(a.created_at)}</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: sys?.bg, color: sys?.color, whiteSpace: 'nowrap' }}>{sys?.label}</span>
                <span style={{ fontSize: 12, color: '#1a1a18', flex: 1 }}>{act?.label || a.action}</span>
                {a.invoice_number && (
                  <span style={{ fontSize: 11, background: '#CECBF6', color: '#3C3489', padding: '1px 7px', borderRadius: 6, fontWeight: 500, whiteSpace: 'nowrap', cursor: 'pointer' }}
                    onClick={() => { setSearchQuery(a.invoice_number!); selectInvoice(a.invoice_number!) }}>
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
