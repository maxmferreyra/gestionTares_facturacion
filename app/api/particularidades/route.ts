import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const { data, error } = await supabase
    .from('particularidades').select('*').order('company_code').order('created_at')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { company_code, title, body } = await req.json()
  if (!company_code?.trim() || !title?.trim() || !body?.trim())
    return NextResponse.json({ error: 'Completá todos los campos' }, { status: 400 })
  const { data, error } = await supabase.from('particularidades')
    .insert({ company_code: company_code.trim(), title: title.trim(), body: body.trim() })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
