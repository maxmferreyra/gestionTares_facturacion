-- ═══════════════════════════════════════════════════
-- CAPACITY MODULE — tablas nuevas, no toca nada existente
-- ═══════════════════════════════════════════════════

-- Catálogo de tareas de Capacity con tiempo estándar
create table if not exists capacity_tasks (
  id uuid primary key default gen_random_uuid(),
  task_key text not null unique,
  name text not null,
  unit text not null check (unit in ('per_document', 'minutes')),
  unit_minutes integer not null,   -- valor "X" en "1=Xmin" o en "per document"
  standard_minutes numeric(6,2) not null default 1,
  active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now()
);
alter table capacity_tasks enable row level security;
create policy "allow_all_capacity_tasks" on capacity_tasks for all using (true);

-- Registros diarios de toques
create table if not exists capacity_logs (
  id uuid primary key default gen_random_uuid(),
  collaborator_id uuid references collaborators(id) not null,
  task_key text not null,
  date date not null,
  quantity integer not null default 1,
  created_at timestamptz default now()
);
create index if not exists cap_logs_collab_date on capacity_logs(collaborator_id, date);
create index if not exists cap_logs_date on capacity_logs(date);
alter table capacity_logs enable row level security;
create policy "allow_all_capacity_logs" on capacity_logs for all using (true);

-- Setting: horas del mes configurables por supervisores
create table if not exists capacity_settings (
  key text primary key,
  value text not null
);
alter table capacity_settings enable row level security;
create policy "allow_all_capacity_settings" on capacity_settings for all using (true);
insert into capacity_settings (key, value) values ('monthly_hours', '176') on conflict (key) do nothing;

-- Carga inicial: 28 tareas con tiempos del Excel
insert into capacity_tasks (task_key, name, unit, unit_minutes, standard_minutes, sort_order) values
('arca_control',           'ARCA - Control of approved/missing invoices', 'per_document', 1,  3,    1),
('arca_excel',             'ARCA - Excel update for control',              'minutes',      60, 60,   2),
('arca_approval',          'ARCA - Invoice approval/rejection on ARCA portal', 'per_document', 1, 4,  3),
('arca_mail',              'ARCA - Mail/ticket to casual buyers for missing invoices on Coupa', 'per_document', 1, 5, 4),
('arg_wht',                'Argentina - Tax base (WHT) correction',        'per_document', 1,  1,    5),
('br_boleto',              'Brazil - Boleto reference update',              'per_document', 1,  1,    6),
('br_tax_review',          'Brazil - Tax Review update & claim for missing information', 'minutes', 60, 60, 7),
('claim_gr',               'Claim invoices without GR (Pending Receipt/Z-block)', 'per_document', 1, 5, 8),
('coupa_status',           'Coupa status review',                          'per_document', 1,  10,   9),
('credit_debit',           'Credit/debit note compensation',               'per_document', 1,  10,   10),
('disputed',               'Disputed invoice review & claims',             'per_document', 1,  5,    11),
('email',                  'Email review & responses',                     'minutes',      60, 60,   12),
('freshdesk',              'Freshdesk - Ticket management',                'per_document', 1,  5,    13),
('hamm',                   'HAMM processing',                              'per_document', 1,  15,   14),
('inv_brainware',          'Invoice processing - Brainware',               'per_document', 1,  1.5,  15),
('inv_coupa',              'Invoice processing - Coupa',                   'per_document', 1,  2,    16),
('inv_onbase',             'Invoice processing - Onbase',                  'per_document', 1,  3,    17),
('inv_sap_lt',             'Invoice processing - SAP FB60 (Legal Tracker)', 'per_document', 1, 10,   18),
('lt_batch',               'Legal Tracker - Batch ID download & shared Excel update', 'minutes', 30, 30, 19),
('lt_claims',              'Legal Tracker - Missing coding claims/follow-up', 'per_document', 1, 5,  20),
('sap_adjustments',        'Manual adjustments on SAP / Audit',            'per_document', 1,  10,   21),
('meetings',               'Meetings',                                     'minutes',      30, 30,   22),
('mexico_ctrl',            'Mexico - Controllership update',               'minutes',      30, 30,   23),
('npo_taxes',              'NPO / Taxes processing',                       'per_document', 1,  10,   24),
('vendor_support',         'Vendor/Requester Support via Teams/other channels', 'minutes', 60, 60,  25),
('report_200070',          '200070 Report Review',                         'minutes',      60, 60,   26),
('analysis_errors',        'Analysis of recurring errors',                 'minutes',      60, 60,   27),
('metrics_reporting',      'Metrics / Reporting',                          'minutes',      60, 60,   28)
on conflict (task_key) do nothing;
