create table if not exists boleto_brasil (
  id uuid primary key default gen_random_uuid(),
  company_code text not null check (company_code in ('4003','4018','4305')),
  vendor text not null,
  nf_number text not null,
  boleto_number text not null,
  status text not null default 'pending' check (status in ('pending','done')),
  added_by_id uuid references collaborators(id),
  added_by_name text not null,
  added_at timestamptz not null default now(),
  loaded_by_id uuid references collaborators(id),
  loaded_by_name text,
  loaded_at timestamptz
);
alter table boleto_brasil enable row level security;
create policy "allow_all_boleto" on boleto_brasil for all using (true);
