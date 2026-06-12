'use client'
import { useEffect, useState, useCallback } from 'react'
import { SYSTEMS_CONFIG } from '@/lib/actions-config'

interface Action {
  id: string
  system: string
  action: string
  date: string
  created_at: string
}

interface Props {
  collaboratorId: string
  currentDate: string
}

const font = { fontFamily: 'Montserrat, sans-serif' }

export default function InvoiceActions({ collaboratorId, currentDate }: Props) {
  const [actions, setActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(true)
  const [undoing, setUndoing] = useState(false)
  const [lastAdded, setLastAdded] = useState<string | null>(null)

  const fetchActions = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/actions?collaborator_id=${collaboratorId}&date=${currentDate}`)
    const data = await res.json()
    setActions(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [collaboratorId, currentDate])

  useEffect(() => { fetchActions() }, [fetchActions])

  async function addAction(system: string, action: string) {
    const res = await fetch('/api/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collaborator_id: collaboratorId, system, action, date: currentDate }),
    })
    const data = await res.json()
    if (res.ok) {
      setActions(prev => [...prev, data])
      setLastAdded(data.id)
      setTimeout(() => setLastAdded(null), 600)
    }
  }

  async function undoLast() {
    if (actions.length === 0) return
    setUndoing(true)
    const res = await fetch('/api/actions/undo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collaborator_id: collaboratorId, date: currentDate }),
    })
    if (res.ok) {
      setActions(prev => prev.slice(0, -1))
    }
    setUndoing(false)
  }

  // Count by system+action
  const counts: Record<string, number> = {}
  const systemTotals: Record<string, number> = {}
  for (const a of actions) {
    const key = `${a.system}__${a.action}`
    counts[key] = (counts[key] || 0) + 1
    systemTotals[a.system] = (systemTotals[a.system] || 0) + 1
  }

  const total = actions.length

  // History (last 8, reversed)
  const history = [...actions].reverse().slice(0, 8)

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ ...font }}>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ background: 'white', borderRadius: 10, padding: '9px 14px', border: '0.5px solid #e5e3db', textAlign: 'center', minWidth: 60 }}>
          <div style={{ fontSize: 10, color: '#888780', fontWeight: 500, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 2 }}>Total</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#534AB7' }}>{total}</div>
        </div>
        {SYSTEMS_CONFIG.map(s => (
          <div key={s.key} style={{ background: 'white', borderRadius: 10, padding: '9px 14px', border: '0.5px solid #e5e3db', textAlign: 'center', minWidth: 60 }}>
            <div style={{ fontSize: 10, color: '#888780', fontWeight: 500, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: s.color }}>{systemTotals[s.key] || 0}</div>
          </div>
        ))}
      </div>

      {/* Undo button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={undoLast} disabled={undoing || actions.length === 0}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '0.5px solid #d3d1c7', background: 'transparent', cursor: actions.length === 0 ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 500, color: '#888780', opacity: actions.length === 0 ? 0.4 : 1, ...font }}>
          <i className="ti ti-arrow-back-up" style={{ fontSize: 14 }} />
          {undoing ? 'Deshaciendo...' : 'Deshacer último'}
        </button>
      </div>

      {/* Systems */}
      {SYSTEMS_CONFIG.map((sys, si) => (
        <div key={sys.key} style={{ marginBottom: 4 }}>
          {/* Divider between systems */}
          {si > 0 && <div style={{ borderTop: '0.5px solid #e5e3db', margin: '14px 0' }} />}

          {/* System label */}
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', padding: '3px 10px', borderRadius: 20, background: sys.bg, color: sys.color, display: 'inline-block' }}>
              {sys.label}
            </span>
            {systemTotals[sys.key] > 0 && (
              <span style={{ fontSize: 11, color: '#888780', marginLeft: 8, fontWeight: 300 }}>
                {systemTotals[sys.key]} hoy
              </span>
            )}
          </div>

          {/* Action buttons */}
          {sys.actions.map(act => {
            const countKey = `${sys.key}__${act.key}`
            const count = counts[countKey] || 0
            const isNew = lastAdded !== null && actions.find(a => a.id === lastAdded && a.system === sys.key && a.action === act.key)
            return (
              <div key={act.key}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderRadius: 10, border: `0.5px solid ${isNew ? sys.color : '#e5e3db'}`, background: isNew ? sys.bg : 'white', marginBottom: 7, transition: 'all .15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: sys.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`ti ${act.icon}`} style={{ fontSize: 15, color: sys.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a18' }}>{act.label}</div>
                    {act.sublabel && <div style={{ fontSize: 11, color: '#888780', fontWeight: 300, marginTop: 1 }}>{act.sublabel}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20, fontWeight: 600, color: sys.color, minWidth: 28, textAlign: 'right' }}>{count}</span>
                  <button onClick={() => addAction(sys.key, act.key)}
                    style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: sys.bg, color: sys.color, fontSize: 18, fontWeight: 400, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'transform .08s, filter .08s' }}
                    onMouseOver={e => (e.currentTarget.style.filter = 'brightness(.88)')}
                    onMouseOut={e => (e.currentTarget.style.filter = '')}
                    onMouseDown={e => (e.currentTarget.style.transform = 'scale(.88)')}
                    onMouseUp={e => (e.currentTarget.style.transform = '')}
                    aria-label={`Sumar ${act.label} en ${sys.label}`}>
                    +
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ))}

      {/* History */}
      {actions.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#888780', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="ti ti-history" style={{ fontSize: 13 }} /> Historial de hoy
          </div>
          {history.map((a, i) => {
            const sys = SYSTEMS_CONFIG.find(s => s.key === a.system)
            const act = sys?.actions.find(x => x.key === a.action)
            return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: i === 0 ? '#f5f4f0' : 'white', border: '0.5px solid #e5e3db', marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: '#888780', minWidth: 42, fontWeight: 300 }}>{formatTime(a.created_at)}</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: sys?.bg, color: sys?.color, whiteSpace: 'nowrap' }}>{sys?.label}</span>
                <span style={{ fontSize: 13, color: '#1a1a18', flex: 1 }}>{act?.label || a.action}</span>
                <span style={{ fontSize: 10, color: '#b4b2a9' }}>#{actions.length - i}</span>
              </div>
            )
          })}
        </div>
      )}

      {!loading && actions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#b4b2a9' }}>
          <i className="ti ti-file-invoice" style={{ fontSize: 36, display: 'block', marginBottom: 8 }} />
          <div style={{ fontSize: 14, fontWeight: 300 }}>Todavía no registraste acciones hoy</div>
        </div>
      )}
    </div>
  )
}
