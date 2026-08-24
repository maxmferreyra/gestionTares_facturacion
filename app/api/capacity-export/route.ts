import { NextRequest, NextResponse } from 'next/server'
import { supabase, fetchAllRows } from '@/lib/supabase'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

// Lunes de la semana (calendario local, sin líos de timezone) de una fecha YYYY-MM-DD
function mondayOf(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const day = date.getDay() // 0=domingo..6=sábado
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  const yy = date.getFullYear()
  const mm = (date.getMonth() + 1).toString().padStart(2, '0')
  const dd = date.getDate().toString().padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}
function monthOf(dateStr: string): string { return dateStr.slice(0, 7) }
function weekLabel(monday: string) { return `Week of ${monday}` }
function monthLabel(mo: string) {
  const [y, m] = mo.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}
function combKey(taskKey: string, collaboratorId: string) { return `${taskKey}__${collaboratorId}` }

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const collaborator_id = searchParams.get('collaborator_id')
  const date_from = searchParams.get('date_from')
  const date_to = searchParams.get('date_to')
  if (!collaborator_id || !date_from || !date_to)
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const isAll = collaborator_id === 'all'

  const { data: collabsData } = await supabase.from('collaborators').select('id, name')
  const nameMap: Record<string, string> = {}
  for (const c of collabsData || []) nameMap[c.id] = c.name
  const collabName = isAll ? 'Equipo' : (nameMap[collaborator_id] || '')

  const { data: tasks } = await supabase.from('capacity_tasks').select('*').eq('active', true).order('sort_order')
  const { data: logs } = await fetchAllRows((from, to) => {
    let q = supabase.from('capacity_logs').select('*')
      .gte('date', date_from).lte('date', date_to)
      .order('date').range(from, to)
    if (!isAll) q = q.eq('collaborator_id', collaborator_id)
    return q
  })

  const taskList = (tasks || [])
  const taskOrder: Record<string, number> = {}
  taskList.forEach((t, i) => { taskOrder[t.task_key] = i })

  // Pivots: tarea x día / semana / mes. Cuando isAll, la clave incluye al colaborador
  // (task_key__collaborator_id) para poder separar el volumen por persona.
  const dates = new Set<string>()
  const weeks = new Set<string>()
  const months = new Set<string>()
  const pivotDay: Record<string, Record<string, number>> = {}
  const pivotWeek: Record<string, Record<string, number>> = {}
  const pivotMonth: Record<string, Record<string, number>> = {}
  const pairsSeen = new Map<string, { task_key: string; collaborator_id: string }>()

  for (const log of logs || []) {
    dates.add(log.date)
    const wk = mondayOf(log.date)
    const mo = monthOf(log.date)
    weeks.add(wk)
    months.add(mo)
    const key = isAll ? combKey(log.task_key, log.collaborator_id) : log.task_key
    if (isAll) pairsSeen.set(key, { task_key: log.task_key, collaborator_id: log.collaborator_id })
    if (!pivotDay[key]) pivotDay[key] = {}
    pivotDay[key][log.date] = (pivotDay[key][log.date] || 0) + log.quantity
    if (!pivotWeek[key]) pivotWeek[key] = {}
    pivotWeek[key][wk] = (pivotWeek[key][wk] || 0) + log.quantity
    if (!pivotMonth[key]) pivotMonth[key] = {}
    pivotMonth[key][mo] = (pivotMonth[key][mo] || 0) + log.quantity
  }
  const sortedDates = Array.from(dates).sort()
  const sortedWeeks = Array.from(weeks).sort()
  const sortedMonths = Array.from(months).sort()

  // Filas a mostrar en cada hoja: una por tarea (export individual) o una por
  // combinación tarea+colaborador que realmente tuvo volumen (export de equipo),
  // agrupadas por colaborador (orden alfabético) y luego por orden del catálogo.
  type Row = { key: string; task: typeof taskList[number]; collaboratorName: string | null }
  const rows: Row[] = isAll
    ? Array.from(pairsSeen.values())
        .filter(p => taskList.some(t => t.task_key === p.task_key))
        .map(p => ({ key: combKey(p.task_key, p.collaborator_id), task: taskList.find(t => t.task_key === p.task_key), collaboratorName: nameMap[p.collaborator_id] || 'Sin nombre' } as Row))
        .sort((a, b) => (a.collaboratorName || '').localeCompare(b.collaboratorName || '') || taskOrder[a.task.task_key] - taskOrder[b.task.task_key])
    : taskList.map(t => ({ key: t.task_key, task: t, collaboratorName: null }))

  const wb = XLSX.utils.book_new()

  // Sheet 1: Summary (totales del período, separados por colaborador si es "todo el equipo")
  const summaryHeader = isAll ? ['Colaborador', '#', 'Task', 'Unit', 'Standard (min)', 'Volume', 'Total Minutes'] : ['#', 'Task', 'Unit', 'Standard (min)', 'Volume', 'Total Minutes']
  const summaryRows: unknown[][] = [
    ['CAPACITY REPORT', '', `${collabName}`, `Period: ${date_from} to ${date_to}`],
    [],
    summaryHeader,
  ]
  let grandTotal = 0
  const byCollabTotal: Record<string, number> = {}
  rows.forEach((r, i) => {
    const t = r.task
    const volume = Object.values(pivotDay[r.key] || {}).reduce((s, v) => s + v, 0)
    const total = volume * t.standard_minutes
    grandTotal += total
    if (isAll) byCollabTotal[r.collaboratorName!] = (byCollabTotal[r.collaboratorName!] || 0) + total
    const unit = t.unit === 'per_document' ? 'per document' : `1=${t.unit_minutes}min`
    const line = isAll ? [r.collaboratorName, i + 1, t.name, unit, t.standard_minutes, volume || '', Math.round(total)]
                        : [i + 1, t.name, unit, t.standard_minutes, volume || '', Math.round(total)]
    summaryRows.push(line)
  })
  summaryRows.push([])
  if (isAll) {
    summaryRows.push(['', '', '', '', 'TOTAL POR COLABORADOR (min)', ''])
    Object.entries(byCollabTotal).sort((a, b) => a[0].localeCompare(b[0])).forEach(([name, mins]) => {
      summaryRows.push(['', '', name, '', '', Math.round(mins), +(mins / 60).toFixed(2)])
    })
    summaryRows.push([])
  }
  const totalPad = isAll ? ['', '', '', '', 'TOTAL', ''] : ['', '', '', 'TOTAL', '']
  const hoursPad = isAll ? ['', '', '', '', 'TOTAL HOURS', ''] : ['', '', '', 'TOTAL HOURS', '']
  summaryRows.push([...totalPad, Math.round(grandTotal)])
  summaryRows.push([...hoursPad, +(grandTotal / 60).toFixed(2)])

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
  wsSummary['!cols'] = isAll
    ? [{ wch: 20 }, { wch: 4 }, { wch: 55 }, { wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 14 }]
    : [{ wch: 4 }, { wch: 55 }, { wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  function buildDetailSheet(pivot: Record<string, Record<string, number>>, periods: string[], periodLabels: string[], sheetName: string) {
    const header = isAll ? ['Colaborador', 'Task', 'Unit', ...periodLabels] : ['Task', 'Unit', ...periodLabels]
    const detailRows: unknown[][] = [header]
    rows.forEach(r => {
      const t = r.task
      const unit = t.unit === 'per_document' ? 'per document' : `1=${t.unit_minutes}min`
      const row: unknown[] = isAll ? [r.collaboratorName, t.name, unit] : [t.name, unit]
      periods.forEach(p => row.push(pivot[r.key]?.[p] || ''))
      detailRows.push(row)
    })
    const ws = XLSX.utils.aoa_to_sheet(detailRows)
    const baseCols = isAll ? [{ wch: 20 }, { wch: 55 }, { wch: 14 }] : [{ wch: 55 }, { wch: 14 }]
    ws['!cols'] = [...baseCols, ...periods.map(() => ({ wch: 14 }))]
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
  }

  buildDetailSheet(pivotDay, sortedDates, sortedDates, 'Por dia')
  buildDetailSheet(pivotWeek, sortedWeeks, sortedWeeks.map(weekLabel), 'Por semana')
  buildDetailSheet(pivotMonth, sortedMonths, sortedMonths.map(monthLabel), 'Por mes')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  const name = `${(collabName || 'Capacity').replace(/\s+/g, '_')}_${date_from}_${date_to}.xlsx`
  return new NextResponse(buf, {
    headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="${name}"` },
  })
}
