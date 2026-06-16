import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const { data: collaborators } = await supabase
    .from('collaborators').select('id, name, role, avatar')

  let tq = supabase.from('tasks').select('*').order('date').order('start_time')
  if (from) tq = tq.gte('date', from)
  if (to) tq = tq.lte('date', to)
  const { data: tasks } = await tq

  let aq = supabase.from('invoice_actions').select('*').order('date').order('created_at')
  if (from) aq = aq.gte('date', from)
  if (to) aq = aq.lte('date', to)
  const { data: actions } = await aq

  return NextResponse.json({
    collaborators: collaborators || [],
    tasks: tasks || [],
    actions: actions || [],
  })
}
