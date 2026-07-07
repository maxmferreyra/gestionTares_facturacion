import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type Ctx = { params: Promise<{ id: string }> }

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  // Desactiva en vez de borrar para no romper el historial
  const { error } = await supabase.from('task_catalog').update({ active: false }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
