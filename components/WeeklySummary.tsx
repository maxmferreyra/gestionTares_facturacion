'use client'
import { useEffect, useState } from 'react'
import type { Task } from '@/lib/types'

interface Props {
  collaboratorId: string
  collaboratorName: string
}

function getMonday(d: Date) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  return date.toISOString().split('T')[0]
}

function offsetDate(base: string, days: number) {
  const d = new Date(base + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export default function WeeklySummary({ collaboratorId, collaboratorName }: Props) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function fetch_() {
      setLoading(true)
      const res = await fetch(`/api/weekly-summary?collaborator_id=${collaboratorId}&week_start=${weekStart}`)
      const data = await res.json()
      setTasks(Array.isArray(data) ? data : [])
      setLoading(false)
    }
    fetch_()
  }, [collaboratorId, weekStart])

  function prevWeek() { setWeekStart(d => offsetDate(d, -7)) }
  function nextWeek() {
    const next = offsetDate(weekStart, 7)
    if (next <= today) setWeekStart(next)
  }

  function handleExport() {
    const to = offsetDate(weekStart, 6)
    window.open(`/api/export?collaborator_id=${collaboratorId}&name=${encodeURIComponent(collaboratorName)}&from=${weekStart}&to=${to}`, '_blank')
  }

  const days = Array.from({ length: 7 }, (_, i) => {
    const dateStr = offsetDate(weekStart, i)
    const dayTasks = tasks.filter(t => t.date === dateStr)
    return {
      label: DAY_NAMES[i], date: dateStr,
      total: dayTasks.length,
      done: dayTasks.filter(t => t.completed).length,
      hours: dayTasks.reduce((s, t) => s + (Number(t.hours) || 0), 0),
    }
  })

  const totalTasks = tasks.length
  const totalDone = tasks.filter(t => t.completed).length
  const totalHours = tasks.reduce((s, t) => s + (Number(t.hours) || 0), 0)
  const weekPct = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0

  const weekLabel = new Date(weekStart + 'T12:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
  const weekEnd = new Date(offsetDate(weekStart, 6) + 'T12:00')
  const weekEndLabel = weekEnd.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })

  const font = { fontFamily: 'Montserrat, sans-serif' }

  return (
    <div style={font}>
      {/* Week nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', borderRadius: 10, padding: '10px 14px', marginBottom: '1rem', border: '0.5px solid #e5e3db' }}>
        <button onClick={prevWeek} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#534AB7', padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
          <i className="ti ti-chevron-left" style={{ fontSize: 18 }} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{weekLabel} – {weekEndLabel}</div>
        </div>
        <button onClick={nextWeek} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: weekStart >= getMonday(new Date()) ? '#d3d1c7' : '#534AB7', padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
          <i className="ti ti-chevron-right" style={{ fontSize: 18 }} />
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: '1rem' }}>
        {[
          { label: 'Tareas', value: totalTasks, color: '#1a1a18', icon: 'ti-list' },
          { label: 'Completadas', value: totalDone, color: '#0F6E56', icon: 'ti-circle-check' },
          { label: 'Horas', value: totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1), color: '#534AB7', icon: 'ti-hourglass' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 10, padding: '10px 12px', border: '0.5px solid #e5e3db', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, color: '#888780', marginBottom: 4, fontWeight: 500 }}>
              <i className={`ti ${s.icon}`} style={{ fontSize: 13 }} /> {s.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Progress */}
      {totalTasks > 0 && (
        <div style={{ background: 'white', borderRadius: 10, padding: '12px 14px', marginBottom: '1rem', border: '0.5px solid #e5e3db' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
            <span style={{ color: '#5f5e5a', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ti ti-trending-up" style={{ fontSize: 15 }} /> Cumplimiento semanal
            </span>
            <span style={{ fontWeight: 600, color: weekPct === 100 ? '#0F6E56' : '#534AB7' }}>{weekPct}%</span>
          </div>
          <div style={{ height: 6, background: '#f5f4f0', borderRadius: 99 }}>
            <div style={{ height: '100%', width: `${weekPct}%`, borderRadius: 99, background: weekPct === 100 ? '#1D9E75' : '#534AB7', transition: 'width 0.3s' }} />
          </div>
        </div>
      )}

      {/* Bar chart */}
      <div style={{ background: 'white', borderRadius: 12, border: '0.5px solid #e5e3db', padding: '14px', marginBottom: '1rem' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#888780', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className="ti ti-chart-bar" style={{ fontSize: 13 }} /> Actividad diaria
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 80 }}>
          {days.map(d => {
            const maxH = Math.max(...days.map(x => x.total), 1)
            const height = d.total > 0 ? Math.max((d.total / maxH) * 64, 8) : 4
            const isToday = d.date === today
            return (
              <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: 10, color: '#b4b2a9', fontWeight: 500 }}>{d.done > 0 ? d.done : ''}</div>
                <div style={{ width: '100%', height, borderRadius: 4,
                  background: d.total === 0 ? '#f5f4f0' : d.done === d.total && d.total > 0 ? '#1D9E75' : '#534AB7',
                  opacity: isToday ? 1 : 0.55 }} />
                <div style={{ fontSize: 10, color: isToday ? '#534AB7' : '#888780', fontWeight: isToday ? 600 : 400 }}>{d.label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Day list */}
      {days.filter(d => d.total > 0).map(d => (
        <div key={d.date} style={{ background: 'white', borderRadius: 10, border: '0.5px solid #e5e3db', padding: '10px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, textTransform: 'capitalize' }}>
              {new Date(d.date + 'T12:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })}
            </div>
            <div style={{ fontSize: 12, color: '#888780', fontWeight: 300, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span><i className="ti ti-circle-check" style={{ fontSize: 12, verticalAlign: -1 }} /> {d.done}/{d.total} tareas</span>
              <span><i className="ti ti-hourglass" style={{ fontSize: 12, verticalAlign: -1 }} /> {d.hours % 1 === 0 ? d.hours : d.hours.toFixed(1)}h</span>
            </div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: d.done === d.total && d.total > 0 ? '#0F6E56' : '#BA7517' }}>
            {d.total > 0 ? Math.round((d.done / d.total) * 100) + '%' : '—'}
          </div>
        </div>
      ))}

      {!loading && totalTasks === 0 && (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#b4b2a9' }}>
          <i className="ti ti-calendar-off" style={{ fontSize: 36, display: 'block', marginBottom: 8 }} />
          <div style={{ fontSize: 14, fontWeight: 300 }}>Sin tareas registradas esta semana</div>
        </div>
      )}

      <button onClick={handleExport}
        style={{ width: '100%', marginTop: 8, padding: '10px', borderRadius: 10, border: '0.5px solid #C0DD97', background: '#EAF3DE', color: '#3B6D11', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, ...font }}>
        <i className="ti ti-file-spreadsheet" style={{ fontSize: 16 }} /> Exportar esta semana a Excel
      </button>
    </div>
  )
}
