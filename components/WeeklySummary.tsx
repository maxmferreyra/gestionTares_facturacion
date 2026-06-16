'use client'
import { useEffect, useState } from 'react'
import type { Task } from '@/lib/types'
import { calcDuration } from '@/lib/types'

interface Props { collaboratorId: string; collaboratorName: string }

function getMonday(d: Date) {
  const date = new Date(d)
  const day = date.getDay()
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1))
  return date.toISOString().split('T')[0]
}
function offsetDate(base: string, days: number) {
  const d = new Date(base + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}
const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function taskMinutes(t: Task) {
  if (!t.start_time || !t.end_time) return 0
  const d = calcDuration(t.start_time, t.end_time)
  return d ? d.hours * 60 + d.minutes : 0
}

export default function WeeklySummary({ collaboratorId, collaboratorName }: Props) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]
  const font = { fontFamily: 'Montserrat, sans-serif' }

  useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await fetch(`/api/weekly-summary?collaborator_id=${collaboratorId}&week_start=${weekStart}`)
      const data = await res.json()
      setTasks(Array.isArray(data) ? data : [])
      setLoading(false)
    }
    load()
  }, [collaboratorId, weekStart])

  function handleExport() {
    const to = offsetDate(weekStart, 6)
    window.open(`/api/export?collaborator_id=${collaboratorId}&name=${encodeURIComponent(collaboratorName)}&from=${weekStart}&to=${to}`, '_blank')
  }

  const days = Array.from({ length: 7 }, (_, i) => {
    const dateStr = offsetDate(weekStart, i)
    const dayTasks = tasks.filter(t => t.date === dateStr)
    const mins = dayTasks.reduce((s, t) => s + taskMinutes(t), 0)
    return { label: DAY_NAMES[i], date: dateStr, total: dayTasks.length, minutes: mins }
  })

  const totalTasks = tasks.length
  const totalMin = tasks.reduce((s, t) => s + taskMinutes(t), 0)
  const totalH = Math.floor(totalMin / 60), totalM = totalMin % 60
  const totalHoursLabel = totalM > 0 ? `${totalH}h ${totalM}min` : `${totalH}h`

  const weekLabel = new Date(weekStart + 'T12:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
  const weekEndLabel = new Date(offsetDate(weekStart, 6) + 'T12:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
  const maxMin = Math.max(...days.map(d => d.minutes), 1)

  return (
    <div style={font}>
      {/* Week nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--card)', borderRadius: 10, padding: '10px 14px', marginBottom: '1rem', border: '0.5px solid var(--border)' }}>
        <button onClick={() => setWeekStart(d => offsetDate(d, -7))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#534AB7', padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
          <i className="ti ti-chevron-left" style={{ fontSize: 18 }} />
        </button>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{weekLabel} – {weekEndLabel}</div>
        <button onClick={() => { const n = offsetDate(weekStart, 7); if (n <= today) setWeekStart(n) }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: weekStart >= getMonday(new Date()) ? 'var(--border)' : '#534AB7', padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
          <i className="ti ti-chevron-right" style={{ fontSize: 18 }} />
        </button>
      </div>

      {/* Stats — solo tareas y horas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: '1rem' }}>
        <div style={{ background: 'var(--card)', borderRadius: 10, padding: '12px 14px', border: '0.5px solid var(--border)', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, color: 'var(--text3)', marginBottom: 4, fontWeight: 500 }}>
            <i className="ti ti-list" style={{ fontSize: 13 }} /> Tareas
          </div>
          <div style={{ fontSize: 24, fontWeight: 600, color: '#1a1a18' }}>{totalTasks}</div>
        </div>
        <div style={{ background: 'var(--card)', borderRadius: 10, padding: '12px 14px', border: '0.5px solid var(--border)', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, color: 'var(--text3)', marginBottom: 4, fontWeight: 500 }}>
            <i className="ti ti-hourglass" style={{ fontSize: 13 }} /> Horas
          </div>
          <div style={{ fontSize: 24, fontWeight: 600, color: '#534AB7' }}>{totalHoursLabel}</div>
        </div>
      </div>

      {/* Bar chart */}
      <div style={{ background: 'var(--card)', borderRadius: 12, border: '0.5px solid var(--border)', padding: '14px', marginBottom: '1rem' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className="ti ti-chart-bar" style={{ fontSize: 13 }} /> Horas por día
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 80 }}>
          {days.map(d => {
            const height = d.minutes > 0 ? Math.max((d.minutes / maxMin) * 64, 8) : 4
            const isToday = d.date === today
            const h = Math.floor(d.minutes / 60), m = d.minutes % 60
            return (
              <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: 9, color: 'var(--text4)', fontWeight: 500 }}>{d.minutes > 0 ? (m > 0 ? `${h}:${m.toString().padStart(2,'0')}` : `${h}h`) : ''}</div>
                <div style={{ width: '100%', height, borderRadius: 4, background: d.minutes === 0 ? 'var(--bg)' : '#534AB7', opacity: isToday ? 1 : 0.55 }} />
                <div style={{ fontSize: 10, color: isToday ? '#534AB7' : 'var(--text3)', fontWeight: isToday ? 600 : 400 }}>{d.label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Day detail */}
      {days.filter(d => d.total > 0).map(d => {
        const h = Math.floor(d.minutes / 60), m = d.minutes % 60
        return (
          <div key={d.date} style={{ background: 'var(--card)', borderRadius: 10, border: '0.5px solid var(--border)', padding: '10px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, textTransform: 'capitalize', color: 'var(--text)' }}>
                {new Date(d.date + 'T12:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 300 }}>{d.total} tarea{d.total !== 1 ? 's' : ''}</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#534AB7' }}>{m > 0 ? `${h}h ${m}min` : `${h}h`}</div>
          </div>
        )
      })}

      {!loading && totalTasks === 0 && (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text4)' }}>
          <i className="ti ti-calendar-off" style={{ fontSize: 36, display: 'block', marginBottom: 8 }} />
          <div style={{ fontSize: 14, fontWeight: 300 }}>Sin tareas registradas esta semana</div>
        </div>
      )}

      <button onClick={handleExport} style={{ width: '100%', marginTop: 8, padding: '10px', borderRadius: 10, border: '0.5px solid #C0DD97', background: '#EAF3DE', color: '#3B6D11', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, ...font }}>
        <i className="ti ti-file-spreadsheet" style={{ fontSize: 16 }} /> Exportar esta semana a Excel
      </button>
    </div>
  )
}
