import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')

  let query = supabase.from('invoice_actions').select('system, action')
  if (date) query = query.eq('date', date)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Count by system
  const totals: Record<string, number> = {}
  for (const a of data || []) {
    totals[a.system] = (totals[a.system] || 0) + 1
  }
  return NextResponse.json(totals)
}
