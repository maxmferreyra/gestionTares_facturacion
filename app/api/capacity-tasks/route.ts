import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabase
    .from('capacity_tasks').select('*').eq('active', true).order('sort_order')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// Supervisors: update standard_minutes for a task
export async function PATCH(req: NextRequest) {
  const { task_key, standard_minutes } = await req.json()
  if (!task_key || standard_minutes == null) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const { data, error } = await supabase
    .from('capacity_tasks').update({ standard_minutes }).eq('task_key', task_key).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
