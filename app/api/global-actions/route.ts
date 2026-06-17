import { NextRequest, NextResponse } from 'next/server'
import { supabase, fetchAllRows } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')

  const { data, error } = await fetchAllRows((rFrom, rTo) => {
    let q = supabase.from('invoice_actions').select('system, action').range(rFrom, rTo)
    if (date) q = q.eq('date', date)
    return q
  })
  if (error) return NextResponse.json({ error }, { status: 500 })

  const totals: Record<string, number> = {}
  for (const a of data) {
    totals[a.system] = (totals[a.system] || 0) + 1
  }
  return NextResponse.json(totals)
}
