import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Supabase/PostgREST devuelve como máximo 1000 filas por consulta por defecto.
// Esta función pagina automáticamente con .range() hasta traer TODAS las filas
// que cumplen el filtro, sin importar cuántas sean.
const PAGE_SIZE = 1000

export async function fetchAllRows<T>(
  buildQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<{ data: T[]; error: string | null }> {
  let all: T[] = []
  let page = 0
  while (true) {
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const { data, error } = await buildQuery(from, to)
    if (error) return { data: all, error: error.message }
    if (!data || data.length === 0) break
    all = all.concat(data)
    if (data.length < PAGE_SIZE) break // última página
    page++
  }
  return { data: all, error: null }
}
