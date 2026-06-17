export interface ActionItem {
  key: string
  label: string
  sublabel?: string
  icon: string
  reasons?: string[]
  reasonAllowsCustom?: boolean
  transition?: boolean
}

export interface SystemConfig {
  key: string
  label: string
  bg: string
  color: string
  actions: ActionItem[]
}

export const COUPA_STATES = ['Draft', 'Pending Approval', 'Approved', 'Disputed', 'Rejected', 'Pending Action', 'Void', 'Abandon']

// Helper: orden alfabético por label (transición siempre primera)
function sortActions(actions: ActionItem[]): ActionItem[] {
  return [...actions].sort((a, b) => {
    if (a.transition) return -1
    if (b.transition) return 1
    return a.label.localeCompare(b.label, 'es')
  })
}

export const SYSTEMS_CONFIG: SystemConfig[] = [
  {
    key: 'brainware',
    label: 'Brainware',
    bg: '#E6F1FB',
    color: '#185FA5',
    // Orden manual (no alfabético): Validar primero, Rechazo después
    actions: [
      { key: 'validar_documento', label: 'Validar documento', icon: 'ti-circle-check' },
      {
        key: 'rechazo_documento',
        label: 'Rechazo documento',
        sublabel: 'Seleccioná la razón',
        icon: 'ti-file-x',
        reasons: ['Información incorrecta', 'PO cerrada', 'Documento inválido', 'PDF ilegible', 'Otro'],
        reasonAllowsCustom: true,
      },
    ],
  },
  {
    key: 'coupa',
    label: 'Coupa',
    bg: '#CECBF6',
    color: '#3C3489',
    actions: sortActions([
      { key: 'transicion', label: 'Cambio de estado', sublabel: 'Origen → Destino', icon: 'ti-arrows-exchange', transition: true },
      { key: 'revision_estado_fc', label: 'Revisión de estado factura', icon: 'ti-eye' },
      { key: 'compensacion_fc_nc', label: 'Compensación FC/NC', icon: 'ti-arrows-left-right' },
      { key: 'revision_po_gr', label: 'Revisión PO/GR', icon: 'ti-clipboard-check' },
    ]),
  },
  {
    key: 'onbase',
    label: 'Onbase',
    bg: '#FAEEDA',
    color: '#854F0B',
    actions: sortActions([
      { key: 'invalid_requestor', label: 'Invalid requestor', icon: 'ti-user-x' },
      { key: 'correccion_send_forward', label: 'Corrección info - Send forward', icon: 'ti-send' },
      { key: 'true_duplicate', label: 'True Duplicate', icon: 'ti-copy' },
      { key: 'reject_document', label: 'Reject document', icon: 'ti-file-x' },
      { key: 'future_date_forward', label: 'Future date - Send forward', icon: 'ti-calendar-up' },
      { key: 'busqueda_estado_fc', label: 'Búsqueda estado FC', icon: 'ti-search' },
    ]),
  },
  {
    key: 'sap',
    label: 'SAP',
    bg: '#EAF3DE',
    color: '#3B6D11',
    actions: sortActions([
      { key: 'modif_base_imponible', label: 'Modificación base imponible', sublabel: 'Por documento', icon: 'ti-edit' },
      { key: 'aprobacion_npo', label: 'Aprobación NPO', icon: 'ti-check' },
      { key: 'ajuste_manual', label: 'Ajuste manual', icon: 'ti-adjustments' },
      { key: 'factura_legal_tracker', label: 'Factura Legal Tracker', icon: 'ti-file-invoice' },
      { key: 'rechazo_npo', label: 'Rechazo NPO', icon: 'ti-x' },
      { key: 'mr8m', label: 'MR8M (cancelación FC PO)', icon: 'ti-ban' },
      { key: 'f44', label: 'F-44 (compensación proveedor)', icon: 'ti-arrows-left-right' },
      { key: 'registro_hamm', label: 'Registro HAMM', icon: 'ti-pencil-plus' },
      { key: 'mr11_pos', label: 'MR11 POs', icon: 'ti-clipboard-x' },
      { key: 'revision_po', label: 'Revisión PO', icon: 'ti-clipboard-check' },
      { key: 'brasil_mod_reference_boleto', label: 'Brasil - Modificación de reference por BOLETO', icon: 'ti-edit' },
      { key: 'brasil_reclamo_boleto_vencimiento', label: 'Brasil - Reclamo nuevo boleto por vencimiento', icon: 'ti-receipt' },
      { key: 'reportes_generados', label: 'Reportes generados', icon: 'ti-report' },
    ]),
  },
  {
    key: 'arca',
    label: 'ARCA',
    bg: '#FBEAF0',
    color: '#72243E',
    actions: sortActions([
      { key: 'aceptacion_rechazo_fces', label: 'Aceptación/Rechazo FCEs', icon: 'ti-checkbox' },
      { key: 'control_status_factura', label: 'Control status factura SAP/Coupa/Excel', icon: 'ti-list-check' },
    ]),
  },
  {
    key: 'freshdesk',
    label: 'Freshdesk',
    bg: '#E0F2EF',
    color: '#0F6E56',
    actions: sortActions([
      { key: 'ticket', label: 'Ticket', icon: 'ti-ticket' },
    ]),
  },
  {
    key: 'outlook',
    label: 'Outlook',
    bg: '#E6E9FB',
    color: '#2A4B9B',
    actions: sortActions([
      { key: 'lectura_mail', label: 'Lectura de mail', icon: 'ti-mail-opened' },
      { key: 'respuesta_mail', label: 'Respuesta mail', icon: 'ti-mail-forward' },
      { key: 'reunion_meeting', label: 'Reunión/Meeting', icon: 'ti-users' },
    ]),
  },
]

export function getActionLabel(systemKey: string, actionKey: string): string {
  const sys = SYSTEMS_CONFIG.find(s => s.key === systemKey)
  const act = sys?.actions.find(a => a.key === actionKey)
  return act?.label || actionKey
}
