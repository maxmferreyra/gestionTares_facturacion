-- Run this AFTER creating your Supabase project and running supabase-schema.sql
-- This creates the two supervisor accounts with a default PIN of 1234
-- IMPORTANT: Change the PINs after first login using "Olvidé mi PIN"

-- Add role column to collaborators
alter table collaborators add column if not exists role text default 'collaborator';

-- Insert supervisors (PIN: 1234 - hashed with bcrypt rounds=10)
-- The hash below corresponds to PIN "1234"
insert into collaborators (name, pin_hash, role) values
  ('Gonzalo Haene', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'supervisor'),
  ('Paula Czemernicki', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'supervisor')
on conflict do nothing;
