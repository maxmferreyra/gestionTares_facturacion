'use client'
import { useState } from 'react'

const font = { fontFamily: 'Montserrat, sans-serif' }

interface HelpItem {
  title: string
  icon: string
  content: string
  links?: { label: string; url: string }[]
}

const HELP_ITEMS: HelpItem[] = [
  {
    title: '¿Cómo registrar una tarea?',
    icon: 'ti-clipboard-plus',
    content: 'En la pestaña "Diario", hacé clic en "Registrar tarea". Completá el nombre, horario de inicio y fin, el sistema y la etiqueta. La duración se calcula automáticamente.',
  },
  {
    title: '¿Cómo registrar toques en sistemas?',
    icon: 'ti-file-invoice',
    content: 'En la pestaña "Facturas", desplegá el sistema correspondiente haciendo clic en él. Luego presioná "+" para sumar un toque o "−" para restar.',
  },
  {
    title: '¿Cómo cambiar mi PIN?',
    icon: 'ti-lock',
    content: 'En la pantalla de login, hacé clic en "Olvidé mi PIN". Ingresá tu nombre y elegí un nuevo PIN de 4 a 8 dígitos.',
  },
  {
    title: '¿Cómo exportar a Excel?',
    icon: 'ti-file-spreadsheet',
    content: 'Desde el header de la app, hacé clic en el botón "Excel". Se descargará un archivo con 3 hojas: Tareas, Acciones por sistema, y Resumen.',
  },
  {
    title: 'Sistemas del proceso',
    icon: 'ti-server',
    content: 'El proceso de facturas involucra: Brainware (OCR/escaneo), Onbase (filtro automático), Coupa (aprobación principal) y SAP (contabilidad y pagos). Las facturas CSP omiten Brainware y Onbase.',
  },
  {
    title: 'Estados de facturas en Coupa',
    icon: 'ti-arrows-exchange',
    content: 'Draft: borrador con irregularidades. Pending Approval: listo para editar y aprobar. Approved: aprobado y migrado a SAP. Rejected: rechazado por SAP. Disputed: problema con PO/GR. Void/Abandon: factura anulada.',
  },
  {
    title: 'Links útiles',
    icon: 'ti-link',
    content: 'Accesos rápidos a los sistemas y documentación del equipo.',
    links: [
      { label: 'Coupa', url: 'https://supplier.coupahost.com' },
      { label: 'SAP', url: 'https://www.sap.com' },
      { label: 'Onbase', url: '#' },
      { label: 'Brainware', url: '#' },
    ],
  },
]

export default function HelpSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div style={font}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
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
              <p style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 300, lineHeight: 1.6, marginBottom: item.links ? 12 : 0 }}>{item.content}</p>
              {item.links && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {item.links.map(l => (
                    <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, color: '#534AB7', background: '#CECBF633', padding: '4px 10px', borderRadius: 20, textDecoration: 'none' }}>
                      <i className="ti ti-external-link" style={{ fontSize: 12 }} />{l.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
