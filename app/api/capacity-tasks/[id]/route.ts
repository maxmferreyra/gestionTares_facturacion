import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type Ctx = { params: Promise<{ id: string }> }

// Supervisors: editar nombre, unidad de medida, valor de la unidad y/o tiempo estándar
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const body = await req.json()
  const update: Record<string, unknown> = {}

  if (body.name !== undefined) {
    if (!String(body.name).trim()) return NextResponse.json({ error: 'Falta el nombre' }, { status: 400 })
    update.name = String(body.name).trim()
  }
  if (body.unit !== undefined) {
    if (body.unit !== 'per_document' && body.unit !== 'minutes') {
      return NextResponse.json({ error: 'Unidad de medida inválida' }, { status: 400 })
    }
    update.unit = body.unit
  }
  if (body.unit_minutes !== undefined) {
    const n = Number(body.unit_minutes)
    if (isNaN(n) || n <= 0) return NextResponse.json({ error: 'Valor de unidad inválido' }, { status: 400 })
    update.unit_minutes = n
  }
  if (body.standard_minutes !== undefined) {
    const n = Number(body.standard_minutes)
    if (isNaN(n) || n <= 0) return NextResponse.json({ error: 'Tiempo estándar inválido' }, { status: 400 })
    update.standard_minutes = n
  }

  if (Object.keys(update).length === 0) return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 })

  const { data, error } = await supabase.from('capacity_tasks').update(update).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
