export interface ActionItem {
  key: string
  label: string
  sublabel?: string
  icon: string
  reasons?: string[]  // optional dropdown of reasons
}

export interface SystemConfig {
  key: string
  label: string
  bg: string
  color: string
  actions: ActionItem[]
}

// Basado en la hoja "Facturas" del Excel
export const SYSTEMS_CONFIG: SystemConfig[] = [
  {
    key: 'brainware',
    label: 'Brainware',
    bg: '#E6F1FB',
    color: '#185FA5',
    actions: [
      { key: 'correccion_aprobacion', label: 'Corrección de info y aprobación', icon: 'ti-circle-check' },
      {
        key: 'rechazo_documento',
        label: 'Rechazo documento',
        sublabel: 'Seleccioná la razón',
        icon: 'ti-file-x',
        reasons: ['Información incorrecta', 'PO cerrada', 'Documento inválido', 'PDF ilegible', 'Otro'],
      },
    ],
  },
  {
    key: 'coupa',
    label: 'Coupa',
    bg: '#CECBF6',
    color: '#3C3489',
    actions: [
      { key: 'draft', label: 'Draft', icon: 'ti-file-pencil' },
      { key: 'pending_approval', label: 'Pending Approval', icon: 'ti-clock' },
      { key: 'approved', label: 'Approved', icon: 'ti-circle-check' },
      { key: 'disputed', label: 'Disputed', icon: 'ti-message-exclamation' },
      { key: 'rejected', label: 'Rejected', icon: 'ti-refresh' },
      { key: 'pending_action', label: 'Pending Action', icon: 'ti-alert-circle' },
      { key: 'void', label: 'Void', icon: 'ti-ban' },
      { key: 'abandon', label: 'Abandon', icon: 'ti-trash-x' },
    ],
  },
  {
    key: 'onbase',
    label: 'Onbase',
    bg: '#FAEEDA',
    color: '#854F0B',
    actions: [
      { key: 'invalid_requestor', label: 'Invalid requestor', icon: 'ti-user-x' },
      { key: 'correccion_send_forward', label: 'Corrección info - Send forward', icon: 'ti-send' },
      { key: 'true_duplicate', label: 'True Duplicate', icon: 'ti-copy' },
      { key: 'reject_document', label: 'Reject document', icon: 'ti-file-x' },
      { key: 'future_date_forward', label: 'Future date - Send forward', icon: 'ti-calendar-up' },
    ],
  },
  {
    key: 'sap',
    label: 'SAP',
    bg: '#EAF3DE',
    color: '#3B6D11',
    actions: [
      { key: 'modif_base_imponible', label: 'Modificación base imponible', sublabel: 'Por documento', icon: 'ti-edit' },
      { key: 'aprobacion_npo', label: 'Aprobación NPO', icon: 'ti-check' },
      { key: 'ajuste_manual', label: 'Ajuste manual', icon: 'ti-adjustments' },
      { key: 'factura_legal_tracker', label: 'Factura Legal Tracker', icon: 'ti-file-invoice' },
    ],
  },
  {
    key: 'arca',
    label: 'ARCA',
    bg: '#FBEAF0',
    color: '#72243E',
    actions: [
      { key: 'aceptacion_rechazo_fces', label: 'Aceptación/Rechazo FCEs', icon: 'ti-checkbox' },
    ],
  },
]

// Helper: get a flat label for an action key
export function getActionLabel(systemKey: string, actionKey: string): string {
  const sys = SYSTEMS_CONFIG.find(s => s.key === systemKey)
  const act = sys?.actions.find(a => a.key === actionKey)
  return act?.label || actionKey
}
