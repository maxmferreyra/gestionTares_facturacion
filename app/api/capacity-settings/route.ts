import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data } = await supabase.from('capacity_settings').select('*')
  const result: Record<string, string> = {}
  for (const row of data || []) result[row.key] = row.value
  return NextResponse.json(result)
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  for (const [key, value] of Object.entries(body)) {
    await supabase.from('capacity_settings').upsert({ key, value: String(value) }, { onConflict: 'key' })
  }
  return NextResponse.json({ ok: true })
}
