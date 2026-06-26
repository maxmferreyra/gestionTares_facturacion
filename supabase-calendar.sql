-- ════════════════════════════════════════════════════════════
-- MÓDULO INICIO / CALENDARIO — tabla nueva, no modifica nada existente
-- ════════════════════════════════════════════════════════════
create table if not exists calendar_events (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('absence','team_event')),

  -- Solo para kind='absence'
  absence_type text check (absence_type in ('vacaciones','estudio','licencia_medica','otro')),
  collaborator_id uuid references collaborators(id),

  -- Solo para kind='team_event'
  team_event_type text check (team_event_type in ('feriado','fecha_importante')),

  title text,                 -- nota opcional (absence) o título (team_event, requerido en la app)
  date_from date not null,
  date_to date not null,

  created_by_id uuid references collaborators(id) not null,
  created_by_name text not null,
  created_at timestamptz default now()
);

create index if not exists cal_events_dates_idx on calendar_events(date_from, date_to);
create index if not exists cal_events_kind_idx on calendar_events(kind);

alter table calendar_events enable row level security;
create policy "allow_all_calendar_events" on calendar_events for all using (true);
