import { NextRequest, NextResponse } from 'next/server'
import { supabase, fetchAllRows } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const collaborator_id = searchParams.get('collaborator_id')
  const week_start = searchParams.get('week_start') // YYYY-MM-DD (Monday)

  if (!collaborator_id || !week_start) {
    return NextResponse.json({ error: 'Parámetros faltantes' }, { status: 400 })
  }

  const start = new Date(week_start)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const weekEnd = end.toISOString().split('T')[0]

  const { data: tasks, error: tasksError } = await fetchAllRows((rFrom, rTo) =>
    supabase.from('tasks').select('*')
      .eq('collaborator_id', collaborator_id)
      .gte('date', week_start).lte('date', weekEnd)
      .order('date').range(rFrom, rTo)
  )
  if (tasksError) return NextResponse.json({ error: tasksError }, { status: 500 })

  const { data: actions, error: actionsError } = await fetchAllRows((rFrom, rTo) =>
    supabase.from('invoice_actions').select('*')
      .eq('collaborator_id', collaborator_id)
      .gte('date', week_start).lte('date', weekEnd)
      .order('date').range(rFrom, rTo)
  )
  if (actionsError) return NextResponse.json({ error: actionsError }, { status: 500 })

  return NextResponse.json({ tasks, actions })
}
