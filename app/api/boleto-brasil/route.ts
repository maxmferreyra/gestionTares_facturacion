import { NextRequest, NextResponse } from 'next/server'
import { supabase, fetchAllRows } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const { data, error } = await fetchAllRows((from, to) =>
    supabase.from('boleto_brasil').select('*').order('added_at', { ascending: false }).range(from, to)
  )
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { company_code, vendor, nf_number, boleto_number, added_by_id, added_by_name } = await req.json()
  if (!company_code || !vendor?.trim() || !nf_number?.trim() || !boleto_number?.trim() || !added_by_id)
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

  const { data, error } = await supabase.from('boleto_brasil')
    .insert({ company_code, vendor: vendor.trim(), nf_number: nf_number.trim(), boleto_number: boleto_number.trim(), added_by_id, added_by_name })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
