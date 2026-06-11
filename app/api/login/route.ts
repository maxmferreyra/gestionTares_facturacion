import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { name, pin, mode } = await req.json()

  if (!pin || pin.length < 4) {
    return NextResponse.json({ error: 'PIN inválido' }, { status: 400 })
  }

  if (mode === 'register') {
    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
    }
    // Check name not taken
    const { data: existing } = await supabase
      .from('collaborators')
      .select('id')
      .ilike('name', name)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Ese nombre ya está registrado' }, { status: 400 })
    }

    const pin_hash = await bcrypt.hash(pin, 10)
    const { data, error } = await supabase
      .from('collaborators')
      .insert({ name, pin_hash })
      .select('id, name')
      .single()

    if (error) return NextResponse.json({ error: 'Error al registrar' }, { status: 500 })
    return NextResponse.json({ collaborator: data })
  }

  // Login mode: find by name
  if (!name || name.length < 2) {
    return NextResponse.json({ error: 'Ingresá tu nombre' }, { status: 400 })
  }

  const { data: collaborator } = await supabase
    .from('collaborators')
    .select('id, name, pin_hash')
    .ilike('name', name)
    .single()

  if (!collaborator) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  const valid = await bcrypt.compare(pin, collaborator.pin_hash)
  if (!valid) {
    return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 })
  }

  return NextResponse.json({ collaborator: { id: collaborator.id, name: collaborator.name } })
}
