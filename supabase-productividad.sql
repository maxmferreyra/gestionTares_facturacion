-- ════════════════════════════════════════════════════════════
-- MÓDULO PRODUCTIVIDAD — tabla nueva, no modifica nada existente
-- ════════════════════════════════════════════════════════════
create table if not exists action_time_standards (
  id uuid primary key default gen_random_uuid(),
  system text not null,
  action text not null,
  standard_seconds integer not null default 60,
  updated_at timestamptz default now(),
  unique(system, action)
);

alter table action_time_standards enable row level security;
create policy "allow_all_action_time_standards" on action_time_standards for all using (true);

-- Valores iniciales estimados — son un punto de partida, ajustalos
-- desde la pantalla de Productividad una vez que tengas datos reales.
insert into action_time_standards (system, action, standard_seconds) values
  ('brainware','validar_documento',45),
  ('brainware','rechazo_documento',90),
  ('coupa','transicion',60),
  ('coupa','revision_estado_fc',90),
  ('coupa','compensacion_fc_nc',120),
  ('coupa','revision_po_gr',120),
  ('onbase','invalid_requestor',60),
  ('onbase','correccion_send_forward',90),
  ('onbase','true_duplicate',45),
  ('onbase','reject_document',60),
  ('onbase','future_date_forward',60),
  ('onbase','busqueda_estado_fc',60),
  ('sap','modif_base_imponible',180),
  ('sap','aprobacion_npo',90),
  ('sap','ajuste_manual',120),
  ('sap','factura_legal_tracker',180),
  ('sap','rechazo_npo',90),
  ('sap','mr8m',120),
  ('sap','f44',120),
  ('sap','registro_hamm',150),
  ('sap','mr11_pos',120),
  ('sap','revision_po',90),
  ('sap','brasil_mod_reference_boleto',120),
  ('sap','brasil_reclamo_boleto_vencimiento',120),
  ('sap','reportes_generados',300),
  ('sap','revision_documento_trm',150),
  ('arca','aceptacion_rechazo_fces',60),
  ('arca','control_status_factura',90),
  ('freshdesk','ticket',300),
  ('outlook','lectura_mail',60),
  ('outlook','respuesta_mail',180),
  ('outlook','reunion_meeting',1800),
  ('outlook','brasil_reclamo_boleto_vencido',120)
on conflict (system, action) do nothing;
