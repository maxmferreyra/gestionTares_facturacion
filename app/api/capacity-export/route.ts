import { NextRequest, NextResponse } from 'next/server'
import { supabase, fetchAllRows } from '@/lib/supabase'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const collaborator_id = searchParams.get('collaborator_id')
  const date_from = searchParams.get('date_from')
  const date_to = searchParams.get('date_to')
  if (!collaborator_id || !date_from || !date_to)
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const { data: collabData } = await supabase.from('collaborators').select('id, name').eq('id', collaborator_id).single()
  const { data: tasks } = await supabase.from('capacity_tasks').select('*').eq('active', true).order('sort_order')
  const { data: logs } = await fetchAllRows((from, to) =>
    supabase.from('capacity_logs').select('*')
      .eq('collaborator_id', collaborator_id)
      .gte('date', date_from).lte('date', date_to)
      .order('date').range(from, to)
  )

  // Build pivot: task x date
  const dates = new Set<string>()
  const pivot: Record<string, Record<string, number>> = {}
  for (const log of logs || []) {
    dates.add(log.date)
    if (!pivot[log.task_key]) pivot[log.task_key] = {}
    pivot[log.task_key][log.date] = (pivot[log.task_key][log.date] || 0) + log.quantity
  }
  const sortedDates = Array.from(dates).sort()

  const wb = XLSX.utils.book_new()
  const taskList = (tasks || [])

  // Sheet 1: Summary (matches the Capacity Excel format)
  const summaryRows: unknown[][] = [
    ['CAPACITY REPORT', '', `${collabData?.name || ''}`, `Period: ${date_from} to ${date_to}`],
    [],
    ['#', 'Task', 'Unit', 'Standard (min)', 'Volume', 'Total Minutes'],
  ]
  let grandTotal = 0
  taskList.forEach((t, i) => {
    const volume = Object.values(pivot[t.task_key] || {}).reduce((s, v) => s + v, 0)
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

  // Sheet 2: Daily detail
  const detailHeader = ['Task', 'Unit', ...sortedDates]
  const detailRows: unknown[][] = [detailHeader]
  taskList.forEach(t => {
    const unit = t.unit === 'per_document' ? 'per document' : `1=${t.unit_minutes}min`
    const row: unknown[] = [t.name, unit]
    sortedDates.forEach(d => row.push(pivot[t.task_key]?.[d] || ''))
    detailRows.push(row)
  })
  const wsDetail = XLSX.utils.aoa_to_sheet(detailRows)
  wsDetail['!cols'] = [{ wch: 55 }, { wch: 14 }, ...sortedDates.map(() => ({ wch: 11 }))]
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Daily Detail')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  const name = `${collabData?.name?.replace(/\s+/g, '_') || 'Capacity'}_${date_from}_${date_to}.xlsx`
  return new NextResponse(buf, {
    headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="${name}"` },
  })
}
