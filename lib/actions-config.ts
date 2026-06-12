export interface ActionItem {
  key: string
  label: string
  sublabel: string
  icon: string
}

export interface SystemConfig {
  key: string
  label: string
  bg: string
  color: string
  actions: ActionItem[]
}

export const SYSTEMS_CONFIG: SystemConfig[] = [
  {
    key: 'brainware',
    label: 'Brainware',
    bg: '#E6F1FB',
    color: '#185FA5',
    actions: [
      { key: 'ocr_verification', label: 'Verificación inicial', sublabel: 'OCR / Escaneo', icon: 'ti-scan' },
    ],
  },
  {
    key: 'onbase',
    label: 'Onbase',
    bg: '#FAEEDA',
    color: '#854F0B',
    actions: [
      { key: 'onbase_ok', label: 'Factura OK', sublabel: 'Sin intervención', icon: 'ti-circle-check' },
      { key: 'onbase_stopped', label: 'Factura frenada', sublabel: 'Requiere intervención', icon: 'ti-alert-triangle' },
    ],
  },
  {
    key: 'coupa',
    label: 'Coupa',
    bg: '#CECBF6',
    color: '#3C3489',
    actions: [
      { key: 'draft_to_pending', label: 'Draft → Pending Approval', sublabel: 'Revisión de borrador', icon: 'ti-file-arrow-right' },
      { key: 'pending_to_approved', label: 'Pending Approval → Approved', sublabel: 'Aprobación final', icon: 'ti-check' },
      { key: 'rejected_review', label: 'Rejected → revisión', sublabel: 'Factura rechazada por SAP', icon: 'ti-refresh' },
      { key: 'disputed', label: 'Disputed', sublabel: 'Problema con PO / GR', icon: 'ti-message-exclamation' },
      { key: 'void_abandon', label: 'Void / Abandon', sublabel: 'Anulación de factura', icon: 'ti-ban' },
    ],
  },
  {
    key: 'sap',
    label: 'SAP',
    bg: '#EAF3DE',
    color: '#3B6D11',
    actions: [
      { key: 'sap_arrival', label: 'Verificación de llegada', sublabel: 'Chequeo post-aprobación', icon: 'ti-eye' },
      { key: 'sap_tax_base', label: 'Modificación base imponible', sublabel: 'Argentina — WHT / percepciones', icon: 'ti-edit' },
    ],
  },
  {
    key: 'arca',
    label: 'ARCA',
    bg: '#FBEAF0',
    color: '#72243E',
    actions: [
      { key: 'arca_action', label: 'Consulta / acción', sublabel: '', icon: 'ti-cursor-text' },
    ],
  },
  {
    key: 'legal_tracker',
    label: 'Legal Tracker',
    bg: '#F1EFE8',
    color: '#444441',
    actions: [
      { key: 'lt_action', label: 'Consulta / acción', sublabel: '', icon: 'ti-cursor-text' },
    ],
  },
]
