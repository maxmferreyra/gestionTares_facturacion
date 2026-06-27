'use client'
import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Task } from '@/lib/types'
import { calcDuration, localToday, localOffsetDate } from '@/lib/types'
import TaskItem from '@/components/TaskItem'
import AddTaskForm from '@/components/AddTaskForm'
import WeeklySummary from '@/components/WeeklySummary'
import InvoiceActions from '@/components/InvoiceActions'
import HelpSection from '@/components/HelpSection'
import SupervisorDashboard from '@/components/SupervisorDashboard'
import UserManagement from '@/components/UserManagement'
import InicioCalendar from '@/components/InicioCalendar'
import InicioSummary from '@/components/InicioSummary'
import Popups from '@/components/Popups'
import AvatarPicker from '@/components/AvatarPicker'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'

type View = 'inicio' | 'daily' | 'weekly' | 'invoices' | 'help' | 'supervisor' | 'users'

const WORK_START = 9 * 60, WORK_END = 18 * 60, WORK_TOTAL = WORK_END - WORK_START
const INACTIVITY_LIMIT = 8 * 60 * 60 * 1000

const offsetDate = localOffsetDate
function formatDate(dateStr: string) {
  const today = localToday()
  if (dateStr === today) return 'Hoy'
  if (dateStr === offsetDate(today, -1)) return 'Ayer'
  if (dateStr === offsetDate(today, 1)) return 'Mañana'
  return new Date(dateStr + 'T12:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

// Mensaje basado SOLO en progreso de horas, sin referencia al momento del día
function getMotivation(workedMin: number): { msg: string; color: string; bg: string } {
  const pct = workedMin / WORK_TOTAL
  if (workedMin === 0) return { msg: 'Sin registros aún. ¡A cargar!', color: '#185FA5', bg: '#E6F1FB' }
  if (pct < 0.3)  return { msg: 'Buen comienzo, seguí sumando 👍', color: '#185FA5', bg: '#E6F1FB' }
  if (pct < 0.55) return { msg: 'Vas por la mitad, bien 💪', color: '#854F0B', bg: '#FAEEDA' }
  if (pct < 0.85) return { msg: 'Buen avance, falta poco 🔥', color: '#854F0B', bg: '#FAEEDA' }
  if (pct < 1)    return { msg: 'Casi completás tu jornada ⚡', color: 'var(--brand)', bg: 'var(--brand-tint)' }
  return { msg: '¡Jornada completa! Bien hecho ✓', color: 'var(--success)', bg: 'var(--success-bg)' }
}
function timeToMin(t: string) { const [h, m] = t.split(':').map(Number); return h * 60 + m }

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [collaborator, setCollaborator] = useState<{ id: string; name: string; role: string; avatar?: string | null } | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [view, setView] = useState<View>(() => {
    const v = searchParams.get('view')
    const validViews: View[] = ['inicio', 'daily', 'weekly', 'invoices', 'help', 'supervisor', 'users']
    return (v && validViews.includes(v as View)) ? (v as View) : 'inicio'
  })
  const [showAddForm, setShowAddForm] = useState(false)
  const [showAvatar, setShowAvatar] = useState(false)
  const [calendarVersion, setCalendarVersion] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(localToday())
  const today = localToday()
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function resetInactivity() {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    inactivityTimer.current = setTimeout(() => {
      localStorage.removeItem('collaborator')
      router.push('/?reason=inactivity')
    }, INACTIVITY_LIMIT)
  }

  useEffect(() => {
    const stored = localStorage.getItem('collaborator')
    if (!stored) { router.push('/'); return }
    setCollaborator(JSON.parse(stored))
    resetInactivity()
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    events.forEach(e => window.addEventListener(e, resetInactivity))
    return () => {
      events.forEach(e => window.removeEventListener(e, resetInactivity))
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    }
  }, [router])

  const fetchTasks = useCallback(async () => {
    if (!collaborator) return
    setLoading(true)
    const res = await fetch(`/api/tasks?collaborator_id=${collaborator.id}&date=${currentDate}`, { cache: 'no-store' })
    const data = await res.json()
    setTasks(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [collaborator, currentDate])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  async function updateTask(id: string, fields: Partial<Task>) {
    const res = await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) })
    const updated = await res.json()
    setTasks(prev => prev.map(t => t.id === id ? updated : t))
  }
  async function deleteTask(id: string) {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    setTasks(prev => prev.filter(t => t.id !== id))
  }
  async function addTask(data: { title: string; start_time: string; end_time: string; systems: string[]; tag: string; notes: string }) {
    if (!collaborator) return
    const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ collaborator_id: collaborator.id, date: currentDate, ...data }) })
    const task = await res.json()
    setTasks(prev => [...prev, task].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')))
    setShowAddForm(false)
  }
  function handleExport() {
    if (!collaborator) return
    window.open(`/api/export?collaborator_id=${collaborator.id}&name=${encodeURIComponent(collaborator.name)}&date=${currentDate}`, '_blank')
  }
  function logout() { localStorage.removeItem('collaborator'); router.push('/') }

  function onAvatarSelected(avatar: string) {
    if (!collaborator) return
    const updated = { ...collaborator, avatar }
    setCollaborator(updated)
    localStorage.setItem('collaborator', JSON.stringify(updated))
    setShowAvatar(false)
  }

  const workedMin = tasks.reduce((sum, t) => {
    if (!t.start_time || !t.end_time) return sum
    const d = calcDuration(t.start_time, t.end_time)
    return sum + (d ? d.hours * 60 + d.minutes : 0)
  }, 0)
  const workedH = Math.floor(workedMin / 60), workedM = workedMin % 60
  const workedLabel = workedM > 0 ? `${workedH}h ${workedM}min` : `${workedH}h`
  const uncoveredMin = Math.max(0, WORK_TOTAL - workedMin)
  const uncoveredH = Math.floor(uncoveredMin / 60), uncoveredM = uncoveredMin % 60
  const uncoveredLabel = uncoveredM > 0 ? `${uncoveredH}h ${uncoveredM}min` : `${uncoveredH}h`
  const motivation = getMotivation(workedMin)

  // Horario de fin de la última tarea del día — se usa como inicio sugerido de la próxima
  const lastTaskEndTime = tasks.reduce((latest: string | null, t) => {
    if (!t.end_time) return latest
    return (!latest || t.end_time > latest) ? t.end_time : latest
  }, null)
  const font = { fontFamily: 'Montserrat, sans-serif' }
  const isSupervisor = collaborator?.role === 'supervisor'

  const coveredSlots = tasks.filter(t => t.start_time && t.end_time)
    .map(t => ({ start: timeToMin(t.start_time!), end: timeToMin(t.end_time!) }))
    .filter(s => s.end > s.start).sort((a, b) => a.start - b.start)
  type Seg = { from: number; to: number; covered: boolean }
  const segments: Seg[] = []
  let cursor = WORK_START
  for (const slot of coveredSlots) {
    const s = Math.max(slot.start, WORK_START), e = Math.min(slot.end, WORK_END)
    if (s > cursor) segments.push({ from: cursor, to: s, covered: false })
    if (e > cursor) { segments.push({ from: Math.max(cursor, s), to: e, covered: true }); cursor = e }
  }
  if (cursor < WORK_END) segments.push({ from: cursor, to: WORK_END, covered: false })

  if (!collaborator) return null

  return (
    <div className="flex flex-col lg:flex-row" style={{ width: '100%', minHeight: '100vh', gap: 22, padding: 22, background: 'var(--bg)', ...font }}>

      <Sidebar
        collaborator={collaborator}
        activeKey={view}
        onNavigate={(key) => setView(key as View)}
        onAvatarClick={() => setShowAvatar(true)}
      />
      <MobileNav
        collaborator={collaborator}
        activeKey={view}
        onNavigate={(key) => setView(key as View)}
        onAvatarClick={() => setShowAvatar(true)}
        onLogout={logout}
        onExportExcel={handleExport}
      />

      <Popups userName={collaborator.name} />
      {showAvatar && <AvatarPicker collaboratorId={collaborator.id} current={collaborator.avatar || null} onSelect={onAvatarSelected} onClose={() => setShowAvatar(false)} />}

      <div className="pt-14 pb-20 lg:pt-0 lg:pb-0" style={{ flex: 1, minWidth: 0, maxWidth: 880 }}>

        {/* Topbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 600, color: 'var(--text)' }}>
              {view === 'inicio' ? 'Inicio' : view === 'daily' ? `Hola, ${collaborator.name.split(' ')[0]} 👋` : view === 'weekly' ? 'Resumen semanal' : view === 'invoices' ? 'Facturas' : view === 'help' ? 'Ayuda' : view === 'supervisor' ? 'Equipo' : 'Usuarios'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 300, marginTop: 2 }}>
              {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 7 }}>
            <button onClick={handleExport} title="Exportar a Excel" style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'var(--card)', fontSize: 14, cursor: 'pointer', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(11,43,38,0.08)' }}>
              <i className="ti ti-file-spreadsheet" />
            </button>
            <button onClick={logout} title="Salir" style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'var(--card)', fontSize: 14, cursor: 'pointer', color: 'var(--text3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(11,43,38,0.08)' }}>
              <i className="ti ti-logout" />
            </button>
          </div>
        </div>

        {/* INICIO */}
        {view === 'inicio' && (
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <InicioSummary
              myWorkedLabel={workedLabel || '0h'}
              myUncoveredLabel={uncoveredMin === 0 ? '0h' : uncoveredLabel}
              collaborator={collaborator}
              onEventAdded={() => setCalendarVersion(v => v + 1)}
            />
            <div style={{ flex: '1.2 1 340px', minWidth: 0 }}>
              <InicioCalendar collaborator={collaborator} refreshKey={calendarVersion} />
            </div>
          </div>
        )}

        {/* DAILY */}
        {view === 'daily' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--card)', borderRadius: 12, padding: '9px 14px', marginBottom: '1rem', border: '0.5px solid var(--border)' }}>
              <button onClick={() => setCurrentDate(d => offsetDate(d, -1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--brand)', padding: '4px', display: 'flex' }}><i className="ti ti-chevron-left" style={{ fontSize: 18 }} /></button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize', color: 'var(--text)' }}>{formatDate(currentDate)}</div>
                {currentDate !== today && <div style={{ fontSize: 10, color: 'var(--text4)', fontWeight: 300 }}>{new Date(currentDate + 'T12:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>}
              </div>
              <button onClick={() => setCurrentDate(d => offsetDate(d, 1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--brand)', padding: '4px', display: 'flex' }}><i className="ti ti-chevron-right" style={{ fontSize: 18 }} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: '1rem' }}>
              <div style={{ background: 'var(--card)', borderRadius: 12, padding: '11px 13px', border: '0.5px solid var(--border)' }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}><i className="ti ti-hourglass-filled" style={{ fontSize: 12 }} /> Horas registradas</div>
                <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--brand)', fontFamily: "'JetBrains Mono', monospace" }}>{workedLabel || '0h'}</div>
                <div style={{ fontSize: 10, color: 'var(--text4)', marginTop: 1 }}>de 9h laborales</div>
              </div>
              <div style={{ background: 'var(--card)', borderRadius: 12, padding: '11px 13px', border: '0.5px solid var(--border)' }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}><i className="ti ti-clock-x" style={{ fontSize: 12 }} /> Sin registrar</div>
                <div style={{ fontSize: 22, fontWeight: 600, color: uncoveredMin === 0 ? 'var(--success)' : 'var(--warning)', fontFamily: "'JetBrains Mono', monospace" }}>{uncoveredMin === 0 ? '0h' : uncoveredLabel}</div>
                <div style={{ fontSize: 10, color: 'var(--text4)', marginTop: 1 }}>{tasks.length} tarea{tasks.length !== 1 ? 's' : ''}</div>
              </div>
            </div>

            {tasks.some(t => t.start_time && t.end_time) && (
              <div style={{ background: 'var(--card)', borderRadius: 12, padding: '11px 14px', marginBottom: '1rem', border: '0.5px solid var(--border)' }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, marginBottom: 7, display: 'flex', justifyContent: 'space-between' }}>
                  <span><i className="ti ti-timeline" style={{ fontSize: 12, verticalAlign: -1 }} /> Cobertura del día</span>
                  <span style={{ color: motivation.color }}>{Math.round(workedMin / WORK_TOTAL * 100)}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 99, background: 'var(--bg)', display: 'flex', overflow: 'hidden' }}>
                  {segments.map((seg, i) => <div key={i} style={{ width: `${(seg.to - seg.from) / WORK_TOTAL * 100}%`, background: seg.covered ? 'var(--brand)' : 'var(--bg)' }} />)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text4)', marginTop: 4 }}><span>09:00</span><span>12:00</span><span>15:00</span><span>18:00</span></div>
              </div>
            )}

            <div style={{ background: motivation.bg, borderRadius: 12, padding: '9px 13px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ti ti-mood-smile" style={{ fontSize: 16, color: motivation.color }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: motivation.color }}>{motivation.msg}</span>
            </div>

            {tasks.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className="ti ti-list" style={{ fontSize: 12 }} /> Tareas del día
                </div>
                {tasks.map(t => <TaskItem key={t.id} task={t} onUpdate={updateTask} onDelete={deleteTask} />)}
              </div>
            )}

            {!loading && tasks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text4)' }}>
                <i className="ti ti-clipboard" style={{ fontSize: 32, display: 'block', marginBottom: 8 }} />
                <div style={{ fontSize: 13, fontWeight: 300 }}>Sin tareas para este día</div>
              </div>
            )}

            {showAddForm
              ? <AddTaskForm onAdd={addTask} onCancel={() => setShowAddForm(false)} defaultStartTime={lastTaskEndTime} />
              : <button onClick={() => setShowAddForm(true)} style={{ width: '100%', padding: '10px', borderRadius: 12, border: '0.5px dashed var(--text4)', background: 'transparent', fontSize: 13, color: 'var(--text3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, ...font, fontWeight: 500 }}>
                  <i className="ti ti-plus" style={{ fontSize: 15 }} /> Registrar tarea
                </button>}
          </>
        )}

        {view === 'weekly' && <WeeklySummary collaboratorId={collaborator.id} collaboratorName={collaborator.name} onSelectDay={(date) => { setCurrentDate(date); setView('daily') }} />}

        {view === 'invoices' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--card)', borderRadius: 12, padding: '9px 14px', marginBottom: '1rem', border: '0.5px solid var(--border)' }}>
              <button onClick={() => setCurrentDate(d => offsetDate(d, -1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--brand)', padding: '4px', display: 'flex' }}><i className="ti ti-chevron-left" style={{ fontSize: 18 }} /></button>
              <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize', color: 'var(--text)' }}>{formatDate(currentDate)}</div>
              <button onClick={() => setCurrentDate(d => offsetDate(d, 1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--brand)', padding: '4px', display: 'flex' }}><i className="ti ti-chevron-right" style={{ fontSize: 18 }} /></button>
            </div>
            <InvoiceActions collaboratorId={collaborator.id} currentDate={currentDate} />
          </>
        )}

        {view === 'help' && <HelpSection />}
        {view === 'supervisor' && isSupervisor && <SupervisorDashboard />}
        {view === 'users' && isSupervisor && <UserManagement currentUserId={collaborator.id} />}
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  )
}
