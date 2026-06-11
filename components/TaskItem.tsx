'use client'
import { useState } from 'react'
import type { Task } from '@/lib/types'

const DEFAULT_TAGS = ['General', 'Urgente', 'Reunión', 'Informe', 'Soporte', 'Cierre']

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  General:  { bg: '#F1EFE8', color: '#444441' },
  Urgente:  { bg: '#FAEEDA', color: '#854F0B' },
  Reunión:  { bg: '#CECBF6', color: '#3C3489' },
  Informe:  { bg: '#E6F1FB', color: '#185FA5' },
  Soporte:  { bg: '#EAF3DE', color: '#3B6D11' },
  Cierre:   { bg: '#FBEAF0', color: '#72243E' },
}

function tagStyle(tag: string) {
  return TAG_COLORS[tag] || { bg: '#F1EFE8', color: '#444441' }
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
  const [showNewTag, setShowNewTag] = useState(false)
  const [newTagInput, setNewTagInput] = useState('')
  const [customTags, setCustomTags] = useState<string[]>([])

  const allTags = [...DEFAULT_TAGS, ...customTags]
  const font = { fontFamily: 'Montserrat, sans-serif' }
  const tc = tagStyle(task.tag)

  function addCustomTag() {
    const t = newTagInput.trim()
    if (t && !allTags.includes(t)) { setCustomTags(p => [...p, t]); setTag(t) }
    setNewTagInput(''); setShowNewTag(false)
  }

  function saveEdit() {
    onUpdate(task.id, { title, hours, tag, notes })
    setEditing(false)
  }

  if (editing) {
    return (
      <div style={{ background: 'white', borderRadius: 12, border: '0.5px solid #AFA9EC', padding: '12px 14px', marginBottom: 8, ...font }}>
        <input value={title} onChange={e => setTitle(e.target.value)}
          style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '0.5px solid #d3d1c7', fontSize: 14, marginBottom: 8, outline: 'none', ...font }} />
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: '#888780', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3, fontWeight: 500 }}>
              <i className="ti ti-hourglass" style={{ fontSize: 12 }} /> Horas
            </label>
            <input type="number" value={hours} onChange={e => setHours(Number(e.target.value))} min={0} max={24} step={0.5}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 7, border: '0.5px solid #d3d1c7', fontSize: 14, outline: 'none', ...font }} />
          </div>
          <div style={{ flex: 2 }}>
            <label style={{ fontSize: 11, color: '#888780', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3, fontWeight: 500 }}>
              <i className="ti ti-tag" style={{ fontSize: 12 }} /> Etiqueta
            </label>
            <div style={{ display: 'flex', gap: 5 }}>
              <select value={tag} onChange={e => setTag(e.target.value)}
                style={{ flex: 1, padding: '6px 8px', borderRadius: 7, border: '0.5px solid #d3d1c7', fontSize: 14, outline: 'none', background: 'white', ...font }}>
                {allTags.map(t => <option key={t}>{t}</option>)}
              </select>
              <button type="button" onClick={() => setShowNewTag(v => !v)}
                style={{ padding: '6px 9px', borderRadius: 7, border: '0.5px solid #d3d1c7', background: showNewTag ? '#CECBF6' : 'white', cursor: 'pointer', color: '#534AB7' }}>
                <i className="ti ti-tag-plus" style={{ fontSize: 14 }} />
              </button>
            </div>
          </div>
        </div>
        {showNewTag && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <input value={newTagInput} onChange={e => setNewTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag() } }}
              placeholder="Nueva etiqueta" autoFocus
              style={{ flex: 1, padding: '6px 10px', borderRadius: 7, border: '0.5px solid #AFA9EC', fontSize: 13, outline: 'none', ...font }} />
            <button type="button" onClick={addCustomTag}
              style={{ padding: '6px 12px', borderRadius: 7, border: 'none', background: '#534AB7', color: 'white', fontSize: 12, cursor: 'pointer', ...font }}>
              OK
            </button>
          </div>
        )}
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas (opcional)"
          rows={2} style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '0.5px solid #d3d1c7', fontSize: 13, outline: 'none', resize: 'vertical', marginBottom: 8, ...font }} />
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={saveEdit}
            style={{ flex: 1, padding: '7px', borderRadius: 7, border: 'none', background: '#534AB7', color: 'white', fontSize: 13, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, ...font }}>
            <i className="ti ti-device-floppy" style={{ fontSize: 14 }} /> Guardar
          </button>
          <button onClick={() => setEditing(false)}
            style={{ padding: '7px 12px', borderRadius: 7, border: '0.5px solid #d3d1c7', background: 'transparent', fontSize: 13, cursor: 'pointer', color: '#888780', ...font }}>
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'white', borderRadius: 12, border: '0.5px solid #e5e3db', padding: '10px 14px', marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 10, opacity: task.completed ? 0.65 : 1, ...font }}>
      <button onClick={() => onToggle(task.id, !task.completed)}
        style={{ width: 20, height: 20, borderRadius: '50%', border: task.completed ? 'none' : '1.5px solid #d3d1c7', background: task.completed ? '#1D9E75' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginTop: 2 }}>
        {task.completed && <i className="ti ti-check" style={{ fontSize: 11, color: 'white' }} />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: task.completed ? '#b4b2a9' : '#1a1a18', textDecoration: task.completed ? 'line-through' : 'none', marginBottom: 5 }}>
          {task.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: tc.bg, color: tc.color, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}>
            <i className="ti ti-tag" style={{ fontSize: 11 }} /> {task.tag}
          </span>
          {task.hours > 0 && (
            <span style={{ fontSize: 11, color: '#888780', display: 'flex', alignItems: 'center', gap: 3 }}>
              <i className="ti ti-hourglass" style={{ fontSize: 11 }} /> {task.hours}h
            </span>
          )}
          {task.notes && (
            <span style={{ fontSize: 11, color: '#b4b2a9', display: 'flex', alignItems: 'center', gap: 3 }} title={task.notes}>
              <i className="ti ti-note" style={{ fontSize: 11 }} /> nota
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={() => setEditing(true)}
          style={{ padding: '5px 8px', borderRadius: 6, border: '0.5px solid #e5e3db', background: 'transparent', cursor: 'pointer', color: '#888780', display: 'flex', alignItems: 'center' }}>
          <i className="ti ti-pencil" style={{ fontSize: 14 }} />
        </button>
        <button onClick={() => onDelete(task.id)}
          style={{ padding: '5px 8px', borderRadius: 6, border: '0.5px solid #e5e3db', background: 'transparent', cursor: 'pointer', color: '#e24b4a', display: 'flex', alignItems: 'center' }}>
          <i className="ti ti-trash" style={{ fontSize: 14 }} />
        </button>
      </div>
    </div>
  )
}
