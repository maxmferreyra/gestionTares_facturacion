'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'

const font = { fontFamily: 'Montserrat, sans-serif' }
const INACTIVITY = 8 * 60 * 60 * 1000

const FIXED_CCS = ['4001', '4015', '4003', '4018', '4305']
const CC_COUNTRY: Record<string, { label: string; flag: string }> = {
  '4001': { label: 'Argentina', flag: 'ar' },
  '4015': { label: 'Argentina', flag: 'ar' },
  '4003': { label: 'Brasil', flag: 'br' },
  '4018': { label: 'Brasil', flag: 'br' },
  '4305': { label: 'Brasil', flag: 'br' },
}

interface Nota { id: string; company_code: string; title: string; body: string }

export default function ParticularidadesPage() {
  const router = useRouter()
  const [collab, setCollab] = useState<{ id: string; name: string; role: string; avatar?: string | null } | null>(null)
  const [notas, setNotas] = useState<Nota[]>([])
  const [loading, setLoading] = useState(true)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Form
  const [cc, setCc] = useState('4001')
  const [customCc, setCustomCc] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [formErr, setFormErr] = useState('')
  const [saving, setSaving] = useState(false)

  // Edit/delete state
  const [editId, setEditId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)

  function resetInactivity() {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => { localStorage.removeItem('collaborator'); router.push('/') }, INACTIVITY)
  }
  function logout() { localStorage.removeItem('collaborator'); router.push('/') }

  useEffect(() => {
    const s = localStorage.getItem('collaborator')
    if (!s) { router.push('/'); return }
    setCollab(JSON.parse(s))
    resetInactivity()
    const evs = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    evs.forEach(e => window.addEventListener(e, resetInactivity))
    return () => { evs.forEach(e => window.removeEventListener(e, resetInactivity)); if (timer.current) clearTimeout(timer.current) }
  }, [])

  const fetchNotas = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/particularidades', { cache: 'no-store' })
    const data = await res.json()
    setNotas(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchNotas() }, [fetchNotas])

  const effectiveCc = showCustom ? customCc.trim() : cc

  async function addNota(e: React.FormEvent) {
    e.preventDefault(); setFormErr('')
    if (!effectiveCc) { setFormErr('Ingresá el company code'); return }
    if (!title.trim()) { setFormErr('Ingresá un título'); return }
    if (!body.trim()) { setFormErr('Ingresá el detalle'); return }
    setSaving(true)
    const res = await fetch('/api/particularidades', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_code: effectiveCc, title, body }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setFormErr(data.error || 'Error al guardar'); return }
    setNotas(prev => [...prev, data].sort((a, b) => a.company_code.localeCompare(b.company_code)))
    setTitle(''); setBody(''); setFormErr('')
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/particularidades/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle, body: editBody }),
    })
    const data = await res.json()
    if (res.ok) { setNotas(prev => prev.map(n => n.id === id ? data : n)); setEditId(null) }
  }

  async function deleteNota(id: string) {
    const res = await fetch(`/api/particularidades/${id}`, { method: 'DELETE' })
    if (res.ok) { setNotas(prev => prev.filter(n => n.id !== id)); setConfirmId(null) }
  }

  if (!collab) return null

  // Agrupar por company code
  const grouped = new Map<string, Nota[]>()
  for (const n of notas) {
    if (!grouped.has(n.company_code)) grouped.set(n.company_code, [])
    grouped.get(n.company_code)!.push(n)
  }
  const groups = Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]))

  const inp = { width: '100%', padding: '8px 11px', borderRadius: 8, border: '0.5px solid var(--border)' as string, fontSize: 13, outline: 'none', background: 'var(--input-bg)', color: 'var(--text)', ...font }

  return (
    <div className="flex flex-col lg:flex-row" style={{ width: '100%', minHeight: '100vh', gap: 22, padding: 22, background: 'var(--bg)', ...font }}>
      <Sidebar collaborator={collab} activeKey="/particularidades" onNavigate={key => router.push(`/dashboard?view=${key}`)} />
      <MobileNav collaborator={collab} activeKey="/particularidades" onNavigate={key => router.push(`/dashboard?view=${key}`)} onLogout={logout} />

      <div className="pt-14 pb-20 lg:pt-0 lg:pb-0" style={{ flex: 1, minWidth: 0, maxWidth: 760 }}>
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 19, fontWeight: 600, color: 'var(--text)' }}>Particularidades</h1>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 300, marginTop: 2 }}>Notas y consideraciones por company code · visible y editable para todos</div>
        </div>

        {/* Formulario */}
        <form onSubmit={addNota} style={{ background: 'var(--card)', borderRadius: 12, border: '0.5px solid var(--brand-soft)', padding: 14, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-plus" style={{ fontSize: 14 }} /> Agregar nota
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, display: 'block', marginBottom: 3 }}>Company code</label>
              {!showCustom ? (
                <select value={cc} onChange={e => { if (e.target.value === '__new__') setShowCustom(true); else setCc(e.target.value) }} style={{ ...inp, cursor: 'pointer' }}>
                  {FIXED_CCS.map(v => <option key={v} value={v}>{v}</option>)}
                  <option value="__new__">+ Otro código...</option>
                </select>
              ) : (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input value={customCc} onChange={e => setCustomCc(e.target.value)} placeholder="Ej: 4020" style={{ ...inp }} />
                  <button type="button" onClick={() => { setShowCustom(false); setCustomCc('') }} style={{ border: 'none', background: 'transparent', color: 'var(--text4)', cursor: 'pointer', fontSize: 18, flexShrink: 0 }}>×</button>
                </div>
              )}
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, display: 'block', marginBottom: 3 }}>Título</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Retención de ganancias" style={inp} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, display: 'block', marginBottom: 3 }}>Detalle</label>
            <textarea value={body} onChange={e => setBody(e.target.value)}
              placeholder="Describí la particularidad, el proceso o la excepción a tener en cuenta..."
              style={{ ...inp, resize: 'vertical', minHeight: 80 }} />
          </div>
          {formErr && <div style={{ fontSize: 11, color: 'var(--error)', background: 'var(--error-bg)', padding: '6px 10px', borderRadius: 7, marginBottom: 10 }}>{formErr}</div>}
          <button type="submit" disabled={saving} style={{ padding: '9px 18px', borderRadius: 9, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, ...font }}>
            {saving ? 'Guardando...' : 'Agregar nota'}
          </button>
        </form>

        {/* Lista */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text4)' }}>Cargando...</div>
        ) : groups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text4)' }}>
            <i className="ti ti-notes" style={{ fontSize: 32, display: 'block', marginBottom: 8 }} />
            <div style={{ fontSize: 13, fontWeight: 300 }}>Todavía no hay notas. ¡Agregá la primera!</div>
          </div>
        ) : (
          groups.map(([code, list]) => {
            const meta = CC_COUNTRY[code]
            return (
              <div key={code} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 2px 8px', display: 'flex', alignItems: 'center', gap: 7 }}>
                  {meta
                    ? <img src={`https://flagcdn.com/16x12/${meta.flag}.png`} alt={meta.flag} style={{ borderRadius: 2 }} />
                    : <i className="ti ti-world" style={{ fontSize: 13 }} />}
                  {code}{meta ? ` · ${meta.label}` : ''}
                </div>
                {list.map(n => (
                  <div key={n.id} style={{ background: 'var(--card)', borderRadius: 10, border: '0.5px solid var(--border)', padding: '12px 14px', marginBottom: 8 }}>
                    {editId === n.id ? (
                      <div>
                        <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ ...inp, marginBottom: 8, fontWeight: 600 }} />
                        <textarea value={editBody} onChange={e => setEditBody(e.target.value)} style={{ ...inp, resize: 'vertical', minHeight: 80, marginBottom: 10 }} />
                        <div style={{ display: 'flex', gap: 7 }}>
                          <button onClick={() => saveEdit(n.id)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', ...font }}>Guardar</button>
                          <button onClick={() => setEditId(null)} style={{ padding: '6px 14px', borderRadius: 8, border: '0.5px solid var(--border)', background: 'transparent', fontSize: 12, cursor: 'pointer', color: 'var(--text3)', ...font }}>Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 5 }}>{n.title}</div>
                          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{n.body}</div>
                          {confirmId === n.id && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                              <span style={{ fontSize: 11, color: 'var(--error)', fontWeight: 500 }}>¿Eliminar esta nota?</span>
                              <button onClick={() => deleteNota(n.id)} style={{ padding: '3px 10px', borderRadius: 6, border: 'none', background: 'var(--error)', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Sí</button>
                              <button onClick={() => setConfirmId(null)} style={{ padding: '3px 10px', borderRadius: 6, border: '0.5px solid var(--border)', background: 'transparent', fontSize: 11, cursor: 'pointer', color: 'var(--text3)' }}>No</button>
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                          <button onClick={() => { setEditId(n.id); setEditTitle(n.title); setEditBody(n.body) }} title="Editar"
                            style={{ border: 'none', background: 'transparent', color: 'var(--brand-soft)', cursor: 'pointer', padding: 3 }}>
                            <i className="ti ti-pencil" style={{ fontSize: 15 }} />
                          </button>
                          <button onClick={() => setConfirmId(confirmId === n.id ? null : n.id)} title="Eliminar"
                            style={{ border: 'none', background: 'transparent', color: 'var(--text4)', cursor: 'pointer', padding: 3 }}>
                            <i className="ti ti-trash" style={{ fontSize: 15 }} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
