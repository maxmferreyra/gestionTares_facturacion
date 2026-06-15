'use client'
import { useEffect, useState } from 'react'

interface Props {
  userName: string
}

const font = { fontFamily: 'Montserrat, sans-serif' }

export default function Popups({ userName }: Props) {
  const [showWelcome, setShowWelcome] = useState(false)
  const [showLunch, setShowLunch] = useState(false)

  // Welcome popup — show once per session
  useEffect(() => {
    const key = `welcome_shown_${new Date().toISOString().split('T')[0]}`
    if (!sessionStorage.getItem(key)) {
      setTimeout(() => setShowWelcome(true), 600)
      sessionStorage.setItem(key, '1')
    }
  }, [])

  // Lunch popup — check every minute if it's 13:00
  useEffect(() => {
    function checkLunch() {
      const now = new Date()
      const h = now.getHours(), m = now.getMinutes()
      const key = `lunch_shown_${now.toISOString().split('T')[0]}`
      if (h === 13 && m === 0 && !localStorage.getItem(key)) {
        setShowLunch(true)
        localStorage.setItem(key, '1')
      }
    }
    checkLunch()
    const interval = setInterval(checkLunch, 60000)
    return () => clearInterval(interval)
  }, [])

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '1rem',
  }

  const modalStyle: React.CSSProperties = {
    background: 'var(--card)', borderRadius: 16, padding: '2rem',
    maxWidth: 360, width: '100%', textAlign: 'center', ...font,
    boxShadow: '0 8px 32px rgba(0,0,0,.15)',
  }

  return (
    <>
      {/* Welcome popup */}
      {showWelcome && (
        <div style={overlayStyle} onClick={() => setShowWelcome(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👋</div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
              ¡Hola, {userName.split(' ')[0]}!
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text3)', fontWeight: 300, marginBottom: 20, lineHeight: 1.5 }}>
              No olvides iniciar <strong style={{ color: '#534AB7', fontWeight: 600 }}>Lilo</strong> antes de comenzar.
            </p>
            <button onClick={() => setShowWelcome(false)}
              style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: '#534AB7', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', ...font }}>
              Entendido ✓
            </button>
          </div>
        </div>
      )}

      {/* Lunch popup */}
      {showLunch && (
        <div style={overlayStyle} onClick={() => setShowLunch(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🍽️</div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
              Hora de almuerzo
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text3)', fontWeight: 300, marginBottom: 20, lineHeight: 1.5 }}>
              Momento de descansar y comer algo rico. <br />¡Hora de almuerzo!
            </p>
            <button onClick={() => setShowLunch(false)}
              style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: '#1D9E75', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', ...font }}>
              ¡Provecho! 🥗
            </button>
          </div>
        </div>
      )}
    </>
  )
}
