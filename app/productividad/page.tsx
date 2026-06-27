'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { calcDuration } from '@/lib/types'
import { SYSTEMS_CONFIG } from '@/lib/actions-config'
import { TASK_SYSTEMS } from '@/lib/tasks-config'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'

const font = { fontFamily: 'Montserrat, sans-serif' }
const mono = { fontFamily: "'JetBrains Mono', monospace" }
const INACTIVITY_LIMIT = 8 * 60 * 60 * 1000

interface Collaborator { id: string; name: string; role: string; avatar?: string }
interface Task { id: string; collaborator_id: string; date: string; start_time: string | null; end_time: string | null; systems: string[] | null }
interface Action { id: string; collaborator_id: string; system: string; action: string; date: string }
interface TimeStandard { system: string; action: string; label: string; standard_seconds: number }

type Period = 'day' | 'week' | 'month'

function getRange(period: Period): { from: string; to: string } {
  const now = new Date()
  const to = now.toISOString().split('T')[0]
  let from = to
  if (period === 'week') { const d = new Date(now); d.setDate(d.getDate() - 6); from = d.toISOString().split('T')[0] }
  else if (period === 'month') { from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0] }
  return { from, to }
}

function taskMinutes(t: Task) {
  if (!t.start_time || !t.end_time) return 0
  const d = calcDuration(t.start_time, t.end_time)
  return d ? d.hours * 60 + d.minutes : 0
}

