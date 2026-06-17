import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { collaborator_id, avatar } = await req.json()
  if (!collaborator_id || !avatar) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  const { data, error } = await supabase.from('collaborators').update({ avatar }).eq('id', collaborator_id).select('id, name, role, avatar').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
