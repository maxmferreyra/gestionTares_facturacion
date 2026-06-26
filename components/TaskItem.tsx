'use client'
import { useState } from 'react'
import type { Task } from '@/lib/types'
import { HOURS, MINUTES, calcDuration, formatDuration } from '@/lib/types'
import { tagStyleFixed } from '@/lib/tasks-config'

interface Props {
  task: Task
  onUpdate: (id: string, fields: Partial<Task>) => void
  onDelete: (id: string) => void
}

export default function TaskItem({ task, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [startH, setStartH] = useState(task.start_time?.slice(0, 2) || '09')
  const [startM, setStartM] = useState(task.start_time?.slice(3, 5) || '00')
  const [endH, setEndH] = useState(task.end_time?.slice(0, 2) || '10')
  const [endM, setEndM] = useState(task.end_time?.slice(3, 5) || '00')
  const [notes, setNotes] = useState(task.notes || '')
  const [editError, setEditError] = useState('')

  const font = { fontFamily: 'Montserrat, sans-serif' }
  const tc = tagStyleFixed(task.tag)
  const startTime = `${startH}:${startM}`
  const endTime = `${endH}:${endM}`
  const editDuration = calcDuration(startTime, endTime)
  const displayDuration = task.start_time && task.end_time ? formatDuration(task.start_time, task.end_time) : null
  const selectStyle = { padding: '5px 7px', borderRadius: 7, border: '0.5px solid var(--border)', fontSize: 13, outline: 'none', background: 'var(--input-bg)', color: 'var(--text)', cursor: 'pointer', ...font }

  function saveEdit() {
    setEditError('')
    if (!editDuration) { setEditError('El fin debe ser posterior al inicio'); return }
    onUpdate(task.id, { title, start_time: startTime, end_time: endTime, notes })
    setEditing(false)
  }

  if (editing) {
    return (
      <div style={{ background: 'var(--card)', borderRadius: 12, border: '0.5px solid var(--brand-soft)', padding: '12px 14px', marginBottom: 8, ...font }}>
        <input value={title} onChange={e => setTitle(e.target.value)}
          style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '0.5px solid var(--border)', fontSize: 14, marginBottom: 10, outline: 'none', background: 'var(--input-bg)', color: 'var(--text)', ...font }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Inicio</label>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <select value={startH} onChange={e => setStartH(e.target.value)} style={{ ...selectStyle, flex: 1 }}>{HOURS.map(h => <option key={h}>{h}</option>)}</select>
              <span style={{ color: 'var(--text3)' }}>:</span>
              <select value={startM} onChange={e => setStartM(e.target.value)} style={{ ...selectStyle, flex: 1 }}>{MINUTES.map(m => <option key={m}>{m}</option>)}</select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Fin</label>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <select value={endH} onChange={e => setEndH(e.target.value)} style={{ ...selectStyle, flex: 1 }}>{HOURS.map(h => <option key={h}>{h}</option>)}</select>
              <span style={{ color: 'var(--text3)' }}>:</span>
              <select value={endM} onChange={e => setEndM(e.target.value)} style={{ ...selectStyle, flex: 1 }}>{MINUTES.map(m => <option key={m}>{m}</option>)}</select>
            </div>
          </div>
        </div>
        {editDuration
          ? <div style={{ fontSize: 11, color: '#3B6D11', background: '#EAF3DE', padding: '3px 8px', borderRadius: 20, display: 'inline-block', marginBottom: 8 }}>Duración: {formatDuration(startTime, endTime)}</div>
          : <div style={{ fontSize: 11, color: '#A32D2D', background: '#FCEBEB', padding: '3px 8px', borderRadius: 20, display: 'inline-block', marginBottom: 8 }}>El fin debe ser posterior al inicio</div>}
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas (opcional)"
          rows={2} style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '0.5px solid var(--border)', fontSize: 13, outline: 'none', resize: 'vertical', marginBottom: 8, display: 'block', background: 'var(--input-bg)', color: 'var(--text)', ...font }} />
        {editError && <div style={{ fontSize: 12, color: '#A32D2D', marginBottom: 8 }}>{editError}</div>}
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={saveEdit} style={{ flex: 1, padding: '7px', borderRadius: 7, border: 'none', background: 'var(--brand)', color: 'white', fontSize: 13, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, ...font }}>
            <i className="ti ti-device-floppy" style={{ fontSize: 14 }} /> Guardar
          </button>
          <button onClick={() => setEditing(false)} style={{ padding: '7px 12px', borderRadius: 7, border: '0.5px solid var(--border)', background: 'transparent', fontSize: 13, cursor: 'pointer', color: 'var(--text3)', ...font }}>
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--card)', borderRadius: 12, border: '0.5px solid var(--border)', padding: '10px 14px', marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 10, ...font }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 5 }}>{task.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {task.start_time && task.end_time && (
            <span style={{ fontSize: 11, color: 'var(--brand)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
              <i className="ti ti-clock" style={{ fontSize: 11 }} />{task.start_time.slice(0, 5)} – {task.end_time.slice(0, 5)}
            </span>
          )}
          {displayDuration && <span style={{ fontSize: 11, background: '#EAF3DE', color: '#3B6D11', padding: '1px 7px', borderRadius: 20, fontWeight: 600 }}>{displayDuration}</span>}
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: tc.bg, color: tc.color, fontWeight: 500 }}>{task.tag}</span>
          {task.systems?.length > 0 && task.systems.map(s => (
            <span key={s} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 6, background: '#E6F1FB', color: '#185FA5', fontWeight: 500 }}>{s}</span>
          ))}
          {task.notes && <span style={{ fontSize: 11, color: 'var(--text4)', display: 'flex', alignItems: 'center', gap: 3 }} title={task.notes}><i className="ti ti-note" style={{ fontSize: 11 }} /> nota</span>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={() => setEditing(true)} style={{ padding: '5px 8px', borderRadius: 6, border: '0.5px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text3)', display: 'flex', alignItems: 'center' }}>
          <i className="ti ti-pencil" style={{ fontSize: 14 }} />
        </button>
        <button onClick={() => onDelete(task.id)} style={{ padding: '5px 8px', borderRadius: 6, border: '0.5px solid var(--border)', background: 'transparent', cursor: 'pointer', color: '#e24b4a', display: 'flex', alignItems: 'center' }}>
          <i className="ti ti-trash" style={{ fontSize: 14 }} />
        </button>
      </div>
    </div>
  )
}
