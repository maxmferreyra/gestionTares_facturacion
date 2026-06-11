'use client'
import { useState } from 'react'
import type { Task } from '@/lib/types'
import { TAGS } from '@/lib/types'

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  General:  { bg: '#F1EFE8', color: '#444441' },
  Urgente:  { bg: '#FAEEDA', color: '#854F0B' },
  Reunión:  { bg: '#CECBF6', color: '#3C3489' },
  Informe:  { bg: '#E6F1FB', color: '#185FA5' },
  Soporte:  { bg: '#EAF3DE', color: '#3B6D11' },
  Cierre:   { bg: '#FBEAF0', color: '#72243E' },
}

interface Props {
  task: Task
  onToggle: (id: string, completed: boolean) => void
  onUpdate: (id: string, fields: Partial<Task>) => void
  onDelete: (id: string) => void
}

export default function TaskItem({ task, onToggle, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [hours, setHours] = useState(task.hours)
  const [tag, setTag] = useState(task.tag)
  const [notes, setNotes] = useState(task.notes || '')

  function saveEdit() {
    onUpdate(task.id, { title, hours, tag, notes })
    setEditing(false)
  }

  const tc = TAG_COLORS[task.tag] || TAG_COLORS.General

  if (editing) {
    return (
      <div style={{ background: 'white', borderRadius: 12, border: '0.5px solid #AFA9EC', padding: '12px 14px', marginBottom: 8 }}>
        <input value={title} onChange={e => setTitle(e.target.value)}
          style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '0.5px solid #d3d1c7', fontSize: 14, marginBottom: 8, outline: 'none' }} />
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: '#888780', display: 'block', marginBottom: 3 }}>Horas</label>
            <input type="number" value={hours} onChange={e => setHours(Number(e.target.value))} min={0} max={24} step={0.5}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 7, border: '0.5px solid #d3d1c7', fontSize: 14, outline: 'none' }} />
          </div>
          <div style={{ flex: 2 }}>
            <label style={{ fontSize: 11, color: '#888780', display: 'block', marginBottom: 3 }}>Etiqueta</label>
            <select value={tag} onChange={e => setTag(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 7, border: '0.5px solid #d3d1c7', fontSize: 14, outline: 'none', background: 'white' }}>
              {TAGS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas (opcional)"
          rows={2} style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '0.5px solid #d3d1c7', fontSize: 13, outline: 'none', resize: 'vertical', marginBottom: 8 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={saveEdit}
            style={{ flex: 1, padding: '7px', borderRadius: 7, border: 'none', background: '#534AB7', color: 'white', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
            Guardar
          </button>
          <button onClick={() => setEditing(false)}
            style={{ padding: '7px 12px', borderRadius: 7, border: '0.5px solid #d3d1c7', background: 'transparent', fontSize: 13, cursor: 'pointer', color: '#888780' }}>
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'white', borderRadius: 12, border: '0.5px solid #e5e3db', padding: '10px 14px', marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 10, opacity: task.completed ? 0.7 : 1 }}>
      {/* Checkbox */}
      <button onClick={() => onToggle(task.id, !task.completed)}
        style={{ width: 20, height: 20, borderRadius: '50%', border: task.completed ? 'none' : '1.5px solid #d3d1c7', background: task.completed ? '#1D9E75' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginTop: 1 }}>
        {task.completed && <span style={{ color: 'white', fontSize: 11, lineHeight: 1 }}>✓</span>}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: task.completed ? '#b4b2a9' : '#1a1a18', textDecoration: task.completed ? 'line-through' : 'none', marginBottom: 4 }}>
          {task.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 6, background: tc.bg, color: tc.color, fontWeight: 500 }}>{task.tag}</span>
          {task.hours > 0 && <span style={{ fontSize: 11, color: '#888780' }}>{task.hours}h</span>}
          {task.notes && <span style={{ fontSize: 11, color: '#b4b2a9' }} title={task.notes}>📝</span>}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={() => setEditing(true)}
          style={{ padding: '4px 8px', borderRadius: 6, border: '0.5px solid #e5e3db', background: 'transparent', fontSize: 12, cursor: 'pointer', color: '#888780' }}>
          ✏️
        </button>
        <button onClick={() => onDelete(task.id)}
          style={{ padding: '4px 8px', borderRadius: 6, border: '0.5px solid #e5e3db', background: 'transparent', fontSize: 12, cursor: 'pointer', color: '#e24b4a' }}>
          ✕
        </button>
      </div>
    </div>
  )
}
