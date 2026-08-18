'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const font = { fontFamily: 'Montserrat, sans-serif' }

export interface MobileNavCollaborator {
  id: string
  name: string
  role: string
  avatar?: string | null
}

interface NavItem {
  key: string
  label: string
  icon: string
  external?: string
  flag?: string
}

interface Props {
  collaborator: MobileNavCollaborator
  activeKey: string
  onNavigate: (key: string) => void
  onAvatarClick?: () => void
  onLogout?: () => void
  onExportExcel?: () => void
}

// 4 accesos fijos en la barra de abajo + "Más"
const PRIMARY_ITEMS: NavItem[] = [
  { key: 'inicio', label: 'Inicio', icon: 'ti-home-2' },
  { key: 'capacity', label: 'Capacity', icon: 'ti-chart-line', external: '/capacity' },
  { key: 'base-imponible', label: 'B. imp.', flag: 'ar', icon: 'ti-receipt-tax', external: '/base-imponible' },
  { key: 'boleto-brasil', label: 'Boleto', flag: 'br', icon: 'ti-barcode', external: '/boleto-brasil' },
]
const MORE_ITEMS: NavItem[] = [
  { key: 'particularidades', label: 'Particularidades', icon: 'ti-notes', external: '/particularidades' },
  { key: 'help', label: 'Ayuda', icon: 'ti-help-circle' },
]
const MORE_SUPERVISOR_ITEMS: NavItem[] = [
  { key: 'supervisor', label: 'Equipo', icon: 'ti-chart-bar' },
  { key: 'productividad', label: 'Productividad', icon: 'ti-gauge', external: '/productividad' },
  { key: 'users', label: 'Usuarios', icon: 'ti-users-group' },
]

export default function MobileNav({ collaborator, activeKey, onNavigate, onAvatarClick, onLogout, onExportExcel }: Props) {
  const router = useRouter()
  const [moreOpen, setMoreOpen] = useState(false)
  const isSupervisor = collaborator.role === 'supervisor'
  const initials = collaborator.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  function handleClick(item: NavItem) {
    setMoreOpen(false)
    if (item.external) router.push(item.external)
    else onNavigate(item.key)
  }
  function isActive(item: NavItem) {
    if (item.external) return activeKey === item.key || activeKey === item.external
    return activeKey === item.key
  }

  const moreList = [...MORE_ITEMS, ...(isSupervisor ? MORE_SUPERVISOR_ITEMS : [])]
  const anyMoreActive = moreList.some(isActive)

  return (
    <>
      {/* Top compact bar */}
      <div className="flex lg:hidden" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 80,
        alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', background: 'var(--card)', borderBottom: '0.5px solid var(--border)', ...font,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <img src="/logo-milo.png" alt="Milo" style={{ width: 20, height: 20, objectFit: 'contain' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Milo</span>
        </div>
        <button onClick={onAvatarClick} style={{ width: 28, height: 28, borderRadius: '50%', background: '#fff', border: '1.5px solid var(--brand-soft)', padding: 0, cursor: onAvatarClick ? 'pointer' : 'default', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {collaborator.avatar
            ? <img src={collaborator.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            : <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--brand)' }}>{initials}</span>}
        </button>
      </div>

      {/* "Más" drawer */}
      {moreOpen && (
        <div className="lg:hidden" style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(11,43,38,0.35)' }} onClick={() => setMoreOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            position: 'fixed', bottom: 64, left: 0, right: 0, background: 'var(--card)',
            borderRadius: '18px 18px 0 0', padding: '14px 16px 18px', ...font,
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Más opciones</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              {moreList.map(item => (
                <button key={item.key} onClick={() => handleClick(item)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 11px', borderRadius: 10, border: 'none', background: isActive(item) ? 'var(--brand)' : 'var(--bg)', color: isActive(item) ? '#fff' : 'var(--text)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', ...font }}>
                  <i className={`ti ${item.icon}`} style={{ fontSize: 16 }} />{item.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {onExportExcel && (
                <button onClick={() => { setMoreOpen(false); onExportExcel() }}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px', borderRadius: 10, border: 'none', background: 'var(--success-bg)', color: 'var(--success)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', ...font }}>
                  <i className="ti ti-file-spreadsheet" style={{ fontSize: 15 }} /> Excel
                </button>
              )}
              {onLogout && (
                <button onClick={() => { setMoreOpen(false); onLogout() }}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px', borderRadius: 10, border: '0.5px solid var(--border)', background: 'transparent', color: 'var(--text3)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', ...font }}>
                  <i className="ti ti-logout" style={{ fontSize: 15 }} /> Salir
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div className="flex lg:hidden" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 80,
        background: 'var(--card)', borderTop: '0.5px solid var(--border)',
        padding: '7px 4px calc(7px + env(safe-area-inset-bottom, 0px))', ...font,
      }}>
        {PRIMARY_ITEMS.map(item => (
          <button key={item.key} onClick={() => handleClick(item)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, border: 'none', background: 'transparent', cursor: 'pointer', color: isActive(item) ? 'var(--brand)' : 'var(--text4)', padding: '4px 0', ...font }}>
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <i className={`ti ${item.icon}`} style={{ fontSize: 19 }} />
              {item.flag && <img src={`https://flagcdn.com/12x9/${item.flag}.png`} alt={item.flag} style={{ position: 'absolute', bottom: -2, right: -5, width: 12, height: 9, borderRadius: 1 }} />}
            </div>
            <span style={{ fontSize: 9, fontWeight: isActive(item) ? 600 : 500 }}>{item.label}</span>
          </button>
        ))}
        <button onClick={() => setMoreOpen(v => !v)}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, border: 'none', background: 'transparent', cursor: 'pointer', color: (moreOpen || anyMoreActive) ? 'var(--brand)' : 'var(--text4)', padding: '4px 0', ...font }}>
          <i className="ti ti-menu-2" style={{ fontSize: 19 }} />
          <span style={{ fontSize: 9, fontWeight: (moreOpen || anyMoreActive) ? 600 : 500 }}>Más</span>
        </button>
      </div>
    </>
  )
}
