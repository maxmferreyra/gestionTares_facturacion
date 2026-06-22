import { NextRequest, NextResponse } from 'next/server'
import { supabase, fetchAllRows } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const { data: collaborators } = await supabase
    .from('collaborators').select('id, name, role, avatar')

  const { data: tasks } = await fetchAllRows((rFrom, rTo) => {
    let q = supabase.from('tasks').select('*').order('date').order('start_time').range(rFrom, rTo)
    if (from) q = q.gte('date', from)
    if (to) q = q.lte('date', to)
    return q
  })

  const { data: actions } = await fetchAllRows((rFrom, rTo) => {
    let q = supabase.from('invoice_actions').select('*').order('date').order('created_at').range(rFrom, rTo)
    if (from) q = q.gte('date', from)
    if (to) q = q.lte('date', to)
    return q
  })

  return NextResponse.json({
    collaborators: collaborators || [],
    tasks: tasks || [],
    actions: actions || [],
  })
}
