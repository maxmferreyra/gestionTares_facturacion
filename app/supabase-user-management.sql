-- ════════════════════════════════════════════════════════════
-- GESTIÓN DE USUARIOS — Ejecutar una sola vez en Supabase
-- ════════════════════════════════════════════════════════════
-- Agrega la columna "active" para poder desactivar usuarios
-- sin perder su historial de tareas y toques (no se borra nada).

alter table collaborators add column if not exists active boolean default true;

-- Verificar
select name, role, active from collaborators order by role, name;
