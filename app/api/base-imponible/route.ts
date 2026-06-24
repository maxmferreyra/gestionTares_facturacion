import { NextRequest, NextResponse } from 'next/server'
import { supabase, fetchAllRows } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Lista todas las correcciones pendientes/corregidas (paginado, sin límite de 1000 filas)
export async function GET() {
  const { data, error } = await fetchAllRows((rFrom, rTo) =>
    supabase.from('base_imponible_correcciones').select('*').order('added_at', { ascending: false }).range(rFrom, rTo)
  )
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

// Crea un nuevo pendiente
export async function POST(req: NextRequest) {
  const { company_code, vendor, invoice_number, amount, added_by_id, added_by_name } = await req.json()

  if (!company_code || !['4001', '4015'].includes(company_code)) {
    return NextResponse.json({ error: 'Company code inválido' }, { status: 400 })
  }
  if (!vendor || !vendor.trim()) return NextResponse.json({ error: 'Falta el vendor' }, { status: 400 })
  if (!invoice_number || !invoice_number.trim()) return NextResponse.json({ error: 'Falta el N° de invoice' }, { status: 400 })
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })
  }
  if (!added_by_id || !added_by_name) return NextResponse.json({ error: 'Falta el usuario' }, { status: 400 })

  const { data, error } = await supabase
    .from('base_imponible_correcciones')
    .insert({
      company_code,
      vendor: vendor.trim(),
      invoice_number: invoice_number.trim(),
      amount: Number(amount),
      added_by_id,
      added_by_name,
      status: 'pending',
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
