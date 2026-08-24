'use client'
import { useEffect, useState } from 'react'

const font = { fontFamily: 'Montserrat, sans-serif' }

interface CTask {
  id: string
  task_key: string
  name: string
  unit: 'per_document' | 'minutes'
  unit_minutes: number
  standard_minutes: number
}

type UnitOption = 'per_document' | 'minutes'

const inp = { width: '100%', padding: '8px 11px', borderRadius: 8, border: '0.5px solid var(--border)', fontSize: 13, outline: 'none', background: 'var(--input-bg)', color: 'var(--text)', ...font }
const label = { fontSize: 11, color: 'var(--text3)', fontWeight: 500, display: 'block', marginBottom: 4 }

function unitLabel(t: { unit: string; unit_minutes: number }) {
  return t.unit === 'per_document' ? 'Por documento' : `1 = ${t.unit_minutes} min`
}

export default function CapacityCatalogManager() {
  const [tasks, setTasks] = useState<CTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Edición inline
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editUnit, setEditUnit] = useState<UnitOption>('per_document')
  const [editUnitMinutes, setEditUnitMinutes] = useState('1')
  const [editStandard, setEditStandard] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  // Alta de nueva tarea
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUnit, setNewUnit] = useState<UnitOption>('per_document')
  const [newUnitMinutes, setNewUnitMinutes] = useState('1')
  const [newStandard, setNewStandard] = useState('')
  const [addError, setAddError] = useState('')
  const [adding, setAdding] = useState(false)

  async function fetchTasks() {
    setLoading(true)
    const res = await fetch('/api/capacity-tasks', { cache: 'no-store' })
    const data = await res.json()
    setTasks(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { fetchTasks() }, [])

  function startEdit(t: CTask) {
    setEditId(t.id)
    setEditName(t.name)
    setEditUnit(t.unit)
    setEditUnitMinutes(String(t.unit_minutes))
    setEditStandard(String(t.standard_minutes))
    setError('')
  }
  function cancelEdit() { setEditId(null) }

  async function saveEdit(id: string) {
    setError('')
    if (!editName.trim()) { setError('Ingresá un nombre'); return }
    const unitMinutesNum = editUnit === 'per_document' ? 1 : parseFloat(editUnitMinutes)
    const standardNum = parseFloat(editStandard)
    if (isNaN(unitMinutesNum) || unitMinutesNum <= 0) { setError('Valor de unidad inválido'); return }
    if (isNaN(standardNum) || standardNum <= 0) { setError('Tiempo estándar inválido'); return }

    setSavingEdit(true)
    const res = await fetch(`/api/capacity-tasks/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim(), unit: editUnit, unit_minutes: unitMinutesNum, standard_minutes: standardNum }),
    })
    const data = await res.json()
    setSavingEdit(false)
    if (!res.ok) { setError(data.error || 'Error al guardar'); return }
    setTasks(prev => prev.map(t => t.id === id ? data : t))
    setEditId(null)
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    setAddError('')
    if (!newName.trim()) { setAddError('Ingresá un nombre'); return }
    const unitMinutesNum = newUnit === 'per_document' ? 1 : parseFloat(newUnitMinutes)
    const standardNum = parseFloat(newStandard)
    if (isNaN(unitMinutesNum) || unitMinutesNum <= 0) { setAddError('Valor de unidad inválido'); return }
    if (isNaN(standardNum) || standardNum <= 0) { setAddError('Tiempo estándar inválido'); return }

    setAdding(true)
    const res = await fetch('/api/capacity-tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), unit: newUnit, unit_minutes: unitMinutesNum, standard_minutes: standardNum }),
    })
    const data = await res.json()
    setAdding(false)
    if (!res.ok) { setAddError(data.error || 'Error al agregar'); return }
    setTasks(prev => [...prev, data])
    setNewName(''); setNewUnit('per_document'); setNewUnitMinutes('1'); setNewStandard('')
    setShowAdd(false)
  }

  return (
    <div style={font}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
        {tasks.length} tareas en Capacity
      </div>
      <div style={{ fontSize: 11, color: 'var(--text4)', marginBottom: 14, lineHeight: 1.5 }}>
        Editá el nombre, la unidad de medida y el tiempo estándar de cada tarea, o agregá tareas nuevas al catálogo de Capacity.
      </div>

      {/* Botón / form de alta */}
      {!showAdd ? (
        <button onClick={() => setShowAdd(true)}
          style={{ width: '100%', padding: '10px', borderRadius: 9, border: '0.5px dashed var(--text4)', background: 'transparent', fontSize: 13, color: 'var(--text3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 16, ...font, fontWeight: 500 }}>
          <i className="ti ti-plus" style={{ fontSize: 15 }} /> Agregar tarea a Capacity
        </button>
      ) : (
        <form onSubmit={addTask} style={{ background: 'var(--card)', borderRadius: 12, border: '0.5px solid var(--brand-soft)', padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-plus" style={{ fontSize: 14 }} /> Nueva tarea
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={label}>Nombre de la tarea</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej: Argentina - Tax base (WHT) correction" style={inp} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: newUnit === 'minutes' ? '1fr 1fr 1fr' : '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={label}>Unidad de medida</label>
              <select value={newUnit} onChange={e => setNewUnit(e.target.value as UnitOption)} style={{ ...inp, cursor: 'pointer' }}>
                <option value="per_document">Por documento</option>
                <option value="minutes">Bloque de minutos</option>
              </select>
            </div>
            {newUnit === 'minutes' && (
              <div>
                <label style={label}>1 toque = X min</label>
                <input value={newUnitMinutes} onChange={e => setNewUnitMinutes(e.target.value.replace(/[^\d.]/g, ''))} inputMode="decimal" style={inp} />
              </div>
            )}
            <div>
              <label style={label}>Tiempo estándar (min)</label>
              <input value={newStandard} onChange={e => setNewStandard(e.target.value.replace(/[^\d.]/g, ''))} inputMode="decimal" placeholder="Ej: 5" style={inp} />
            </div>
          </div>
          {addError && <div style={{ fontSize: 12, color: 'var(--error)', background: 'var(--error-bg)', padding: '6px 10px', borderRadius: 7, marginBottom: 10 }}>{addError}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={adding}
              style={{ flex: 1, padding: '9px', borderRadius: 9, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: adding ? 'not-allowed' : 'pointer', opacity: adding ? 0.7 : 1, ...font }}>
              {adding ? 'Guardando...' : 'Agregar'}
            </button>
            <button type="button" onClick={() => { setShowAdd(false); setAddError('') }}
              style={{ padding: '9px 14px', borderRadius: 9, border: '0.5px solid var(--border)', background: 'transparent', fontSize: 13, cursor: 'pointer', color: 'var(--text3)', ...font }}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {error && <div style={{ fontSize: 12, color: 'var(--error)', background: 'var(--error-bg)', padding: '6px 10px', borderRadius: 7, marginBottom: 12 }}>{error}</div>}

      {loading ? (
        <div style={{ color: 'var(--text4)', fontSize: 13, padding: '1rem 0' }}>Cargando...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tasks.map(t => (
            <div key={t.id} style={{ background: 'var(--card)', borderRadius: 10, border: '0.5px solid var(--border)', padding: '11px 13px' }}>
              {editId === t.id ? (
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <label style={label}>Nombre</label>
                    <input value={editName} onChange={e => setEditName(e.target.value)} style={inp} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: editUnit === 'minutes' ? '1fr 1fr 1fr' : '1fr 1fr', gap: 8, marginBottom: 10 }}>
                    <div>
                      <label style={label}>Unidad de medida</label>
                      <select value={editUnit} onChange={e => setEditUnit(e.target.value as UnitOption)} style={{ ...inp, cursor: 'pointer' }}>
                        <option value="per_document">Por documento</option>
                        <option value="minutes">Bloque de minutos</option>
                      </select>
                    </div>
                    {editUnit === 'minutes' && (
                      <div>
                        <label style={label}>1 toque = X min</label>
                        <input value={editUnitMinutes} onChange={e => setEditUnitMinutes(e.target.value.replace(/[^\d.]/g, ''))} inputMode="decimal" style={inp} />
                      </div>
                    )}
                    <div>
                      <label style={label}>Tiempo estándar (min)</label>
                      <input value={editStandard} onChange={e => setEditStandard(e.target.value.replace(/[^\d.]/g, ''))} inputMode="decimal" style={inp} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => saveEdit(t.id)} disabled={savingEdit}
                      style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: savingEdit ? 'not-allowed' : 'pointer', opacity: savingEdit ? 0.7 : 1, ...font }}>
                      {savingEdit ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button onClick={cancelEdit}
                      style={{ padding: '8px 12px', borderRadius: 8, border: '0.5px solid var(--border)', background: 'transparent', fontSize: 12.5, cursor: 'pointer', color: 'var(--text3)', ...font }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>{t.name}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: t.unit === 'per_document' ? 'var(--brand-tint)' : 'var(--warning-bg)', color: t.unit === 'per_document' ? 'var(--brand)' : 'var(--warning)' }}>
                        {unitLabel(t)}
                      </span>
                      <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: 'var(--hover)', color: 'var(--text3)' }}>
                        {t.standard_minutes} min estándar
                      </span>
                    </div>
                  </div>
                  <button onClick={() => startEdit(t)} title="Editar"
                    style={{ border: 'none', background: 'transparent', color: 'var(--text4)', cursor: 'pointer', fontSize: 14, padding: 4, flexShrink: 0 }}>
                    <i className="ti ti-pencil" style={{ fontSize: 15 }} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 14, lineHeight: 1.5, display: 'flex', gap: 6 }}>
        <i className="ti ti-info-circle" style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }} />
        <span>Estas son las tareas que ven los colaboradores en la pestaña Capacity para cargar sus toques del día.</span>
      </div>
    </div>
  )
}
