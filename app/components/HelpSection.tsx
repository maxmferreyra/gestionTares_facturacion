'use client'
import { useState } from 'react'

const font = { fontFamily: 'Montserrat, sans-serif' }

const USEFUL_LINKS = [
  { label: 'Coupa Invoices', url: 'https://disney.coupahost.com/invoices', icon: 'ti-file-invoice', color: '#534AB7', bg: '#CECBF6' },
  { label: 'Onbase', url: 'https://disney.hylandcloud.com/241idp/', icon: 'ti-folder', color: '#854F0B', bg: '#FAEEDA' },
  { label: 'Brainware', url: 'https://webverifier.prod.disney.com/WebVerifierProd/BatchView.aspx', icon: 'ti-scan', color: '#185FA5', bg: '#E6F1FB' },
  { label: 'SAP Web', url: 'https://sap.disney.com/sap/bc/ui5_ui5/ui2/ushell/shells/abap/Fiorilaunchpad.html#Shell-home', icon: 'ti-database', color: '#3B6D11', bg: '#EAF3DE' },
  { label: 'Creación Ticket FS', url: 'https://disney.service-now.com/dtoolsitsp?id=sc_cat_item&sys_id=948e02211bb10c50d90d43f4bd4bcb3f', icon: 'ti-ticket', color: '#72243E', bg: '#FBEAF0' },
  { label: 'FS Help', url: 'https://fshelp.disney.com/', icon: 'ti-help', color: '#444441', bg: '#F1EFE8' },
]

interface HelpItem { title: string; icon: string; content: string }
const HELP_ITEMS: HelpItem[] = [
  { title: '¿Cómo registrar una tarea?', icon: 'ti-clipboard-plus', content: 'En la pestaña "Diario", hacé clic en "Registrar tarea". Buscá y seleccioná la tarea, completá el horario de inicio y fin, el sistema y la etiqueta. La duración se calcula automáticamente.' },
  { title: '¿Cómo registrar toques en sistemas?', icon: 'ti-file-invoice', content: 'En la pestaña "Facturas", desplegá el sistema correspondiente. Presioná "+" para sumar un toque o "−" para restar. En Coupa elegís la transición de estado origen → destino. En Brainware, al rechazar un documento podés indicar la razón.' },
  { title: '¿Cómo cambiar mi PIN?', icon: 'ti-lock', content: 'En la pantalla de login, hacé clic en "Olvidé mi PIN". Ingresá tu nombre y elegí un nuevo PIN de 4 a 8 dígitos.' },
  { title: '¿Cómo personalizar mi avatar?', icon: 'ti-mood-smile', content: 'Hacé clic en tu foto de perfil arriba a la izquierda y elegí tu Milo favorito de la galería.' },
  { title: '¿Cómo exportar a Excel?', icon: 'ti-file-spreadsheet', content: 'Desde el header, hacé clic en "Excel". Se descarga un archivo con tus tareas, acciones por sistema y resumen.' },
]

export default function HelpSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div style={font}>
      {/* LINKS ÚTILES — estilo destacado con gradiente */}
      <div style={{ background: 'linear-gradient(135deg, #534AB7 0%, #3C3489 100%)', borderRadius: 14, padding: '16px', marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.95)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="ti ti-rocket" style={{ fontSize: 15 }} /> Accesos rápidos
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {USEFUL_LINKS.map(l => (
            <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.95)', textDecoration: 'none', transition: 'transform .12s' }}
              onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseOut={e => (e.currentTarget.style.transform = 'translateY(0)')}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: l.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={`ti ${l.icon}`} style={{ fontSize: 15, color: l.color }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a18', flex: 1, lineHeight: 1.2 }}>{l.label}</span>
              <i className="ti ti-external-link" style={{ fontSize: 13, color: '#888780' }} />
            </a>
          ))}
        </div>
      </div>

      {/* CENTRO DE AYUDA — estilo acordeón estándar */}
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <i className="ti ti-help-circle" style={{ fontSize: 14 }} /> Centro de ayuda
      </div>
      {HELP_ITEMS.map((item, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <button onClick={() => setOpen(open === i ? null : i)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: open === i ? '10px 10px 0 0' : 10, border: `0.5px solid ${open === i ? '#534AB7' : 'var(--border)'}`, background: open === i ? '#CECBF633' : 'var(--card)', cursor: 'pointer', ...font }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: '#CECBF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={`ti ${item.icon}`} style={{ fontSize: 14, color: '#3C3489' }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', textAlign: 'left' }}>{item.title}</span>
            </div>
            <i className={`ti ${open === i ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: 15, color: open === i ? '#534AB7' : 'var(--text3)' }} />
          </button>
          {open === i && (
            <div style={{ border: '0.5px solid #534AB7', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '12px 16px', background: 'var(--card)' }}>
              <p style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 300, lineHeight: 1.6 }}>{item.content}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
