'use client'
import { useEffect, useState } from 'react'
import { SYSTEMS_CONFIG } from '@/lib/actions-config'

const font = { fontFamily: 'Montserrat, sans-serif' }

interface Collaborator { id: string; name: string; role: string }
interface Action { id: string; collaborator_id: string; system: string; action: string; date: string; created_at: string }
interface Task { id: string; collaborator_id: string; title: string; date: string; start_time: string | null; end_time: string | null; hours: number; tag: string }

type Period = 'day' | 'week' | 'month'

function getRange(period: Period): { from: string; to: string } {
  const now = new Date()
  const to = now.toISOString().split('T')[0]
  let from = to
  if (period === 'week') {
    const d = new Date(now); d.setDate(d.getDate() - 6); from = d.toISOString().split('T')[0]
  } else if (period === 'month') {
    const d = new Date(now.getFullYear(), now.getMonth(), 1)
    from = d.toISOString().split('T')[0]
  }
  return { from, to }
}

export default function SupervisorDashboard() {
  const [period, setPeriod] = useState<Period>('day')
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [actions, setActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const { from, to } = getRange(period)
        const res = await fetch(`/api/supervisor?from=${from}&to=${to}`)
        if (!res.ok) { setError('Error al cargar datos'); setLoading(false); return }
        const d = await res.json()
        setCollaborators(Array.isArray(d.collaborators) ? d.collaborators : [])
        setTasks(Array.isArray(d.tasks) ? d.tasks : [])
        setActions(Array.isArray(d.actions) ? d.actions : [])
      } catch (e) {
        setError('Error de conexión')
      }
      setLoading(false)
    }
    load()
  }, [period])

  // Actions by system
  const actionsBySystem: Record<string, number> = {}
  for (const a of actions) actionsBySystem[a.system] = (actionsBySystem[a.system] || 0) + 1
  const maxSys = Math.max(...Object.values(actionsBySystem), 1)

  // Per collaborator stats
  const actionsByCollab: Record<string, number> = {}
  const tasksByCollab: Record<string, number> = {}
  const hoursByCollab: Record<string, number> = {}
  for (const a of actions) actionsByCollab[a.collaborator_id] = (actionsByCollab[a.collaborator_id] || 0) + 1
  for (const t of tasks) {
    tasksByCollab[t.collaborator_id] = (tasksByCollab[t.collaborator_id] || 0) + 1
    hoursByCollab[t.collaborator_id] = (hoursByCollab[t.collaborator_id] || 0) + (Number(t.hours) || 0)
  }

  // Include ALL users that have activity, even if not in collaborators list
  const allUserIds = new Set([
    ...collaborators.map(c => c.id),
    ...Object.keys(actionsByCollab),
    ...Object.keys(tasksByCollab),
  ])

  const maxCollab = Math.max(...Array.from(allUserIds).map(id => actionsByCollab[id] || 0), 1)

  const totalActions = actions.length
  const totalTasks = tasks.length
  const totalHours = tasks.reduce((s, t) => s + (Number(t.hours) || 0), 0)

  function getName(id: string) {
    return collaborators.find(c => c.id === id)?.name || 'Usuario'
  }

  function getInitials(id: string) {
    return getName(id).split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  }

  function handleExport() {
    const { from, to } = getRange(period)
    window.open(`/api/export?collaborator_id=all&name=Equipo&from=${from}&to=${to}`, '_blank')
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)', ...font }}>
      <i className="ti ti-loader-2" style={{ fontSize: 28, display: 'block', marginBottom: 8 }} />
      Cargando datos del equipo...
    </div>
  )

  if (error) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: '#A32D2D', ...font }}>
      <i className="ti ti-alert-circle" style={{ fontSize: 28, display: 'block', marginBottom: 8 }} />
      {error}
    </div>
  )

  return (
    <div style={font}>

      {/* Period selector */}
      <div style={{ display: 'flex', background: 'var(--card)', borderRadius: 10, padding: 3, marginBottom: 16, border: '0.5px solid var(--border)' }}>
        {(['day', 'week', 'month'] as Period[]).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, background: period === p ? '#1D9E75' : 'transparent', color: period === p ? 'white' : 'var(--text3)', transition: 'all .15s', ...font }}>
            {p === 'day' ? 'Hoy' : p === 'week' ? 'Semana' : 'Mes'}
          </button>
        ))}
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Toques totales', value: totalActions, color: '#534AB7', icon: 'ti-hand-click' },
          { label: 'Tareas totales', value: totalTasks, color: '#0F6E56', icon: 'ti-list' },
          { label: 'Horas trabajadas', value: `${totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1)}h`, color: '#BA7517', icon: 'ti-clock' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--card)', borderRadius: 10, padding: '10px 12px', border: '0.5px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <i className={`ti ${s.icon}`} style={{ fontSize: 12 }} />{s.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Chart: actions by system */}
      <div style={{ background: 'var(--card)', borderRadius: 12, border: '0.5px solid var(--border)', padding: '14px', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className="ti ti-chart-bar" style={{ fontSize: 13 }} /> Toques por sistema
        </div>
        {SYSTEMS_CONFIG.map(sys => {
          const count = actionsBySystem[sys.key] || 0
          const pct = (count / maxSys) * 100
          return (
            <div key={sys.key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: sys.bg, color: sys.color, minWidth: 90, textAlign: 'center' }}>{sys.label}</span>
              <div style={{ flex: 1, height: 10, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: sys.color, borderRadius: 99, transition: 'width .4s' }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: sys.color, minWidth: 28, textAlign: 'right' }}>{count}</span>
            </div>
          )
        })}
        {totalActions === 0 && (
          <div style={{ fontSize: 13, color: 'var(--text4)', fontWeight: 300, textAlign: 'center', padding: '1rem 0' }}>Sin acciones en este período</div>
        )}
      </div>

      {/* Chart: by collaborator — shows ALL users with activity */}
      <div style={{ background: 'var(--card)', borderRadius: 12, border: '0.5px solid var(--border)', padding: '14px', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className="ti ti-users" style={{ fontSize: 13 }} /> Actividad por colaborador
        </div>

        {Array.from(allUserIds).map(id => {
          const acts = actionsByCollab[id] || 0
          const tsks = tasksByCollab[id] || 0
          const hrs = hoursByCollab[id] || 0
          const pct = (acts / maxCollab) * 100
          const initials = getInitials(id)
          const displayName = getName(id)

          return (
            <div key={id} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '0.5px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#CECBF6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#3C3489', flexShrink: 0 }}>{initials}</div>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', flex: 1 }}>{displayName}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{tsks} tareas · {hrs % 1 === 0 ? hrs : hrs.toFixed(1)}h</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 8, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: '#534AB7', borderRadius: 99, transition: 'width .4s' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#534AB7', minWidth: 28, textAlign: 'right' }}>{acts} toques</span>
              </div>
            </div>
          )
        })}

        {allUserIds.size === 0 && (
          <div style={{ fontSize: 13, color: 'var(--text4)', fontWeight: 300, textAlign: 'center', padding: '1rem 0' }}>Sin actividad registrada en este período</div>
        )}
      </div>

      {/* Recent activity feed */}
      {actions.length > 0 && (
        <div style={{ background: 'var(--card)', borderRadius: 12, border: '0.5px solid var(--border)', padding: '14px', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="ti ti-activity" style={{ fontSize: 13 }} /> Actividad reciente
          </div>
          {[...actions].reverse().slice(0, 10).map(a => {
            const sys = SYSTEMS_CONFIG.find(s => s.key === a.system)
            const act = sys?.actions.find(x => x.key === a.action)
            const time = new Date(a.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
            return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '0.5px solid var(--border)' }}>
                <span style={{ fontSize: 10, color: 'var(--text4)', minWidth: 38 }}>{time}</span>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#CECBF6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, color: '#3C3489', flexShrink: 0 }}>
                  {getInitials(a.collaborator_id)}
                </div>
                <span style={{ fontSize: 11, color: 'var(--text2)', flex: 1 }}>{getName(a.collaborator_id)}</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 20, background: sys?.bg, color: sys?.color, whiteSpace: 'nowrap' }}>{sys?.label}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{act?.label}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Export */}
      <button onClick={handleExport}
        style={{ width: '100%', padding: '10px', borderRadius: 10, border: '0.5px solid #C0DD97', background: '#EAF3DE', color: '#3B6D11', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, ...font }}>
        <i className="ti ti-file-spreadsheet" style={{ fontSize: 16 }} /> Exportar reporte del equipo
      </button>
    </div>
  )
}
