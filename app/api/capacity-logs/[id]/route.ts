import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const { quantity } = await req.json()
  if (quantity != null && quantity <= 0) {
    const { error } = await supabase.from('capacity_logs').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ deleted: true })
  }
  const { data, error } = await supabase.from('capacity_logs').update({ quantity }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
