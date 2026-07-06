'use client'
import { useRouter } from 'next/navigation'

const font = { fontFamily: 'Montserrat, sans-serif' }

export interface SidebarCollaborator {
  id: string
  name: string
  role: string
  avatar?: string | null
}

interface NavItem {
  key: string
  label: string
  icon: string
  external?: string // si está seteado, navega a esta ruta en vez de cambiar el view interno
}

interface Props {
  collaborator: SidebarCollaborator
  activeKey: string
  onNavigate: (key: string) => void
  onAvatarClick?: () => void
  teamNames?: string[] // iniciales de gente activa hoy, opcional
}

const COLLAB_ITEMS: NavItem[] = [
  { key: 'inicio', label: 'Inicio', icon: 'ti-home-2' },
  { key: 'daily', label: 'Tareas', icon: 'ti-clipboard-list' },
  { key: 'weekly', label: 'Semana', icon: 'ti-calendar-week' },
  { key: 'invoices', label: 'Facturas', icon: 'ti-file-invoice' },
  { key: 'base-imponible', label: 'Base imponible 🇦🇷', icon: 'ti-receipt-tax', external: '/base-imponible' },
  { key: 'boleto-brasil', label: 'Boleto 🇧🇷', icon: 'ti-barcode', external: '/boleto-brasil' },
  { key: 'help', label: 'Ayuda', icon: 'ti-help-circle' },
]
const SUPERVISOR_ITEMS: NavItem[] = [
  { key: 'supervisor', label: 'Equipo', icon: 'ti-chart-bar' },
  { key: 'productividad', label: 'Productividad', icon: 'ti-gauge', external: '/productividad' },
  { key: 'users', label: 'Usuarios', icon: 'ti-users-group' },
]

export default function Sidebar({ collaborator, activeKey, onNavigate, onAvatarClick, teamNames = [] }: Props) {
  const router = useRouter()
  const isSupervisor = collaborator.role === 'supervisor'
  const initials = collaborator.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  function handleClick(item: NavItem) {
    if (item.external) router.push(item.external)
    else onNavigate(item.key)
  }

  function isActive(item: NavItem) {
    if (item.external) return activeKey === item.key || activeKey === item.external
    return activeKey === item.key
  }

  return (
    <div className="hidden lg:flex" style={{
      width: 222, flexShrink: 0, background: 'linear-gradient(165deg, var(--brand-dark) 0%, var(--brand-darkest) 100%)',
      borderRadius: 22, padding: '22px 16px', flexDirection: 'column', color: '#fff',
      position: 'relative', overflow: 'hidden', minHeight: 'calc(100vh - 44px)', ...font,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 26, paddingLeft: 4 }}>
        <img src="/logo-milo.png" alt="Milo" style={{ width: 28, height: 28, objectFit: 'contain' }} />
        <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '0.3px' }}>Milo</span>
      </div>

      {/* Profile */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 26 }}>
        <button onClick={onAvatarClick} title="Cambiar avatar"
          style={{ width: 60, height: 60, borderRadius: '50%', background: '#fff', border: '2.5px solid var(--brand-soft)', padding: 0, cursor: onAvatarClick ? 'pointer' : 'default', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 9 }}>
          {collaborator.avatar
            ? <img src={collaborator.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            : <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--brand)' }}>{initials}</span>}
        </button>
        <div style={{ fontSize: 12, fontWeight: 600, textAlign: 'center' }}>{collaborator.name}</div>
        <div style={{ fontSize: 10, color: 'var(--brand-soft)', fontWeight: 500, marginTop: 1 }}>{isSupervisor ? '⭐ Supervisor' : 'Colaborador'}</div>
      </div>

      {/* Nav */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
        {COLLAB_ITEMS.map(item => (
          <button key={item.key} onClick={() => handleClick(item)}
            style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 11px', borderRadius: 10, fontSize: 12.5, fontWeight: 500, border: 'none', textAlign: 'left', cursor: 'pointer', background: isActive(item) ? 'var(--brand)' : 'transparent', color: isActive(item) ? '#fff' : '#cfe3da', ...font }}>
            <i className={`ti ${item.icon}`} style={{ fontSize: 15, width: 17, textAlign: 'center' }} />{item.label}
          </button>
        ))}

        {isSupervisor && (
          <>
            <div style={{ fontSize: 9, color: '#5f8276', textTransform: 'uppercase', letterSpacing: '.08em', margin: '13px 0 3px 11px', fontWeight: 600 }}>Supervisor</div>
            {SUPERVISOR_ITEMS.map(item => (
              <button key={item.key} onClick={() => handleClick(item)}
                style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 11px', borderRadius: 10, fontSize: 12.5, fontWeight: 500, border: 'none', textAlign: 'left', cursor: 'pointer', background: isActive(item) ? 'var(--brand)' : 'transparent', color: isActive(item) ? '#fff' : '#cfe3da', ...font }}>
                <i className={`ti ${item.icon}`} style={{ fontSize: 15, width: 17, textAlign: 'center' }} />{item.label}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      {teamNames.length > 0 && (
        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 9, color: 'var(--brand-soft)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 7 }}>Equipo activo hoy</div>
          <div style={{ display: 'flex' }}>
            {teamNames.slice(0, 4).map((n, i) => (
              <span key={i} style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--brand-soft)', border: '2px solid var(--brand-dark)', marginLeft: i === 0 ? 0 : -8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: 'var(--brand-dark)' }}>
                {n}
              </span>
            ))}
            {teamNames.length > 4 && (
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '2px solid var(--brand-dark)', marginLeft: -8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff' }}>
                +{teamNames.length - 4}
              </span>
            )}
          </div>
        </div>
      )}
      <i className="ti ti-paw-filled" style={{ position: 'absolute', bottom: -28, right: -28, fontSize: 130, opacity: 0.06, pointerEvents: 'none' }} />
    </div>
  )
}
