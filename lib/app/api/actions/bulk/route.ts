import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Crea múltiples registros individuales de una sola vez (carga masiva)
// Cada toque queda como una fila separada en la base — se mantiene auditable
// (se puede ver, contar y borrar cada uno individualmente, igual que si se
// hubiese tocado "+" repetidas veces).
export async function POST(req: NextRequest) {
  const { collaborator_id, system, action, date, reason, quantity } = await req.json()

  if (!collaborator_id || !system || !action) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const qty = Math.floor(Number(quantity))
  if (!qty || qty < 1) return NextResponse.json({ error: 'Cantidad inválida' }, { status: 400 })
  if (qty > 500) return NextResponse.json({ error: 'Máximo 500 toques por carga' }, { status: 400 })

  const effDate = date || new Date().toISOString().split('T')[0]
  const rows = Array.from({ length: qty }, () => ({
    collaborator_id,
    system,
    action,
    date: effDate,
    reason: reason || null,
  }))

  const { data, error } = await supabase.from('invoice_actions').insert(rows).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ inserted: data.length, rows: data })
}
