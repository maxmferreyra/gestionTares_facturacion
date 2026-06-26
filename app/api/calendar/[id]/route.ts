import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type RouteContext = { params: Promise<{ id: string }> }

export async function DELETE(req: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const { error } = await supabase.from('calendar_events').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
