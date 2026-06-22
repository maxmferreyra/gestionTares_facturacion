-- Migration: update tasks table for time-based tracking

-- Add new columns
alter table tasks add column if not exists start_time time;
alter table tasks add column if not exists end_time time;
alter table tasks add column if not exists systems text[] default '{}';

-- hours is now calculated, keep for backward compat but we won't use it
-- tag stays as-is

-- Systems catalog table (for future supervisor management)
create table if not exists systems_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

-- Seed default systems
insert into systems_catalog (name) values
  ('ARCA'),
  ('BRAINWARE'),
  ('COUPA'),
  ('LEGAL TRACKER'),
  ('ONBASE'),
  ('SAP')
on conflict (name) do nothing;

-- Tags catalog table
create table if not exists tags_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

-- Seed default tags
insert into tags_catalog (name) values
  ('General'),
  ('Urgente'),
  ('Reunión'),
  ('Informe'),
  ('Soporte'),
  ('Cierre')
on conflict (name) do nothing;

-- RLS
alter table systems_catalog enable row level security;
alter table tags_catalog enable row level security;
create policy "allow_all_systems" on systems_catalog for all using (true);
create policy "allow_all_tags" on tags_catalog for all using (true);

-- Invoice actions table for the counter tab
create table if not exists invoice_actions (
  id uuid primary key default gen_random_uuid(),
  collaborator_id uuid references collaborators(id) on delete cascade,
  system text not null,
  action text not null,
  date date not null default current_date,
  created_at timestamptz default now()
);

create index if not exists invoice_actions_collaborator_date on invoice_actions(collaborator_id, date);

alter table invoice_actions enable row level security;
create policy "allow_all_invoice_actions" on invoice_actions for all using (true);

-- Add invoice_number to invoice_actions
alter table invoice_actions add column if not exists invoice_number text;

-- Invoices table
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  collaborator_id uuid references collaborators(id) on delete cascade,
  invoice_number text not null,
  origin text default 'OCR',
  created_at timestamptz default now(),
  unique(collaborator_id, invoice_number)
);

create index if not exists invoices_collaborator on invoices(collaborator_id);
alter table invoices enable row level security;
create policy "allow_all_invoices" on invoices for all using (true);
