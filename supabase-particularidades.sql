create table if not exists particularidades (
  id uuid primary key default gen_random_uuid(),
  company_code text not null,
  title text not null,
  body text not null,
  created_at timestamptz default now()
);
alter table particularidades enable row level security;
create policy "allow_all_particularidades" on particularidades for all using (true);
