'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { localToday } from '@/lib/types'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'

const font = { fontFamily: 'Montserrat, sans-serif' }
const mono = { fontFamily: "'JetBrains Mono', monospace" }
const INACTIVITY = 8 * 60 * 60 * 1000
const CC_KEY = 'milo_boleto_cc'

interface Boleto {
  id: string; company_code: string; vendor: string; nf_number: string
  boleto_number: string; due_date: string | null; status: 'pending' | 'done'
  added_by_id: string; added_by_name: string; added_at: string
  loaded_by_id: string | null; loaded_by_name: string | null; loaded_at: string | null
}
type Scope = 'mine' | 'all'
type Tab = 'pending' | 'done'

export default function BoletoBrasilPage() {
  const router = useRouter()
  const [collab, setCollab] = useState<{ id: string; name: string; role: string; avatar?: string | null } | null>(null)
  const [items, setItems] = useState<Boleto[]>([])
  const [loading, setLoading] = useState(true)
  const [scope, setScope] = useState<Scope>('mine')
  const [tab, setTab] = useState<Tab>('pending')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [cc, setCc] = useState('4003')
  const [vendor, setVendor] = useState('')
  const [nf, setNf] = useState('')
  const [boleto, setBoleto] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [formErr, setFormErr] = useState('')
  const [saving, setSaving] = useState(false)

  function resetInactivity() {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => { localStorage.removeItem('collaborator'); router.push('/') }, INACTIVITY)
  }
  function logout() { localStorage.removeItem('collaborator'); router.push('/') }

  useEffect(() => {
    const s = localStorage.getItem('collaborator')
    if (!s) { router.push('/'); return }
    setCollab(JSON.parse(s))
    const saved = localStorage.getItem(CC_KEY)
    if (saved) setCc(saved)
    resetInactivity()
    const evs = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    evs.forEach(e => window.addEventListener(e, resetInactivity))
    return () => { evs.forEach(e => window.removeEventListener(e, resetInactivity)); if (timer.current) clearTimeout(timer.current) }
  }, [])

  const fetchItems = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/boleto-brasil', { cache: 'no-store' })
    const data = await res.json()
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  function saveCc(val: string) { setCc(val); localStorage.setItem(CC_KEY, val) }

  async function addItem(e: React.FormEvent) {
    e.preventDefault(); setFormErr('')
    if (!vendor.trim()) { setFormErr('Ingresá el vendor'); return }
    if (!nf.trim()) { setFormErr('Ingresá el N° de nota fiscal'); return }
    if (!boleto.trim()) { setFormErr('Ingresá el N° de boleto'); return }
    const boletoCleaned = boleto.trim()
    const boletoDigits = boletoCleaned.startsWith('*') ? boletoCleaned.slice(1).replace(/\D/g, '') : boletoCleaned.replace(/\D/g, '')
    if (boletoDigits.length !== 47) { setFormErr(`El boleto debe tener 47 dígitos — tiene ${boletoDigits.length}`); return }
    const boletoFinal = '*' + boletoDigits
    if (!collab) return
    setSaving(true)
    const res = await fetch('/api/boleto-brasil', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_code: cc, vendor: vendor.trim(), nf_number: nf.trim(), boleto_number: boletoFinal, due_date: dueDate || null, added_by_id: collab.id, added_by_name: collab.name }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setFormErr(data.error || 'Error al guardar'); return }
    setItems(prev => [data, ...prev])
    setVendor(''); setNf(''); setBoleto(''); setDueDate('')
  }

  async function markDone(id: string) {
    if (!collab) return
    setBusyId(id)
    const res = await fetch(`/api/boleto-brasil/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loaded_by_id: collab.id, loaded_by_name: collab.name, date: localToday() }),
    })
    const data = await res.json()
    setBusyId(null)
    if (res.ok) setItems(prev => prev.map(it => it.id === id ? data : it))
  }

  async function deleteItem(id: string) {
    setBusyId(id)
    const res = await fetch(`/api/boleto-brasil/${id}`, { method: 'DELETE' })
    setBusyId(null); setConfirmId(null)
    if (res.ok) setItems(prev => prev.filter(it => it.id !== id))
  }

  if (!collab) return null

  const today = localToday()
  const scoped = items.filter(it => scope === 'mine' ? it.added_by_id === collab.id : true)
  const pending = scoped.filter(it => it.status === 'pending')
  const done = scoped.filter(it => it.status === 'done' && it.loaded_at && it.loaded_at.slice(0, 10) === today)
  const totalToday = pending.length + done.length
  const pct = totalToday > 0 ? Math.round(done.length / totalToday * 100) : 0
  const visible = tab === 'pending' ? pending : done
  const groups = new Map<string, Boleto[]>()
  for (const it of visible) {
    if (!groups.has(it.vendor)) groups.set(it.vendor, [])
    groups.get(it.vendor)!.push(it)
  }
  const vendorGroups = Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  const inp = { width: '100%', padding: '8px 11px', borderRadius: 8, border: '0.5px solid var(--border)' as string, fontSize: 12, outline: 'none', background: 'var(--input-bg)', color: 'var(--text)', ...font }

  return (
    <div className="flex flex-col lg:flex-row" style={{ width: '100%', minHeight: '100vh', gap: 22, padding: 22, background: 'var(--bg)', ...font }}>
      <Sidebar collaborator={collab} activeKey="/boleto-brasil" onNavigate={key => router.push(`/dashboard?view=${key}`)} />
      <MobileNav collaborator={collab} activeKey="/boleto-brasil" onNavigate={key => router.push(`/dashboard?view=${key}`)} onLogout={logout} />
      <div className="pt-14 pb-20 lg:pt-0 lg:pb-0" style={{ flex: 1, minWidth: 0, maxWidth: 700 }}>
        <div style={{ marginBottom: 14 }}>
          <h1 style={{ fontSize: 19, fontWeight: 600, color: 'var(--text)' }}>Boleto 🇧🇷</h1>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 300, marginTop: 2 }}>Registro de boletos · SAP reference update</div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          {(['mine', 'all'] as Scope[]).map(s => (
            <button key={s} onClick={() => setScope(s)} style={{ flex: 1, padding: '7px 0', borderRadius: 9, border: `0.5px solid ${scope === s ? 'transparent' : 'var(--border)'}`, background: scope === s ? 'var(--brand)' : 'var(--card)', color: scope === s ? '#fff' : 'var(--text3)', fontSize: 11, fontWeight: 500, cursor: 'pointer', ...font }}>
              {s === 'mine' ? 'Míos' : 'Todo el equipo'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {(['pending', 'done'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '7px 0', borderRadius: 9, border: `0.5px solid ${tab === t ? 'transparent' : 'var(--border)'}`, background: tab === t ? 'var(--brand)' : 'var(--card)', color: tab === t ? '#fff' : 'var(--text3)', fontSize: 11, fontWeight: 500, cursor: 'pointer', ...font }}>
              {t === 'pending' ? `Pendientes (${pending.length})` : `Cargados hoy (${done.length})`}
            </button>
          ))}
        </div>
        <div style={{ background: 'var(--card)', borderRadius: 12, border: '0.5px solid var(--border)', padding: '12px 14px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', fontWeight: 500, marginBottom: 8 }}>
            <span>Progreso de hoy</span>
            <span style={{ color: 'var(--brand)', fontWeight: 600 }}>{done.length} de {totalToday} cargados en SAP</span>
          </div>
          <div style={{ height: 8, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--brand)', borderRadius: 99, transition: 'width .4s' }} />
          </div>
        </div>
        <form onSubmit={addItem} style={{ background: 'var(--card)', borderRadius: 12, border: '0.5px solid var(--brand-soft)', padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-plus" style={{ fontSize: 14 }} /> Cargar nuevo boleto
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, display: 'block', marginBottom: 3 }}>Company code <span style={{ color: 'var(--brand-soft)', fontSize: 9 }}>recordado</span></label>
              <select value={cc} onChange={e => saveCc(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                {['4003', '4018', '4305'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, display: 'block', marginBottom: 3 }}>Vendor</label>
              <input value={vendor} onChange={e => setVendor(e.target.value)} placeholder="N° - Razón social" style={inp} />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, display: 'block', marginBottom: 3 }}>N° Nota Fiscal</label>
            <input value={nf} onChange={e => setNf(e.target.value)} placeholder="Ej: NF-e 000123456" style={inp} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, display: 'block', marginBottom: 3 }}>Vencimiento del boleto</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inp} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, display: 'block', marginBottom: 3 }}>N° Boleto <span style={{ color: 'var(--text4)', fontSize: 9 }}>* + 47 dígitos · pegá con Ctrl+V</span></label>
            <input value={boleto} onChange={e => setBoleto(e.target.value)} placeholder="*00190001083000100002000101669579000053659..." style={{ ...inp, ...mono, fontSize: 11 }} />
          </div>
          {formErr && <div style={{ fontSize: 11, color: 'var(--error)', background: 'var(--error-bg)', padding: '6px 10px', borderRadius: 7, marginBottom: 10 }}>{formErr}</div>}
          <button type="submit" disabled={saving} style={{ width: '100%', padding: '10px', borderRadius: 9, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, ...font }}>
            {saving ? 'Guardando...' : 'Agregar pendiente'}
          </button>
        </form>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text4)' }}>Cargando...</div>
        ) : vendorGroups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text4)' }}>
            {tab === 'pending' ? '¡Todo cargado en SAP!' : 'Sin registros hoy.'}
          </div>
        ) : vendorGroups.map(([v, list]) => (
          <div key={v} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 2px 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ti ti-building-store" style={{ fontSize: 12 }} />{v}
            </div>
            {list.map(it => {
              const isOwn = it.added_by_id === collab.id
              const isBusy = busyId === it.id
              return (
                <div key={it.id} style={{ background: 'var(--card)', borderRadius: 10, border: '0.5px solid var(--border)', padding: '10px 13px', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: 'var(--brand-tint)', color: 'var(--brand-dark)' }}>{it.company_code}</span>
                        {tab === 'done' && it.loaded_at && (
                          <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: 'var(--success-bg)', color: 'var(--success)' }}>
                            ✓ {new Date(it.loaded_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}hs
                          </span>
                        )}
                        {!isOwn && <span style={{ fontSize: 9, color: 'var(--text3)', padding: '2px 7px', borderRadius: 20, background: 'var(--hover)' }}>de {it.added_by_name}</span>}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 3 }}>{it.nf_number}</div>
                      {it.due_date && (
                        <div style={{ fontSize: 10, color: 'var(--warning)', fontWeight: 500, marginBottom: 2 }}>
                          <i className="ti ti-calendar-due" style={{ fontSize: 11 }} /> Vence: {new Date(it.due_date + 'T12:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: 'var(--text4)', ...mono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.boleto_number}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center', flexShrink: 0 }}>
                      {tab === 'pending' ? (
                        <>
                          <button onClick={() => markDone(it.id)} disabled={isBusy} title="Marcar cargado en SAP"
                            style={{ width: 30, height: 30, borderRadius: '50%', border: '1.8px solid var(--brand)', background: 'transparent', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isBusy ? 'not-allowed' : 'pointer' }}>
                            <i className="ti ti-check" style={{ fontSize: 15 }} />
                          </button>
                          {isOwn && (confirmId === it.id ? (
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button onClick={() => deleteItem(it.id)} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, border: 'none', background: 'var(--error)', color: '#fff', cursor: 'pointer' }}>Sí</button>
                              <button onClick={() => setConfirmId(null)} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, border: '0.5px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text3)' }}>No</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmId(it.id)} style={{ border: 'none', background: 'transparent', color: 'var(--text4)', cursor: 'pointer' }}>
                              <i className="ti ti-trash" style={{ fontSize: 14 }} />
                            </button>
                          ))}
                        </>
                      ) : (
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="ti ti-check" style={{ fontSize: 15 }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div style={{ fontSize: 10, color: 'var(--text4)', marginTop: 8, textAlign: 'center' }}>
          Al tildar ✓ se registra un toque en "Brasil · Modificación reference por boleto"
        </div>
      </div>
    </div>
  )
}
