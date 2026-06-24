import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type RouteContext = { params: Promise<{ id: string }> }

// Marca un pendiente como corregido.
// IMPORTANTE: "date" lo calcula el cliente con localToday() (fecha local Argentina) —
// el servidor (Vercel) corre en UTC, así que nunca calcula "hoy" por su cuenta,
// igual que el resto de los endpoints de Milo (ver app/api/actions/route.ts).
export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const { corrected_by_id, corrected_by_name, date } = await req.json()

  if (!corrected_by_id || !corrected_by_name || !date) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  // 1) Marcar la corrección como "done"
  const { data: updated, error: updateError } = await supabase
    .from('base_imponible_correcciones')
    .update({
      status: 'done',
      corrected_by_id,
      corrected_by_name,
      corrected_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select().single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // 2) Insertar el toque en invoice_actions — misma tabla que usa el botón "xN" de Facturas.
  //    No se toca /api/actions/bulk ni nada de esa sección, solo se reutiliza la tabla.
  const { error: actionError } = await supabase
    .from('invoice_actions')
    .insert({
      collaborator_id: corrected_by_id,
      system: 'sap',
      action: 'modif_base_imponible',
      date,
      reason: null,
    })

  if (actionError) {
    // La corrección ya se guardó; avisamos si el toque no pudo registrarse, sin revertir.
    return NextResponse.json({ ...updated, _actionWarning: actionError.message })
  }

  return NextResponse.json(updated)
}

// Revertir una corrección a pendiente (por si alguien se equivoca al tocar el check)
export async function DELETE(req: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const { error } = await supabase.from('base_imponible_correcciones').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
