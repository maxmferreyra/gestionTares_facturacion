'use client'
import { useState } from 'react'

const DEFAULT_TAGS = ['General', 'Urgente', 'Reunión', 'Informe', 'Soporte', 'Cierre']

interface Props {
  onAdd: (data: { title: string; hours: number; tag: string; notes: string }) => void
  onCancel: () => void
}

export default function AddTaskForm({ onAdd, onCancel }: Props) {
  const [title, setTitle] = useState('')
  const [hours, setHours] = useState(0)
  const [tag, setTag] = useState('General')
  const [notes, setNotes] = useState('')
  const [customTags, setCustomTags] = useState<string[]>([])
  const [showNewTag, setShowNewTag] = useState(false)
  const [newTagInput, setNewTagInput] = useState('')

  const allTags = [...DEFAULT_TAGS, ...customTags]

  function addCustomTag() {
    const t = newTagInput.trim()
    if (t && !allTags.includes(t)) {
      setCustomTags(prev => [...prev, t])
      setTag(t)
    }
    setNewTagInput('')
    setShowNewTag(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    onAdd({ title: title.trim(), hours, tag, notes })
  }

  const font = { fontFamily: 'Montserrat, sans-serif' }

  return (
    <div style={{ background: 'white', borderRadius: 12, border: '0.5px solid #AFA9EC', padding: '14px', marginBottom: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#534AB7', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, ...font }}>
        <i className="ti ti-plus" style={{ fontSize: 15 }} /> Nueva tarea
      </div>
      <form onSubmit={handleSubmit}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="¿Qué vas a hacer?"
          autoFocus
          style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '0.5px solid #d3d1c7', fontSize: 14, marginBottom: 10, outline: 'none', ...font }} />

        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: '#888780', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4, fontWeight: 500, ...font }}>
              <i className="ti ti-hourglass" style={{ fontSize: 13 }} /> Horas
            </label>
            <input type="number" value={hours} onChange={e => setHours(Number(e.target.value))} min={0} max={24} step={0.5}
              style={{ width: '100%', padding: '7px 9px', borderRadius: 8, border: '0.5px solid #d3d1c7', fontSize: 14, outline: 'none', ...font }} />
          </div>
          <div style={{ flex: 2 }}>
            <label style={{ fontSize: 11, color: '#888780', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4, fontWeight: 500, ...font }}>
              <i className="ti ti-tag" style={{ fontSize: 13 }} /> Etiqueta
            </label>
            <div style={{ display: 'flex', gap: 5 }}>
              <select value={tag} onChange={e => setTag(e.target.value)}
                style={{ flex: 1, padding: '7px 9px', borderRadius: 8, border: '0.5px solid #d3d1c7', fontSize: 14, outline: 'none', background: 'white', ...font }}>
                {allTags.map(t => <option key={t}>{t}</option>)}
              </select>
              <button type="button" onClick={() => setShowNewTag(v => !v)} title="Nueva etiqueta"
                style={{ padding: '7px 10px', borderRadius: 8, border: '0.5px solid #d3d1c7', background: showNewTag ? '#CECBF6' : 'white', cursor: 'pointer', color: '#534AB7', display: 'flex', alignItems: 'center' }}>
                <i className="ti ti-tag-plus" style={{ fontSize: 15 }} />
              </button>
            </div>
          </div>
        </div>

        {showNewTag && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <input value={newTagInput} onChange={e => setNewTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag() } }}
              placeholder="Nombre de la nueva etiqueta"
              autoFocus
              style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '0.5px solid #AFA9EC', fontSize: 13, outline: 'none', ...font }} />
            <button type="button" onClick={addCustomTag}
              style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: '#534AB7', color: 'white', fontSize: 13, cursor: 'pointer', fontWeight: 500, ...font }}>
              Agregar
            </button>
          </div>
        )}

        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas opcionales..."
          rows={2}
          style={{ width: '100%', padding: '7px 11px', borderRadius: 8, border: '0.5px solid #d3d1c7', fontSize: 13, outline: 'none', resize: 'vertical', marginBottom: 10, ...font }} />

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit"
            style={{ flex: 1, padding: '9px', borderRadius: 9, border: 'none', background: '#534AB7', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, ...font }}>
            <i className="ti ti-check" style={{ fontSize: 15 }} /> Agregar
          </button>
          <button type="button" onClick={onCancel}
            style={{ padding: '9px 14px', borderRadius: 9, border: '0.5px solid #d3d1c7', background: 'transparent', fontSize: 14, cursor: 'pointer', color: '#888780', display: 'flex', alignItems: 'center', gap: 6, ...font }}>
            <i className="ti ti-x" style={{ fontSize: 15 }} /> Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
