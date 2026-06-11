'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (pin.length < 4) { setError('El PIN debe tener al menos 4 dígitos'); return }
    if (name.trim().length < 2) { setError('Ingresá tu nombre'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), pin, mode }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      localStorage.setItem('collaborator', JSON.stringify(data.collaborator))
      router.push('/dashboard')
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#CECBF6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <i className="ti ti-checks" style={{ fontSize: 24, color: '#3C3489' }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4, fontFamily: 'Montserrat, sans-serif' }}>Control de tareas</h1>
          <p style={{ fontSize: 13, color: '#888780', fontWeight: 300 }}>Ingresá con tu PIN personal</p>
        </div>

        <div style={{ background: 'white', borderRadius: 16, border: '0.5px solid #e5e3db', padding: '1.5rem' }}>
          <div style={{ display: 'flex', background: '#f5f4f0', borderRadius: 10, padding: 3, marginBottom: '1.25rem' }}>
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }}
                style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  fontFamily: 'Montserrat, sans-serif',
                  background: mode === m ? 'white' : 'transparent',
                  color: mode === m ? '#1a1a18' : '#888780',
                  boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s' }}>
                {m === 'login' ? 'Ingresar' : 'Registrarse'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#5f5e5a', marginBottom: 6, fontWeight: 500 }}>
                <i className="ti ti-user" style={{ fontSize: 14 }} /> Tu nombre
              </label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Martín García"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '0.5px solid #d3d1c7', fontSize: 14, outline: 'none', background: '#fafaf8', fontFamily: 'Montserrat, sans-serif' }} />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#5f5e5a', marginBottom: 6, fontWeight: 500 }}>
                <i className="ti ti-lock" style={{ fontSize: 14 }} />
                {mode === 'login' ? 'Tu PIN' : 'Elegí un PIN (4–8 dígitos)'}
              </label>
              <input value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                type="password" inputMode="numeric" placeholder="••••"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '0.5px solid #d3d1c7', fontSize: 18, letterSpacing: 4, outline: 'none', background: '#fafaf8', textAlign: 'center', fontFamily: 'Montserrat, sans-serif' }} />
            </div>

            {error && (
              <div style={{ background: '#FCEBEB', color: '#A32D2D', fontSize: 13, padding: '8px 12px', borderRadius: 8, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="ti ti-alert-circle" style={{ fontSize: 15 }} /> {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: '#534AB7', color: 'white', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'Montserrat, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? <><i className="ti ti-loader-2" style={{ fontSize: 16 }} /> Cargando...</> : <><i className="ti ti-login" style={{ fontSize: 16 }} /> {mode === 'login' ? 'Ingresar' : 'Crear cuenta'}</>}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#b4b2a9', marginTop: '1.5rem', fontWeight: 300 }}>
          Cada colaborador tiene su espacio privado
        </p>
      </div>
    </div>
  )
}
