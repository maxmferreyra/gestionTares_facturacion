import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const collaborator_id = searchParams.get('collaborator_id')
  const date = searchParams.get('date')
  if (!collaborator_id) return NextResponse.json({ error: 'Falta collaborator_id' }, { status: 400 })
  let query = supabase.from('tasks').select('*').eq('collaborator_id', collaborator_id).order('start_time', { ascending: true }).order('created_at', { ascending: true })
  if (date) query = query.eq('date', date)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { collaborator_id, title, date, start_time, end_time, systems, tag, notes } = body
  if (!collaborator_id || !title) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })

  // Calculate hours from times
  let hours = 0
  if (start_time && end_time) {
    const [sh, sm] = start_time.split(':').map(Number)
    const [eh, em] = end_time.split(':').map(Number)
    hours = ((eh * 60 + em) - (sh * 60 + sm)) / 60
  }

  const { data, error } = await supabase.from('tasks')
    .insert({ collaborator_id, title, date: date || new Date().toISOString().split('T')[0], start_time: start_time || null, end_time: end_time || null, systems: systems || [], hours, tag: tag || 'General', notes: notes || null })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
