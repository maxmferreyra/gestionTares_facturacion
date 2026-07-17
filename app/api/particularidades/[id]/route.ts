import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const { title, body } = await req.json()
  const updates: Record<string, string> = {}
  if (title?.trim()) updates.title = title.trim()
  if (body?.trim()) updates.body = body.trim()
  const { data, error } = await supabase.from('particularidades')
    .update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const { error } = await supabase.from('particularidades').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
