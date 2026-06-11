import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { name, pin, mode } = await req.json()

  if (!pin || pin.length < 4) {
    return NextResponse.json({ error: 'PIN inválido' }, { status: 400 })
  }

  if (mode === 'register') {
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
    }
    const { data: existing } = await supabase
      .from('collaborators').select('id').ilike('name', name.trim()).single()
    if (existing) {
      return NextResponse.json({ error: 'Ese nombre ya está registrado' }, { status: 400 })
    }
    const pin_hash = await bcrypt.hash(pin, 10)
    const { data, error } = await supabase
      .from('collaborators').insert({ name: name.trim(), pin_hash }).select('id, name').single()
    if (error) return NextResponse.json({ error: 'Error al registrar' }, { status: 500 })
    return NextResponse.json({ collaborator: data })
  }

  // Login: busca por PIN entre todos los colaboradores
  const { data: all, error } = await supabase
    .from('collaborators').select('id, name, pin_hash')
  if (error || !all) {
    return NextResponse.json({ error: 'Error al conectar' }, { status: 500 })
  }

  for (const c of all) {
    const valid = await bcrypt.compare(pin, c.pin_hash)
    if (valid) {
      return NextResponse.json({ collaborator: { id: c.id, name: c.name } })
    }
  }

  return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 })
}
