'use client'
import { useState } from 'react'
import type { Tag } from '@/lib/types'
import { TAGS } from '@/lib/types'

interface Props {
  onAdd: (data: { title: string; hours: number; tag: Tag; notes: string }) => void
  onCancel: () => void
}

export default function AddTaskForm({ onAdd, onCancel }: Props) {
  const [title, setTitle] = useState('')
  const [hours, setHours] = useState(0)
  const [tag, setTag] = useState<Tag>('General')
  const [notes, setNotes] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    onAdd({ title: title.trim(), hours, tag, notes })
  }

  return (
    <div style={{ background: 'white', borderRadius: 12, border: '0.5px solid #AFA9EC', padding: '14px', marginBottom: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: '#534AB7', marginBottom: 10 }}>Nueva tarea</div>
      <form onSubmit={handleSubmit}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="¿Qué vas a hacer?"
          autoFocus
          style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '0.5px solid #d3d1c7', fontSize: 14, marginBottom: 10, outline: 'none' }} />

        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: '#888780', display: 'block', marginBottom: 4 }}>Horas estimadas</label>
            <input type="number" value={hours} onChange={e => setHours(Number(e.target.value))} min={0} max={24} step={0.5}
              style={{ width: '100%', padding: '7px 9px', borderRadius: 8, border: '0.5px solid #d3d1c7', fontSize: 14, outline: 'none' }} />
          </div>
          <div style={{ flex: 2 }}>
            <label style={{ fontSize: 11, color: '#888780', display: 'block', marginBottom: 4 }}>Etiqueta</label>
            <select value={tag} onChange={e => setTag(e.target.value as Tag)}
              style={{ width: '100%', padding: '7px 9px', borderRadius: 8, border: '0.5px solid #d3d1c7', fontSize: 14, outline: 'none', background: 'white' }}>
              {TAGS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas opcionales..."
          rows={2}
          style={{ width: '100%', padding: '7px 11px', borderRadius: 8, border: '0.5px solid #d3d1c7', fontSize: 13, outline: 'none', resize: 'vertical', marginBottom: 10 }} />

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit"
            style={{ flex: 1, padding: '9px', borderRadius: 9, border: 'none', background: '#534AB7', color: 'white', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            Agregar
          </button>
          <button type="button" onClick={onCancel}
            style={{ padding: '9px 14px', borderRadius: 9, border: '0.5px solid #d3d1c7', background: 'transparent', fontSize: 14, cursor: 'pointer', color: '#888780' }}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
