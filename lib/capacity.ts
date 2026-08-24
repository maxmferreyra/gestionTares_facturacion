import { supabase } from './supabase'

// Suma "qty" toques a una tarea de Capacity para un colaborador en una fecha dada.
// Si ya existe un registro para esa combinación colaborador+tarea+fecha, lo incrementa;
// si no existe, lo crea. Usado tanto por /api/capacity-logs como por los disparadores
// automáticos de Base Imponible y Boleto Brasil.
export async function addCapacityTouches(collaboratorId: string, taskKey: string, date: string, qty = 1) {
  const { data: existing } = await supabase
    .from('capacity_logs').select('id, quantity')
    .eq('collaborator_id', collaboratorId).eq('task_key', taskKey).eq('date', date).single()

  if (existing) {
    return supabase
      .from('capacity_logs').update({ quantity: existing.quantity + qty })
      .eq('id', existing.id).select().single()
  }

  return supabase
    .from('capacity_logs').insert({ collaborator_id: collaboratorId, task_key: taskKey, date, quantity: qty })
    .select().single()
}
