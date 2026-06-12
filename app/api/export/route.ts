import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'
import { SYSTEMS_CONFIG } from '@/lib/actions-config'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const collaborator_id = searchParams.get('collaborator_id')
  const collaborator_name = searchParams.get('name') || 'Colaborador'
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const date = searchParams.get('date')

  if (!collaborator_id) return NextResponse.json({ error: 'Falta colaborador' }, { status: 400 })

  const effectiveFrom = from || date || undefined
  const effectiveTo = to || date || undefined

  // Fetch tasks
  let tQuery = supabase.from('tasks').select('*').eq('collaborator_id', collaborator_id).order('date').order('start_time')
  if (effectiveFrom) tQuery = tQuery.gte('date', effectiveFrom)
  if (effectiveTo) tQuery = tQuery.lte('date', effectiveTo)
  const { data: tasks } = await tQuery

  // Fetch invoice actions
  let aQuery = supabase.from('invoice_actions').select('*').eq('collaborator_id', collaborator_id).order('date').order('created_at')
  if (effectiveFrom) aQuery = aQuery.gte('date', effectiveFrom)
  if (effectiveTo) aQuery = aQuery.lte('date', effectiveTo)
  const { data: actions } = await aQuery

  const wb = XLSX.utils.book_new()

  // ── Sheet 1: Tasks ──
  const taskRows = (tasks || []).map(t => {
    let duration = ''
    if (t.start_time && t.end_time) {
      const [sh, sm] = t.start_time.split(':').map(Number)
      const [eh, em] = t.end_time.split(':').map(Number)
      const diff = (eh * 60 + em) - (sh * 60 + sm)
      if (diff > 0) {
        const h = Math.floor(diff / 60), m = diff % 60
        duration = m > 0 ? `${h}h ${m}min` : `${h}h`
      }
    }
    return {
      'Fecha': t.date,
      'Tarea': t.title,
      'Inicio': t.start_time?.slice(0, 5) || '',
      'Fin': t.end_time?.slice(0, 5) || '',
      'Duración': duration,
      'Sistemas': Array.isArray(t.systems) ? t.systems.join(', ') : '',
      'Etiqueta': t.tag,
      'Estado': t.completed ? 'Completada' : 'Pendiente',
      'Notas': t.notes || '',
    }
  })
  const ws1 = XLSX.utils.json_to_sheet(taskRows.length ? taskRows : [{ 'Fecha': '', 'Tarea': 'Sin tareas', 'Inicio': '', 'Fin': '', 'Duración': '', 'Sistemas': '', 'Etiqueta': '', 'Estado': '', 'Notas': '' }])
  ws1['!cols'] = [{ wch: 12 }, { wch: 38 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 28 }]
  XLSX.utils.book_append_sheet(wb, ws1, 'Tareas')

  // ── Sheet 2: Invoice actions (chronological) ──
  const actionRows = (actions || []).map((a, i) => {
    const sys = SYSTEMS_CONFIG.find(s => s.key === a.system)
    const act = sys?.actions.find(x => x.key === a.action)
    return {
      '#': i + 1,
      'Fecha': a.date,
      'Hora': new Date(a.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      'Sistema': sys?.label || a.system,
      'Acción': act?.label || a.action,
    }
  })
  const ws2 = XLSX.utils.json_to_sheet(actionRows.length ? actionRows : [{ '#': '', 'Fecha': '', 'Hora': '', 'Sistema': 'Sin acciones', 'Acción': '' }])
  ws2['!cols'] = [{ wch: 6 }, { wch: 12 }, { wch: 8 }, { wch: 16 }, { wch: 35 }]
  XLSX.utils.book_append_sheet(wb, ws2, 'Acciones por sistema')

  // ── Sheet 3: Summary by date + system ──
  const summaryMap: Record<string, Record<string, number>> = {}
  const allDates = new Set<string>()
  const allSystems = SYSTEMS_CONFIG.map(s => s.label)

  for (const a of actions || []) {
    const sys = SYSTEMS_CONFIG.find(s => s.key === a.system)
    const sysLabel = sys?.label || a.system
    if (!summaryMap[a.date]) summaryMap[a.date] = {}
    summaryMap[a.date][sysLabel] = (summaryMap[a.date][sysLabel] || 0) + 1
    allDates.add(a.date)
  }

  const summaryRows = Array.from(allDates).sort().map(date => {
    const row: Record<string, string | number> = { 'Fecha': date }
    let total = 0
    for (const sys of allSystems) {
      const count = summaryMap[date]?.[sys] || 0
      row[sys] = count
      total += count
    }
    row['Total'] = total
    return row
  })

  const ws3 = XLSX.utils.json_to_sheet(summaryRows.length ? summaryRows : [{ 'Fecha': 'Sin datos' }])
  ws3['!cols'] = [{ wch: 12 }, ...allSystems.map(() => ({ wch: 14 })), { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, ws3, 'Resumen por sistema')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  const filename = `registro_${collaborator_name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
