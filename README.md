# Control de Tareas

App para que colaboradores gestionen sus tareas diarias con PIN personal.

## Stack
- **Next.js 14** (App Router)
- **Supabase** (base de datos PostgreSQL)
- **Vercel** (hosting)

---

## Configuración paso a paso

### 1. Base de datos en Supabase

1. Entrá a [supabase.com](https://supabase.com) y creá un proyecto gratis
2. Andá a **SQL Editor** y pegá el contenido de `supabase-schema.sql`
3. Ejecutá el script — crea las tablas `collaborators` y `tasks`
4. En **Settings → API**, copiá:
   - `Project URL`
   - `anon public` key

### 2. Variables de entorno

Creá un archivo `.env.local` en la raíz del proyecto:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 3. Correr en local

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000)

### 4. Deploy en Vercel

1. Subí el proyecto a GitHub
2. En [vercel.com](https://vercel.com), importá el repositorio
3. En **Settings → Environment Variables**, agregá las mismas dos variables del paso 2
4. Deploy — listo 🎉

---

## Uso

- Cada colaborador se registra con su nombre y un PIN de 4–8 dígitos
- El PIN queda hasheado en la base de datos (nunca se guarda en texto plano)
- Cada uno ve solo sus propias tareas
- Pueden agregar tareas con horas trabajadas, etiqueta y notas
- Vista diaria con progreso y vista semanal con gráfico de actividad
- Botón para exportar a Excel (todas las tareas o solo la semana)

---

## Estructura del proyecto

```
app/
  page.tsx              → Login / Registro
  dashboard/page.tsx    → Dashboard principal
  api/
    login/route.ts      → Autenticación con PIN
    tasks/route.ts      → GET (listar) y POST (crear) tareas
    tasks/[id]/route.ts → PATCH (editar) y DELETE (borrar)
    weekly-summary/     → GET tareas de la semana
    export/route.ts     → Descarga Excel
components/
  TaskItem.tsx          → Tarea individual (editable inline)
  AddTaskForm.tsx       → Formulario nueva tarea
  WeeklySummary.tsx     → Vista semanal con gráfico
lib/
  supabase.ts           → Cliente Supabase
  types.ts              → Tipos TypeScript
supabase-schema.sql     → Script SQL para crear tablas
```
