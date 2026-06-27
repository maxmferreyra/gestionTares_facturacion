'use client'
import { useEffect, useState } from 'react'
import { localToday } from '@/lib/types'

const font = { fontFamily: 'Montserrat, sans-serif' }
const mono = { fontFamily: "'JetBrains Mono', monospace" }

const ABSENCE_LABELS: Record<string, string> = { vacaciones: 'Vacaciones', estudio: 'Día de estudio', licencia_medica: 'Licencia médica', otro: 'Otro' }
const TEAM_EVENT_LABELS: Record<string, string> = { feriado: 'Feriado', fecha_importante: 'Fecha importante' }

interface Props {
  myWorkedLabel: string
  myUncoveredLabel: string
  collaborator: { id: string; name: string }
  onEventAdded: () => void
}

interface ActionRow { date: string }
interface TaskRow { date: string }

export default function InicioSummary({ myWorkedLabel, myUncoveredLabel, collaborator, onEventAdded }: Props) {
  const today = localToday()
  const [loading, setLoading] = useState(true)
  const [teamTouchesToday, setTeamTouchesToday] = useState(0)
  const [teamTasksToday, setTeamTasksToday] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [teamMemberCount, setTeamMemberCount] = useState(0)

  // Form de agregar al calendario
  const [formOpen, setFormOpen] = useState<'absence' | 'team_event' | null>(null)
  const [absenceType, setAbsenceType] = useState('vacaciones')
  const [teamEventType, setTeamEventType] = useState('feriado')
  const [title, setTitle] = useState('')
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(today)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [supRes, baseImpRes] = await Promise.all([
        fetch(`/api/supervisor?from=${today}&to=${today}`, { cache: 'no-store' }),
        fetch('/api/base-imponible', { cache: 'no-store' }),
      ])
      const supData = await supRes.json()
      const baseImpData = await baseImpRes.json()

      const allActions: ActionRow[] = Array.isArray(supData.actions) ? supData.actions : []
      const allTasks: TaskRow[] = Array.isArray(supData.tasks) ? supData.tasks : []
      setTeamTouchesToday(allActions.length)
      setTeamTasksToday(allTasks.length)
      setTeamMemberCount(Array.isArray(supData.collaborators) ? supData.collaborators.filter((c: { role: string }) => c.role === 'collaborator').length : 0)

      const pending = Array.isArray(baseImpData)
        ? baseImpData.filter((it: { status: string; added_by_id: string }) => it.status === 'pending' && it.added_by_id === collaborator.id).length
        : 0
      setPendingCount(pending)
      setLoading(false)
    }
    load()
  }, [today, collaborator.id])

  function openForm(kind: 'absence' | 'team_event') {
    setFormOpen(kind); setFormError(''); setTitle(''); setDateFrom(today); setDateTo(today)
    setAbsenceType('vacaciones'); setTeamEventType('feriado')
  }

  async function submitForm() {
    setFormError('')
    if (dateTo < dateFrom) { setFormError('La fecha de fin no puede ser anterior a la de inicio'); return }
    if (formOpen === 'team_event' && !title.trim()) { setFormError('Ingresá un título para el evento'); return }
    setSaving(true)
    const res = await fetch('/api/calendar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: formOpen,
        absence_type: formOpen === 'absence' ? absenceType : undefined,
        team_event_type: formOpen === 'team_event' ? teamEventType : undefined,
        title: title.trim() || null,
        date_from: dateFrom, date_to: dateTo,
        created_by_id: collaborator.id, created_by_name: collaborator.name,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setFormError(data.error || 'Error al guardar'); return }
    setFormOpen(null)
    onEventAdded()
  }

  const inputStyle = { width: '100%', padding: '7px 10px', borderRadius: 8, border: '0.5px solid var(--border)', fontSize: 12, outline: 'none', background: 'var(--input-bg)', color: 'var(--text)', ...font }

  return (
    <div style={{ flex: '1 1 280px', minWidth: 0, ...font }}>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <i className="ti ti-user-circle" style={{ fontSize: 13 }} /> Mi día
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1, background: 'var(--card)', borderRadius: 12, border: '0.5px solid var(--border)', padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>Registradas</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--brand)', ...mono }}>{myWorkedLabel}</div>
        </div>
        <div style={{ flex: 1, background: 'var(--card)', borderRadius: 12, border: '0.5px solid var(--border)', padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>Sin registrar</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--warning)', ...mono }}>{myUncoveredLabel}</div>
        </div>
      </div>

      <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <i className="ti ti-users" style={{ fontSize: 13 }} /> Actividad del equipo hoy
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1, background: 'var(--brand)', borderRadius: 12, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: 'var(--brand-tint)', marginBottom: 4 }}>Toques del equipo</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', ...mono }}>{loading ? '—' : teamTouchesToday}</div>
          {teamMemberCount > 0 && <div style={{ fontSize: 9, color: 'var(--brand-soft)', marginTop: 2 }}>entre {teamMemberCount} colaboradores</div>}
        </div>
        <div style={{ flex: 1, background: 'var(--card)', borderRadius: 12, border: '0.5px solid var(--border)', padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>Tareas del equipo</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', ...mono }}>{loading ? '—' : teamTasksToday}</div>
          <div style={{ fontSize: 9, color: 'var(--text4)', marginTop: 2 }}>registradas hoy</div>
        </div>
      </div>

      {!loading && pendingCount > 0 && (
        <a href="/base-imponible" style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'var(--warning-bg)', borderRadius: 12, padding: '10px 13px', textDecoration: 'none', marginBottom: 16 }}>
          <i className="ti ti-receipt-tax" style={{ fontSize: 15, color: 'var(--warning)', flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 11, color: 'var(--warning)', fontWeight: 500 }}>
            Tenés <strong>{pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}</strong> en Base imponible
          </div>
          <i className="ti ti-chevron-right" style={{ fontSize: 13, color: 'var(--warning)' }} />
        </a>
      )}

      {/* Agregar al calendario */}
      <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <i className="ti ti-calendar-plus" style={{ fontSize: 13 }} /> Agregar al calendario
      </div>
      <div style={{ display: 'flex', gap: 7, marginBottom: formOpen ? 10 : 0 }}>
        <button onClick={() => openForm('absence')}
          style={{ flex: 1, padding: '9px 8px', borderRadius: 10, border: 'none', background: formOpen === 'absence' ? 'var(--brand-dark)' : 'var(--brand)', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, ...font }}>
          <i className="ti ti-beach" style={{ fontSize: 16 }} /> Mi ausencia
        </button>
        <button onClick={() => openForm('team_event')}
          style={{ flex: 1, padding: '9px 8px', borderRadius: 10, border: '0.5px solid var(--border)', background: formOpen === 'team_event' ? 'var(--hover)' : 'var(--card)', color: 'var(--brand)', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, ...font }}>
          <i className="ti ti-calendar-event" style={{ fontSize: 16 }} /> Evento equipo
        </button>
      </div>

      {formOpen && (
        <div style={{ background: 'var(--card)', border: '0.5px solid var(--brand-soft)', borderRadius: 12, padding: 13 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            {formOpen === 'absence' ? (
              <div>
                <label style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, display: 'block', marginBottom: 3 }}>Tipo</label>
                <select value={absenceType} onChange={e => setAbsenceType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {Object.entries(ABSENCE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, display: 'block', marginBottom: 3 }}>Tipo</label>
                <select value={teamEventType} onChange={e => setTeamEventType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {Object.entries(TEAM_EVENT_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </div>
            )}
            <div>
              <label style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, display: 'block', marginBottom: 3 }}>{formOpen === 'team_event' ? 'Título' : 'Nota (opc.)'}</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder={formOpen === 'team_event' ? 'Ej: Cierre mensual' : 'Opcional'} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, display: 'block', marginBottom: 3 }}>Desde</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, display: 'block', marginBottom: 3 }}>Hasta</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
            </div>
          </div>
          {formError && <div style={{ fontSize: 11, color: 'var(--error)', background: 'var(--error-bg)', padding: '6px 9px', borderRadius: 7, marginBottom: 9 }}>{formError}</div>}
          <div style={{ display: 'flex', gap: 7 }}>
            <button onClick={submitForm} disabled={saving} style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1, ...font }}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={() => setFormOpen(null)} style={{ padding: '8px 14px', borderRadius: 8, border: '0.5px solid var(--border)', background: 'transparent', fontSize: 12, cursor: 'pointer', color: 'var(--text3)', ...font }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
