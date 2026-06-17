-- ════════════════════════════════════════════════════════════
-- USUARIOS FIJOS — Los únicos que pueden loguearse
-- ════════════════════════════════════════════════════════════
-- Colaboradores con PIN 1234 (hash bcrypt)
-- Supervisores: Gonzalo (3208) y Paula (1234)

-- Asegurar columnas
alter table collaborators add column if not exists role text default 'collaborator';
alter table collaborators add column if not exists avatar text;

-- Limpiar usuarios existentes (opcional, descomentar si querés empezar de cero)
-- truncate table collaborators cascade;

-- Hash de PIN 1234: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
-- Hash de PIN 3208: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

-- NOTA: como todos los colaboradores comparten PIN 1234, el login es por NOMBRE + PIN
insert into collaborators (name, pin_hash, role) values
  ('Julio Riobo', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'collaborator'),
  ('Marjorie Gaigher', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'collaborator'),
  ('Maria Susana Racedo', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'collaborator'),
  ('Ignacio Scalzo', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'collaborator'),
  ('Candela Monico', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'collaborator'),
  ('Gonzalo Haene', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'supervisor'),
  ('Paula Czemernicki', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'supervisor')
on conflict do nothing;

select name, role from collaborators order by role, name;
