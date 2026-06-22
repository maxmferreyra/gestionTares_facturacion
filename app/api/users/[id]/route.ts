import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

type RouteContext = { params: Promise<{ id: string }> }

// Actualiza un usuario: activar/desactivar, cambiar rol, o resetear PIN
export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const body = await req.json()
  const updates: Record<string, unknown> = {}

  if ('active' in body) updates.active = !!body.active
  if ('role' in body) updates.role = body.role === 'supervisor' ? 'supervisor' : 'collaborator'
  if ('newPin' in body) {
    if (!body.newPin || String(body.newPin).length < 4) {
      return NextResponse.json({ error: 'El PIN debe tener al menos 4 dígitos' }, { status: 400 })
    }
    updates.pin_hash = await bcrypt.hash(String(body.newPin), 10)
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 })

  const { data, error } = await supabase
    .from('collaborators').update(updates).eq('id', id)
    .select('id, name, role, active').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// Elimina un usuario definitivamente (borra también sus tareas y toques por cascade)
export async function DELETE(req: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const { error } = await supabase.from('collaborators').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
