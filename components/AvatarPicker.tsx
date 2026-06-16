'use client'
import { useState } from 'react'

const font = { fontFamily: 'Montserrat, sans-serif' }
const AVATARS = Array.from({ length: 36 }, (_, i) => `/avatars/milo_${(i + 1).toString().padStart(2, '0')}.png`)

interface Props {
  collaboratorId: string
  current: string | null
  onSelect: (avatar: string) => void
  onClose: () => void
}

export default function AvatarPicker({ collaboratorId, current, onSelect, onClose }: Props) {
  const [selected, setSelected] = useState(current)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!selected) return
    setSaving(true)
    const res = await fetch('/api/avatar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collaborator_id: collaboratorId, avatar: selected }),
    })
    if (res.ok) onSelect(selected)
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={onClose}>
      <div style={{ background: 'var(--card)', borderRadius: 16, padding: '1.5rem', maxWidth: 440, width: '100%', maxHeight: '85vh', overflowY: 'auto', ...font }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Elegí tu Milo favorito</h2>
          <p style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 300 }}>Personalizá tu perfil</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 16 }}>
          {AVATARS.map(a => (
            <button key={a} onClick={() => setSelected(a)}
              style={{ padding: 0, borderRadius: '50%', border: `2.5px solid ${selected === a ? '#534AB7' : 'var(--border)'}`, background: '#ffffff', cursor: 'pointer', aspectRatio: '1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={a} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'contain', display: 'block', background: '#ffffff' }} />
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={save} disabled={!selected || saving}
            style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: '#534AB7', color: 'white', fontSize: 13, fontWeight: 600, cursor: selected ? 'pointer' : 'not-allowed', opacity: selected ? 1 : 0.5, ...font }}>
            {saving ? 'Guardando...' : 'Guardar avatar'}
          </button>
          <button onClick={onClose}
            style={{ padding: '10px 16px', borderRadius: 10, border: '0.5px solid var(--border)', background: 'transparent', fontSize: 13, cursor: 'pointer', color: 'var(--text3)', ...font }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
