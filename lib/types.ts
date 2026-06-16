export interface Collaborator {
  id: string
  name: string
  role: 'collaborator' | 'supervisor'
  created_at: string
}

export interface Task {
  id: string
  collaborator_id: string
  title: string
  date: string
  start_time: string | null
  end_time: string | null
  systems: string[]
  hours: number
  tag: string
  completed: boolean
  completed_at: string | null
  notes: string | null
  created_at: string
}

export interface SystemCatalog { id: string; name: string }
export interface TagCatalog { id: string; name: string }

export const HOURS = Array.from({ length: 10 }, (_, i) => (i + 9).toString().padStart(2, '0'))
export const MINUTES = ['00', '15', '30', '45']

export function calcDuration(start: string, end: string) {
  if (!start || !end) return null
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const diff = (eh * 60 + em) - (sh * 60 + sm)
  if (diff <= 0) return null
  return { hours: Math.floor(diff / 60), minutes: diff % 60, total: diff / 60 }
}

export function formatDuration(start: string, end: string): string {
  const d = calcDuration(start, end)
  if (!d) return ''
  if (d.hours === 0) return `${d.minutes}min`
  if (d.minutes === 0) return `${d.hours}h`
  return `${d.hours}h ${d.minutes}min`
}

export const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  General:   { bg: '#F1EFE8', color: '#444441' },
  Urgente:   { bg: '#FAEEDA', color: '#854F0B' },
  'Reunión': { bg: '#CECBF6', color: '#3C3489' },
  Informe:   { bg: '#E6F1FB', color: '#185FA5' },
  Soporte:   { bg: '#EAF3DE', color: '#3B6D11' },
  Cierre:    { bg: '#FBEAF0', color: '#72243E' },
}

export function tagStyle(tag: string) {
  return TAG_COLORS[tag] || { bg: '#F1EFE8', color: '#444441' }
}

// Fecha local (no UTC) — evita el bug de que después de las 21hs ARG muestre el día siguiente
export function localToday(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function localOffsetDate(base: string, days: number): string {
  const [y, m, d] = base.split('-').map(Number)
  const date = new Date(y, m - 1, d + days)
  const yy = date.getFullYear()
  const mm = (date.getMonth() + 1).toString().padStart(2, '0')
  const dd = date.getDate().toString().padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}
