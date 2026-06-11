'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Task, Tag } from '@/lib/types'
import TaskItem from '@/components/TaskItem'
import AddTaskForm from '@/components/AddTaskForm'
import WeeklySummary from '@/components/WeeklySummary'

type View = 'daily' | 'weekly'

function offsetDate(base: string, days: number) {
  const d = new Date(base + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date().toISOString().split('T')[0]
  const yesterday = offsetDate(today, -1)
  const tomorrow = offsetDate(today, 1)
  if (dateStr === today) return 'Hoy'
  if (dateStr === yesterday) return 'Ayer'
  if (dateStr === tomorrow) return 'Mañana'
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
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
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    })
    setTasks(prev => prev.map(t => t.id === id ? res.ok ? undefined : t : t).filter(Boolean) as Task[])
    const updated = await res.json()
    setTasks(prev => prev.map(t => t.id === id ? updated : t))
  }

  async function updateTask(id: string, fields: Partial<Task>) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    const updated = await res.json()
    setTasks(prev => prev.map(t => t.id === id ? updated : t))
  }

  async function deleteTask(id: string) {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  async function addTask(data: { title: string; hours: number; tag: string; notes: string }) {
    if (!collaborator) return
    const res = await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collaborator_id: collaborator.id, date: currentDate, ...data }),
    })
    const task = await res.json()
    setTasks(prev => [...prev, task])
    setShowAddForm(false)
  }

  function handleExport() {
    if (!collaborator) return
    window.open(`/api/export?collaborator_id=${collaborator.id}&name=${encodeURIComponent(collaborator.name)}`, '_blank')
  }

  function logout() {
    localStorage.removeItem('collaborator')
    router.push('/')
  }

  const done = tasks.filter(t => t.completed)
  const pending = tasks.filter(t => !t.completed)
  const totalHours = tasks.reduce((s, t) => s + (Number(t.hours) || 0), 0)
  const pct = tasks.length > 0 ? Math.round((done.length / tasks.length) * 100) : 0
  const initials = collaborator?.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
  const isFuture = currentDate > today

  if (!collaborator) return null

  const font = { fontFamily: 'Montserrat, sans-serif' }

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
            <button onClick={handleExport}
              style={{ padding: '7px 14px', borderRadius: 8, border: '0.5px solid #C0DD97', background: '#EAF3DE', fontSize: 12, cursor: 'pointer', color: '#3B6D11', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, ...font }}>
              <i className="ti ti-file-spreadsheet" style={{ fontSize: 15 }} /> Excel
            </button>
            <button onClick={logout}
              style={{ padding: '7px 14px', borderRadius: 8, border: '0.5px solid #d3d1c7', background: 'white', fontSize: 12, cursor: 'pointer', color: '#888780', display: 'flex', alignItems: 'center', gap: 6, ...font }}>
              <i className="ti ti-logout" style={{ fontSize: 15 }} /> Salir
            </button>
          </div>
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', background: 'white', borderRadius: 10, padding: 3, marginBottom: '1.25rem', border: '0.5px solid #e5e3db' }}>
          {(['daily', 'weekly'] as View[]).map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                background: view === v ? '#534AB7' : 'transparent',
                color: view === v ? 'white' : '#888780',
                transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, ...font }}>
              <i className={`ti ${v === 'daily' ? 'ti-calendar-day' : 'ti-calendar-week'}`} style={{ fontSize: 15 }} />
              {v === 'daily' ? 'Diario' : 'Semana'}
            </button>
          ))}
        </div>

        {view === 'daily' && (
          <>
            {/* Date navigator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', borderRadius: 10, padding: '10px 14px', marginBottom: '1.25rem', border: '0.5px solid #e5e3db' }}>
              <button onClick={() => setCurrentDate(d => offsetDate(d, -1))}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#534AB7', padding: '4px 8px', borderRadius: 6, fontSize: 14, display: 'flex', alignItems: 'center' }}>
                <i className="ti ti-chevron-left" style={{ fontSize: 18 }} />
              </button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, textTransform: 'capitalize' }}>{formatDate(currentDate)}</div>
                {currentDate !== today && (
                  <div style={{ fontSize: 11, color: '#b4b2a9', fontWeight: 300 }}>
                    {new Date(currentDate + 'T12:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                )}
              </div>
              <button onClick={() => setCurrentDate(d => offsetDate(d, 1))}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#534AB7', padding: '4px 8px', borderRadius: 6, fontSize: 14, display: 'flex', alignItems: 'center' }}>
                <i className="ti ti-chevron-right" style={{ fontSize: 18 }} />
              </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: '1.25rem' }}>
              {[
                { label: 'Total', value: tasks.length, color: '#1a1a18', icon: 'ti-list' },
                { label: 'Hechas', value: done.length, color: '#0F6E56', icon: 'ti-circle-check' },
                { label: 'Pendientes', value: pending.length, color: '#BA7517', icon: 'ti-clock' },
                { label: 'Horas', value: totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1), color: '#534AB7', icon: 'ti-hourglass' },
              ].map(s => (
                <div key={s.label} style={{ background: 'white', borderRadius: 10, padding: '10px 12px', border: '0.5px solid #e5e3db' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#888780', marginBottom: 4, fontWeight: 500 }}>
                    <i className={`ti ${s.icon}`} style={{ fontSize: 13 }} /> {s.label}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 600, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            {tasks.length > 0 && (
              <div style={{ background: 'white', borderRadius: 10, padding: '12px 14px', marginBottom: '1.25rem', border: '0.5px solid #e5e3db' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: '#5f5e5a', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="ti ti-trending-up" style={{ fontSize: 15 }} /> Progreso del día
                  </span>
                  <span style={{ fontWeight: 600, color: pct === 100 ? '#0F6E56' : '#534AB7' }}>{pct}%</span>
                </div>
                <div style={{ height: 6, background: '#f5f4f0', borderRadius: 99 }}>
                  <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: pct === 100 ? '#1D9E75' : '#534AB7', transition: 'width 0.3s' }} />
                </div>
              </div>
            )}

            {/* Pending */}
            {pending.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#888780', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className="ti ti-clock" style={{ fontSize: 13 }} /> Pendientes
                </div>
                {pending.map(t => <TaskItem key={t.id} task={t} onToggle={toggleTask} onUpdate={updateTask} onDelete={deleteTask} />)}
              </div>
            )}

            {/* Done */}
            {done.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#888780', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className="ti ti-circle-check" style={{ fontSize: 13 }} /> Completadas
                </div>
                {done.map(t => <TaskItem key={t.id} task={t} onToggle={toggleTask} onUpdate={updateTask} onDelete={deleteTask} />)}
              </div>
            )}

            {!loading && tasks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#b4b2a9' }}>
                <i className="ti ti-clipboard" style={{ fontSize: 36, display: 'block', marginBottom: 8 }} />
                <div style={{ fontSize: 14, fontWeight: 300 }}>
                  {isFuture ? 'No hay tareas cargadas para este día' : 'Sin tareas para este día'}
                </div>
              </div>
            )}

            {/* Add task */}
            {showAddForm ? (
              <AddTaskForm onAdd={addTask} onCancel={() => setShowAddForm(false)} />
            ) : (
              <button onClick={() => setShowAddForm(true)}
                style={{ width: '100%', padding: '11px', borderRadius: 10, border: '0.5px dashed #b4b2a9', background: 'transparent', fontSize: 14, color: '#888780', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, ...font, fontWeight: 500 }}>
                <i className="ti ti-plus" style={{ fontSize: 17 }} /> Agregar tarea
              </button>
            )}
          </>
        )}

        {view === 'weekly' && (
          <WeeklySummary collaboratorId={collaborator.id} collaboratorName={collaborator.name} />
        )}
      </div>
    </div>
  )
}
