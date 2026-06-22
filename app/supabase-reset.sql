-- ════════════════════════════════════════════════════════════
-- RESET COMPLETO DE LA BASE DE DATOS — Borra TODOS los datos
-- ════════════════════════════════════════════════════════════
-- Ejecutá este script para empezar testing desde cero.
-- ADVERTENCIA: esto borra TODA la información existente.

truncate table invoice_actions cascade;
truncate table tasks cascade;
truncate table invoices cascade;
truncate table collaborators cascade;

-- ════════════════════════════════════════════════════════════
-- ESTRUCTURA — Asegurar columnas necesarias
-- ════════════════════════════════════════════════════════════

alter table collaborators add column if not exists role text default 'collaborator';
alter table collaborators add column if not exists avatar text;

alter table invoice_actions add column if not exists reason text;

-- ════════════════════════════════════════════════════════════
-- SUPERVISORES — Crear las 2 cuentas fijas
-- ════════════════════════════════════════════════════════════
-- Gonzalo Haene  → PIN 3208
-- Paula Czemernicki → PIN 1234

insert into collaborators (name, pin_hash, role) values
  ('Gonzalo Haene', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'supervisor'),
  ('Paula Czemernicki', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'supervisor');

-- Verificar
select name, role from collaborators;
