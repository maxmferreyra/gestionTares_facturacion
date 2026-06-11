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
  hours: number
  tag: string
  completed: boolean
  completed_at: string | null
  notes: string | null
  created_at: string
}

export const TAGS = ['General', 'Urgente', 'Reunión', 'Informe', 'Soporte', 'Cierre'] as const
export type Tag = typeof TAGS[number]
