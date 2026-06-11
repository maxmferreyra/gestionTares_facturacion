import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const collaborator_id = searchParams.get('collaborator_id')
  const collaborator_name = searchParams.get('name') || 'Colaborador'
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (!collaborator_id) return NextResponse.json({ error: 'Falta colaborador' }, { status: 400 })

  let query = supabase
    .from('tasks')
    .select('*')
    .eq('collaborator_id', collaborator_id)
    .order('date')
    .order('created_at')

  if (from) query = query.gte('date', from)
  if (to) query = query.lte('date', to)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Build rows
  const rows = (data || []).map(t => ({
    'Fecha': t.date,
    'Tarea': t.title,
    'Etiqueta': t.tag,
    'Horas': t.hours,
    'Estado': t.completed ? 'Completada' : 'Pendiente',
    'Hora completada': t.completed_at ? new Date(t.completed_at).toLocaleTimeString('es-AR') : '',
    'Notas': t.notes || '',
  }))

  // Summary by day
  const byDay: Record<string, { total: number; done: number; hours: number }> = {}
  for (const t of data || []) {
    if (!byDay[t.date]) byDay[t.date] = { total: 0, done: 0, hours: 0 }
    byDay[t.date].total++
    if (t.completed) byDay[t.date].done++
    byDay[t.date].hours += Number(t.hours) || 0
  }
  const summaryRows = Object.entries(byDay).map(([date, s]) => ({
    'Fecha': date,
    'Total tareas': s.total,
    'Completadas': s.done,
    'Pendientes': s.total - s.done,
    'Horas trabajadas': s.hours,
    'Cumplimiento %': s.total > 0 ? Math.round((s.done / s.total) * 100) + '%' : '0%',
  }))

  const wb = XLSX.utils.book_new()

  const ws1 = XLSX.utils.json_to_sheet(rows)
  ws1['!cols'] = [{ wch: 12 }, { wch: 40 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 18 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(wb, ws1, 'Tareas')

  const ws2 = XLSX.utils.json_to_sheet(summaryRows)
  ws2['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 13 }, { wch: 12 }, { wch: 18 }, { wch: 16 }]
  XLSX.utils.book_append_sheet(wb, ws2, 'Resumen por día')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  const filename = `tareas_${collaborator_name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
