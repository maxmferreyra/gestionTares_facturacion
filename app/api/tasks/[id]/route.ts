import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const body = await req.json()
  const updates: Record<string, unknown> = {}

  if ('completed' in body) {
    updates.completed = body.completed
    updates.completed_at = body.completed ? new Date().toISOString() : null
  }
  if ('title' in body) updates.title = body.title
  if ('start_time' in body) updates.start_time = body.start_time
  if ('end_time' in body) updates.end_time = body.end_time
  if ('systems' in body) updates.systems = body.systems
  if ('tag' in body) updates.tag = body.tag
  if ('notes' in body) updates.notes = body.notes

  // Recalculate hours if times changed
  if (('start_time' in body || 'end_time' in body)) {
    const { data: current } = await supabase.from('tasks').select('start_time, end_time').eq('id', id).single()
    const st = body.start_time ?? current?.start_time
    const et = body.end_time ?? current?.end_time
    if (st && et) {
      const [sh, sm] = st.split(':').map(Number)
      const [eh, em] = et.split(':').map(Number)
      updates.hours = ((eh * 60 + em) - (sh * 60 + sm)) / 60
    }
  }

  const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
