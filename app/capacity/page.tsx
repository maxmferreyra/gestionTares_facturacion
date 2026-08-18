'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { localToday, localOffsetDate } from '@/lib/types'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'

const font = { fontFamily: 'Montserrat, sans-serif' }
const INACTIVITY = 8 * 60 * 60 * 1000

interface CTask { id: string; task_key: string; name: string; unit: 'per_document'|'minutes'; unit_minutes: number; standard_minutes: number }
interface CLog  { id: string; collaborator_id: string; task_key: string; date: string; quantity: number }

function formatDate(d: string) {
  const today = localToday()
  if (d === today) return 'Today'
  if (d === localOffsetDate(today, -1)) return 'Yesterday'
  if (d === localOffsetDate(today, 1)) return 'Tomorrow'
  return new Date(d + 'T12:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function CapacityPage() {
  const router = useRouter()
  const [collab, setCollab] = useState<{ id: string; name: string; role: string; avatar?: string | null } | null>(null)
  const [tasks, setTasks] = useState<CTask[]>([])
  const [logs, setLogs] = useState<CLog[]>([])
  const [currentDate, setCurrentDate] = useState(localToday())
  const [loading, setLoading] = useState(true)
  const [bulkTask, setBulkTask] = useState<CTask | null>(null)
  const [bulkN, setBulkN] = useState('')
  const [saving, setSaving] = useState(false)
  const [accordionOpen, setAccordionOpen] = useState(true)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const fetchTasks = useCallback(async () => {
    const res = await fetch('/api/capacity-tasks', { cache: 'no-store' })
    const data = await res.json()
    setTasks(Array.isArray(data) ? data : [])
  }, [])

  const fetchLogs = useCallback(async () => {
    if (!collab) return
    setLoading(true)
    const res = await fetch(`/api/capacity-logs?collaborator_id=${collab.id}&date_from=${currentDate}&date_to=${currentDate}`, { cache: 'no-store' })
    const data = await res.json()
    setLogs(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [collab, currentDate])

  useEffect(() => { fetchTasks() }, [fetchTasks])
  useEffect(() => { fetchLogs() }, [fetchLogs])

  async function addTouches(task: CTask, qty: number) {
    if (!collab || qty < 1) return
    setSaving(true)
    const res = await fetch('/api/capacity-logs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collaborator_id: collab.id, task_key: task.task_key, date: currentDate, quantity: qty }),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) {
      setLogs(prev => {
        const idx = prev.findIndex(l => l.task_key === task.task_key)
        if (idx >= 0) { const copy = [...prev]; copy[idx] = data; return copy }
        return [...prev, data]
      })
    }
  }

  async function removeTouches(task: CTask) {
    const log = logs.find(l => l.task_key === task.task_key)
    if (!log || log.quantity <= 0) return
    const newQty = log.quantity - 1
    const res = await fetch(`/api/capacity-logs/${log.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: newQty }),
    })
    const data = await res.json()
    if (res.ok) {
      if (data.deleted) setLogs(prev => prev.filter(l => l.id !== log.id))
      else setLogs(prev => prev.map(l => l.id === log.id ? data : l))
    }
  }

  if (!collab) return null

  const today = localToday()
  const todayLogs = logs.filter(l => l.date === currentDate)
  const logByKey = Object.fromEntries(todayLogs.map(l => [l.task_key, l]))

  // Day progress calculation
  const minutesWorked = tasks.reduce((sum, t) => {
    const qty = logByKey[t.task_key]?.quantity || 0
    return sum + qty * t.standard_minutes
  }, 0)
  const DAY_MINUTES = 480
  const pct = Math.min(100, Math.round(minutesWorked / DAY_MINUTES * 100))
  const workedH = Math.floor(minutesWorked / 60)
  const workedM = Math.round(minutesWorked % 60)
  const workedLabel = workedM > 0 ? `${workedH}h ${workedM}min` : `${workedH}h`
  const totalTouches = todayLogs.reduce((s, l) => s + l.quantity, 0)

  const inp = { width: '100%', padding: '8px 11px', borderRadius: 8, border: '0.5px solid var(--border)', fontSize: 13, outline: 'none', background: 'var(--input-bg)', color: 'var(--text)', ...font }

  return (
    <div className="flex flex-col lg:flex-row" style={{ width: '100%', minHeight: '100vh', gap: 22, padding: 22, background: 'var(--bg)', ...font }}>
      <Sidebar collaborator={collab} activeKey="/capacity" onNavigate={key => router.push(`/dashboard?view=${key}`)} />
      <MobileNav collaborator={collab} activeKey="/capacity" onNavigate={key => router.push(`/dashboard?view=${key}`)} onLogout={logout} />

      <div className="pt-14 pb-20 lg:pt-0 lg:pb-0" style={{ flex: 1, minWidth: 0, maxWidth: 800 }}>
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 19, fontWeight: 600, color: 'var(--text)' }}>Capacity</h1>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 300, marginTop: 2 }}>Daily task & volume tracking</div>
        </div>

        {/* Date nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--card)', borderRadius: 12, padding: '9px 14px', marginBottom: 10, border: '0.5px solid var(--border)' }}>
          <button onClick={() => setCurrentDate(d => localOffsetDate(d, -1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--brand)', padding: '4px', display: 'flex' }}>
            <i className="ti ti-chevron-left" style={{ fontSize: 18 }} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{formatDate(currentDate)}</div>
            {currentDate !== today && <div style={{ fontSize: 10, color: 'var(--text4)', fontWeight: 300 }}>{new Date(currentDate + 'T12:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>}
          </div>
          <button onClick={() => setCurrentDate(d => localOffsetDate(d, 1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--brand)', padding: '4px', display: 'flex' }}>
            <i className="ti ti-chevron-right" style={{ fontSize: 18 }} />
          </button>
        </div>

        {/* Day progress */}
        <div style={{ background: 'var(--card)', borderRadius: 12, border: '0.5px solid var(--border)', padding: '11px 14px', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text3)', fontWeight: 500, marginBottom: 7 }}>
            <span><i className="ti ti-clock" style={{ fontSize: 13, verticalAlign: -2 }} /> Day progress</span>
            <span style={{ color: 'var(--brand)', fontWeight: 600 }}>{pct}% · {workedLabel} logged</span>
          </div>
          <div style={{ height: 8, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--brand)', borderRadius: 99, transition: 'width .4s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text4)', marginTop: 4 }}>
            <span>0h</span><span>2h</span><span>4h</span><span>6h</span><span>8h</span>
          </div>
        </div>

        {/* Tasks accordion */}
        <div style={{ background: 'var(--card)', borderRadius: 12, border: '0.5px solid var(--border)', padding: '12px 14px', marginBottom: 12 }}>
          <button onClick={() => setAccordionOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, ...font }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
              <i className="ti ti-list-check" style={{ fontSize: 15, color: 'var(--brand)' }} />
              IP Tasks
              <span style={{ fontSize: 11, color: 'var(--brand)', fontWeight: 600 }}>{totalTouches > 0 ? `${totalTouches} touches` : ''}</span>
            </div>
            <i className={`ti ti-chevron-${accordionOpen ? 'up' : 'down'}`} style={{ fontSize: 15, color: 'var(--text4)', transition: 'transform .2s' }} />
          </button>

          {accordionOpen && (
            <div style={{ marginTop: 8 }}>
              {tasks.map(t => {
                const log = logByKey[t.task_key]
                const qty = log?.quantity || 0
                const isPerdoc = t.unit === 'per_document'
                return (
                  <div key={t.task_key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderTop: '1px solid var(--hover)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 400 }}>{t.name}</div>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 20, flexShrink: 0, background: isPerdoc ? 'var(--brand-tint)' : 'var(--warning-bg)', color: isPerdoc ? 'var(--brand)' : 'var(--warning)' }}>
                      {isPerdoc ? 'per doc' : `1=${t.unit_minutes}min`}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => removeTouches(t)} style={{ width: 28, height: 28, borderRadius: 7, border: '0.5px solid var(--border)', background: 'var(--card)', fontSize: 16, cursor: qty > 0 ? 'pointer' : 'not-allowed', color: qty > 0 ? 'var(--brand)' : 'var(--text4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>−</button>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', minWidth: 22, textAlign: 'center', fontFamily: "'JetBrains Mono', monospace" }}>{qty}</span>
                      <button onClick={() => addTouches(t, 1)} disabled={saving} style={{ width: 28, height: 28, borderRadius: 7, border: '0.5px solid var(--border)', background: 'var(--card)', fontSize: 16, cursor: 'pointer', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>+</button>
                      {isPerdoc && (
                        <button onClick={() => { setBulkTask(t); setBulkN('') }} style={{ width: 28, height: 28, borderRadius: 7, border: '0.5px solid var(--brand-tint)', background: 'var(--brand-tint)', fontSize: 9, cursor: 'pointer', color: 'var(--brand)', fontWeight: 700, ...font }}>xN</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Today's log */}
        {todayLogs.length > 0 && (
          <div style={{ background: 'var(--card)', borderRadius: 12, border: '0.5px solid var(--border)', padding: '12px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Today's log</div>
            {todayLogs.filter(l => l.quantity > 0).sort((a, b) => b.quantity - a.quantity).map(l => {
              const t = tasks.find(t => t.task_key === l.task_key)
              if (!t) return null
              const isPerdoc = t.unit === 'per_document'
              return (
                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderTop: '1px solid var(--hover)' }}>
                  <i className="ti ti-circle-check" style={{ fontSize: 14, color: 'var(--brand)', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--text)' }}>{t.name}</span>
                  <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: isPerdoc ? 'var(--brand-tint)' : 'var(--warning-bg)', color: isPerdoc ? 'var(--brand)' : 'var(--warning)' }}>
                    {isPerdoc ? 'per doc' : `1=${t.unit_minutes}min`}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)', fontFamily: "'JetBrains Mono', monospace" }}>×{l.quantity}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bulk modal */}
      {bulkTask && (
        <div onClick={() => setBulkTask(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(11,43,38,0.4)', zIndex: 99, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--card)', borderRadius: 16, padding: 20, width: 300, ...font }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Bulk load</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 14, lineHeight: 1.4 }}>{bulkTask.name}</div>
            <input autoFocus value={bulkN} onChange={e => setBulkN(e.target.value.replace(/\D/g, ''))} type="text" inputMode="numeric" placeholder="How many?" style={{ ...inp, marginBottom: 12 }}
              onKeyDown={e => { if (e.key === 'Enter' && parseInt(bulkN) > 0) { addTouches(bulkTask, parseInt(bulkN)); setBulkTask(null) } }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { if (parseInt(bulkN) > 0) { addTouches(bulkTask, parseInt(bulkN)); setBulkTask(null) } }}
                style={{ flex: 1, padding: '9px', borderRadius: 9, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', ...font }}>Confirm</button>
              <button onClick={() => setBulkTask(null)}
                style={{ padding: '9px 14px', borderRadius: 9, border: '0.5px solid var(--border)', background: 'transparent', fontSize: 13, cursor: 'pointer', color: 'var(--text3)', ...font }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
