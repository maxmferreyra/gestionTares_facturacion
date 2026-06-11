import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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
    .from('tasks')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await supabase.from('tasks').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
