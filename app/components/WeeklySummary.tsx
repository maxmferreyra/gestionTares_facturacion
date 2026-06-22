'use client'
import { useEffect, useState } from 'react'
import type { Task } from '@/lib/types'
import { calcDuration, localToday, localOffsetDate } from '@/lib/types'
import { SYSTEMS_CONFIG } from '@/lib/actions-config'

interface InvoiceAction { id: string; system: string; action: string; date: string }

interface Props {
  collaboratorId: string
  collaboratorName: string
  onSelectDay?: (date: string) => void
}

function getMonday(d: Date) {
  const date = new Date(d)
  const day = date.getDay()
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1))
  const y = date.getFullYear()
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const dd = date.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${dd}`
}
const offsetDate = localOffsetDate
const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const WORK_TOTAL = 9 * 60 // jornada laboral fija de referencia (9hs)

function taskMinutes(t: Task) {
  if (!t.start_time || !t.end_time) return 0
  const d = calcDuration(t.start_time, t.end_time)
  return d ? d.hours * 60 + d.minutes : 0
}

export default function WeeklySummary({ collaboratorId, collaboratorName, onSelectDay }: Props) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [actions, setActions] = useState<InvoiceAction[]>([])
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const [loading, setLoading] = useState(true)
  const today = localToday()
  const font = { fontFamily: 'Montserrat, sans-serif' }

  useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await fetch(`/api/weekly-summary?collaborator_id=${collaboratorId}&week_start=${weekStart}`, { cache: 'no-store' })
      const data = await res.json()
      setTasks(Array.isArray(data.tasks) ? data.tasks : [])
      setActions(Array.isArray(data.actions) ? data.actions : [])
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
    const dayActions = actions.filter(a => a.date === dateStr)
    const mins = dayTasks.reduce((s, t) => s + taskMinutes(t), 0)
    const systemsUsed = Array.from(new Set(dayActions.map(a => a.system)))
    let status: 'complete' | 'partial' | 'incomplete' = 'incomplete'
    if (mins >= WORK_TOTAL) status = 'complete'
    else if (mins > 0 || dayActions.length > 0) status = 'partial'
    return { label: DAY_NAMES[i], date: dateStr, taskCount: dayTasks.length, touchCount: dayActions.length, minutes: mins, systemsUsed, status }
  })

  const totalTasks = tasks.length
  const totalTouches = actions.length
  const totalMin = tasks.reduce((s, t) => s + taskMinutes(t), 0)
  const totalH = Math.floor(totalMin / 60), totalM = totalMin % 60
  const totalHoursLabel = totalM > 0 ? `${totalH}h ${totalM}min` : `${totalH}h`

  const weekLabel = new Date(weekStart + 'T12:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
  const weekEndLabel = new Date(offsetDate(weekStart, 6) + 'T12:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })

  const statusConfig = {
    complete:   { label: 'Completo',   color: '#0F6E56', bg: '#E0F2EF', icon: 'ti-circle-check' },
    partial:    { label: 'Parcial',    color: '#854F0B', bg: '#FAEEDA', icon: 'ti-circle-half-2' },
    incomplete: { label: 'Incompleto', color: '#888780', bg: '#F1EFE8', icon: 'ti-circle-dashed' },
  }

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

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: '1rem' }}>
        <div style={{ background: 'var(--card)', borderRadius: 10, padding: '12px 10px', border: '0.5px solid var(--border)', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 10, color: 'var(--text3)', marginBottom: 4, fontWeight: 500 }}>
            <i className="ti ti-list" style={{ fontSize: 12 }} /> Tareas
          </div>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#1a1a18' }}>{totalTasks}</div>
        </div>
        <div style={{ background: 'var(--card)', borderRadius: 10, padding: '12px 10px', border: '0.5px solid var(--border)', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 10, color: 'var(--text3)', marginBottom: 4, fontWeight: 500 }}>
            <i className="ti ti-hand-click" style={{ fontSize: 12 }} /> Toques
          </div>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#534AB7' }}>{totalTouches}</div>
        </div>
        <div style={{ background: 'var(--card)', borderRadius: 10, padding: '12px 10px', border: '0.5px solid var(--border)', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 10, color: 'var(--text3)', marginBottom: 4, fontWeight: 500 }}>
            <i className="ti ti-hourglass" style={{ fontSize: 12 }} /> Horas
          </div>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#185FA5' }}>{totalHoursLabel}</div>
        </div>
      </div>

      {/* Day cards — clickable */}
      {days.map(d => {
        const sc = statusConfig[d.status]
        const isToday = d.date === today
        return (
          <button key={d.date} onClick={() => onSelectDay?.(d.date)}
            style={{ width: '100%', textAlign: 'left', background: 'var(--card)', borderRadius: 10, border: `0.5px solid ${isToday ? '#534AB7' : 'var(--border)'}`, padding: '11px 14px', marginBottom: 8, cursor: onSelectDay ? 'pointer' : 'default', ...font }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{d.label}</span>
                <span style={{ fontSize: 11, color: 'var(--text4)', fontWeight: 300 }}>{new Date(d.date + 'T12:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
                {isToday && <span style={{ fontSize: 9, fontWeight: 600, color: '#534AB7', background: '#CECBF6', padding: '1px 6px', borderRadius: 20 }}>HOY</span>}
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: sc.color, background: sc.bg, padding: '3px 9px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
                <i className={`ti ${sc.icon}`} style={{ fontSize: 12 }} />{sc.label}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="ti ti-clipboard-list" style={{ fontSize: 13 }} />{d.taskCount} tarea{d.taskCount !== 1 ? 's' : ''}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="ti ti-hand-click" style={{ fontSize: 13 }} />{d.touchCount} toque{d.touchCount !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {d.systemsUsed.map(sysKey => {
                  const sys = SYSTEMS_CONFIG.find(s => s.key === sysKey)
                  if (!sys) return null
                  return (
                    <div key={sysKey} title={sys.label} style={{ width: 20, height: 20, borderRadius: 6, background: sys.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className={`ti ${sys.actions[0]?.icon || 'ti-server'}`} style={{ fontSize: 11, color: sys.color }} />
                    </div>
                  )
                })}
                {onSelectDay && <i className="ti ti-chevron-right" style={{ fontSize: 14, color: 'var(--text4)', marginLeft: 2 }} />}
              </div>
            </div>
          </button>
        )
      })}

      {!loading && totalTasks === 0 && totalTouches === 0 && (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text4)' }}>
          <i className="ti ti-calendar-off" style={{ fontSize: 36, display: 'block', marginBottom: 8 }} />
          <div style={{ fontSize: 14, fontWeight: 300 }}>Sin actividad registrada esta semana</div>
        </div>
      )}

      <button onClick={handleExport} style={{ width: '100%', marginTop: 8, padding: '10px', borderRadius: 10, border: '0.5px solid #C0DD97', background: '#EAF3DE', color: '#3B6D11', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, ...font }}>
        <i className="ti ti-file-spreadsheet" style={{ fontSize: 16 }} /> Exportar esta semana a Excel
      </button>
    </div>
  )
}
