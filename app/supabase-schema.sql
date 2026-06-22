-- Run this in Supabase SQL Editor

-- Collaborators table
create table if not exists collaborators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pin_hash text not null,
  created_at timestamptz default now()
);

-- Tasks table
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  collaborator_id uuid references collaborators(id) on delete cascade,
  title text not null,
  date date not null default current_date,
  hours numeric(4,1) default 0,
  tag text default 'General',
  completed boolean default false,
  completed_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists tasks_collaborator_date on tasks(collaborator_id, date);

-- Row Level Security
alter table collaborators enable row level security;
alter table tasks enable row level security;

-- Policies: allow all via service role (we handle auth ourselves)
create policy "allow_all_collaborators" on collaborators for all using (true);
create policy "allow_all_tasks" on tasks for all using (true);
