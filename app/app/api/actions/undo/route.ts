import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { collaborator_id, date } = await req.json()
  if (!collaborator_id) return NextResponse.json({ error: 'Falta collaborator_id' }, { status: 400 })

  const today = date || new Date().toISOString().split('T')[0]

  // Find the last action for this collaborator today
  const { data: last, error: findError } = await supabase
    .from('invoice_actions')
    .select('id')
    .eq('collaborator_id', collaborator_id)
    .eq('date', today)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (findError || !last) return NextResponse.json({ error: 'No hay acciones para deshacer' }, { status: 404 })

  const { error } = await supabase.from('invoice_actions').delete().eq('id', last.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, deleted_id: last.id })
}
