'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Task } from '@/lib/types'
import { calcDuration } from '@/lib/types'
import TaskItem from '@/components/TaskItem'
import AddTaskForm from '@/components/AddTaskForm'
import WeeklySummary from '@/components/WeeklySummary'
import InvoiceActions from '@/components/InvoiceActions'

type View = 'daily' | 'weekly' | 'invoices'

const WORK_START = 9 * 60
const WORK_END = 18 * 60
const WORK_TOTAL = WORK_END - WORK_START

function offsetDate(base: string, days: number) {
  const d = new Date(base + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function formatDate(dateStr: string) {
  const today = new Date().toISOString().split('T')[0]
  if (dateStr === today) return 'Hoy'
  if (dateStr === offsetDate(today, -1)) return 'Ayer'
  if (dateStr === offsetDate(today, 1)) return 'Mañana'
  return new Date(dateStr + 'T12:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function getMotivation(workedMin: number): { msg: string; color: string; bg: string } {
  const pct = workedMin / WORK_TOTAL
  if (workedMin === 0) return { msg: '¡Arrancá el día!', color: '#185FA5', bg: '#E6F1FB' }
  if (pct < 0.3) return { msg: 'Buen comienzo, seguí así 👍', color: '#185FA5', bg: '#E6F1FB' }
  if (pct < 0.55) return { msg: 'Vas por la mitad, bien 💪', color: '#854F0B', bg: '#FAEEDA' }
  if (pct < 0.85) return { msg: 'Falta poco, metele 🔥', color: '#854F0B', bg: '#FAEEDA' }
  if (pct < 1) return { msg: '¡Casi terminás el día! ⚡', color: '#3C3489', bg: '#CECBF6' }
  return { msg: '¡Día completo! Bien hecho ✓', color: '#0F6E56', bg: '#EAF3DE' }
}

function timeToMin(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export default function Dashboard() {
  const router = useRouter()
  const [collaborator, setCollaborator] = useState<{ id: string; name: string } | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [view, setView] = useState<View>('daily')
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0])
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const stored = localStorage.getItem('collaborator')
    if (!stored) { router.push('/'); return }
    setCollaborator(JSON.parse(stored))
  }, [router])

  const fetchTasks = useCallback(async () => {
    if (!collaborator) return
    setLoading(true)
    const res = await fetch(`/api/tasks?collaborator_id=${collaborator.id}&date=${currentDate}`)
    const data = await res.json()
    setTasks(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [collaborator, currentDate])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  async function toggleTask(id: string, completed: boolean) {
    const res = await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed }) })
    const updated = await res.json()
    setTasks(prev => prev.map(t => t.id === id ? updated : t))
  }

  async function updateTask(id: string, fields: Partial<Task>) {
    const res = await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) })
    const updated = await res.json()
    setTasks(prev => prev.map(t => t.id === id ? updated : t))
  }

  async function deleteTask(id: string) {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  async function addTask(data: { title: string; start_time: string; end_time: string; systems: string[]; tag: string; notes: string }) {
    if (!collaborator) return
    const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ collaborator_id: collaborator.id, date: currentDate, ...data }) })
    const task = await res.json()
    setTasks(prev => [...prev, task].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')))
    setShowAddForm(false)
  }

  function handleExport() {
    if (!collaborator) return
    window.open(`/api/export?collaborator_id=${collaborator.id}&name=${encodeURIComponent(collaborator.name)}&date=${currentDate}`, '_blank')
  }

  function logout() {
    localStorage.removeItem('collaborator')
    router.push('/')
  }

  const workedMin = tasks.reduce((sum, t) => {
    if (!t.start_time || !t.end_time) return sum
    const d = calcDuration(t.start_time, t.end_time)
    return sum + (d ? d.hours * 60 + d.minutes : 0)
  }, 0)

  const workedH = Math.floor(workedMin / 60)
  const workedM = workedMin % 60
  const workedLabel = workedM > 0 ? `${workedH}h ${workedM}min` : `${workedH}h`
  const uncoveredMin = Math.max(0, WORK_TOTAL - workedMin)
  const uncoveredH = Math.floor(uncoveredMin / 60)
  const uncoveredM = uncoveredMin % 60
  const uncoveredLabel = uncoveredM > 0 ? `${uncoveredH}h ${uncoveredM}min` : `${uncoveredH}h`
  const motivation = getMotivation(workedMin)
  const initials = collaborator?.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
  const font = { fontFamily: 'Montserrat, sans-serif' }

  const coveredSlots = tasks.filter(t => t.start_time && t.end_time)
    .map(t => ({ start: timeToMin(t.start_time!), end: timeToMin(t.end_time!) }))
    .filter(s => s.end > s.start).sort((a, b) => a.start - b.start)

  type Seg = { from: number; to: number; covered: boolean }
  const segments: Seg[] = []
  let cursor = WORK_START
  for (const slot of coveredSlots) {
    const s = Math.max(slot.start, WORK_START), e = Math.min(slot.end, WORK_END)
    if (s > cursor) segments.push({ from: cursor, to: s, covered: false })
    if (e > cursor) { segments.push({ from: Math.max(cursor, s), to: e, covered: true }); cursor = e }
  }
  if (cursor < WORK_END) segments.push({ from: cursor, to: WORK_END, covered: false })

  const VIEWS: { key: View; label: string; icon: string }[] = [
    { key: 'daily', label: 'Diario', icon: 'ti-calendar-day' },
    { key: 'weekly', label: 'Semana', icon: 'ti-calendar-week' },
    { key: 'invoices', label: 'Facturas', icon: 'ti-file-invoice' },
  ]

  if (!collaborator) return null

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '80%', maxWidth: 700, ...font }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#CECBF6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#3C3489' }}>{initials}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{collaborator.name}</div>
              <div style={{ fontSize: 11, color: '#888780', fontWeight: 300 }}>Control de tareas</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleExport} style={{ padding: '7px 14px', borderRadius: 8, border: '0.5px solid #C0DD97', background: '#EAF3DE', fontSize: 12, cursor: 'pointer', color: '#3B6D11', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, ...font }}>
              <i className="ti ti-file-spreadsheet" style={{ fontSize: 15 }} /> Excel
            </button>
            <button onClick={logout} style={{ padding: '7px 14px', borderRadius: 8, border: '0.5px solid #d3d1c7', background: 'white', fontSize: 12, cursor: 'pointer', color: '#888780', display: 'flex', alignItems: 'center', gap: 6, ...font }}>
              <i className="ti ti-logout" style={{ fontSize: 15 }} /> Salir
            </button>
          </div>
        </div>

        {/* View toggle — 3 tabs */}
        <div style={{ display: 'flex', background: 'white', borderRadius: 10, padding: 3, marginBottom: '1.25rem', border: '0.5px solid #e5e3db' }}>
          {VIEWS.map(v => (
            <button key={v.key} onClick={() => setView(v.key)}
              style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: view === v.key ? '#534AB7' : 'transparent', color: view === v.key ? 'white' : '#888780', transition: 'all .15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, ...font }}>
              <i className={`ti ${v.icon}`} style={{ fontSize: 15 }} />
              {v.label}
            </button>
          ))}
        </div>

        {/* ── DAILY ── */}
        {view === 'daily' && (
          <>
            {/* Date navigator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', borderRadius: 10, padding: '10px 14px', marginBottom: '1.25rem', border: '0.5px solid #e5e3db' }}>
              <button onClick={() => setCurrentDate(d => offsetDate(d, -1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#534AB7', padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
                <i className="ti ti-chevron-left" style={{ fontSize: 18 }} />
              </button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, textTransform: 'capitalize' }}>{formatDate(currentDate)}</div>
                {currentDate !== today && <div style={{ fontSize: 11, color: '#b4b2a9', fontWeight: 300 }}>{new Date(currentDate + 'T12:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>}
              </div>
              <button onClick={() => setCurrentDate(d => offsetDate(d, 1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#534AB7', padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
                <i className="ti ti-chevron-right" style={{ fontSize: 18 }} />
              </button>
            </div>

            {/* Hours stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: '1.25rem' }}>
              <div style={{ background: 'white', borderRadius: 10, padding: '12px 14px', border: '0.5px solid #e5e3db' }}>
                <div style={{ fontSize: 11, color: '#888780', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}><i className="ti ti-hourglass-filled" style={{ fontSize: 13 }} /> Horas registradas</div>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#534AB7' }}>{workedLabel || '0h'}</div>
                <div style={{ fontSize: 11, color: '#b4b2a9', marginTop: 2 }}>de 9h laborales</div>
              </div>
              <div style={{ background: 'white', borderRadius: 10, padding: '12px 14px', border: '0.5px solid #e5e3db' }}>
                <div style={{ fontSize: 11, color: '#888780', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}><i className="ti ti-clock-x" style={{ fontSize: 13 }} /> Sin registrar</div>
                <div style={{ fontSize: 24, fontWeight: 600, color: uncoveredMin === 0 ? '#0F6E56' : '#BA7517' }}>{uncoveredMin === 0 ? '0h' : uncoveredLabel}</div>
                <div style={{ fontSize: 11, color: '#b4b2a9', marginTop: 2 }}>{tasks.length} tarea{tasks.length !== 1 ? 's' : ''} cargada{tasks.length !== 1 ? 's' : ''}</div>
              </div>
            </div>

            {/* Timeline bar */}
            {tasks.some(t => t.start_time && t.end_time) && (
              <div style={{ background: 'white', borderRadius: 10, padding: '12px 14px', marginBottom: '1.25rem', border: '0.5px solid #e5e3db' }}>
                <div style={{ fontSize: 11, color: '#888780', fontWeight: 500, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <span><i className="ti ti-timeline" style={{ fontSize: 13, verticalAlign: -1 }} /> Cobertura del día</span>
                  <span style={{ color: motivation.color }}>{Math.round(workedMin / WORK_TOTAL * 100)}%</span>
                </div>
                <div style={{ height: 10, borderRadius: 99, background: '#f5f4f0', display: 'flex', overflow: 'hidden' }}>
                  {segments.map((seg, i) => (
                    <div key={i} style={{ width: `${(seg.to - seg.from) / WORK_TOTAL * 100}%`, background: seg.covered ? '#534AB7' : '#f5f4f0' }} />
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#b4b2a9', marginTop: 4 }}>
                  <span>09:00</span><span>12:00</span><span>15:00</span><span>18:00</span>
                </div>
              </div>
            )}

            {/* Motivation */}
            <div style={{ background: motivation.bg, borderRadius: 10, padding: '10px 14px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ti ti-mood-smile" style={{ fontSize: 18, color: motivation.color }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: motivation.color }}>{motivation.msg}</span>
            </div>

            {/* Tasks */}
            {tasks.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#888780', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className="ti ti-list" style={{ fontSize: 13 }} /> Tareas del día
                </div>
                {tasks.map(t => <TaskItem key={t.id} task={t} onUpdate={updateTask} onDelete={deleteTask} />)}
              </div>
            )}

            {!loading && tasks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#b4b2a9' }}>
                <i className="ti ti-clipboard" style={{ fontSize: 36, display: 'block', marginBottom: 8 }} />
                <div style={{ fontSize: 14, fontWeight: 300 }}>Sin tareas para este día</div>
              </div>
            )}

            {showAddForm
              ? <AddTaskForm onAdd={addTask} onCancel={() => setShowAddForm(false)} />
              : <button onClick={() => setShowAddForm(true)} style={{ width: '100%', padding: '11px', borderRadius: 10, border: '0.5px dashed #b4b2a9', background: 'transparent', fontSize: 14, color: '#888780', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, ...font, fontWeight: 500 }}>
                  <i className="ti ti-plus" style={{ fontSize: 17 }} /> Registrar tarea
                </button>
            }
          </>
        )}

        {/* ── WEEKLY ── */}
        {view === 'weekly' && <WeeklySummary collaboratorId={collaborator.id} collaboratorName={collaborator.name} />}

        {/* ── INVOICES ── */}
        {view === 'invoices' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', borderRadius: 10, padding: '10px 14px', marginBottom: '1.25rem', border: '0.5px solid #e5e3db' }}>
              <button onClick={() => setCurrentDate(d => offsetDate(d, -1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#534AB7', padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
                <i className="ti ti-chevron-left" style={{ fontSize: 18 }} />
              </button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, textTransform: 'capitalize' }}>{formatDate(currentDate)}</div>
                {currentDate !== today && <div style={{ fontSize: 11, color: '#b4b2a9', fontWeight: 300 }}>{new Date(currentDate + 'T12:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>}
              </div>
              <button onClick={() => setCurrentDate(d => offsetDate(d, 1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#534AB7', padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
                <i className="ti ti-chevron-right" style={{ fontSize: 18 }} />
              </button>
            </div>
            <InvoiceActions collaboratorId={collaborator.id} currentDate={currentDate} />
          </>
        )}

      </div>
    </div>
  )
}
