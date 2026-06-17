'use client'
import { useState } from 'react'
import { HOURS, MINUTES, calcDuration, formatDuration } from '@/lib/types'
import { TASK_OPTIONS, TASK_SYSTEMS, TASK_TAGS, tagStyleFixed } from '@/lib/tasks-config'

interface Props {
  onAdd: (data: { title: string; start_time: string; end_time: string; systems: string[]; tag: string; notes: string }) => void
  onCancel: () => void
}

export default function AddTaskForm({ onAdd, onCancel }: Props) {
  const [title, setTitle] = useState('')
  const [titleSearch, setTitleSearch] = useState('')
  const [showTaskList, setShowTaskList] = useState(false)
  const [startH, setStartH] = useState('09')
  const [startM, setStartM] = useState('00')
  const [endH, setEndH] = useState('10')
  const [endM, setEndM] = useState('00')
  const [selectedSystems, setSelectedSystems] = useState<string[]>([])
  const [selectedTag, setSelectedTag] = useState(TASK_TAGS[0])
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const startTime = `${startH}:${startM}`
  const endTime = `${endH}:${endM}`
  const duration = calcDuration(startTime, endTime)
  const durationLabel = duration ? formatDuration(startTime, endTime) : null

  const filteredTasks = titleSearch.trim()
    ? TASK_OPTIONS.filter(t => t.toLowerCase().includes(titleSearch.toLowerCase()))
    : TASK_OPTIONS

  function toggleSystem(name: string) {
    setSelectedSystems(prev => prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name])
  }

  function selectTask(t: string) {
    setTitle(t)
    setTitleSearch(t)
    setShowTaskList(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!title.trim()) { setError('Seleccioná una tarea'); return }
    if (!duration) { setError('El horario de fin debe ser posterior al de inicio'); return }
    onAdd({ title: title.trim(), start_time: startTime, end_time: endTime, systems: selectedSystems, tag: selectedTag, notes })
  }

  const font = { fontFamily: 'Montserrat, sans-serif' }
  const selectStyle = { padding: '7px 9px', borderRadius: 8, border: '0.5px solid var(--border)', fontSize: 14, outline: 'none', background: 'var(--input-bg)', color: 'var(--text)', cursor: 'pointer', ...font }

  return (
    <div style={{ background: 'var(--card)', borderRadius: 12, border: '0.5px solid #AFA9EC', padding: '16px', marginBottom: 8, ...font }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#534AB7', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
        <i className="ti ti-plus" style={{ fontSize: 15 }} /> Nueva tarea
      </div>

      <form onSubmit={handleSubmit}>
        {/* Task selector with search */}
        <div style={{ marginBottom: 12, position: 'relative' }}>
          <label style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
            <i className="ti ti-clipboard-list" style={{ fontSize: 13 }} /> Tarea
          </label>
          <input
            value={titleSearch}
            onChange={e => { setTitleSearch(e.target.value); setShowTaskList(true); setTitle('') }}
            onFocus={() => setShowTaskList(true)}
            placeholder="Buscá y seleccioná una tarea..."
            style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: `0.5px solid ${title ? '#1D9E75' : 'var(--border)'}`, fontSize: 14, outline: 'none', background: 'var(--input-bg)', color: 'var(--text)', ...font }}
          />
          {title && (
            <i className="ti ti-circle-check-filled" style={{ position: 'absolute', right: 12, top: 34, fontSize: 16, color: '#1D9E75' }} />
          )}
          {showTaskList && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--card)', border: '0.5px solid var(--border)', borderRadius: '0 0 8px 8px', maxHeight: 220, overflowY: 'auto', zIndex: 30, boxShadow: '0 4px 16px rgba(0,0,0,.1)' }}>
              {filteredTasks.length > 0 ? filteredTasks.map(t => (
                <button key={t} type="button" onClick={() => selectTask(t)}
                  style={{ display: 'block', width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: 'var(--text)', ...font }}
                  onMouseOver={e => (e.currentTarget.style.background = 'var(--hover)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                  {t}
                </button>
              )) : (
                <div style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text4)' }}>Sin coincidencias</div>
              )}
            </div>
          )}
        </div>

        {/* Time selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
              <i className="ti ti-player-play" style={{ fontSize: 12 }} /> Inicio
            </label>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              <select value={startH} onChange={e => setStartH(e.target.value)} style={{ ...selectStyle, flex: 1 }}>{HOURS.map(h => <option key={h}>{h}</option>)}</select>
              <span style={{ color: 'var(--text3)', fontWeight: 600 }}>:</span>
              <select value={startM} onChange={e => setStartM(e.target.value)} style={{ ...selectStyle, flex: 1 }}>{MINUTES.map(m => <option key={m}>{m}</option>)}</select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
              <i className="ti ti-player-stop" style={{ fontSize: 12 }} /> Fin
            </label>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              <select value={endH} onChange={e => setEndH(e.target.value)} style={{ ...selectStyle, flex: 1 }}>{HOURS.map(h => <option key={h}>{h}</option>)}</select>
              <span style={{ color: 'var(--text3)', fontWeight: 600 }}>:</span>
              <select value={endM} onChange={e => setEndM(e.target.value)} style={{ ...selectStyle, flex: 1 }}>{MINUTES.map(m => <option key={m}>{m}</option>)}</select>
            </div>
          </div>
        </div>

        {/* Duration */}
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

        {/* Sistema — fijos */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
            <i className="ti ti-server" style={{ fontSize: 12 }} /> Sistema
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {TASK_SYSTEMS.map(s => (
              <button key={s} type="button" onClick={() => toggleSystem(s)}
                style={{ padding: '5px 11px', borderRadius: 20, border: `1.5px solid ${selectedSystems.includes(s) ? '#534AB7' : 'var(--border)'}`, background: selectedSystems.includes(s) ? '#CECBF6' : 'var(--card)', color: selectedSystems.includes(s) ? '#3C3489' : 'var(--text2)', fontSize: 12, fontWeight: 500, cursor: 'pointer', ...font }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Etiqueta — fijas */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
            <i className="ti ti-tag" style={{ fontSize: 12 }} /> Etiqueta
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {TASK_TAGS.map(t => {
              const ts = tagStyleFixed(t)
              const active = selectedTag === t
              return (
                <button key={t} type="button" onClick={() => setSelectedTag(t)}
                  style={{ padding: '5px 11px', borderRadius: 20, border: `1.5px solid ${active ? ts.color : 'var(--border)'}`, background: active ? ts.bg : 'var(--card)', color: active ? ts.color : 'var(--text2)', fontSize: 12, fontWeight: 500, cursor: 'pointer', ...font }}>
                  {t}
                </button>
              )
            })}
          </div>
        </div>

        {/* Notas */}
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas opcionales..."
          rows={2}
          style={{ width: '100%', padding: '7px 11px', borderRadius: 8, border: '0.5px solid var(--border)', fontSize: 13, outline: 'none', resize: 'vertical', marginBottom: 12, background: 'var(--input-bg)', color: 'var(--text)', ...font }} />

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
            style={{ padding: '9px 14px', borderRadius: 9, border: '0.5px solid var(--border)', background: 'transparent', fontSize: 14, cursor: 'pointer', color: 'var(--text3)', ...font }}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
