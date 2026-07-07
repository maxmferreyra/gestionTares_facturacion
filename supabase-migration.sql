-- Catálogo de tareas editable desde la app
create table if not exists task_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean default true,
  created_at timestamptz default now()
);
alter table task_catalog enable row level security;
create policy "allow_all_task_catalog" on task_catalog for all using (true);

-- Carga inicial con las tareas actuales
insert into task_catalog (name) values
('Argentina - Modificación bases imponibles'),
('Armado de reportes'),
('Capacitación / Training'),
('Carga de facturas en sistema'),
('Compensación FC/NC'),
('Consulta a proveedor'),
('Consulta interna / Gestión de aprobación'),
('Control de pagos'),
('Control de vencimientos'),
('Corrección de errores en facturas'),
('Estandarización de procesos entre países'),
('Facturas urgentes / pagos críticos'),
('Feriado/OOO'),
('Gestión de bloqueos'),
('Gestión de retenciones'),
('Gestión Legal Tracker'),
('Investigación de diferencias de precio'),
('Limpieza de cola / backlog'),
('Otras tareas operativas'),
('Procesamiento de facturas'),
('Reclamar facturas sin GR (Pending Receipt/Z-block)'),
('Regularización de facturas retenidas'),
('Reportes'),
('Reprocesamiento de facturas rechazadas'),
('Reunión / Meeting interno'),
('Revisión documentos en SAP'),
('Soporte a auditoría interna/externa'),
('Soporte CB por Teams/otras vías'),
('Turnos médico/Personal')
on conflict (name) do nothing;
