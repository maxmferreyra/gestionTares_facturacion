import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const collaborator_id = searchParams.get('collaborator_id')
  const date = searchParams.get('date')
  if (!collaborator_id) return NextResponse.json({ error: 'Falta collaborator_id' }, { status: 400 })
  let query = supabase.from('invoice_actions').select('*').eq('collaborator_id', collaborator_id).order('created_at', { ascending: true })
  if (date) query = query.eq('date', date)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { collaborator_id, system, action, date, reason } = await req.json()
  if (!collaborator_id || !system || !action) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  const { data, error } = await supabase.from('invoice_actions')
    .insert({ collaborator_id, system, action, date: date || new Date().toISOString().split('T')[0], reason: reason || null })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
