'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { localToday, localOffsetDate } from '@/lib/types'
import Sidebar from '@/components/Sidebar'

const font = { fontFamily: 'Montserrat, sans-serif' }
const mono = { fontFamily: "'JetBrains Mono', monospace" }
const INACTIVITY_LIMIT = 8 * 60 * 60 * 1000

interface Correction {
  id: string
  company_code: '4001' | '4015'
  vendor: string
  invoice_number: string
  amount: number
  status: 'pending' | 'done'
  added_by_id: string
  added_by_name: string
  added_at: string
  corrected_by_id: string | null
  corrected_by_name: string | null
  corrected_at: string | null
}

type Scope = 'mine' | 'all'
type StatusView = 'pending' | 'done'

function localDateOf(iso: string) {
  const d = new Date(iso)
  const y = d.getFullYear(), m = (d.getMonth() + 1).toString().padStart(2, '0'), day = d.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${day}`
}

function daysAgoInfo(addedAtIso: string) {
  const addedDate = localDateOf(addedAtIso)
  const today = localToday()
  if (addedDate === today) return { label: 'Hoy', warn: false }
  if (addedDate === localOffsetDate(today, -1)) return { label: 'Ayer', warn: false }
  const diffDays = Math.round((new Date(today + 'T12:00').getTime() - new Date(addedDate + 'T12:00').getTime()) / 86400000)
  return { label: `Hace ${diffDays} días`, warn: diffDays >= 2 }
}

function formatAmount(n: number) {
  // Mismo formato que Coupa/SAP: coma de miles, punto decimal (ej: 4,000,000.00)
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function diffDaysFromToday(dateStr: string) {
  const today = localToday()
  return Math.round((new Date(today + 'T12:00').getTime() - new Date(dateStr + 'T12:00').getTime()) / 86400000)
}

function dayLabel(dateStr: string) {
  const today = localToday()
  if (dateStr === today) return 'Hoy'
  if (dateStr === localOffsetDate(today, -1)) return 'Ayer'
  const dt = new Date(dateStr + 'T12:00')
  const wd = dt.toLocaleDateString('es-AR', { weekday: 'long' })
  return `${wd.charAt(0).toUpperCase()}${wd.slice(1)} ${dt.getDate()}`
}

// Genera chips de día (máx. 5, los más recientes) a partir de fechas que
// realmente tienen datos — nunca se muestran días vacíos.
function buildDayChips(dates: string[], maxDays = 5) {
  const counts: Record<string, number> = {}
  for (const d of dates) counts[d] = (counts[d] || 0) + 1
  const sorted = Object.keys(counts).sort((a, b) => b.localeCompare(a))
  const top = sorted.slice(0, maxDays)
  return top.map(d => ({ date: d, label: dayLabel(d), count: counts[d], warn: diffDaysFromToday(d) >= 2 }))
}

// Interpreta el monto sin importar si lo escribiste en formato
// argentino (5.000.000,00) o en formato US/Coupa-SAP (5,000,000.00).
// Detecta cuál símbolo es el separador decimal mirando cuál aparece último.
function parseAmountInput(raw: string): number | null {
  let s = raw.trim()
  if (!s) return null
  const hasComma = s.includes(',')
  const hasDot = s.includes('.')

  if (hasComma && hasDot) {
    const lastComma = s.lastIndexOf(',')
    const lastDot = s.lastIndexOf('.')
    if (lastComma > lastDot) {
      // la coma es el decimal (formato AR) -> el punto era separador de miles
      s = s.replace(/\./g, '').replace(',', '.')
    } else {
      // el punto es el decimal (formato US) -> la coma era separador de miles
      s = s.replace(/,/g, '')
    }
  } else if (hasComma) {
    const parts = s.split(',')
    const lastPart = parts[parts.length - 1]
    s = (parts.length === 2 && lastPart.length <= 2)
      ? s.replace(',', '.')   // coma decimal: "50000,50"
      : s.replace(/,/g, '')   // comas de miles: "5,000,000"
  } else if (hasDot) {
    const parts = s.split('.')
    const lastPart = parts[parts.length - 1]
    if (!(parts.length === 2 && lastPart.length <= 2)) {
      s = s.replace(/\./g, '') // puntos de miles: "5.000.000"
    }
  }

  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

export default function BaseImponiblePage() {
  const router = useRouter()
  const [collaborator, setCollaborator] = useState<{ id: string; name: string; role: string } | null>(null)
  const [items, setItems] = useState<Correction[]>([])
  const [loading, setLoading] = useState(true)
  const [scope, setScope] = useState<Scope>('mine')
  const [statusView, setStatusView] = useState<StatusView>('pending')
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Add form
  const [companyCode, setCompanyCode] = useState<'4001' | '4015'>('4001')
  const [vendor, setVendor] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  // Chips de día — 'all' o una fecha YYYY-MM-DD específica
  const [pendingDayFilter, setPendingDayFilter] = useState<string>('all')
  const [doneDayFilter, setDoneDayFilter] = useState<string>(localToday())

  // Confirmación de borrado en Corregidas (2 pasos)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  function resetInactivity() {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    inactivityTimer.current = setTimeout(() => {
      localStorage.removeItem('collaborator')
      router.push('/?reason=inactivity')
    }, INACTIVITY_LIMIT)
  }

  useEffect(() => {
    const stored = localStorage.getItem('collaborator')
    if (!stored) { router.push('/'); return }
    setCollaborator(JSON.parse(stored))
    resetInactivity()
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    events.forEach(e => window.addEventListener(e, resetInactivity))
    return () => {
      events.forEach(e => window.removeEventListener(e, resetInactivity))
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    }
  }, [router])

  const fetchItems = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/base-imponible', { cache: 'no-store' })
    const data = await res.json()
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!vendor.trim()) { setFormError('Ingresá el vendor'); return }
    if (!invoiceNumber.trim()) { setFormError('Ingresá el N° de invoice'); return }
    const amountNum = parseAmountInput(amount)
    if (amountNum === null) { setFormError('Ingresá un monto válido'); return }
    if (!collaborator) return

    setSaving(true)
    const res = await fetch('/api/base-imponible', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_code: companyCode, vendor: vendor.trim(), invoice_number: invoiceNumber.trim(),
        amount: amountNum, added_by_id: collaborator.id, added_by_name: collaborator.name,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setFormError(data.error || 'Error al guardar'); return }
    setItems(prev => [data, ...prev])
    setVendor(''); setInvoiceNumber(''); setAmount('')
  }

  async function markCorrected(id: string) {
    if (!collaborator) return
    setBusyId(id)
    const res = await fetch(`/api/base-imponible/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ corrected_by_id: collaborator.id, corrected_by_name: collaborator.name, date: localToday() }),
    })
    const data = await res.json()
    setBusyId(null)
    if (res.ok) setItems(prev => prev.map(it => it.id === id ? data : it))
  }

  async function removePending(id: string) {
    setBusyId(id)
    const res = await fetch(`/api/base-imponible/${id}`, { method: 'DELETE' })
    setBusyId(null)
    if (res.ok) setItems(prev => prev.filter(it => it.id !== id))
  }

  // Borra una corrección ya marcada como "done". El toque ya insertado en
  // invoice_actions NO se toca — la auditoría queda intacta a propósito.
  async function deleteCorrected(id: string) {
    setBusyId(id)
    const res = await fetch(`/api/base-imponible/${id}`, { method: 'DELETE' })
    setBusyId(null)
    setConfirmDeleteId(null)
    if (res.ok) setItems(prev => prev.filter(it => it.id !== id))
  }

  if (!collaborator) return null

  const today = localToday()

  // ── Filtros base ──
  const scopedItems = items.filter(it => scope === 'mine' ? it.added_by_id === collaborator.id : true)
  const pendingAll = scopedItems.filter(it => it.status === 'pending')
  const doneAll = scopedItems.filter(it => it.status === 'done' && it.corrected_at)

  // Progreso de HOY: siempre fijo, sin importar qué chip esté mirando el usuario
  const correctedToday = doneAll.filter(it => localDateOf(it.corrected_at!) === today)
  const totalToday = pendingAll.length + correctedToday.length
  const progressPct = totalToday > 0 ? Math.round((correctedToday.length / totalToday) * 100) : 0

  // ── Chips de día (según pestaña activa) ──
  const pendingChips = buildDayChips(pendingAll.map(it => localDateOf(it.added_at)))
  const doneChips = buildDayChips(doneAll.map(it => localDateOf(it.corrected_at!)))

  // ── Lista visible según pestaña + chip seleccionado ──
  const visibleItems = statusView === 'pending'
    ? (pendingDayFilter === 'all' ? pendingAll : pendingAll.filter(it => localDateOf(it.added_at) === pendingDayFilter))
    : (doneDayFilter === 'all' ? doneAll : doneAll.filter(it => localDateOf(it.corrected_at!) === doneDayFilter))

  // Agrupar por vendor
  const grouped = new Map<string, Correction[]>()
  for (const it of visibleItems) {
    if (!grouped.has(it.vendor)) grouped.set(it.vendor, [])
    grouped.get(it.vendor)!.push(it)
  }
  // Dentro de cada grupo, más antigua primero (lo más urgente arriba) para pendientes; más reciente primero para corregidas
  grouped.forEach(arr => {
    arr.sort((a, b) => statusView === 'pending'
      ? a.added_at.localeCompare(b.added_at)
      : (b.corrected_at || '').localeCompare(a.corrected_at || ''))
  })
  const vendorGroups = Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]))

  const inputStyle = { width: '100%', padding: '8px 11px', borderRadius: 7, border: '0.5px solid var(--border)', fontSize: 13, outline: 'none', background: 'var(--input-bg)', color: 'var(--text)', ...font }

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', gap: 22, padding: 22, background: 'var(--bg)', ...font }}>
      <Sidebar collaborator={collaborator} activeKey="/base-imponible" onNavigate={() => router.push('/dashboard')} />
      <div style={{ flex: 1, minWidth: 0, maxWidth: 760 }}>

        {/* Header */}
        <div style={{ marginBottom: '1.1rem' }}>
          <h1 style={{ fontSize: 19, fontWeight: 600, color: 'var(--text)' }}>Base imponible</h1>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 300, marginTop: 2 }}>Corrección manual SAP — company codes 4001 / 4015</div>
        </div>

        {/* Toggle Mías / Todo el equipo */}
        <div style={{ display: 'flex', background: 'var(--card)', borderRadius: 10, padding: 3, marginBottom: 8, border: '0.5px solid var(--border)', gap: 2 }}>
          {(['mine', 'all'] as Scope[]).map(s => (
            <button key={s} onClick={() => setScope(s)}
              style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 500, background: scope === s ? 'var(--brand)' : 'transparent', color: scope === s ? 'var(--card)' : 'var(--text3)', ...font }}>
              {s === 'mine' ? 'Mías' : 'Todo el equipo'}
            </button>
          ))}
        </div>

        {/* Toggle Pendientes / Corregidas */}
        <div style={{ display: 'flex', background: 'var(--card)', borderRadius: 10, padding: 3, marginBottom: 10, border: '0.5px solid var(--border)', gap: 2 }}>
          {(['pending', 'done'] as StatusView[]).map(s => (
            <button key={s} onClick={() => setStatusView(s)}
              style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 500, background: statusView === s ? 'var(--brand)' : 'transparent', color: statusView === s ? 'var(--card)' : 'var(--text3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, ...font }}>
              <i className={`ti ${s === 'pending' ? 'ti-clock' : 'ti-circle-check'}`} style={{ fontSize: 13 }} />
              {s === 'pending' ? `Pendientes (${pendingAll.length})` : `Corregidas (${doneAll.length})`}
            </button>
          ))}
        </div>

        {/* Chips de día */}
        <div style={{ fontSize: 10, color: 'var(--text4)', fontWeight: 500, margin: '6px 2px 6px', textTransform: 'uppercase', letterSpacing: '.05em', display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className="ti ti-calendar" style={{ fontSize: 11 }} /> {statusView === 'pending' ? 'Filtrar por día que se cargó' : 'Filtrar por día corregido'}
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 12 }}>
          {(() => {
            const chips = statusView === 'pending' ? pendingChips : doneChips
            const activeFilter = statusView === 'pending' ? pendingDayFilter : doneDayFilter
            const setFilter = statusView === 'pending' ? setPendingDayFilter : setDoneDayFilter
            const allTotal = statusView === 'pending' ? pendingAll.length : doneAll.length
            return (
              <>
                <button onClick={() => setFilter('all')}
                  style={{ flexShrink: 0, padding: '6px 13px', borderRadius: 20, fontSize: 12, fontWeight: 500, border: `1.3px solid ${activeFilter === 'all' ? 'var(--brand)' : 'var(--border)'}`, background: activeFilter === 'all' ? 'var(--brand)' : 'var(--card)', color: activeFilter === 'all' ? 'var(--card)' : 'var(--text2)', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6, ...font }}>
                  Todos <span style={{ fontSize: 10, background: activeFilter === 'all' ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.08)', padding: '1px 6px', borderRadius: 10 }}>{allTotal}</span>
                </button>
                {chips.map(c => (
                  <button key={c.date} onClick={() => setFilter(c.date)}
                    style={{
                      flexShrink: 0, padding: '6px 13px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6, ...font,
                      border: `1.3px solid ${activeFilter === c.date ? 'var(--brand)' : (c.warn ? '#e8a0a0' : 'var(--border)')}`,
                      background: activeFilter === c.date ? 'var(--brand)' : 'var(--card)',
                      color: activeFilter === c.date ? 'var(--card)' : (c.warn ? 'var(--error)' : 'var(--text2)'),
                    }}>
                    {c.label} <span style={{ fontSize: 10, background: activeFilter === c.date ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.08)', padding: '1px 6px', borderRadius: 10 }}>{c.count}</span>
                  </button>
                ))}
              </>
            )
          })()}
        </div>
        {statusView === 'pending' && pendingChips.some(c => c.warn) && (
          <div style={{ fontSize: 10, color: 'var(--error)', marginTop: -6, marginBottom: 10 }}>Los chips en rojo tienen pendientes de 2+ días</div>
        )}

        {/* Progress card */}
        <div style={{ background: 'var(--card)', borderRadius: 12, border: '0.5px solid var(--border)', padding: '13px 16px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text3)', fontWeight: 500, marginBottom: 8 }}>
            <span><i className="ti ti-chart-donut" style={{ fontSize: 13, verticalAlign: -2 }} /> Progreso de hoy</span>
            <span style={{ color: 'var(--brand)', fontWeight: 600 }}>{correctedToday.length} de {totalToday} corregidas</span>
          </div>
          <div style={{ height: 8, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${progressPct}%`, height: '100%', background: 'var(--brand)', borderRadius: 99, transition: 'width .4s' }} />
          </div>
          {scope === 'all' && statusView === 'done' && (
            <div style={{ fontSize: 10, color: 'var(--brand)', fontWeight: 500, marginTop: 7, display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="ti ti-users" style={{ fontSize: 12 }} /> Total del equipo en este filtro: {visibleItems.length} factura{visibleItems.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Add form */}
        <form onSubmit={addItem} style={{ background: 'var(--card)', borderRadius: 12, border: '0.5px solid var(--brand-soft)', padding: '14px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-plus" style={{ fontSize: 15 }} /> Cargar nueva
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Company code</label>
              <select value={companyCode} onChange={e => setCompanyCode(e.target.value as '4001' | '4015')} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="4001">4001</option>
                <option value="4015">4015</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, display: 'block', marginBottom: 4 }}>N° Invoice</label>
              <input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="Ej: FC-0001A" style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Vendor</label>
            <input value={vendor} onChange={e => setVendor(e.target.value)} placeholder="N° vendor - Razón social" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Price / base imponible</label>
            <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" inputMode="decimal" style={{ ...inputStyle, ...mono }} />
            <div style={{ fontSize: 10, color: 'var(--text4)', marginTop: 4 }}>Acepta cualquier formato: 5,000,000.00 (Coupa/SAP) o 5.000.000,00 (AR)</div>
          </div>
          {formError && (
            <div style={{ fontSize: 12, color: 'var(--error)', background: 'var(--error-bg)', padding: '6px 10px', borderRadius: 7, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
              <i className="ti ti-alert-circle" style={{ fontSize: 14 }} /> {formError}
            </div>
          )}
          <button type="submit" disabled={saving}
            style={{ width: '100%', padding: '10px', borderRadius: 9, border: 'none', background: 'var(--brand)', color: 'var(--card)', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, ...font }}>
            {saving ? <><i className="ti ti-loader-2" style={{ fontSize: 14 }} /> Guardando...</> : <><i className="ti ti-check" style={{ fontSize: 14 }} /> Agregar pendiente</>}
          </button>
        </form>

        {/* List grouped by vendor */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text3)' }}>
            <i className="ti ti-loader-2" style={{ fontSize: 28, display: 'block', marginBottom: 8 }} /> Cargando...
          </div>
        ) : vendorGroups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text4)' }}>
            <i className={`ti ${statusView === 'pending' ? 'ti-circle-check' : 'ti-clock'}`} style={{ fontSize: 32, display: 'block', marginBottom: 8 }} />
            <div style={{ fontSize: 13, fontWeight: 300 }}>
              {statusView === 'pending'
                ? (pendingDayFilter === 'all' ? '¡Sin pendientes! Todo corregido.' : 'Nada pendiente para ese día.')
                : (doneDayFilter === 'all' ? 'Todavía no hay correcciones.' : (doneDayFilter === today ? 'Todavía no corregiste nada hoy.' : 'Sin correcciones ese día.'))}
            </div>
          </div>
        ) : (
          vendorGroups.map(([vendorName, list]) => (
            <div key={vendorName} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 2px 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="ti ti-building-store" style={{ fontSize: 13 }} /> {vendorName}
              </div>
              {list.map(it => {
                const isOwn = it.added_by_id === collaborator.id
                const dayInfo = statusView === 'pending' ? daysAgoInfo(it.added_at) : null
                const isBusy = busyId === it.id
                return (
                  <div key={it.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px',
                    border: `0.5px solid ${dayInfo?.warn ? '#e8a0a0' : 'var(--border)'}`,
                    background: dayInfo?.warn ? 'var(--error-bg)22' : 'var(--card)',
                    borderRadius: 10, marginBottom: 6,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 3 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: 'var(--brand-tint)', color: 'var(--brand-dark)' }}>{it.company_code}</span>
                        {dayInfo && (
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: dayInfo.warn ? 'var(--error-bg)' : '#EAF3DE', color: dayInfo.warn ? 'var(--error)' : '#3B6D11' }}>
                            {dayInfo.label}
                          </span>
                        )}
                        {statusView === 'done' && it.corrected_at && (
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#EAF3DE', color: '#3B6D11' }}>
                            {new Date(it.corrected_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        {!isOwn && (
                          <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: '#F1EFE8', color: 'var(--text2)' }}>
                            de {statusView === 'pending' ? it.added_by_name : it.corrected_by_name}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{it.invoice_number}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', ...mono }}>$ {formatAmount(it.amount)}</div>
                    {statusView === 'pending' ? (
                      <>
                        <button onClick={() => markCorrected(it.id)} disabled={isBusy} title="Marcar corregido"
                          style={{ width: 30, height: 30, borderRadius: '50%', border: '1.8px solid var(--brand)', background: 'transparent', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isBusy ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
                          {isBusy ? <i className="ti ti-loader-2" style={{ fontSize: 15 }} /> : <i className="ti ti-check" style={{ fontSize: 15 }} />}
                        </button>
                        {isOwn && (
                          <button onClick={() => removePending(it.id)} disabled={isBusy} title="Eliminar"
                            style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--text4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                            <i className="ti ti-x" style={{ fontSize: 14 }} />
                          </button>
                        )}
                      </>
                    ) : confirmDeleteId === it.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, color: 'var(--error)', fontWeight: 500, whiteSpace: 'nowrap' }}>¿Eliminar?</span>
                        <button onClick={() => deleteCorrected(it.id)} disabled={isBusy}
                          style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: 'var(--error)', color: 'var(--card)', fontSize: 11, fontWeight: 600, cursor: 'pointer', ...font }}>
                          Sí
                        </button>
                        <button onClick={() => setConfirmDeleteId(null)}
                          style={{ padding: '4px 10px', borderRadius: 6, border: '0.5px solid var(--border)', background: 'transparent', fontSize: 11, cursor: 'pointer', color: 'var(--text3)', ...font }}>
                          No
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--brand)', color: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <i className="ti ti-check" style={{ fontSize: 15 }} />
                        </div>
                        <button onClick={() => setConfirmDeleteId(it.id)} title="Eliminar"
                          style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: 'transparent', color: 'var(--text4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                          <i className="ti ti-trash" style={{ fontSize: 14 }} />
                        </button>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          ))
        )}

        <div style={{ fontSize: 10, color: 'var(--text4)', marginTop: 10, textAlign: 'center' }}>
          Las pendientes no desaparecen solas — quedan hasta que alguien las marque corregidas.
        </div>
      </div>
    </div>
  )
}
