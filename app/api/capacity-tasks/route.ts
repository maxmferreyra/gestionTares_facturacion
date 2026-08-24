import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabase
    .from('capacity_tasks').select('*').eq('active', true).order('sort_order')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// Supervisors: update standard_minutes for a task
export async function PATCH(req: NextRequest) {
  const { task_key, standard_minutes } = await req.json()
  if (!task_key || standard_minutes == null) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const { data, error } = await supabase
    .from('capacity_tasks').update({ standard_minutes }).eq('task_key', task_key).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

function slugify(name: string) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40) || 'task'
}

// Supervisors: crear una nueva tarea en el catálogo de Capacity
export async function POST(req: NextRequest) {
  const { name, unit, unit_minutes, standard_minutes } = await req.json()

  if (!name || !String(name).trim()) return NextResponse.json({ error: 'Falta el nombre' }, { status: 400 })
  if (unit !== 'per_document' && unit !== 'minutes') return NextResponse.json({ error: 'Unidad de medida inválida' }, { status: 400 })
  const unitMinutesNum = Number(unit_minutes)
  const standardMinutesNum = Number(standard_minutes)
  if (isNaN(unitMinutesNum) || unitMinutesNum <= 0) return NextResponse.json({ error: 'Valor de unidad inválido' }, { status: 400 })
  if (isNaN(standardMinutesNum) || standardMinutesNum <= 0) return NextResponse.json({ error: 'Tiempo estándar inválido' }, { status: 400 })

  const { data: existingTasks, error: listError } = await supabase.from('capacity_tasks').select('task_key, sort_order')
  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 })

  const existingKeys = new Set((existingTasks || []).map(t => t.task_key))
  const base = slugify(String(name).trim())
  let key = base
  let n = 2
  while (existingKeys.has(key)) { key = `${base}_${n}`; n++ }
  const maxSort = (existingTasks || []).reduce((m, t) => Math.max(m, t.sort_order || 0), 0)

  const { data, error } = await supabase.from('capacity_tasks').insert({
    task_key: key,
    name: String(name).trim(),
    unit,
    unit_minutes: unitMinutesNum,
    standard_minutes: standardMinutesNum,
    active: true,
    sort_order: maxSort + 1,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
