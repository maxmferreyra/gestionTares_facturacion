import { NextRequest, NextResponse } from 'next/server'
import { supabase, fetchAllRows } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const collaborator_id = searchParams.get('collaborator_id')
  const date_from = searchParams.get('date_from')
  const date_to = searchParams.get('date_to')
  const all = searchParams.get('all') === 'true'

  const { data, error } = await fetchAllRows((from, to) => {
    let q = supabase.from('capacity_logs').select('*').order('date').order('created_at').range(from, to)
    if (!all && collaborator_id) q = q.eq('collaborator_id', collaborator_id)
    if (date_from) q = q.gte('date', date_from)
    if (date_to) q = q.lte('date', date_to)
    return q
  })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { collaborator_id, task_key, date, quantity } = await req.json()
  if (!collaborator_id || !task_key || !date) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const qty = Math.max(1, parseInt(quantity) || 1)

  // Find existing log for same person+task+date and upsert quantity
  const { data: existing } = await supabase
    .from('capacity_logs').select('id, quantity')
    .eq('collaborator_id', collaborator_id).eq('task_key', task_key).eq('date', date).single()

  if (existing) {
    const { data, error } = await supabase
      .from('capacity_logs').update({ quantity: existing.quantity + qty })
      .eq('id', existing.id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  const { data, error } = await supabase
    .from('capacity_logs').insert({ collaborator_id, task_key, date, quantity: qty }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
