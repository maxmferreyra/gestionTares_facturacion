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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const collaborator_id = searchParams.get('collaborator_id')
  const date_from = searchParams.get('date_from')
  const date_to = searchParams.get('date_to')
  if (!collaborator_id || !date_from || !date_to)
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const isAll = collaborator_id === 'all'

  const collabName = isAll ? 'Equipo' : (await supabase.from('collaborators').select('id, name').eq('id', collaborator_id).single()).data?.name || ''
  const { data: tasks } = await supabase.from('capacity_tasks').select('*').eq('active', true).order('sort_order')
  const { data: logs } = await fetchAllRows((from, to) => {
    let q = supabase.from('capacity_logs').select('*')
      .gte('date', date_from).lte('date', date_to)
      .order('date').range(from, to)
    if (!isAll) q = q.eq('collaborator_id', collaborator_id)
    return q
  })

  // Pivots: tarea x día / semana / mes
  const dates = new Set<string>()
  const weeks = new Set<string>()
  const months = new Set<string>()
  const pivotDay: Record<string, Record<string, number>> = {}
  const pivotWeek: Record<string, Record<string, number>> = {}
  const pivotMonth: Record<string, Record<string, number>> = {}
  for (const log of logs || []) {
    dates.add(log.date)
    const wk = mondayOf(log.date)
    const mo = monthOf(log.date)
    weeks.add(wk)
    months.add(mo)
    if (!pivotDay[log.task_key]) pivotDay[log.task_key] = {}
    pivotDay[log.task_key][log.date] = (pivotDay[log.task_key][log.date] || 0) + log.quantity
    if (!pivotWeek[log.task_key]) pivotWeek[log.task_key] = {}
    pivotWeek[log.task_key][wk] = (pivotWeek[log.task_key][wk] || 0) + log.quantity
    if (!pivotMonth[log.task_key]) pivotMonth[log.task_key] = {}
    pivotMonth[log.task_key][mo] = (pivotMonth[log.task_key][mo] || 0) + log.quantity
  }
  const sortedDates = Array.from(dates).sort()
  const sortedWeeks = Array.from(weeks).sort()
  const sortedMonths = Array.from(months).sort()

  const wb = XLSX.utils.book_new()
  const taskList = (tasks || [])

  // Sheet 1: Summary (totales del período completo)
  const summaryRows: unknown[][] = [
    ['CAPACITY REPORT', '', `${collabName}`, `Period: ${date_from} to ${date_to}`],
    [],
    ['#', 'Task', 'Unit', 'Standard (min)', 'Volume', 'Total Minutes'],
  ]
  let grandTotal = 0
  taskList.forEach((t, i) => {
    const volume = Object.values(pivotDay[t.task_key] || {}).reduce((s, v) => s + v, 0)
    const total = volume * t.standard_minutes
    grandTotal += total
    const unit = t.unit === 'per_document' ? 'per document' : `1=${t.unit_minutes}min`
    summaryRows.push([i + 1, t.name, unit, t.standard_minutes, volume || '', Math.round(total)])
  })
  summaryRows.push([])
  summaryRows.push(['', '', '', 'TOTAL', '', Math.round(grandTotal)])
  summaryRows.push(['', '', '', 'TOTAL HOURS', '', +(grandTotal / 60).toFixed(2)])

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
  wsSummary['!cols'] = [{ wch: 4 }, { wch: 55 }, { wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  // Sheet 2: Por día
  const dayHeader = ['Task', 'Unit', ...sortedDates]
  const dayRows: unknown[][] = [dayHeader]
  taskList.forEach(t => {
    const unit = t.unit === 'per_document' ? 'per document' : `1=${t.unit_minutes}min`
    const row: unknown[] = [t.name, unit]
    sortedDates.forEach(d => row.push(pivotDay[t.task_key]?.[d] || ''))
    dayRows.push(row)
  })
  const wsDay = XLSX.utils.aoa_to_sheet(dayRows)
  wsDay['!cols'] = [{ wch: 55 }, { wch: 14 }, ...sortedDates.map(() => ({ wch: 11 }))]
  XLSX.utils.book_append_sheet(wb, wsDay, 'Por dia')

  // Sheet 3: Por semana
  const weekHeader = ['Task', 'Unit', ...sortedWeeks.map(weekLabel)]
  const weekRows: unknown[][] = [weekHeader]
  taskList.forEach(t => {
    const unit = t.unit === 'per_document' ? 'per document' : `1=${t.unit_minutes}min`
    const row: unknown[] = [t.name, unit]
    sortedWeeks.forEach(w => row.push(pivotWeek[t.task_key]?.[w] || ''))
    weekRows.push(row)
  })
  const wsWeek = XLSX.utils.aoa_to_sheet(weekRows)
  wsWeek['!cols'] = [{ wch: 55 }, { wch: 14 }, ...sortedWeeks.map(() => ({ wch: 16 }))]
  XLSX.utils.book_append_sheet(wb, wsWeek, 'Por semana')

  // Sheet 4: Por mes
  const monthHeader = ['Task', 'Unit', ...sortedMonths.map(monthLabel)]
  const monthRows: unknown[][] = [monthHeader]
  taskList.forEach(t => {
    const unit = t.unit === 'per_document' ? 'per document' : `1=${t.unit_minutes}min`
    const row: unknown[] = [t.name, unit]
    sortedMonths.forEach(m => row.push(pivotMonth[t.task_key]?.[m] || ''))
    monthRows.push(row)
  })
  const wsMonth = XLSX.utils.aoa_to_sheet(monthRows)
  wsMonth['!cols'] = [{ wch: 55 }, { wch: 14 }, ...sortedMonths.map(() => ({ wch: 12 }))]
  XLSX.utils.book_append_sheet(wb, wsMonth, 'Por mes')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  const name = `${(collabName || 'Capacity').replace(/\s+/g, '_')}_${date_from}_${date_to}.xlsx`
  return new NextResponse(buf, {
    headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="${name}"` },
  })
}
