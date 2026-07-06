import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { localToday } from '@/lib/types'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const { loaded_by_id, loaded_by_name, date } = await req.json()
  if (!loaded_by_id || !date) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

  const { data, error } = await supabase.from('boleto_brasil')
    .update({ status: 'done', loaded_by_id, loaded_by_name, loaded_at: new Date().toISOString() })
    .eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Toque en invoice_actions
  await supabase.from('invoice_actions').insert({
    collaborator_id: loaded_by_id, system: 'sap',
    action: 'brasil_mod_reference_boleto', date, reason: null,
  })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const { error } = await supabase.from('boleto_brasil').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
