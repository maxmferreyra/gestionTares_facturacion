import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('collaborator_id', collaborator_id)
    .gte('date', week_start)
    .lte('date', end.toISOString().split('T')[0])
    .order('date')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
