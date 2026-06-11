import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Control de Tareas',
  description: 'Seguimiento de tareas diarias para colaboradores',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
