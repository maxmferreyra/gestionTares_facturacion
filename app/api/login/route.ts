import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { name, pin, mode } = await req.json()

  if (!pin || pin.length < 4) return NextResponse.json({ error: 'PIN inválido' }, { status: 400 })
  if (!name || name.trim().length < 2) return NextResponse.json({ error: 'Ingresá tu nombre' }, { status: 400 })

  if (mode === 'register') {
    // Check name not taken
    const { data: existingName } = await supabase
      .from('collaborators').select('id').ilike('name', name.trim()).single()
    if (existingName) return NextResponse.json({ error: 'Ese nombre ya está registrado' }, { status: 400 })

    // Check PIN not taken by anyone
    const { data: all } = await supabase.from('collaborators').select('pin_hash')
    for (const c of all || []) {
      const match = await bcrypt.compare(pin, c.pin_hash)
      if (match) return NextResponse.json({ error: 'Ese PIN ya está en uso. Elegí otro.' }, { status: 400 })
    }

    const pin_hash = await bcrypt.hash(pin, 10)
    const { data, error } = await supabase.from('collaborators')
      .insert({ name: name.trim(), pin_hash, role: 'collaborator' })
      .select('id, name, role').single()
    if (error) return NextResponse.json({ error: 'Error al registrar' }, { status: 500 })
    return NextResponse.json({ collaborator: data })
  }

  // Login: find by name first, then validate PIN
  const { data: collaborator } = await supabase
    .from('collaborators').select('id, name, pin_hash, role').ilike('name', name.trim()).single()

  if (!collaborator) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const valid = await bcrypt.compare(pin, collaborator.pin_hash)
  if (!valid) return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 })

  return NextResponse.json({ collaborator: { id: collaborator.id, name: collaborator.name, role: collaborator.role } })
}
