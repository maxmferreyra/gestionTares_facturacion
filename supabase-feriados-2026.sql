-- ════════════════════════════════════════════════════════════
-- FERIADOS NACIONALES ARGENTINA 2026 — carga inicial
-- Fuente: Jefatura de Gabinete de Ministros (argentina.gob.ar) + Ley 27.399 + Resolución 164/2025
-- Usuario "Sistema Milo" genérico — no requiere un colaborador específico
-- ════════════════════════════════════════════════════════════

insert into calendar_events (kind, team_event_type, title, date_from, date_to, created_by_id, created_by_name)
select 'team_event', 'feriado', title, date_from::date, date_to::date,
  (select id from collaborators order by created_at limit 1), 'Milo'
from (values
  ('Año Nuevo', '2026-01-01', '2026-01-01'),
  ('Carnaval', '2026-02-16', '2026-02-17'),
  ('Día no laborable con fines turísticos', '2026-03-23', '2026-03-23'),
  ('Día Nacional de la Memoria por la Verdad y la Justicia', '2026-03-24', '2026-03-24'),
  ('Día del Veterano y de los Caídos en la Guerra de Malvinas (+ Jueves Santo)', '2026-04-02', '2026-04-02'),
  ('Viernes Santo', '2026-04-03', '2026-04-03'),
  ('Día del Trabajador', '2026-05-01', '2026-05-01'),
  ('Día de la Revolución de Mayo', '2026-05-25', '2026-05-25'),
  ('Paso a la Inmortalidad del Gral. Martín Miguel de Güemes', '2026-06-15', '2026-06-15'),
  ('Paso a la Inmortalidad del Gral. Manuel Belgrano (cae sábado)', '2026-06-20', '2026-06-20'),
  ('Día de la Independencia', '2026-07-09', '2026-07-09'),
  ('Día no laborable con fines turísticos', '2026-07-10', '2026-07-10'),
  ('Paso a la Inmortalidad del Gral. José de San Martín', '2026-08-17', '2026-08-17'),
  ('Día del Respeto a la Diversidad Cultural', '2026-10-12', '2026-10-12'),
  ('Día de la Soberanía Nacional', '2026-11-23', '2026-11-23'),
  ('Día no laborable con fines turísticos', '2026-12-07', '2026-12-07'),
  ('Inmaculada Concepción de María', '2026-12-08', '2026-12-08'),
  ('Navidad', '2026-12-25', '2026-12-25')
) as t(title, date_from, date_to)
where exists (select 1 from collaborators);
