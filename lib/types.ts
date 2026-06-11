export interface Collaborator {
  id: string
  name: string
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

export interface SystemCatalog {
  id: string
  name: string
}

export interface TagCatalog {
  id: string
  name: string
}

export const HOURS = Array.from({ length: 10 }, (_, i) => {
  const h = i + 9
  return h.toString().padStart(2, '0')
}) // 09..18

export const MINUTES = ['00', '15', '30', '45']

export function calcDuration(start: string, end: string): { hours: number; minutes: number; total: number } | null {
  if (!start || !end) return null
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const startMin = sh * 60 + sm
  const endMin = eh * 60 + em
  if (endMin <= startMin) return null
  const diff = endMin - startMin
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
  General:  { bg: '#F1EFE8', color: '#444441' },
  Urgente:  { bg: '#FAEEDA', color: '#854F0B' },
  'Reunión': { bg: '#CECBF6', color: '#3C3489' },
  Informe:  { bg: '#E6F1FB', color: '#185FA5' },
  Soporte:  { bg: '#EAF3DE', color: '#3B6D11' },
  Cierre:   { bg: '#FBEAF0', color: '#72243E' },
}

export function tagStyle(tag: string) {
  return TAG_COLORS[tag] || { bg: '#F1EFE8', color: '#444441' }
}
