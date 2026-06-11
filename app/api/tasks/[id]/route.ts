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
  if ('hours' in body) updates.hours = body.hours
  if ('tag' in body) updates.tag = body.tag
  if ('notes' in body) updates.notes = body.notes

  const { data, error } = await supabase
    .from('tasks').update(updates).eq('id', id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
