import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Lista todos los usuarios (para el panel de gestión del supervisor)
export async function GET() {
  const { data, error } = await supabase
    .from('collaborators')
    .select('id, name, role, avatar, active, created_at')
    .order('role')
    .order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// Crea un nuevo usuario (solo supervisores deberían poder llamar esto desde la UI)
export async function POST(req: NextRequest) {
  const { name, pin, role } = await req.json()

  if (!name || name.trim().length < 2) return NextResponse.json({ error: 'Ingresá un nombre válido' }, { status: 400 })
  if (!pin || pin.length < 4) return NextResponse.json({ error: 'El PIN debe tener al menos 4 dígitos' }, { status: 400 })
  const finalRole = role === 'supervisor' ? 'supervisor' : 'collaborator'

  const { data: existing } = await supabase
    .from('collaborators').select('id').ilike('name', name.trim()).single()
  if (existing) return NextResponse.json({ error: 'Ya existe un usuario con ese nombre' }, { status: 400 })

  const pin_hash = await bcrypt.hash(pin, 10)
  const { data, error } = await supabase
    .from('collaborators')
    .insert({ name: name.trim(), pin_hash, role: finalRole, active: true })
    .select('id, name, role, active').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
