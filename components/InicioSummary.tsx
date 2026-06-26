'use client'
import { useEffect, useState } from 'react'
import { localToday, localOffsetDate } from '@/lib/types'

const font = { fontFamily: 'Montserrat, sans-serif' }
const mono = { fontFamily: "'JetBrains Mono', monospace" }
const DOW_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

interface Props {
  myWorkedLabel: string
  myUncoveredLabel: string
  myTaskCount: number
  collaboratorId: string
}

interface ActionRow { date: string }
interface TaskRow { date: string }

export default function InicioSummary({ myWorkedLabel, myUncoveredLabel, myTaskCount, collaboratorId }: Props) {
  const today = localToday()
  const [loading, setLoading] = useState(true)
  const [actions, setActions] = useState<ActionRow[]>([])
  const [teamTasksToday, setTeamTasksToday] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [teamMemberCount, setTeamMemberCount] = useState(0)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const weekAgo = localOffsetDate(today, -6)
      const [supRes, baseImpRes] = await Promise.all([
        fetch(`/api/supervisor?from=${weekAgo}&to=${today}`, { cache: 'no-store' }),
        fetch('/api/base-imponible', { cache: 'no-store' }),
      ])
      const supData = await supRes.json()
      const baseImpData = await baseImpRes.json()

      const allActions: ActionRow[] = Array.isArray(supData.actions) ? supData.actions : []
      const allTasks: TaskRow[] = Array.isArray(supData.tasks) ? supData.tasks : []
      setActions(allActions)
      setTeamTasksToday(allTasks.filter(t => t.date === today).length)
      setTeamMemberCount(Array.isArray(supData.collaborators) ? supData.collaborators.filter((c: { role: string }) => c.role === 'collaborator').length : 0)

      const pending = Array.isArray(baseImpData)
        ? baseImpData.filter((it: { status: string; added_by_id: string }) => it.status === 'pending' && it.added_by_id === collaboratorId).length
        : 0
      setPendingCount(pending)
      setLoading(false)
    }
    load()
  }, [today, collaboratorId])

  const teamTouchesToday = actions.filter(a => a.date === today).length

  // últimos 7 días, hoy incluido
  const days = Array.from({ length: 7 }, (_, i) => localOffsetDate(today, -6 + i))
  const countsByDay = days.map(d => actions.filter(a => a.date === d).length)
  const maxCount = Math.max(...countsByDay, 1)

  return (
    <div style={{ flex: '1 1 300px', minWidth: 0, ...font }}>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <i className="ti ti-user-circle" style={{ fontSize: 13 }} /> Mi día
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1, background: 'var(--card)', borderRadius: 12, border: '0.5px solid var(--border)', padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>Registradas</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--brand)', ...mono }}>{myWorkedLabel}</div>
        </div>
        <div style={{ flex: 1, background: 'var(--card)', borderRadius: 12, border: '0.5px solid var(--border)', padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>Sin registrar</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--warning)', ...mono }}>{myUncoveredLabel}</div>
        </div>
      </div>

      <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <i className="ti ti-users" style={{ fontSize: 13 }} /> Pulso del equipo hoy
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1, background: 'var(--brand)', borderRadius: 12, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: 'var(--brand-tint)', marginBottom: 4 }}>Toques del equipo</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', ...mono }}>{loading ? '—' : teamTouchesToday}</div>
          {teamMemberCount > 0 && <div style={{ fontSize: 9, color: 'var(--brand-soft)', marginTop: 2 }}>entre {teamMemberCount} colaboradores</div>}
        </div>
        <div style={{ flex: 1, background: 'var(--card)', borderRadius: 12, border: '0.5px solid var(--border)', padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>Tareas del equipo</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', ...mono }}>{loading ? '—' : teamTasksToday}</div>
          <div style={{ fontSize: 9, color: 'var(--text4)', marginTop: 2 }}>registradas hoy</div>
        </div>
      </div>

      <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <i className="ti ti-chart-bar" style={{ fontSize: 13 }} /> Toques del equipo · últimos 7 días
      </div>
      <div style={{ background: 'var(--card)', borderRadius: 12, border: '0.5px solid var(--border)', padding: '12px 14px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end', height: 44 }}>
          {days.map((d, i) => {
            const isToday = d === today
            const h = Math.max((countsByDay[i] / maxCount) * 100, countsByDay[i] > 0 ? 6 : 2)
            return (
              <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', height: `${h}%`, background: isToday ? 'var(--brand)' : 'var(--brand-tint)', borderRadius: '3px 3px 0 0', minHeight: 3 }} />
                <span style={{ fontSize: 8.5, color: isToday ? 'var(--brand)' : 'var(--text4)', fontWeight: isToday ? 600 : 400 }}>
                  {isToday ? 'Hoy' : DOW_SHORT[new Date(d + 'T12:00').getDay()]}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {!loading && pendingCount > 0 && (
        <a href="/base-imponible" style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'var(--warning-bg)', borderRadius: 12, padding: '10px 13px', textDecoration: 'none' }}>
          <i className="ti ti-receipt-tax" style={{ fontSize: 15, color: 'var(--warning)', flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 11, color: 'var(--warning)', fontWeight: 500 }}>
            Tenés <strong>{pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}</strong> en Base imponible
          </div>
          <i className="ti ti-chevron-right" style={{ fontSize: 13, color: 'var(--warning)' }} />
        </a>
      )}
    </div>
  )
}
