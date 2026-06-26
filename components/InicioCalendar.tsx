'use client'
import { useEffect, useState, useCallback } from 'react'
import { localToday } from '@/lib/types'

const font = { fontFamily: 'Montserrat, sans-serif' }
const DOW = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MONTH_NAMES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

const ABSENCE_LABELS: Record<string, string> = { vacaciones: 'Vacaciones', estudio: 'Día de estudio', licencia_medica: 'Licencia médica', otro: 'Otro' }
const TEAM_EVENT_LABELS: Record<string, string> = { feriado: 'Feriado', fecha_importante: 'Fecha importante' }

interface CalEvent {
  id: string
  kind: 'absence' | 'team_event'
  absence_type?: string | null
  team_event_type?: string | null
  collaborator_id?: string | null
  title: string | null
  date_from: string
  date_to: string
  created_by_id: string
  created_by_name: string
}

interface Props { collaborator: { id: string; name: string } }

function pad(d: { getMonth: () => number; getDate: () => number; getFullYear: () => number }) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function buildMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1)
  const startWeekday = (first.getDay() + 6) % 7
  const gridStart = new Date(year, month, 1 - startWeekday)
  const cells = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    cells.push({ dateStr: pad(d), day: d.getDate(), muted: d.getMonth() !== month })
  }
  return cells
}
function initialsOf(name: string) { return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() }
function formatRange(from: string, to: string) {
  const f = new Date(from + 'T12:00'), t = new Date(to + 'T12:00')
  const fStr = f.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
  if (from === to) return fStr
  const tStr = t.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
  return `${fStr} al ${tStr}`
}

