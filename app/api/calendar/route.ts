import { NextRequest, NextResponse } from 'next/server'
import { supabase, fetchAllRows } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Lista eventos (ausencias + eventos del equipo) que se solapan con el rango dado.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const { data, error } = await fetchAllRows((rFrom, rTo) => {
    let q = supabase.from('calendar_events').select('*').order('date_from').range(rFrom, rTo)
    if (from) q = q.gte('date_to', from)   // el evento termina después (o en) el inicio del rango pedido
    if (to) q = q.lte('date_from', to)     // y empieza antes (o en) el fin del rango pedido
    return q
  })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

// Crea una ausencia personal o un evento del equipo. Cualquier usuario logueado puede crear ambos tipos.
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { kind, absence_type, team_event_type, collaborator_id, title, date_from, date_to, created_by_id, created_by_name } = body

  if (!kind || !['absence', 'team_event'].includes(kind)) {
    return NextResponse.json({ error: 'Tipo de evento inválido' }, { status: 400 })
  }
  if (!date_from || !date_to) return NextResponse.json({ error: 'Faltan las fechas' }, { status: 400 })
  if (date_to < date_from) return NextResponse.json({ error: 'La fecha de fin no puede ser anterior a la de inicio' }, { status: 400 })
  if (!created_by_id || !created_by_name) return NextResponse.json({ error: 'Falta el usuario' }, { status: 400 })

  const row: Record<string, unknown> = { kind, date_from, date_to, created_by_id, created_by_name, title: title || null }

  if (kind === 'absence') {
    if (!absence_type || !['vacaciones', 'estudio', 'licencia_medica', 'otro'].includes(absence_type)) {
      return NextResponse.json({ error: 'Tipo de ausencia inválido' }, { status: 400 })
    }
    row.absence_type = absence_type
    row.collaborator_id = collaborator_id || created_by_id // por defecto, uno mismo
  } else {
    if (!team_event_type || !['feriado', 'fecha_importante'].includes(team_event_type)) {
      return NextResponse.json({ error: 'Tipo de evento inválido' }, { status: 400 })
    }
    if (!title || !title.trim()) return NextResponse.json({ error: 'Ingresá un título para el evento' }, { status: 400 })
    row.team_event_type = team_event_type
  }

  const { data, error } = await supabase.from('calendar_events').insert(row).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
