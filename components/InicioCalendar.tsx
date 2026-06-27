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

interface Props {
  collaborator: { id: string; name: string }
  refreshKey?: number
}

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
function formatDayLong(dateStr: string) {
  return new Date(dateStr + 'T12:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function InicioCalendar({ collaborator, refreshKey }: Props) {
  const today = localToday()
  const [todayDate] = useState(() => new Date())
  const [viewYear, setViewYear] = useState(todayDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth())
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

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

  useEffect(() => { fetchEvents() }, [fetchEvents, refreshKey])

  function prevMonth() { setSelectedDay(null); setViewMonth(m => { if (m === 0) { setViewYear(y => y - 1); return 11 } return m - 1 }) }
  function nextMonth() { setSelectedDay(null); setViewMonth(m => { if (m === 11) { setViewYear(y => y + 1); return 0 } return m + 1 }) }

  async function deleteEvent(id: string) {
    const res = await fetch(`/api/calendar/${id}`, { method: 'DELETE' })
    if (res.ok) { setEvents(prev => prev.filter(e => e.id !== id)); setConfirmDeleteId(null) }
  }

  const cells = buildMonthGrid(viewYear, viewMonth)
  const teamEvents = events.filter(e => e.kind === 'team_event')
  const absences = events.filter(e => e.kind === 'absence')

  const upcomingEvents = [...teamEvents].filter(e => e.date_to >= today).sort((a, b) => a.date_from.localeCompare(b.date_from)).slice(0, 6)
  const upcomingAbsences = [...absences].filter(e => e.date_to >= today).sort((a, b) => a.date_from.localeCompare(b.date_from)).slice(0, 6)

  const selectedDayEvents = selectedDay
    ? events.filter(e => e.date_from <= selectedDay && e.date_to >= selectedDay)
    : []

  return (
    <div style={font}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Calendario del equipo</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Calendar */}
        <div style={{ background: 'var(--card)', borderRadius: 16, border: '0.5px solid var(--border)', padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>{MONTH_NAMES[viewMonth]} {viewYear}</div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={prevMonth} style={{ width: 24, height: 24, borderRadius: 7, border: 'none', background: 'var(--brand-tint)', color: 'var(--brand)', cursor: 'pointer' }}><i className="ti ti-chevron-left" /></button>
              <button onClick={nextMonth} style={{ width: 24, height: 24, borderRadius: 7, border: 'none', background: 'var(--brand-tint)', color: 'var(--brand)', cursor: 'pointer' }}><i className="ti ti-chevron-right" /></button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
            {DOW.map((d, i) => <div key={i} style={{ fontSize: 9, fontWeight: 600, color: 'var(--brand-soft)', textAlign: 'center', paddingBottom: 3, textTransform: 'uppercase' }}>{d}</div>)}
            {cells.map(cell => {
              const dayAbsences = absences.filter(e => e.date_from <= cell.dateStr && e.date_to >= cell.dateStr)
              const dayTeam = teamEvents.filter(e => e.date_from <= cell.dateStr && e.date_to >= cell.dateStr)
              const isToday = cell.dateStr === today
              const isSelected = cell.dateStr === selectedDay
              return (
                <button key={cell.dateStr} onClick={() => setSelectedDay(selectedDay === cell.dateStr ? null : cell.dateStr)}
                  style={{
                    aspectRatio: '1', borderRadius: 9, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                    fontSize: 11, position: 'relative', border: isSelected ? '1.5px solid var(--brand)' : 'none', cursor: 'pointer', ...font,
                    color: isToday ? '#fff' : (cell.muted ? 'var(--text4)' : 'var(--text)'),
                    background: isToday ? 'var(--brand)' : (dayAbsences.length > 0 ? '#EFE6D8' : (isSelected ? 'var(--hover)' : 'transparent')),
                    fontWeight: isToday ? 700 : 400,
                  }}>
                  {cell.day}
                  {dayTeam.length > 0 && <div style={{ width: 5, height: 5, borderRadius: '50%', background: isToday ? '#fff' : 'var(--brand)' }} />}
                  {dayAbsences.length > 0 && (
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--brand-soft)', fontSize: 7, fontWeight: 700, color: 'var(--brand-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {dayAbsences.length > 1 ? `+${dayAbsences.length}` : initialsOf(dayAbsences[0].created_by_name)}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 10, color: 'var(--text2)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)' }} /> Evento del equipo</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EFE6D8' }} /> Alguien afuera</span>
          </div>
        </div>

        {/* Detalle del día seleccionado, o listas por defecto */}
        {selectedDay ? (
          <div style={{ background: 'var(--card)', borderRadius: 16, border: '0.5px solid var(--brand-soft)', padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>{formatDayLong(selectedDay)}</span>
              <button onClick={() => setSelectedDay(null)} style={{ border: 'none', background: 'transparent', color: 'var(--text4)', cursor: 'pointer' }}><i className="ti ti-x" style={{ fontSize: 14 }} /></button>
            </div>
            {selectedDayEvents.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text4)', fontWeight: 300 }}>Sin eventos ni ausencias este día.</div>
            ) : (
              selectedDayEvents.map(ev => {
                const isTeam = ev.kind === 'team_event'
                const isOwn = ev.created_by_id === collaborator.id
                return (
                  <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 0', borderTop: '1px solid var(--hover)' }}>
                    <i className={`ti ${isTeam ? 'ti-calendar-event' : 'ti-beach'}`} style={{ fontSize: 15, color: isTeam ? 'var(--brand)' : '#7a6240', flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: 12, color: 'var(--text)' }}>
                      {isTeam ? (ev.title || TEAM_EVENT_LABELS[ev.team_event_type || '']) : `${ev.created_by_name} · ${ABSENCE_LABELS[ev.absence_type || '']}`}
                    </div>
                    {isOwn && (
                      confirmDeleteId === ev.id ? (
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button onClick={() => deleteEvent(ev.id)} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, border: 'none', background: 'var(--error)', color: '#fff', cursor: 'pointer' }}>Sí</button>
                          <button onClick={() => setConfirmDeleteId(null)} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, border: '0.5px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text3)' }}>No</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(ev.id)} style={{ border: 'none', background: 'transparent', color: 'var(--text4)', cursor: 'pointer', flexShrink: 0 }}><i className="ti ti-trash" style={{ fontSize: 13 }} /></button>
                      )
                    )}
                  </div>
                )
              })
            )}
          </div>
        ) : (
          <>
            <div style={{ background: 'var(--card)', borderRadius: 16, border: '0.5px solid var(--border)', padding: '14px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="ti ti-calendar-event" style={{ fontSize: 13 }} /> Próximos eventos
              </div>
              {upcomingEvents.length === 0 && <div style={{ fontSize: 12, color: 'var(--text4)', fontWeight: 300 }}>Sin eventos próximos</div>}
              {upcomingEvents.map(ev => {
                const d = new Date(ev.date_from + 'T12:00')
                return (
                  <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderTop: '1px solid var(--hover)' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--brand-tint)', color: 'var(--brand)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1, flexShrink: 0 }}>
                      <span style={{ fontSize: 7, fontWeight: 600, textTransform: 'uppercase' }}>{d.toLocaleDateString('es-AR', { month: 'short' })}</span>
                      <strong style={{ fontSize: 12 }}>{d.getDate()}</strong>
                    </div>
                    <div style={{ flex: 1, fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>
                      {ev.title}
                      <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 500 }}>{TEAM_EVENT_LABELS[ev.team_event_type || '']}</div>
                    </div>
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
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
