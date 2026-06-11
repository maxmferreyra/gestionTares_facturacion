'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Task, Tag } from '@/lib/types'
import { TAGS } from '@/lib/types'
import TaskItem from '@/components/TaskItem'
import AddTaskForm from '@/components/AddTaskForm'
import WeeklySummary from '@/components/WeeklySummary'

type View = 'daily' | 'weekly'

export default function Dashboard() {
  const router = useRouter()
  const [collaborator, setCollaborator] = useState<{ id: string; name: string } | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [view, setView] = useState<View>('daily')
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [today] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    const stored = localStorage.getItem('collaborator')
    if (!stored) { router.push('/'); return }
    setCollaborator(JSON.parse(stored))
  }, [router])

  const fetchTasks = useCallback(async () => {
    if (!collaborator) return
    setLoading(true)
    const res = await fetch(`/api/tasks?collaborator_id=${collaborator.id}&date=${today}`)
    const data = await res.json()
    setTasks(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [collaborator, today])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  async function toggleTask(id: string, completed: boolean) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    })
    const updated = await res.json()
    setTasks(prev => prev.map(t => t.id === id ? updated : t))
  }

  async function updateTask(id: string, fields: Partial<Task>) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    const updated = await res.json()
    setTasks(prev => prev.map(t => t.id === id ? updated : t))
  }

  async function deleteTask(id: string) {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  async function addTask(data: { title: string; hours: number; tag: Tag; notes: string }) {
    if (!collaborator) return
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collaborator_id: collaborator.id, date: today, ...data }),
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

  const todayLabel = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

  if (!collaborator) return null

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '1rem', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#CECBF6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 500, color: '#3C3489' }}>{initials}</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{collaborator.name}</div>
            <div style={{ fontSize: 12, color: '#888780', textTransform: 'capitalize' }}>{todayLabel}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleExport} title="Exportar Excel"
            style={{ padding: '7px 12px', borderRadius: 8, border: '0.5px solid #d3d1c7', background: 'white', fontSize: 13, cursor: 'pointer', color: '#3B6D11', fontWeight: 500 }}>
            ⬇ Excel
          </button>
          <button onClick={logout}
            style={{ padding: '7px 12px', borderRadius: 8, border: '0.5px solid #d3d1c7', background: 'white', fontSize: 13, cursor: 'pointer', color: '#888780' }}>
            Salir
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
              transition: 'all 0.15s' }}>
            {v === 'daily' ? 'Hoy' : 'Semana'}
          </button>
        ))}
      </div>

      {view === 'daily' && (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: '1.25rem' }}>
            {[
              { label: 'Total', value: tasks.length, color: '#1a1a18' },
              { label: 'Hechas', value: done.length, color: '#0F6E56' },
              { label: 'Pendientes', value: pending.length, color: '#BA7517' },
              { label: 'Horas', value: totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1), color: '#534AB7' },
            ].map(s => (
              <div key={s.label} style={{ background: 'white', borderRadius: 10, padding: '10px 12px', border: '0.5px solid #e5e3db' }}>
                <div style={{ fontSize: 11, color: '#888780', marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 500, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {tasks.length > 0 && (
            <div style={{ background: 'white', borderRadius: 10, padding: '12px 14px', marginBottom: '1.25rem', border: '0.5px solid #e5e3db' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                <span style={{ color: '#5f5e5a' }}>Progreso del día</span>
                <span style={{ fontWeight: 500, color: pct === 100 ? '#0F6E56' : '#534AB7' }}>{pct}%</span>
              </div>
              <div style={{ height: 6, background: '#f5f4f0', borderRadius: 99 }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: pct === 100 ? '#1D9E75' : '#534AB7', transition: 'width 0.3s' }} />
              </div>
            </div>
          )}

          {/* Pending tasks */}
          {pending.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: '#888780', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Pendientes</div>
              {pending.map(t => (
                <TaskItem key={t.id} task={t} onToggle={toggleTask} onUpdate={updateTask} onDelete={deleteTask} />
              ))}
            </div>
          )}

          {/* Done tasks */}
          {done.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: '#888780', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Completadas</div>
              {done.map(t => (
                <TaskItem key={t.id} task={t} onToggle={toggleTask} onUpdate={updateTask} onDelete={deleteTask} />
              ))}
            </div>
          )}

          {!loading && tasks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#b4b2a9' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
              <div style={{ fontSize: 14 }}>No hay tareas para hoy todavía</div>
            </div>
          )}

          {/* Add task */}
          {showAddForm ? (
            <AddTaskForm onAdd={addTask} onCancel={() => setShowAddForm(false)} />
          ) : (
            <button onClick={() => setShowAddForm(true)}
              style={{ width: '100%', padding: '11px', borderRadius: 10, border: '0.5px dashed #b4b2a9', background: 'transparent', fontSize: 14, color: '#888780', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Agregar tarea
            </button>
          )}
        </>
      )}

      {view === 'weekly' && (
        <WeeklySummary collaboratorId={collaborator.id} collaboratorName={collaborator.name} />
      )}

    </div>
  )
}
