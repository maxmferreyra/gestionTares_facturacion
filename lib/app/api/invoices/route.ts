import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const collaborator_id = searchParams.get('collaborator_id')
  const q = searchParams.get('q') || ''
  if (!collaborator_id) return NextResponse.json({ error: 'Falta collaborator_id' }, { status: 400 })

  let query = supabase
    .from('invoices')
    .select('*')
    .eq('collaborator_id', collaborator_id)
    .order('created_at', { ascending: false })

  if (q) query = query.ilike('invoice_number', `%${q}%`)

  const { data, error } = await query.limit(10)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { collaborator_id, invoice_number, origin } = await req.json()
  if (!collaborator_id || !invoice_number?.trim()) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  // Check duplicate
  const { data: existing } = await supabase
    .from('invoices')
    .select('id')
    .eq('collaborator_id', collaborator_id)
    .ilike('invoice_number', invoice_number.trim())
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Esta factura ya existe', duplicate: true }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('invoices')
    .insert({ collaborator_id, invoice_number: invoice_number.trim(), origin: origin || 'OCR' })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
