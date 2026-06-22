import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { name, pin, mode } = await req.json()

  // Registro deshabilitado — solo usuarios fijos pueden ingresar
  if (mode === 'register') {
    return NextResponse.json({ error: 'El registro está deshabilitado. Contactá a tu supervisor.' }, { status: 403 })
  }

  if (!pin || pin.length < 4) return NextResponse.json({ error: 'PIN inválido' }, { status: 400 })
  if (!name || name.trim().length < 2) return NextResponse.json({ error: 'Ingresá tu nombre' }, { status: 400 })

  const { data: collaborator } = await supabase.from('collaborators')
    .select('id, name, pin_hash, role, avatar, active').ilike('name', name.trim()).single()
  if (!collaborator) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  if (collaborator.active === false) return NextResponse.json({ error: 'Tu cuenta está desactivada. Contactá a tu supervisor.' }, { status: 403 })
  const valid = await bcrypt.compare(pin, collaborator.pin_hash)
  if (!valid) return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 })
  return NextResponse.json({ collaborator: { id: collaborator.id, name: collaborator.name, role: collaborator.role, avatar: collaborator.avatar } })
}
