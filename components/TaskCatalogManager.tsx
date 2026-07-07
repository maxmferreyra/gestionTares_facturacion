'use client'
import { useEffect, useState } from 'react'

const font = { fontFamily: 'Montserrat, sans-serif' }

interface Task { id: string; name: string }

export default function TaskCatalogManager() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)

  async function fetchTasks() {
    setLoading(true)
    const res = await fetch('/api/catalog', { cache: 'no-store' })
    const data = await res.json()
    setTasks(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { fetchTasks() }, [])

  async function addTask(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (!newName.trim()) { setError('Ingresá un nombre'); return }
    setAdding(true)
    const res = await fetch('/api/catalog', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    const data = await res.json()
    setAdding(false)
    if (!res.ok) { setError(data.error || 'Error al agregar'); return }
    setNewName('')
    fetchTasks()
  }

  async function removeTask(id: string) {
    await fetch(`/api/catalog/${id}`, { method: 'DELETE' })
    setTasks(prev => prev.filter(t => t.id !== id))
    setConfirmId(null)
  }

  const inp = { width: '100%', padding: '8px 11px', borderRadius: 8, border: '0.5px solid var(--border)', fontSize: 13, outline: 'none', background: 'var(--input-bg)', color: 'var(--text)', ...font }

  return (
    <div style={font}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>
        {tasks.length} tareas en el catálogo
      </div>

      <form onSubmit={addTask} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nombre de la tarea nueva..." style={{ ...inp, flex: 1 }} />
        <button type="submit" disabled={adding}
          style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: adding ? 0.7 : 1, ...font, whiteSpace: 'nowrap' }}>
          + Agregar
        </button>
      </form>
      {error && <div style={{ fontSize: 12, color: 'var(--error)', background: 'var(--error-bg)', padding: '6px 10px', borderRadius: 7, marginBottom: 12 }}>{error}</div>}

      {loading ? (
        <div style={{ color: 'var(--text4)', fontSize: 13, padding: '1rem 0' }}>Cargando...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 420, overflowY: 'auto' }}>
          {tasks.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--card)', borderRadius: 9, border: '0.5px solid var(--border)', padding: '9px 12px' }}>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>{t.name}</span>
              {confirmId === t.id ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--error)', fontWeight: 500 }}>¿Quitar?</span>
                  <button onClick={() => removeTask(t.id)} style={{ padding: '3px 9px', borderRadius: 6, border: 'none', background: 'var(--error)', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Sí</button>
                  <button onClick={() => setConfirmId(null)} style={{ padding: '3px 9px', borderRadius: 6, border: '0.5px solid var(--border)', background: 'transparent', fontSize: 11, cursor: 'pointer', color: 'var(--text3)' }}>No</button>
                </div>
              ) : (
                <button onClick={() => setConfirmId(t.id)} style={{ border: 'none', background: 'transparent', color: 'var(--text4)', cursor: 'pointer', fontSize: 13, padding: 4 }}>
                  <i className="ti ti-trash" style={{ fontSize: 14 }} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 12, lineHeight: 1.5, display: 'flex', gap: 6 }}>
        <i className="ti ti-info-circle" style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }} />
        <span>Quitar una tarea no borra el historial — solo desaparece del desplegable para nuevas entradas.</span>
      </div>
    </div>
  )
}
