import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { SYSTEMS_CONFIG } from '@/lib/actions-config'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Lista todos los tiempos estándar configurados.
// Si una acción del catálogo (actions-config.ts) todavía no tiene fila en la
// tabla (ej: se agregó una acción nueva), se completa con un default de 60s
// para que la pantalla nunca se rompa por datos faltantes.
export async function GET() {
  const { data, error } = await supabase.from('action_time_standards').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const existing = new Map((data || []).map(r => [`${r.system}__${r.action}`, r.standard_seconds]))
  const result: { system: string; action: string; label: string; standard_seconds: number }[] = []

  for (const sys of SYSTEMS_CONFIG) {
    for (const act of sys.actions) {
      const key = `${sys.key}__${act.key}`
      result.push({
        system: sys.key,
        action: act.key,
        label: act.label,
        standard_seconds: existing.get(key) ?? 60,
      })
    }
  }
  return NextResponse.json(result)
}

// Actualiza (upsert) uno o varios tiempos estándar de una sola vez.
// Body: { items: [{ system, action, standard_seconds }, ...] }
export async function PUT(req: NextRequest) {
  const { items } = await req.json()
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Nada para guardar' }, { status: 400 })
  }

  const rows = items.map((it: { system: string; action: string; standard_seconds: number }) => ({
    system: it.system,
    action: it.action,
    standard_seconds: Math.max(1, Math.round(Number(it.standard_seconds) || 60)),
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('action_time_standards')
    .upsert(rows, { onConflict: 'system,action' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
