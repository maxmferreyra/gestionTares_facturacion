-- ════════════════════════════════════════════════════════════
-- MÓDULO BASE IMPONIBLE — tabla nueva, no modifica nada existente
-- ════════════════════════════════════════════════════════════
create table if not exists base_imponible_correcciones (
  id uuid primary key default gen_random_uuid(),
  company_code text not null check (company_code in ('4001','4015')),
  vendor text not null,
  invoice_number text not null,
  amount numeric(14,2) not null,
  status text not null default 'pending' check (status in ('pending','done')),
  added_by_id uuid references collaborators(id),
  added_by_name text not null,
  added_at timestamptz not null default now(),
  corrected_by_id uuid references collaborators(id),
  corrected_by_name text,
  corrected_at timestamptz
);

create index if not exists bic_status_idx on base_imponible_correcciones(status);
create index if not exists bic_vendor_idx on base_imponible_correcciones(vendor);
create index if not exists bic_added_by_idx on base_imponible_correcciones(added_by_id);

alter table base_imponible_correcciones enable row level security;
create policy "allow_all_base_imponible" on base_imponible_correcciones for all using (true);
