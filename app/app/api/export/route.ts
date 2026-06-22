import { NextRequest, NextResponse } from 'next/server'
import { supabase, fetchAllRows } from '@/lib/supabase'
import * as XLSX from 'xlsx'
import { SYSTEMS_CONFIG } from '@/lib/actions-config'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const collaborator_id = searchParams.get('collaborator_id')
  const collaborator_name = searchParams.get('name') || 'Colaborador'
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const date = searchParams.get('date')
  if (!collaborator_id) return NextResponse.json({ error: 'Falta colaborador' }, { status: 400 })

  const isAll = collaborator_id === 'all'
  const effFrom = from || date || undefined
  const effTo = to || date || undefined

  // Collaborator names map
  const { data: collabs } = await supabase.from('collaborators').select('id, name')
  const nameMap: Record<string, string> = {}
  for (const c of collabs || []) nameMap[c.id] = c.name

  // Tasks (paginado — sin límite de 1000 filas)
  const { data: tasks } = await fetchAllRows((rFrom, rTo) => {
    let q = supabase.from('tasks').select('*').order('date').order('start_time').range(rFrom, rTo)
    if (!isAll) q = q.eq('collaborator_id', collaborator_id)
    if (effFrom) q = q.gte('date', effFrom)
    if (effTo) q = q.lte('date', effTo)
    return q
  })

  // Actions (paginado — sin límite de 1000 filas)
  const { data: actions } = await fetchAllRows((rFrom, rTo) => {
    let q = supabase.from('invoice_actions').select('*').order('date').order('created_at').range(rFrom, rTo)
    if (!isAll) q = q.eq('collaborator_id', collaborator_id)
    if (effFrom) q = q.gte('date', effFrom)
    if (effTo) q = q.lte('date', effTo)
    return q
  })

  const wb = XLSX.utils.book_new()

  // Sheet 1: Tasks
  const taskRows = (tasks || []).map(t => {
    let dur = ''
    if (t.start_time && t.end_time) {
      const [sh, sm] = t.start_time.split(':').map(Number)
      const [eh, em] = t.end_time.split(':').map(Number)
      const diff = (eh * 60 + em) - (sh * 60 + sm)
      if (diff > 0) { const h = Math.floor(diff / 60), m = diff % 60; dur = m > 0 ? `${h}h ${m}min` : `${h}h` }
    }
    const row: Record<string, unknown> = {}
    if (isAll) row['Colaborador'] = nameMap[t.collaborator_id] || ''
    row['Fecha'] = t.date
    row['Tarea'] = t.title
    row['Inicio'] = t.start_time?.slice(0, 5) || ''
    row['Fin'] = t.end_time?.slice(0, 5) || ''
    row['Duración'] = dur
    row['Sistemas'] = Array.isArray(t.systems) ? t.systems.join(', ') : ''
    row['Etiqueta'] = t.tag
    row['Notas'] = t.notes || ''
    return row
  })
  const ws1 = XLSX.utils.json_to_sheet(taskRows.length ? taskRows : [{ Fecha: '', Tarea: 'Sin tareas' }])
  XLSX.utils.book_append_sheet(wb, ws1, 'Tareas')

  // Sheet 2: Actions
  const actionRows = (actions || []).map((a, i) => {
    const sys = SYSTEMS_CONFIG.find(s => s.key === a.system)
    const act = sys?.actions.find(x => x.key === a.action)
    const row: Record<string, unknown> = { '#': i + 1 }
    if (isAll) row['Colaborador'] = nameMap[a.collaborator_id] || ''
    row['Fecha'] = a.date
    row['Hora'] = new Date(a.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    row['Sistema'] = sys?.label || a.system
    row['Acción'] = act?.label || a.action
    row['Razón'] = a.reason || ''
    return row
  })
  const ws2 = XLSX.utils.json_to_sheet(actionRows.length ? actionRows : [{ '#': '', Sistema: 'Sin acciones' }])
  XLSX.utils.book_append_sheet(wb, ws2, 'Acciones por sistema')

  // Sheet 3: Summary by date + system
  const allSystems = SYSTEMS_CONFIG.map(s => s.label)
  const summaryMap: Record<string, Record<string, number>> = {}
  const allDates = new Set<string>()
  for (const a of actions || []) {
    const sys = SYSTEMS_CONFIG.find(s => s.key === a.system)
    const lbl = sys?.label || a.system
    if (!summaryMap[a.date]) summaryMap[a.date] = {}
    summaryMap[a.date][lbl] = (summaryMap[a.date][lbl] || 0) + 1
    allDates.add(a.date)
  }
  const summaryRows = Array.from(allDates).sort().map(d => {
    const row: Record<string, string | number> = { Fecha: d }
    let total = 0
    for (const s of allSystems) { const c = summaryMap[d]?.[s] || 0; row[s] = c; total += c }
    row['Total'] = total
    return row
  })
  const ws3 = XLSX.utils.json_to_sheet(summaryRows.length ? summaryRows : [{ Fecha: 'Sin datos' }])
  XLSX.utils.book_append_sheet(wb, ws3, 'Resumen por sistema')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  const filename = `milo_${collaborator_name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
