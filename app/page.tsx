'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Mode = 'login' | 'reset'

export default function LoginPage() {
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [mode, setMode] = useState<Mode>('login')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function switchMode(m: Mode) {
    setMode(m); setError(''); setSuccess(''); setName(''); setPin(''); setNewPin('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!name.trim() || name.trim().length < 2) { setError('Ingresá tu nombre'); return }

    if (mode === 'login') {
      if (pin.length < 4) { setError('El PIN debe tener al menos 4 dígitos'); return }
      setLoading(true)
      try {
        const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), pin, mode: 'login' }) })
        const data = await res.json()
        if (!res.ok) { setError(data.error); return }
        localStorage.setItem('collaborator', JSON.stringify(data.collaborator))
        router.push('/dashboard')
      } catch { setError('Error de conexión. Intentá de nuevo.') } finally { setLoading(false) }
      return
    }

    if (mode === 'reset') {
      if (newPin.length < 4) { setError('El nuevo PIN debe tener al menos 4 dígitos'); return }
      setLoading(true)
      try {
        const res = await fetch('/api/reset-pin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), newPin }) })
        const data = await res.json()
        if (!res.ok) { setError(data.error); return }
        setSuccess('PIN actualizado. Ya podés ingresar.')
        setTimeout(() => switchMode('login'), 2000)
      } catch { setError('Error de conexión. Intentá de nuevo.') } finally { setLoading(false) }
      return
    }
  }

  const font = { fontFamily: 'Montserrat, sans-serif' }
  const inputStyle = {
    width: '100%', padding: '9px 11px', borderRadius: 7, border: '0.5px solid var(--border)',
    fontSize: 13, outline: 'none', background: 'var(--input-bg)', color: 'var(--text)', ...font,
  }

  return (
    <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 320, ...font }}>

        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <img src="/logo-milo.png" alt="Milo" style={{ width: 170, height: 170, objectFit: 'contain', margin: '0 auto' }} />
          <p style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 300, marginTop: -8 }}>
            {mode === 'reset' ? 'Resetear PIN' : 'Ingresá con tu nombre y PIN'}
          </p>
        </div>

        <div style={{ background: 'var(--card)', borderRadius: 14, border: '0.5px solid var(--border)', padding: '1.25rem' }}>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '0.9rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text2)', marginBottom: 5, fontWeight: 500 }}>
                <i className="ti ti-user" style={{ fontSize: 13 }} /> Tu nombre
              </label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Julio Riobo" style={inputStyle} />
            </div>

            {mode === 'login' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text2)', marginBottom: 5, fontWeight: 500 }}>
                  <i className="ti ti-lock" style={{ fontSize: 13 }} /> Tu PIN
                </label>
                <input value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  type="password" inputMode="numeric" placeholder="••••"
                  style={{ ...inputStyle, fontSize: 16, letterSpacing: 4, textAlign: 'center' }} />
              </div>
            )}

            {mode === 'reset' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text2)', marginBottom: 5, fontWeight: 500 }}>
                  <i className="ti ti-lock-plus" style={{ fontSize: 13 }} /> Nuevo PIN (4–8 dígitos)
                </label>
                <input value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  type="password" inputMode="numeric" placeholder="••••"
                  style={{ ...inputStyle, fontSize: 16, letterSpacing: 4, textAlign: 'center' }} />
              </div>
            )}

            {error && (
              <div style={{ background: '#FCEBEB', color: '#A32D2D', fontSize: 12, padding: '7px 11px', borderRadius: 7, marginBottom: '0.9rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                <i className="ti ti-alert-circle" style={{ fontSize: 14 }} /> {error}
              </div>
            )}
            {success && (
              <div style={{ background: '#EAF3DE', color: '#3B6D11', fontSize: 12, padding: '7px 11px', borderRadius: 7, marginBottom: '0.9rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                <i className="ti ti-circle-check" style={{ fontSize: 14 }} /> {success}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '10px', borderRadius: 9, border: 'none', background: mode === 'reset' ? '#BA7517' : '#534AB7', color: 'white', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, ...font, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              {loading ? <><i className="ti ti-loader-2" style={{ fontSize: 15 }} /> Cargando...</>
                : mode === 'login' ? <><i className="ti ti-login" style={{ fontSize: 15 }} /> Ingresar</>
                : <><i className="ti ti-key" style={{ fontSize: 15 }} /> Resetear PIN</>}
            </button>
          </form>

          {mode === 'login' && (
            <div style={{ textAlign: 'center', marginTop: '0.9rem' }}>
              <button onClick={() => switchMode('reset')} style={{ border: 'none', background: 'transparent', fontSize: 11, color: 'var(--text3)', cursor: 'pointer', ...font, textDecoration: 'underline' }}>
                Olvidé mi PIN
              </button>
            </div>
          )}
          {mode === 'reset' && (
            <div style={{ textAlign: 'center', marginTop: '0.9rem' }}>
              <button onClick={() => switchMode('login')} style={{ border: 'none', background: 'transparent', fontSize: 11, color: 'var(--text3)', cursor: 'pointer', ...font, display: 'flex', alignItems: 'center', gap: 4, margin: '0 auto' }}>
                <i className="ti ti-arrow-left" style={{ fontSize: 12 }} /> Volver al login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
