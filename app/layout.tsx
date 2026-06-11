import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Control de Tareas',
  description: 'Seguimiento de tareas diarias para colaboradores',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.x/dist/tabler-icons.min.css" />
      </head>
      <body>{children}</body>
    </html>
  )
}
