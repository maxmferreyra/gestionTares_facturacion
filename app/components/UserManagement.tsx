'use client'
import { useEffect, useState, useCallback } from 'react'

const font = { fontFamily: 'Montserrat, sans-serif' }

interface User {
  id: string
  name: string
  role: 'collaborator' | 'supervisor'
  avatar?: string | null
  active: boolean
  created_at: string
}

interface Props { currentUserId: string }

export default function UserManagement({ currentUserId }: Props) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Add form
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPin, setNewPin] = useState('')
  const [newRole, setNewRole] = useState<'collaborator' | 'supervisor'>('collaborator')
  const [addError, setAddError] = useState('')
  const [adding, setAdding] = useState(false)

  // Per-user inline state
  const [pinFor, setPinFor] = useState<string | null>(null)
  const [pinValue, setPinValue] = useState('')
  const [pinError, setPinError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/users', { cache: 'no-store' })
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch { setError('Error de conexión') }
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function addUser(e: React.FormEvent) {
    e.preventDefault()
    setAddError('')
    if (!newName.trim() || newName.trim().length < 2) { setAddError('Ingresá un nombre válido'); return }
    if (!newPin || newPin.length < 4) { setAddError('El PIN debe tener al menos 4 dígitos'); return }
    setAdding(true)
    const res = await fetch('/api/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), pin: newPin, role: newRole }),
    })
    const data = await res.json()
    setAdding(false)
    if (!res.ok) { setAddError(data.error || 'Error al crear usuario'); return }
    setNewName(''); setNewPin(''); setNewRole('collaborator'); setShowAdd(false)
    fetchUsers()
  }

  async function toggleActive(u: User) {
    setBusyId(u.id)
    const res = await fetch(`/api/users/${u.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !u.active }),
    })
    if (res.ok) setUsers(prev => prev.map(x => x.id === u.id ? { ...x, active: !u.active } : x))
    setBusyId(null)
  }

  async function toggleRole(u: User) {
    setBusyId(u.id)
    const newRole = u.role === 'supervisor' ? 'collaborator' : 'supervisor'
    const res = await fetch(`/api/users/${u.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    if (res.ok) setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole } : x))
    setBusyId(null)
  }

  async function confirmPin(id: string) {
    setPinError('')
    if (!pinValue || pinValue.length < 4) { setPinError('Mínimo 4 dígitos'); return }
    setBusyId(id)
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPin: pinValue }),
    })
    const data = await res.json()
    setBusyId(null)
    if (!res.ok) { setPinError(data.error || 'Error al actualizar'); return }
    setPinFor(null); setPinValue('')
  }

  async function deleteUser(id: string) {
    setBusyId(id)
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
    if (res.ok) setUsers(prev => prev.filter(u => u.id !== id))
    setBusyId(null); setConfirmDelete(null)
  }

  const inputStyle = { width: '100%', padding: '8px 11px', borderRadius: 7, border: '0.5px solid var(--border)', fontSize: 13, outline: 'none', background: 'var(--input-bg)', color: 'var(--text)', ...font }

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)', ...font }}><i className="ti ti-loader-2" style={{ fontSize: 28, display: 'block', marginBottom: 8 }} />Cargando usuarios...</div>
  if (error) return <div style={{ textAlign: 'center', padding: '3rem', color: '#A32D2D', ...font }}><i className="ti ti-alert-circle" style={{ fontSize: 28, display: 'block', marginBottom: 8 }} />{error}</div>

  return (
    <div style={font}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className="ti ti-users-group" style={{ fontSize: 14 }} /> {users.length} usuario{users.length !== 1 ? 's' : ''}
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          style={{ padding: '7px 13px', borderRadius: 8, border: 'none', background: showAdd ? 'var(--border)' : '#534AB7', color: showAdd ? 'var(--text)' : 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, ...font }}>
          <i className={`ti ${showAdd ? 'ti-x' : 'ti-user-plus'}`} style={{ fontSize: 14 }} /> {showAdd ? 'Cancelar' : 'Agregar usuario'}
        </button>
      </div>

      {/* Add user form */}
      {showAdd && (
        <form onSubmit={addUser} style={{ background: 'var(--card)', borderRadius: 12, border: '0.5px solid #AFA9EC', padding: '14px', marginBottom: 16 }}>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Nombre completo</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej: Martín García" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, display: 'block', marginBottom: 4 }}>PIN inicial</label>
              <input value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                inputMode="numeric" placeholder="4-8 dígitos" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Rol</label>
              <select value={newRole} onChange={e => setNewRole(e.target.value as 'collaborator' | 'supervisor')} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="collaborator">Colaborador</option>
                <option value="supervisor">Supervisor</option>
              </select>
            </div>
          </div>
          {addError && <div style={{ fontSize: 12, color: '#A32D2D', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}><i className="ti ti-alert-circle" style={{ fontSize: 14 }} />{addError}</div>}
          <button type="submit" disabled={adding}
            style={{ width: '100%', padding: '9px', borderRadius: 8, border: 'none', background: '#534AB7', color: 'white', fontSize: 13, fontWeight: 600, cursor: adding ? 'not-allowed' : 'pointer', opacity: adding ? 0.7 : 1, ...font }}>
            {adding ? 'Creando...' : 'Crear usuario'}
          </button>
        </form>
      )}

      {/* User list */}
      {users.map(u => {
        const isSelf = u.id === currentUserId
        const isPinOpen = pinFor === u.id
        const isConfirmingDelete = confirmDelete === u.id
        const isBusy = busyId === u.id
        const initials = u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        return (
          <div key={u.id} style={{ background: 'var(--card)', borderRadius: 10, border: `0.5px solid ${u.active ? 'var(--border)' : '#e8a0a0'}`, padding: '11px 14px', marginBottom: 8, opacity: u.active ? 1 : 0.7 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {u.avatar
                ? <img src={u.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'contain', background: '#fff', flexShrink: 0 }} />
                : <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#CECBF6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#3C3489', flexShrink: 0 }}>{initials}</div>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{u.name}</span>
                  {isSelf && <span style={{ fontSize: 9, color: 'var(--text4)', fontWeight: 400 }}>(vos)</span>}
                </div>
                <div style={{ display: 'flex', gap: 5, marginTop: 3 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 20, background: u.role === 'supervisor' ? '#FAEEDA' : '#E0F2EF', color: u.role === 'supervisor' ? '#854F0B' : '#0F6E56' }}>
                    {u.role === 'supervisor' ? '⭐ Supervisor' : 'Colaborador'}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 20, background: u.active ? '#EAF3DE' : '#FCEBEB', color: u.active ? '#3B6D11' : '#A32D2D' }}>
                    {u.active ? 'Activo' : 'Desactivado'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              <button onClick={() => toggleRole(u)} disabled={isSelf || isBusy}
                title={isSelf ? 'No podés cambiar tu propio rol' : ''}
                style={{ padding: '5px 10px', borderRadius: 7, border: '0.5px solid var(--border)', background: 'transparent', fontSize: 11, color: isSelf ? 'var(--text4)' : 'var(--text2)', cursor: isSelf ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, ...font }}>
                <i className="ti ti-replace" style={{ fontSize: 12 }} /> {u.role === 'supervisor' ? 'Pasar a colaborador' : 'Pasar a supervisor'}
              </button>

              <button onClick={() => { setPinFor(isPinOpen ? null : u.id); setPinValue(''); setPinError('') }}
                style={{ padding: '5px 10px', borderRadius: 7, border: '0.5px solid var(--border)', background: isPinOpen ? '#CECBF6' : 'transparent', fontSize: 11, color: isPinOpen ? '#3C3489' : 'var(--text2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, ...font }}>
                <i className="ti ti-key" style={{ fontSize: 12 }} /> Cambiar PIN
              </button>

              <button onClick={() => toggleActive(u)} disabled={isSelf || isBusy}
                title={isSelf ? 'No podés desactivarte a vos mismo' : ''}
                style={{ padding: '5px 10px', borderRadius: 7, border: `0.5px solid ${u.active ? '#e8a0a0' : '#C0DD97'}`, background: 'transparent', fontSize: 11, color: isSelf ? 'var(--text4)' : (u.active ? '#A32D2D' : '#3B6D11'), cursor: isSelf ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, ...font }}>
                <i className={`ti ${u.active ? 'ti-lock' : 'ti-lock-open'}`} style={{ fontSize: 12 }} /> {u.active ? 'Desactivar' : 'Reactivar'}
              </button>

              {!isConfirmingDelete ? (
                <button onClick={() => setConfirmDelete(u.id)} disabled={isSelf || isBusy}
                  title={isSelf ? 'No podés eliminarte a vos mismo' : ''}
                  style={{ padding: '5px 10px', borderRadius: 7, border: 'none', background: 'transparent', fontSize: 11, color: isSelf ? 'var(--text4)' : '#A32D2D', cursor: isSelf ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, ...font, marginLeft: 'auto' }}>
                  <i className="ti ti-trash" style={{ fontSize: 12 }} /> Eliminar
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                  <span style={{ fontSize: 11, color: '#A32D2D', fontWeight: 500 }}>¿Borrar todo su historial?</span>
                  <button onClick={() => deleteUser(u.id)} disabled={isBusy}
                    style={{ padding: '4px 9px', borderRadius: 6, border: 'none', background: '#A32D2D', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer', ...font }}>
                    Sí, eliminar
                  </button>
                  <button onClick={() => setConfirmDelete(null)}
                    style={{ padding: '4px 9px', borderRadius: 6, border: '0.5px solid var(--border)', background: 'transparent', fontSize: 11, cursor: 'pointer', color: 'var(--text3)', ...font }}>
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            {/* PIN reset inline */}
            {isPinOpen && (
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <input value={pinValue} onChange={e => setPinValue(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  inputMode="numeric" placeholder="Nuevo PIN" autoFocus
                  style={{ flex: 1, padding: '7px 11px', borderRadius: 7, border: '0.5px solid #534AB7', fontSize: 13, outline: 'none', background: 'var(--input-bg)', color: 'var(--text)', ...font }} />
                <button onClick={() => confirmPin(u.id)} disabled={isBusy}
                  style={{ padding: '7px 13px', borderRadius: 7, border: 'none', background: '#534AB7', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', ...font }}>
                  Guardar
                </button>
              </div>
            )}
            {isPinOpen && pinError && <div style={{ fontSize: 11, color: '#A32D2D', marginTop: 6 }}>{pinError}</div>}
          </div>
        )
      })}

      <div style={{ fontSize: 11, color: 'var(--text4)', fontWeight: 300, marginTop: 14, lineHeight: 1.5, display: 'flex', gap: 6 }}>
        <i className="ti ti-info-circle" style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }} />
        <span><strong>Desactivar</strong> bloquea el login pero conserva todo el historial de tareas y toques. <strong>Eliminar</strong> borra al usuario y todos sus registros de forma permanente.</span>
      </div>
    </div>
  )
}