function formatHM(totalMin: number) {
  const h = Math.floor(totalMin / 60), m = Math.round(totalMin % 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// Mapeo Diario (TASK_SYSTEMS) -> Facturas (SYSTEMS_CONFIG keys), con el
// caso especial de Legal Tracker (vive como una acción puntual dentro de SAP).
const SIMPLE_MAP: Record<string, string> = {
  ARCA: 'arca', BRAINWARE: 'brainware', COUPA: 'coupa',
  FRESHDESK: 'freshdesk', ONBASE: 'onbase', OUTLOOK: 'outlook',
}
const ROW_COLORS: Record<string, { bg: string; color: string }> = {
  ARCA: { bg: '#FBEAF0', color: '#72243E' },
  BRAINWARE: { bg: '#E6F1FB', color: '#185FA5' },
  COUPA: { bg: 'var(--brand-tint)', color: 'var(--brand-dark)' },
  FRESHDESK: { bg: '#E0F2EF', color: '#0F6E56' },
  ONBASE: { bg: '#FAEEDA', color: '#854F0B' },
  OUTLOOK: { bg: '#E6E9FB', color: '#2A4B9B' },
  SAP: { bg: '#EAF3DE', color: '#3B6D11' },
  'LEGAL TRACKER': { bg: '#F1EFE8', color: 'var(--brand)' },
}

export default function ProductividadPage() {
  const router = useRouter()
  const [collaborator, setCollaborator] = useState<{ id: string; name: string; role: string } | null>(null)
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [actions, setActions] = useState<Action[]>([])
  const [standards, setStandards] = useState<TimeStandard[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('week')
  const [collabFilter, setCollabFilter] = useState('all')
  const [configOpen, setConfigOpen] = useState(false)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [savingConfig, setSavingConfig] = useState(false)
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function logout() { localStorage.removeItem('collaborator'); router.push('/') }

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
    const c = JSON.parse(stored)
    if (c.role !== 'supervisor') { router.push('/dashboard'); return }
    setCollaborator(c)
    resetInactivity()
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    events.forEach(e => window.addEventListener(e, resetInactivity))
    return () => {
      events.forEach(e => window.removeEventListener(e, resetInactivity))
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    }
  }, [router])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { from, to } = getRange(period)
    const [supRes, stdRes] = await Promise.all([
      fetch(`/api/supervisor?from=${from}&to=${to}`, { cache: 'no-store' }),
      fetch('/api/time-standards', { cache: 'no-store' }),
    ])
    const supData = await supRes.json()
    const stdData = await stdRes.json()
    setCollaborators(Array.isArray(supData.collaborators) ? supData.collaborators : [])
    setTasks(Array.isArray(supData.tasks) ? supData.tasks : [])
    setActions(Array.isArray(supData.actions) ? supData.actions : [])
    setStandards(Array.isArray(stdData) ? stdData : [])
    setLoading(false)
  }, [period])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const vals: Record<string, string> = {}
    for (const s of standards) vals[`${s.system}__${s.action}`] = String(s.standard_seconds)
    setEditValues(vals)
  }, [standards])

  function standardSecondsFor(system: string, action: string) {
    return standards.find(s => s.system === system && s.action === action)?.standard_seconds ?? 60
  }

  async function saveConfig() {
    setSavingConfig(true)
    const items = standards.map(s => ({
      system: s.system, action: s.action,
      standard_seconds: parseInt(editValues[`${s.system}__${s.action}`], 10) || s.standard_seconds,
    }))
    const res = await fetch('/api/time-standards', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
    setSavingConfig(false)
    if (res.ok) fetchData()
  }

  if (!collaborator) return null

  // ── Filtro de colaborador ──
  const filteredTasks = tasks.filter(t => collabFilter === 'all' || t.collaborator_id === collabFilter)
  const filteredActions = actions.filter(a => collabFilter === 'all' || a.collaborator_id === collabFilter)

  // ── Cálculo por fila (una por cada sistema de Diario) ──
  const rows = TASK_SYSTEMS.map(taskSys => {
    const diarioMin = filteredTasks
      .filter(t => t.systems?.includes(taskSys))
      .reduce((s, t) => s + taskMinutes(t), 0)

    let rowActions: Action[]
    if (taskSys === 'SAP') {
      rowActions = filteredActions.filter(a => a.system === 'sap' && a.action !== 'factura_legal_tracker')
    } else if (taskSys === 'LEGAL TRACKER') {
      rowActions = filteredActions.filter(a => a.system === 'sap' && a.action === 'factura_legal_tracker')
    } else {
      const mapped = SIMPLE_MAP[taskSys]
      rowActions = filteredActions.filter(a => a.system === mapped)
    }

    const standardSec = rowActions.reduce((s, a) => s + standardSecondsFor(a.system, a.action), 0)
    const standardMin = standardSec / 60
    const touchCount = rowActions.length
    const ritmoRealMin = touchCount > 0 ? diarioMin / touchCount : null
    const ritmoStdMin = touchCount > 0 ? standardMin / touchCount : null

    let diffLabel = '', diffOk = true
    if (diarioMin > 0 || standardMin > 0) {
      const diff = diarioMin - standardMin
      const pctBase = Math.max(diarioMin, standardMin, 1)
      const pct = Math.abs(diff) / pctBase * 100
      if (pct <= 15) { diffLabel = `Coincide ±${Math.round(pct)}%`; diffOk = true }
      else { diffLabel = `${diff > 0 ? '−' : '+'}${formatHM(Math.abs(diff))} vs Diario`; diffOk = false }
    }

    return { taskSys, diarioMin, standardMin, touchCount, ritmoRealMin, ritmoStdMin, diffLabel, diffOk }
  })

  const colors = (k: string) => ROW_COLORS[k] || { bg: '#F1EFE8', color: 'var(--text2)' }
  const maxBar = Math.max(...rows.map(r => Math.max(r.diarioMin, r.standardMin)), 1)
  const inputStyle = { padding: '8px 11px', borderRadius: 7, border: '0.5px solid var(--border)', fontSize: 13, outline: 'none', background: 'var(--input-bg)', color: 'var(--text)', ...font }

  return (
    <div className="flex flex-col lg:flex-row" style={{ width: '100%', minHeight: '100vh', gap: 22, padding: 22, background: 'var(--bg)', ...font }}>
      <Sidebar collaborator={collaborator} activeKey="/productividad" onNavigate={(key) => router.push(`/dashboard?view=${key}`)} />
      <MobileNav collaborator={collaborator} activeKey="/productividad" onNavigate={(key) => router.push(`/dashboard?view=${key}`)} onLogout={logout} />
      <div className="pt-14 pb-20 lg:pt-0 lg:pb-0" style={{ flex: 1, minWidth: 0, maxWidth: 800 }}>

        {/* Header */}
        <div style={{ marginBottom: '1.1rem' }}>
          <h1 style={{ fontSize: 19, fontWeight: 600, color: 'var(--text)' }}>Productividad</h1>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 300, marginTop: 2 }}>Comparación: horas en Diario vs. tiempo estimado por toques</div>
        </div>

        {/* Period pills */}
        <div style={{ display: 'flex', background: 'var(--card)', borderRadius: 10, padding: 3, marginBottom: 8, border: '0.5px solid var(--border)', gap: 2 }}>
          {(['day', 'week', 'month'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 500, background: period === p ? 'var(--brand)' : 'transparent', color: period === p ? 'var(--card)' : 'var(--text3)', ...font }}>
              {p === 'day' ? 'Hoy' : p === 'week' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>

        {/* Collaborator selector */}
        <select value={collabFilter} onChange={e => setCollabFilter(e.target.value)}
          style={{ ...inputStyle, width: '100%', cursor: 'pointer', marginBottom: 14 }}>
          <option value="all">Todo el equipo (vista agregada)</option>
          {collaborators.map(c => <option key={c.id} value={c.id}>{c.name}{c.role === 'supervisor' ? ' ⭐' : ''}</option>)}
        </select>

        {/* Config panel */}
        <div style={{ background: 'var(--card)', borderRadius: 12, border: '0.5px solid var(--border)', marginBottom: 16, overflow: 'hidden' }}>
          <button onClick={() => setConfigOpen(!configOpen)}
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', border: 'none', background: 'transparent', cursor: 'pointer', ...font }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ti ti-adjustments" style={{ fontSize: 14 }} /> Configurar tiempos estándar
            </span>
            <i className={`ti ${configOpen ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: 15, color: 'var(--text3)' }} />
          </button>
          {configOpen && (
            <div style={{ padding: '0 14px 14px', borderTop: '0.5px solid var(--border)' }}>
              {SYSTEMS_CONFIG.map(sys => (
                <div key={sys.key}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em', margin: '12px 0 6px' }}>{sys.label}</div>
                  {sys.actions.map(act => {
                    const k = `${sys.key}__${act.key}`
                    return (
                      <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                        <span style={{ flex: 1, fontSize: 12, color: 'var(--text)' }}>{act.label}</span>
                        <input type="text" value={editValues[k] ?? ''} onChange={e => setEditValues(prev => ({ ...prev, [k]: e.target.value.replace(/\D/g, '') }))}
                          style={{ width: 64, padding: '5px 8px', borderRadius: 6, border: '0.5px solid var(--border)', fontSize: 12, textAlign: 'center', ...mono }} />
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>seg</span>
                      </div>
                    )
                  })}
                </div>
              ))}
              <button onClick={saveConfig} disabled={savingConfig}
                style={{ marginTop: 10, padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--brand)', color: 'var(--card)', fontSize: 12, fontWeight: 600, cursor: savingConfig ? 'not-allowed' : 'pointer', opacity: savingConfig ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 5, ...font }}>
                <i className="ti ti-check" style={{ fontSize: 13 }} /> {savingConfig ? 'Guardando...' : 'Guardar tiempos'}
              </button>
            </div>
          )}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, padding: '2px 2px 10px', fontSize: 11, color: 'var(--text2)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#185FA5', display: 'inline-block' }} /> Diario (real)</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#3B6D11', display: 'inline-block' }} /> Toques × estándar</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text3)' }}>
            <i className="ti ti-loader-2" style={{ fontSize: 28, display: 'block', marginBottom: 8 }} /> Cargando...
          </div>
        ) : (
          rows.map(r => {
            const rc = colors(r.taskSys)
            return (
              <div key={r.taskSys} style={{ background: 'var(--card)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '13px 15px', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: rc.bg, color: rc.color }}>{r.taskSys}</span>
                  <span style={{ flex: 1 }} />
                  {r.diffLabel && (
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: r.diffOk ? '#EAF3DE' : 'var(--error-bg)', color: r.diffOk ? '#3B6D11' : 'var(--error)' }}>
                      {r.diffLabel}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 9 }}>
                  <div style={{ flex: 1, textAlign: 'center', padding: '7px 4px', borderRadius: 8, background: '#E6F1FB' }}>
                    <div style={{ fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.03em', color: '#185FA5', marginBottom: 3 }}>Diario</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#185FA5', ...mono }}>{formatHM(r.diarioMin)}</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', padding: '7px 4px', borderRadius: 8, background: '#EAF3DE' }}>
                    <div style={{ fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.03em', color: '#3B6D11', marginBottom: 3 }}>Estándar</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#3B6D11', ...mono }}>{formatHM(r.standardMin)}</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', padding: '7px 4px', borderRadius: 8, background: '#F1EFE8' }}>
                    <div style={{ fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.03em', color: 'var(--text2)', marginBottom: 3 }}>Toques</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', ...mono }}>{r.touchCount}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 30, marginBottom: r.ritmoRealMin !== null ? 9 : 0 }}>
                  <div style={{ flex: 1, borderRadius: '4px 4px 0 0', background: '#185FA5', height: `${Math.max((r.diarioMin / maxBar) * 100, r.diarioMin > 0 ? 4 : 0)}%` }} />
                  <div style={{ flex: 1, borderRadius: '4px 4px 0 0', background: '#3B6D11', height: `${Math.max((r.standardMin / maxBar) * 100, r.standardMin > 0 ? 4 : 0)}%` }} />
                </div>

                {r.ritmoRealMin !== null && (
                  <div style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <i className="ti ti-gauge" style={{ fontSize: 13 }} />
                    Ritmo real: <strong style={{ color: 'var(--text)' }}>{r.ritmoRealMin.toFixed(1)} min/toque</strong>
                    {' '}vs. estándar configurado: <strong style={{ color: 'var(--text)' }}>{r.ritmoStdMin!.toFixed(1)} min/toque</strong>
                  </div>
                )}
              </div>
            )
          })
        )}

        <div style={{ fontSize: 10, color: 'var(--text4)', marginTop: 14, lineHeight: 1.6, display: 'flex', gap: 6 }}>
          <i className="ti ti-info-circle" style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }} />
          <span>
            <strong>Diario</strong>: horas reales bloqueadas en la pestaña Diario con ese sistema tildado.{' '}
            <strong>Estándar</strong>: cantidad de toques × tiempo configurado arriba.{' '}
            Legal Tracker se mide aparte (compara contra la acción puntual "Factura Legal Tracker" dentro de SAP, no contra todo SAP).
          </span>
        </div>
      </div>
    </div>
  )
}
