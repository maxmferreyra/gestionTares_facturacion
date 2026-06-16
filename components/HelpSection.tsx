'use client'
import { useState } from 'react'

const font = { fontFamily: 'Montserrat, sans-serif' }

const USEFUL_LINKS = [
  { label: 'Coupa Invoices', url: 'https://disney.coupahost.com/invoices', icon: 'ti-file-invoice' },
  { label: 'Onbase', url: 'https://disney.hylandcloud.com/241idp/', icon: 'ti-folder' },
  { label: 'Brainware', url: 'https://webverifier.prod.disney.com/WebVerifierProd/BatchView.aspx', icon: 'ti-scan' },
  { label: 'SAP Web', url: 'https://sap.disney.com/sap/bc/ui5_ui5/ui2/ushell/shells/abap/Fiorilaunchpad.html#Shell-home', icon: 'ti-database' },
  { label: 'Creación Ticket FS', url: 'https://disney.service-now.com/dtoolsitsp?id=sc_cat_item&sys_id=948e02211bb10c50d90d43f4bd4bcb3f', icon: 'ti-ticket' },
  { label: 'FS Help', url: 'https://fshelp.disney.com/', icon: 'ti-help' },
]

interface HelpItem { title: string; icon: string; content: string }

const HELP_ITEMS: HelpItem[] = [
  { title: '¿Cómo registrar una tarea?', icon: 'ti-clipboard-plus', content: 'En la pestaña "Diario", hacé clic en "Registrar tarea". Buscá y seleccioná la tarea, completá el horario de inicio y fin, el sistema y la etiqueta. La duración se calcula automáticamente.' },
  { title: '¿Cómo registrar toques en sistemas?', icon: 'ti-file-invoice', content: 'En la pestaña "Facturas", desplegá el sistema correspondiente haciendo clic en él. Luego presioná "+" para sumar un toque o "−" para restar. En Brainware, al rechazar un documento podés indicar la razón.' },
  { title: '¿Cómo cambiar mi PIN?', icon: 'ti-lock', content: 'En la pantalla de login, hacé clic en "Olvidé mi PIN". Ingresá tu nombre y elegí un nuevo PIN de 4 a 8 dígitos.' },
  { title: '¿Cómo personalizar mi avatar?', icon: 'ti-mood-smile', content: 'Hacé clic en tu foto de perfil arriba a la izquierda y elegí tu Milo favorito de la galería.' },
  { title: '¿Cómo exportar a Excel?', icon: 'ti-file-spreadsheet', content: 'Desde el header, hacé clic en "Excel". Se descarga un archivo con tus tareas, acciones por sistema y resumen.' },
]

export default function HelpSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div style={font}>
      {/* Links útiles al inicio */}
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <i className="ti ti-link" style={{ fontSize: 14 }} /> Links útiles
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
        {USEFUL_LINKS.map(l => (
          <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, border: '0.5px solid var(--border)', background: 'var(--card)', textDecoration: 'none', transition: 'all .15s' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#CECBF6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className={`ti ${l.icon}`} style={{ fontSize: 16, color: '#3C3489' }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', flex: 1 }}>{l.label}</span>
            <i className="ti ti-external-link" style={{ fontSize: 14, color: 'var(--text3)' }} />
          </a>
        ))}
      </div>

      {/* Centro de ayuda */}
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
