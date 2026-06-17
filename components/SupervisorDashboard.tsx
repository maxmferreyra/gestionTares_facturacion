'use client'
import { useEffect, useState } from 'react'
import { SYSTEMS_CONFIG } from '@/lib/actions-config'

const font = { fontFamily: 'Montserrat, sans-serif' }

interface Collaborator { id: string; name: string; role: string; avatar?: string }
interface Action { id: string; collaborator_id: string; system: string; action: string; date: string; created_at: string }
interface Task { id: string; collaborator_id: string; title: string; date: string; hours: number }

type Period = 'day' | 'week' | 'month'

function getRange(period: Period): { from: string; to: string } {
  const now = new Date()
  const to = now.toISOString().split('T')[0]
  let from = to
  if (period === 'week') { const d = new Date(now); d.setDate(d.getDate() - 6); from = d.toISOString().split('T')[0] }
  else if (period === 'month') { from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0] }
  return { from, to }
}

export default function SupervisorDashboard() {
  const [period, setPeriod] = useState<Period>('day')
  const [collabFilter, setCollabFilter] = useState('all')
  const [systemFilter, setSystemFilter] = useState('all')
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [actions, setActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true); setError('')
      try {
        const { from, to } = getRange(period)
        const res = await fetch(`/api/supervisor?from=${from}&to=${to}`, { cache: 'no-store' })
        if (!res.ok) { setError('Error al cargar datos'); setLoading(false); return }
        const d = await res.json()
        setCollaborators(Array.isArray(d.collaborators) ? d.collaborators : [])
        setTasks(Array.isArray(d.tasks) ? d.tasks : [])
        setActions(Array.isArray(d.actions) ? d.actions : [])
      } catch { setError('Error de conexión') }
      setLoading(false)
    }
    load()
  }, [period])

  function getName(id: string) { return collaborators.find(c => c.id === id)?.name || 'Usuario' }
  function getInitials(id: string) { return getName(id).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() }
  function getAvatar(id: string) { return collaborators.find(c => c.id === id)?.avatar }

  // ── Filtros aplicados ──
  // baseActions: filtra por colaborador + sistema (para totales y feed)
  const baseActions = actions.filter(a =>
    (collabFilter === 'all' || a.collaborator_id === collabFilter) &&
    (systemFilter === 'all' || a.system === systemFilter)
  )
  // collabOnlyActions: filtra solo por colaborador (para el desglose por sistema con %, que necesita todos los sistemas)
  const collabOnlyActions = actions.filter(a => collabFilter === 'all' || a.collaborator_id === collabFilter)
  // periodActions (sin filtro de colaborador): para el ranking del equipo, respeta sistema
  const rankingActions = actions.filter(a => systemFilter === 'all' || a.system === systemFilter)

  const filteredTasks = tasks.filter(t => collabFilter === 'all' || t.collaborator_id === collabFilter)

  const totalActions = baseActions.length
  const totalTasks = filteredTasks.length

  // Sistema más usado (ignora filtro de sistema, respeta colaborador)
  const systemCountsForMostUsed: Record<string, number> = {}
  for (const a of collabOnlyActions) systemCountsForMostUsed[a.system] = (systemCountsForMostUsed[a.system] || 0) + 1
  let mostUsedSystem: string | null = null
  let mostUsedCount = 0
  for (const [sysKey, count] of Object.entries(systemCountsForMostUsed)) {
    if (count > mostUsedCount) { mostUsedCount = count; mostUsedSystem = sysKey }
  }
  const mostUsedLabel = mostUsedSystem ? SYSTEMS_CONFIG.find(s => s.key === mostUsedSystem)?.label : null

  // Desglose por sistema con porcentajes (respeta colaborador, ignora filtro de sistema)
  const totalForBreakdown = collabOnlyActions.length

  // Ranking del equipo (todos los colaboradores, respeta sistema, ignora filtro de colaborador)
  const actionsByCollabRanking: Record<string, number> = {}
  for (const a of rankingActions) actionsByCollabRanking[a.collaborator_id] = (actionsByCollabRanking[a.collaborator_id] || 0) + 1
  const allUserIds = Array.from(new Set([
    ...collaborators.map(c => c.id),
    ...Object.keys(actionsByCollabRanking),
  ]))
  const ranking = allUserIds
    .map(id => ({ id, count: actionsByCollabRanking[id] || 0 }))
    .sort((a, b) => b.count - a.count)
  const maxRanking = Math.max(...ranking.map(r => r.count), 1)

  function handleExport() {
    const { from, to } = getRange(period)
    window.open(`/api/export?collaborator_id=all&name=Equipo&from=${from}&to=${to}`, '_blank')
  }

  const selectStyle = { padding: '7px 9px', borderRadius: 8, border: '0.5px solid var(--border)', fontSize: 12, outline: 'none', background: 'var(--input-bg)', color: 'var(--text)', cursor: 'pointer', flex: 1, ...font }

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)', ...font }}><i className="ti ti-loader-2" style={{ fontSize: 28, display: 'block', marginBottom: 8 }} />Cargando datos del equipo...</div>
  if (error) return <div style={{ textAlign: 'center', padding: '3rem', color: '#A32D2D', ...font }}><i className="ti ti-alert-circle" style={{ fontSize: 28, display: 'block', marginBottom: 8 }} />{error}</div>

  return (
    <div style={font}>
      {/* Period selector */}
      <div style={{ display: 'flex', background: 'var(--card)', borderRadius: 10, padding: 3, marginBottom: 10, border: '0.5px solid var(--border)' }}>
        {(['day', 'week', 'month'] as Period[]).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, background: period === p ? '#1D9E75' : 'transparent', color: period === p ? 'white' : 'var(--text3)', ...font }}>
            {p === 'day' ? 'Hoy' : p === 'week' ? 'Semana' : 'Mes'}
          </button>
        ))}
      </div>

      {/* Filtros: colaborador + sistema */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <select value={collabFilter} onChange={e => setCollabFilter(e.target.value)} style={selectStyle}>
          <option value="all">Todo el equipo</option>
          {collaborators.map(c => <option key={c.id} value={c.id}>{c.name}{c.role === 'supervisor' ? ' ⭐' : ''}</option>)}
        </select>
        <select value={systemFilter} onChange={e => setSystemFilter(e.target.value)} style={selectStyle}>
          <option value="all">Todos los sistemas</option>
          {SYSTEMS_CONFIG.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        <div style={{ background: 'var(--card)', borderRadius: 10, padding: '12px 8px', border: '0.5px solid var(--border)', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <i className="ti ti-hand-click" style={{ fontSize: 12 }} />Toques
          </div>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#534AB7' }}>{totalActions}</div>
        </div>
        <div style={{ background: 'var(--card)', borderRadius: 10, padding: '12px 8px', border: '0.5px solid var(--border)', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <i className="ti ti-list" style={{ fontSize: 12 }} />Tareas
          </div>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#0F6E56' }}>{totalTasks}</div>
        </div>
        <div style={{ background: 'var(--card)', borderRadius: 10, padding: '12px 8px', border: '0.5px solid var(--border)', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <i className="ti ti-trophy" style={{ fontSize: 12 }} />Más usado
          </div>
          {systemFilter === 'all' && mostUsedLabel ? (
            <div style={{ fontSize: 14, fontWeight: 600, color: '#BA7517', marginTop: 3 }}>{mostUsedLabel}</div>
          ) : (
            <div style={{ fontSize: 12, fontWeight: 400, color: 'var(--text4)', marginTop: 5 }}>{systemFilter !== 'all' ? '—' : 'Sin datos'}</div>
          )}
        </div>
      </div>

      {/* Desglose por sistema con porcentajes */}
      <div style={{ background: 'var(--card)', borderRadius: 12, border: '0.5px solid var(--border)', padding: '14px', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className="ti ti-chart-pie" style={{ fontSize: 13 }} /> Desglose por sistema
        </div>
        {SYSTEMS_CONFIG.map(sys => {
          const count = systemCountsForMostUsed[sys.key] || 0
          const pct = totalForBreakdown > 0 ? Math.round((count / totalForBreakdown) * 100) : 0
          return (
            <div key={sys.key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: sys.bg, color: sys.color, minWidth: 90, textAlign: 'center' }}>{sys.label}</span>
              <div style={{ flex: 1, height: 10, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: sys.color, borderRadius: 99, transition: 'width .4s' }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: sys.color, minWidth: 56, textAlign: 'right' }}>{count} · {pct}%</span>
            </div>
          )
        })}
        {totalForBreakdown === 0 && <div style={{ fontSize: 13, color: 'var(--text4)', fontWeight: 300, textAlign: 'center', padding: '1rem 0' }}>Sin acciones en este período</div>}
      </div>

      {/* Ranking del equipo */}
      <div style={{ background: 'var(--card)', borderRadius: 12, border: '0.5px solid var(--border)', padding: '14px', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className="ti ti-medal" style={{ fontSize: 13 }} /> Ranking del equipo {systemFilter !== 'all' && `· ${SYSTEMS_CONFIG.find(s => s.key === systemFilter)?.label}`}
        </div>
        {ranking.map((r, i) => {
          const avatar = getAvatar(r.id)
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
          const isSup = collaborators.find(c => c.id === r.id)?.role === 'supervisor'
          return (
            <div key={r.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < ranking.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text4)', minWidth: 18 }}>{medal || `${i + 1}.`}</span>
                {avatar
                  ? <img src={avatar} alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'contain', background: '#fff', flexShrink: 0 }} />
                  : <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#CECBF6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#3C3489', flexShrink: 0 }}>{getInitials(r.id)}</div>}
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', flex: 1 }}>{getName(r.id)}{isSup && ' ⭐'}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#534AB7' }}>{r.count} toques</span>
              </div>
              <div style={{ height: 7, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden', marginLeft: 26 }}>
                <div style={{ width: `${(r.count / maxRanking) * 100}%`, height: '100%', background: i === 0 ? '#BA7517' : '#534AB7', borderRadius: 99, transition: 'width .4s' }} />
              </div>
            </div>
          )
        })}
        {ranking.length === 0 && <div style={{ fontSize: 13, color: 'var(--text4)', fontWeight: 300, textAlign: 'center', padding: '1rem 0' }}>Sin actividad en este período</div>}
      </div>

      {/* Recent feed */}
      {baseActions.length > 0 && (
        <div style={{ background: 'var(--card)', borderRadius: 12, border: '0.5px solid var(--border)', padding: '14px', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="ti ti-activity" style={{ fontSize: 13 }} /> Actividad reciente
          </div>
          {[...baseActions].reverse().slice(0, 10).map(a => {
            const sys = SYSTEMS_CONFIG.find(s => s.key === a.system)
            const act = sys?.actions.find(x => x.key === a.action)
            const time = new Date(a.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
            return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '0.5px solid var(--border)' }}>
                <span style={{ fontSize: 10, color: 'var(--text4)', minWidth: 38 }}>{time}</span>
                <span style={{ fontSize: 11, color: 'var(--text2)', flex: 1 }}>{getName(a.collaborator_id)}</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 20, background: sys?.bg, color: sys?.color, whiteSpace: 'nowrap' }}>{sys?.label}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{act?.label}</span>
              </div>
            )
          })}
        </div>
      )}

      <button onClick={handleExport} style={{ width: '100%', padding: '10px', borderRadius: 10, border: '0.5px solid #C0DD97', background: '#EAF3DE', color: '#3B6D11', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, ...font }}>
        <i className="ti ti-file-spreadsheet" style={{ fontSize: 16 }} /> Exportar reporte del equipo
      </button>
    </div>
  )
}
