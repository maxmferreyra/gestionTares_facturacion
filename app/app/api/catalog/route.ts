import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const [{ data: systems }, { data: tags }] = await Promise.all([
    supabase.from('systems_catalog').select('id, name').order('name'),
    supabase.from('tags_catalog').select('id, name').order('name'),
  ])
  return NextResponse.json({ systems: systems || [], tags: tags || [] })
}
