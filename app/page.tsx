'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Mode = 'login' | 'register' | 'reset'

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
    setMode(m); setError(''); setSuccess('')
    setName(''); setPin(''); setNewPin('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess('')

    if (mode === 'login') {
      if (pin.length < 4) { setError('El PIN debe tener al menos 4 dígitos'); return }
      setLoading(true)
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin, mode: 'login' }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error); return }
        localStorage.setItem('collaborator', JSON.stringify(data.collaborator))
        router.push('/dashboard')
      } catch { setError('Error de conexión. Intentá de nuevo.') }
      finally { setLoading(false) }
      return
    }

    if (mode === 'register') {
      if (name.trim().length < 2) { setError('Ingresá tu nombre'); return }
      if (pin.length < 4) { setError('El PIN debe tener al menos 4 dígitos'); return }
      setLoading(true)
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), pin, mode: 'register' }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error); return }
        localStorage.setItem('collaborator', JSON.stringify(data.collaborator))
        router.push('/dashboard')
      } catch { setError('Error de conexión. Intentá de nuevo.') }
      finally { setLoading(false) }
      return
    }

    if (mode === 'reset') {
      if (name.trim().length < 2) { setError('Ingresá tu nombre'); return }
      if (newPin.length < 4) { setError('El nuevo PIN debe tener al menos 4 dígitos'); return }
      setLoading(true)
      try {
        const res = await fetch('/api/reset-pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), newPin }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error); return }
        setSuccess('PIN actualizado. Ya podés ingresar.')
        setTimeout(() => switchMode('login'), 2000)
      } catch { setError('Error de conexión. Intentá de nuevo.') }
      finally { setLoading(false) }
      return
    }
  }

  const font = { fontFamily: 'Montserrat, sans-serif' }

  return (
    <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 320, ...font }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#CECBF6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <i className="ti ti-checks" style={{ fontSize: 24, color: '#3C3489' }} />
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4, ...font }}>Control de tareas</h1>
          <p style={{ fontSize: 12, color: '#888780', fontWeight: 300 }}>
            {mode === 'reset' ? 'Resetear PIN' : 'Ingresá con tu PIN personal'}
          </p>
        </div>

        <div style={{ background: 'var(--card)', borderRadius: 16, border: '0.5px solid var(--border)', padding: '1.5rem' }}>

          {/* Tabs — solo login y register */}
          {mode !== 'reset' && (
            <div style={{ display: 'flex', background: '#f5f4f0', borderRadius: 10, padding: 3, marginBottom: '1.25rem' }}>
              {(['login', 'register'] as Mode[]).map(m => (
                <button key={m} onClick={() => switchMode(m)}
                  style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                    ...font,
                    background: mode === m ? 'white' : 'transparent',
                    color: mode === m ? '#1a1a18' : '#888780',
                    boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s' }}>
                  {m === 'login' ? 'Ingresar' : 'Registrarse'}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Nombre — solo en registro y reset */}
            {(mode === 'register' || mode === 'reset') && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#5f5e5a', marginBottom: 6, fontWeight: 500 }}>
                  <i className="ti ti-user" style={{ fontSize: 14 }} /> Tu nombre
                </label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Martín García"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '0.5px solid #d3d1c7', fontSize: 14, outline: 'none', background: '#fafaf8', ...font }} />
              </div>
            )}

            {/* PIN — login y registro */}
            {(mode === 'login' || mode === 'register') && (
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#5f5e5a', marginBottom: 6, fontWeight: 500 }}>
                  <i className="ti ti-lock" style={{ fontSize: 14 }} />
                  {mode === 'login' ? 'Tu PIN' : 'Elegí un PIN (4–8 dígitos)'}
                </label>
                <input value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  type="password" inputMode="numeric" placeholder="••••"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '0.5px solid #d3d1c7', fontSize: 18, letterSpacing: 4, outline: 'none', background: '#fafaf8', textAlign: 'center', ...font }} />
              </div>
            )}

            {/* Nuevo PIN — solo en reset */}
            {mode === 'reset' && (
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#5f5e5a', marginBottom: 6, fontWeight: 500 }}>
                  <i className="ti ti-lock-plus" style={{ fontSize: 14 }} /> Nuevo PIN (4–8 dígitos)
                </label>
                <input value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  type="password" inputMode="numeric" placeholder="••••"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '0.5px solid #d3d1c7', fontSize: 18, letterSpacing: 4, outline: 'none', background: '#fafaf8', textAlign: 'center', ...font }} />
              </div>
            )}

            {error && (
              <div style={{ background: '#FCEBEB', color: '#A32D2D', fontSize: 12, padding: '8px 12px', borderRadius: 8, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="ti ti-alert-circle" style={{ fontSize: 15 }} /> {error}
              </div>
            )}

            {success && (
              <div style={{ background: '#EAF3DE', color: '#3B6D11', fontSize: 12, padding: '8px 12px', borderRadius: 8, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="ti ti-circle-check" style={{ fontSize: 15 }} /> {success}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: mode === 'reset' ? '#BA7517' : '#534AB7', color: 'white', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, ...font, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading
                ? <><i className="ti ti-loader-2" style={{ fontSize: 16 }} /> Cargando...</>
                : mode === 'login' ? <><i className="ti ti-login" style={{ fontSize: 16 }} /> Ingresar</>
                : mode === 'register' ? <><i className="ti ti-user-plus" style={{ fontSize: 16 }} /> Crear cuenta</>
                : <><i className="ti ti-key" style={{ fontSize: 16 }} /> Resetear PIN</>
              }
            </button>
          </form>

          {/* Link olvidé mi PIN */}
          {mode === 'login' && (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button onClick={() => switchMode('reset')}
                style={{ border: 'none', background: 'transparent', fontSize: 12, color: '#888780', cursor: 'pointer', ...font, textDecoration: 'underline' }}>
                Olvidé mi PIN
              </button>
            </div>
          )}

          {mode === 'reset' && (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button onClick={() => switchMode('login')}
                style={{ border: 'none', background: 'transparent', fontSize: 12, color: '#888780', cursor: 'pointer', ...font, display: 'flex', alignItems: 'center', gap: 4, margin: '0 auto' }}>
                <i className="ti ti-arrow-left" style={{ fontSize: 13 }} /> Volver al login
              </button>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#b4b2a9', marginTop: '1.5rem', fontWeight: 300 }}>
          Cada colaborador tiene su espacio privado
        </p>
      </div>
    </div>
  )
}
