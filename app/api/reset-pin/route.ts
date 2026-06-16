import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { name, newPin } = await req.json()
  if (!name || name.trim().length < 2) return NextResponse.json({ error: 'Ingresá tu nombre' }, { status: 400 })
  if (!newPin || newPin.length < 4) return NextResponse.json({ error: 'El PIN debe tener al menos 4 dígitos' }, { status: 400 })

  const { data: collaborator } = await supabase
    .from('collaborators').select('id').ilike('name', name.trim()).single()
  if (!collaborator) return NextResponse.json({ error: 'No existe un usuario con ese nombre' }, { status: 404 })

  const pin_hash = await bcrypt.hash(newPin, 10)
  const { error } = await supabase.from('collaborators').update({ pin_hash }).eq('id', collaborator.id)
  if (error) return NextResponse.json({ error: 'Error al actualizar el PIN' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