export default function InicioCalendar({ collaborator }: Props) {
  const today = localToday()
  const [todayDate] = useState(() => new Date())
  const [viewYear, setViewYear] = useState(todayDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth())
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState<'absence' | 'team_event' | null>(null)
  const [absenceType, setAbsenceType] = useState('vacaciones')
  const [teamEventType, setTeamEventType] = useState('feriado')
  const [title, setTitle] = useState('')
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(today)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const from = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-01`
    const toD = new Date(viewYear, viewMonth + 1, 0)
    const to = pad(toD)
    const res = await fetch(`/api/calendar?from=${from}&to=${to}`, { cache: 'no-store' })
    const data = await res.json()
    setEvents(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [viewYear, viewMonth])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  function prevMonth() { setViewMonth(m => { if (m === 0) { setViewYear(y => y - 1); return 11 } return m - 1 }) }
  function nextMonth() { setViewMonth(m => { if (m === 11) { setViewYear(y => y + 1); return 0 } return m + 1 }) }

  function openForm(kind: 'absence' | 'team_event') {
    setFormOpen(kind); setFormError(''); setTitle(''); setDateFrom(today); setDateTo(today)
    setAbsenceType('vacaciones'); setTeamEventType('feriado')
  }

  async function submitForm() {
    setFormError('')
    if (dateTo < dateFrom) { setFormError('La fecha de fin no puede ser anterior a la de inicio'); return }
    if (formOpen === 'team_event' && !title.trim()) { setFormError('Ingresá un título para el evento'); return }
    setSaving(true)
    const res = await fetch('/api/calendar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: formOpen,
        absence_type: formOpen === 'absence' ? absenceType : undefined,
        team_event_type: formOpen === 'team_event' ? teamEventType : undefined,
        title: title.trim() || null,
        date_from: dateFrom, date_to: dateTo,
        created_by_id: collaborator.id, created_by_name: collaborator.name,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setFormError(data.error || 'Error al guardar'); return }
    setEvents(prev => [...prev, data])
    setFormOpen(null)
  }

  async function deleteEvent(id: string) {
    const res = await fetch(`/api/calendar/${id}`, { method: 'DELETE' })
    if (res.ok) setEvents(prev => prev.filter(e => e.id !== id))
  }

  const cells = buildMonthGrid(viewYear, viewMonth)
  const teamEvents = events.filter(e => e.kind === 'team_event')
  const absences = events.filter(e => e.kind === 'absence')

  const upcomingEvents = [...teamEvents].filter(e => e.date_to >= today).sort((a, b) => a.date_from.localeCompare(b.date_from)).slice(0, 6)
  const upcomingAbsences = [...absences].filter(e => e.date_to >= today).sort((a, b) => a.date_from.localeCompare(b.date_from)).slice(0, 6)

  const inputStyle = { width: '100%', padding: '8px 11px', borderRadius: 8, border: '0.5px solid var(--border)', fontSize: 13, outline: 'none', background: 'var(--input-bg)', color: 'var(--text)', ...font }

  return (
    <div style={font}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Calendario del equipo</h2>
          <p style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 300, marginTop: 2 }}>Feriados, fechas importantes y ausencias</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => openForm('team_event')} style={{ padding: '8px 13px', borderRadius: 10, border: '0.5px solid var(--border)', background: 'var(--card)', color: 'var(--brand)', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, ...font }}>
            <i className="ti ti-calendar-event" style={{ fontSize: 14 }} /> Evento del equipo
          </button>
          <button onClick={() => openForm('absence')} style={{ padding: '8px 13px', borderRadius: 10, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, ...font }}>
            <i className="ti ti-calendar-plus" style={{ fontSize: 14 }} /> Marcar mi ausencia
          </button>
        </div>
      </div>

      {/* Form */}
      {formOpen && (
        <div style={{ background: 'var(--card)', border: '0.5px solid var(--brand-soft)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)', marginBottom: 12 }}>
            {formOpen === 'absence' ? 'Marcar mi ausencia' : 'Nuevo evento del equipo'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            {formOpen === 'absence' ? (
              <div>
                <label style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Tipo</label>
                <select value={absenceType} onChange={e => setAbsenceType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {Object.entries(ABSENCE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Tipo</label>
                <select value={teamEventType} onChange={e => setTeamEventType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {Object.entries(TEAM_EVENT_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </div>
            )}
            <div>
              <label style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, display: 'block', marginBottom: 4 }}>{formOpen === 'team_event' ? 'Título' : 'Nota (opcional)'}</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder={formOpen === 'team_event' ? 'Ej: Cierre mensual' : 'Opcional'} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Desde</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Hasta</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
            </div>
          </div>
          {formError && <div style={{ fontSize: 12, color: 'var(--error)', background: 'var(--error-bg)', padding: '7px 10px', borderRadius: 7, marginBottom: 10 }}>{formError}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={submitForm} disabled={saving} style={{ flex: 1, padding: '9px', borderRadius: 9, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1, ...font }}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={() => setFormOpen(null)} style={{ padding: '9px 16px', borderRadius: 9, border: '0.5px solid var(--border)', background: 'transparent', fontSize: 13, cursor: 'pointer', color: 'var(--text3)', ...font }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Calendar */}
        <div style={{ background: 'var(--card)', borderRadius: 16, border: '0.5px solid var(--border)', padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>{MONTH_NAMES[viewMonth]} {viewYear}</div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={prevMonth} style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: 'var(--brand-tint)', color: 'var(--brand)', cursor: 'pointer' }}><i className="ti ti-chevron-left" /></button>
              <button onClick={nextMonth} style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: 'var(--brand-tint)', color: 'var(--brand)', cursor: 'pointer' }}><i className="ti ti-chevron-right" /></button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
            {DOW.map((d, i) => <div key={i} style={{ fontSize: 9, fontWeight: 600, color: 'var(--brand-soft)', textAlign: 'center', paddingBottom: 4, textTransform: 'uppercase' }}>{d}</div>)}
            {cells.map(cell => {
              const dayAbsences = absences.filter(e => e.date_from <= cell.dateStr && e.date_to >= cell.dateStr)
              const dayTeam = teamEvents.filter(e => e.date_from <= cell.dateStr && e.date_to >= cell.dateStr)
              const isToday = cell.dateStr === today
              return (
                <div key={cell.dateStr} style={{
                  aspectRatio: '1', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                  fontSize: 11.5, position: 'relative',
                  color: isToday ? '#fff' : (cell.muted ? 'var(--text4)' : 'var(--text)'),
                  background: isToday ? 'var(--brand)' : (dayAbsences.length > 0 ? '#EFE6D8' : 'transparent'),
                  fontWeight: isToday ? 700 : 400,
                }}>
                  {cell.day}
                  {dayTeam.length > 0 && !isToday && <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--brand)' }} />}
                  {dayTeam.length > 0 && isToday && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />}
                  {dayAbsences.length > 0 && (
                    <div style={{ width: 15, height: 15, borderRadius: '50%', background: 'var(--brand-soft)', fontSize: 7, fontWeight: 700, color: 'var(--brand-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {dayAbsences.length > 1 ? `+${dayAbsences.length}` : initialsOf(dayAbsences[0].created_by_name)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 12, fontSize: 10, color: 'var(--text2)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)' }} /> Evento del equipo</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EFE6D8' }} /> Alguien afuera</span>
          </div>
        </div>

        {/* Side panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'var(--card)', borderRadius: 16, border: '0.5px solid var(--border)', padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ti ti-calendar-event" style={{ fontSize: 13 }} /> Próximos eventos
            </div>
            {upcomingEvents.length === 0 && <div style={{ fontSize: 12, color: 'var(--text4)', fontWeight: 300 }}>Sin eventos próximos</div>}
            {upcomingEvents.map(ev => {
              const d = new Date(ev.date_from + 'T12:00')
              return (
                <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderTop: '1px solid var(--hover)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--brand-tint)', color: 'var(--brand)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1, flexShrink: 0 }}>
                    <span style={{ fontSize: 7, fontWeight: 600, textTransform: 'uppercase' }}>{d.toLocaleDateString('es-AR', { month: 'short' })}</span>
                    <strong style={{ fontSize: 12 }}>{d.getDate()}</strong>
                  </div>
                  <div style={{ flex: 1, fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>
                    {ev.title}
                    <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 500 }}>{TEAM_EVENT_LABELS[ev.team_event_type || '']}</div>
                  </div>
                  {(ev.created_by_id === collaborator.id) && (
                    <button onClick={() => deleteEvent(ev.id)} style={{ border: 'none', background: 'transparent', color: 'var(--text4)', cursor: 'pointer', flexShrink: 0 }}><i className="ti ti-x" style={{ fontSize: 13 }} /></button>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ background: 'var(--card)', borderRadius: 16, border: '0.5px solid var(--border)', padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ti ti-beach" style={{ fontSize: 13 }} /> Equipo afuera
            </div>
            {upcomingAbsences.length === 0 && <div style={{ fontSize: 12, color: 'var(--text4)', fontWeight: 300 }}>Nadie marcó ausencias próximas</div>}
            {upcomingAbsences.map(ab => (
              <div key={ab.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 0', borderTop: '1px solid var(--hover)' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--brand-tint)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                  {initialsOf(ab.created_by_name)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{ab.created_by_name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>{formatRange(ab.date_from, ab.date_to)}</div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#EFE6D8', color: '#7a6240', flexShrink: 0 }}>{ABSENCE_LABELS[ab.absence_type || '']}</span>
                {ab.created_by_id === collaborator.id && (
                  <button onClick={() => deleteEvent(ab.id)} style={{ border: 'none', background: 'transparent', color: 'var(--text4)', cursor: 'pointer', flexShrink: 0 }}><i className="ti ti-x" style={{ fontSize: 13 }} /></button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
