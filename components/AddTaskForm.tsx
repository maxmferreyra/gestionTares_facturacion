'use client'
import { useState, useEffect } from 'react'
import { HOURS, MINUTES, calcDuration, formatDuration } from '@/lib/types'

interface CatalogItem { id: string; name: string }

interface Props {
  onAdd: (data: { title: string; start_time: string; end_time: string; systems: string[]; tag: string; notes: string }) => void
  onCancel: () => void
}

export default function AddTaskForm({ onAdd, onCancel }: Props) {
  const [title, setTitle] = useState('')
  const [startH, setStartH] = useState('09')
  const [startM, setStartM] = useState('00')
  const [endH, setEndH] = useState('10')
  const [endM, setEndM] = useState('00')
  const [selectedSystems, setSelectedSystems] = useState<string[]>([])
  const [selectedTag, setSelectedTag] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const [systems, setSystems] = useState<CatalogItem[]>([])
  const [tags, setTags] = useState<CatalogItem[]>([])
  const [newSystem, setNewSystem] = useState('')
  const [newTag, setNewTag] = useState('')
  const [showAddSystem, setShowAddSystem] = useState(false)
  const [showAddTag, setShowAddTag] = useState(false)
  const [showDelSystem, setShowDelSystem] = useState(false)
  const [showDelTag, setShowDelTag] = useState(false)

  useEffect(() => {
    fetch('/api/catalog').then(r => r.json()).then(d => {
      setSystems(d.systems || [])
      setTags(d.tags || [])
      if (d.tags?.length) setSelectedTag(d.tags[0].name)
    })
  }, [])

  const startTime = `${startH}:${startM}`
  const endTime = `${endH}:${endM}`
  const duration = calcDuration(startTime, endTime)
  const durationLabel = duration ? formatDuration(startTime, endTime) : null

  function toggleSystem(name: string) {
    setSelectedSystems(prev => prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name])
  }

  async function addSystem() {
    if (!newSystem.trim()) return
    const res = await fetch('/api/catalog/systems', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newSystem }) })
    const data = await res.json()
    if (res.ok) { setSystems(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name))); setNewSystem(''); setShowAddSystem(false) }
  }

  async function deleteSystem(id: string, name: string) {
    await fetch('/api/catalog/systems', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setSystems(prev => prev.filter(s => s.id !== id))
    setSelectedSystems(prev => prev.filter(s => s !== name))
  }

  async function addTag() {
    if (!newTag.trim()) return
    const res = await fetch('/api/catalog/tags', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newTag }) })
    const data = await res.json()
    if (res.ok) { setTags(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name))); setNewTag(''); setShowAddTag(false) }
  }

  async function deleteTag(id: string, name: string) {
    await fetch('/api/catalog/tags', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setTags(prev => prev.filter(t => t.id !== id))
    if (selectedTag === name && tags.length > 1) setSelectedTag(tags.find(t => t.id !== id)?.name || '')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!title.trim()) { setError('Escribí el nombre de la tarea'); return }
    if (!duration) { setError('El horario de fin debe ser posterior al de inicio'); return }
    onAdd({ title: title.trim(), start_time: startTime, end_time: endTime, systems: selectedSystems, tag: selectedTag, notes })
  }

  const font = { fontFamily: 'Montserrat, sans-serif' }
  const selectStyle = { padding: '7px 9px', borderRadius: 8, border: '0.5px solid #d3d1c7', fontSize: 14, outline: 'none', background: 'white', cursor: 'pointer', ...font }
  const iconBtn = (active = false) => ({ padding: '6px 9px', borderRadius: 7, border: '0.5px solid #d3d1c7', background: active ? '#CECBF6' : 'white', cursor: 'pointer', color: '#534AB7', display: 'flex', alignItems: 'center' as const })

  return (
    <div style={{ background: 'white', borderRadius: 12, border: '0.5px solid #AFA9EC', padding: '16px', marginBottom: 8, ...font }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#534AB7', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
        <i className="ti ti-plus" style={{ fontSize: 15 }} /> Nueva tarea
      </div>

      <form onSubmit={handleSubmit}>
        {/* Title */}
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="¿Qué hiciste?"
          autoFocus
          style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '0.5px solid #d3d1c7', fontSize: 14, marginBottom: 12, outline: 'none', ...font }} />

        {/* Time selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          {/* Start time */}
          <div>
            <label style={{ fontSize: 11, color: '#888780', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
              <i className="ti ti-player-play" style={{ fontSize: 12 }} /> Inicio
            </label>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              <select value={startH} onChange={e => setStartH(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
                {HOURS.map(h => <option key={h}>{h}</option>)}
              </select>
              <span style={{ color: '#888780', fontWeight: 600 }}>:</span>
              <select value={startM} onChange={e => setStartM(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
                {MINUTES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          {/* End time */}
          <div>
            <label style={{ fontSize: 11, color: '#888780', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
              <i className="ti ti-player-stop" style={{ fontSize: 12 }} /> Fin
            </label>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              <select value={endH} onChange={e => setEndH(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
                {HOURS.map(h => <option key={h}>{h}</option>)}
              </select>
              <span style={{ color: '#888780', fontWeight: 600 }}>:</span>
              <select value={endM} onChange={e => setEndM(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
                {MINUTES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Duration preview */}
        <div style={{ marginBottom: 12, height: 28, display: 'flex', alignItems: 'center' }}>
          {durationLabel ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EAF3DE', color: '#3B6D11', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20 }}>
              <i className="ti ti-clock-check" style={{ fontSize: 13 }} /> Duración: {durationLabel}
            </div>
          ) : (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FCEBEB', color: '#A32D2D', fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 20 }}>
              <i className="ti ti-alert-circle" style={{ fontSize: 13 }} /> El fin debe ser posterior al inicio
            </div>
          )}
        </div>

        {/* Sistema */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ fontSize: 11, color: '#888780', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="ti ti-server" style={{ fontSize: 12 }} /> Sistema
            </label>
            <div style={{ display: 'flex', gap: 5 }}>
              <button type="button" onClick={() => { setShowAddSystem(v => !v); setShowDelSystem(false) }} style={iconBtn(showAddSystem)}>
                <i className="ti ti-plus" style={{ fontSize: 13 }} />
              </button>
              <button type="button" onClick={() => { setShowDelSystem(v => !v); setShowAddSystem(false) }} style={iconBtn(showDelSystem)}>
                <i className="ti ti-trash" style={{ fontSize: 13 }} />
              </button>
            </div>
          </div>
          {showAddSystem && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input value={newSystem} onChange={e => setNewSystem(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSystem() } }}
                placeholder="Nombre del sistema" autoFocus
                style={{ flex: 1, padding: '6px 10px', borderRadius: 7, border: '0.5px solid #AFA9EC', fontSize: 13, outline: 'none', ...font }} />
              <button type="button" onClick={addSystem}
                style={{ padding: '6px 12px', borderRadius: 7, border: 'none', background: '#534AB7', color: 'white', fontSize: 12, cursor: 'pointer', fontWeight: 600, ...font }}>
                Agregar
              </button>
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {systems.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button type="button" onClick={() => toggleSystem(s.name)}
                  style={{ padding: '4px 10px', borderRadius: 20, border: `1.5px solid ${selectedSystems.includes(s.name) ? '#534AB7' : '#d3d1c7'}`, background: selectedSystems.includes(s.name) ? '#CECBF6' : 'white', color: selectedSystems.includes(s.name) ? '#3C3489' : '#5f5e5a', fontSize: 12, fontWeight: 500, cursor: 'pointer', ...font }}>
                  {s.name}
                </button>
                {showDelSystem && (
                  <button type="button" onClick={() => deleteSystem(s.id, s.name)}
                    style={{ width: 16, height: 16, borderRadius: '50%', border: 'none', background: '#e24b4a', color: 'white', fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: -2 }}>
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Etiqueta */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ fontSize: 11, color: '#888780', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="ti ti-tag" style={{ fontSize: 12 }} /> Etiqueta
            </label>
            <div style={{ display: 'flex', gap: 5 }}>
              <button type="button" onClick={() => { setShowAddTag(v => !v); setShowDelTag(false) }} style={iconBtn(showAddTag)}>
                <i className="ti ti-plus" style={{ fontSize: 13 }} />
              </button>
              <button type="button" onClick={() => { setShowDelTag(v => !v); setShowAddTag(false) }} style={iconBtn(showDelTag)}>
                <i className="ti ti-trash" style={{ fontSize: 13 }} />
              </button>
            </div>
          </div>
          {showAddTag && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input value={newTag} onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                placeholder="Nombre de la etiqueta" autoFocus
                style={{ flex: 1, padding: '6px 10px', borderRadius: 7, border: '0.5px solid #AFA9EC', fontSize: 13, outline: 'none', ...font }} />
              <button type="button" onClick={addTag}
                style={{ padding: '6px 12px', borderRadius: 7, border: 'none', background: '#534AB7', color: 'white', fontSize: 12, cursor: 'pointer', fontWeight: 600, ...font }}>
                Agregar
              </button>
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {tags.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button type="button" onClick={() => setSelectedTag(t.name)}
                  style={{ padding: '4px 10px', borderRadius: 20, border: `1.5px solid ${selectedTag === t.name ? '#534AB7' : '#d3d1c7'}`, background: selectedTag === t.name ? '#CECBF6' : 'white', color: selectedTag === t.name ? '#3C3489' : '#5f5e5a', fontSize: 12, fontWeight: 500, cursor: 'pointer', ...font }}>
                  {t.name}
                </button>
                {showDelTag && (
                  <button type="button" onClick={() => deleteTag(t.id, t.name)}
                    style={{ width: 16, height: 16, borderRadius: '50%', border: 'none', background: '#e24b4a', color: 'white', fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: -2 }}>
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Notas */}
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas opcionales..."
          rows={2}
          style={{ width: '100%', padding: '7px 11px', borderRadius: 8, border: '0.5px solid #d3d1c7', fontSize: 13, outline: 'none', resize: 'vertical', marginBottom: 12, ...font }} />

        {error && (
          <div style={{ background: '#FCEBEB', color: '#A32D2D', fontSize: 12, padding: '7px 10px', borderRadius: 7, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="ti ti-alert-circle" style={{ fontSize: 14 }} /> {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit"
            style={{ flex: 1, padding: '9px', borderRadius: 9, border: 'none', background: '#534AB7', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, ...font }}>
            <i className="ti ti-check" style={{ fontSize: 15 }} /> Guardar tarea
          </button>
          <button type="button" onClick={onCancel}
            style={{ padding: '9px 14px', borderRadius: 9, border: '0.5px solid #d3d1c7', background: 'transparent', fontSize: 14, cursor: 'pointer', color: '#888780', ...font }}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
