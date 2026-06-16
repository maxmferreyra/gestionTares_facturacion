// Listas fijas para el formulario de tareas

// Tareas disponibles (hoja "Tareas" del Excel)
export const TASK_OPTIONS = [
  '200070 - Analisis reporte',
  '200070 - Balanceo POs con error',
  '200070 - MR11 SAP',
  'Actualización de datos de proveedores - Solicitud a Masterdata',
  'Almuerzo',
  'Análisis de causas de errores recurrentes',
  'ARCA - Actualización Excel',
  'ARCA - Aceptación/Rechazo facturas en portal',
  'ARCA - Control de facturas aprobadas y faltantes',
  'ARCA - Reclamo CBs FCEs pendientes',
  'Argentina - Modificación bases imponibles',
  'Brasil - Actualización Tax Review',
  'Brasil - Modificación reference boletos',
  'Brasil - Reclamo TAX por devoluciones de tax reviews',
  'Cambio de bases imponibles Argentina',
  'Capacitación interna del equipo',
  'Carga manual de facturas (error OCR/CSP)',
  'Colombia - Revisión de facturas pendientes',
  'Colombia - Descarga PDFs & actualización Tax Review',
  'Conciliación GR/IR',
  'Control de retenciones/impuestos aplicados correctamente (WHT)',
  'Documentación de procesos (SOPs)',
  'Edición facturas PO/NPO - Falta accesos de PCOE',
  'Estandarización de procesos entre países',
  'Facturas urgentes / pagos críticos',
  'Financial Systems - Creación ticket',
  'Financial Systems - Revisión actualizaciones & backlog de tickets',
  'Freshdesk - Creación de tickets a CBs/proveedores',
  'Freshdesk - Seguimiento y respuestas a tickets creados/derivados',
  'Gestión de notas de crédito / débito con proveedores',
  'Identificación de oportunidades de automatización',
  'Ingreso ajustes manuales',
  'Legal Tracker - Carga de facturas',
  'Legal Tracker - Descarga Batch IDs y actualización Excel compartido',
  'Legal Tracker - Reclamos de coding faltantes en los batch Ids/seguimiento',
  'Limpieza de workflows trabados',
  'Mexico - Actualización Controllership',
  'Mexico - Reclamo/Control de actualización de Controllership',
  'Monitoreo de errores de interfaz (Coupa–SAP)',
  'NEXT - Learning',
  'Onbase - Aprobación/rechazo de facturas',
  'Onbase - Control de facturas LTAM retenidas',
  'Planificación semanal del volumen - Milo',
  'PO - Resolución de discrepancias de precio o cantidad',
  'Priorización diaria de tareas',
  'Procesamiento de facturas',
  'Procesar NPO impuestos',
  'Reclamar facturas sin GR (Pending Receipt/Z-block)',
  'Reclamos por facturas rechazadas',
  'Reprocesamiento de facturas rechazadas',
  'Reunión/Call',
  'Revisión aging de proveedores',
  'Revisión estados Coupa',
  'Revisión facturas dispute y sus reclamos',
  'Revisión mails y respuestas',
  'Seguimiento de cierres de mes',
  'Seguimiento de facturas pendientes con proveedores',
  'Seguimiento de KPIs (volumen, SLA, errores)',
  'Soporte a auditoría interna/externa',
].sort((a, b) => a.localeCompare(b))

// Sistemas fijos para el campo "Sistema" del formulario de tareas (ordenados alfabéticamente)
export const TASK_SYSTEMS = [
  'ARCA',
  'BRAINWARE',
  'COUPA',
  'FRESHDESK',
  'LEGAL TRACKER',
  'ONBASE',
  'OUTLOOK',
  'SAP',
].sort((a, b) => a.localeCompare(b))

// Etiquetas fijas
export const TASK_TAGS = [
  'OPERATIVO',
  'CONTROL',
  'INCIDENCIAS',
  'ANALISIS',
  'GESTIÓN',
  'MEJORAS',
  'REUNIÓN',
  'URGENTE',
]

export const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  OPERATIVO:   { bg: '#E6F1FB', color: '#185FA5' },
  CONTROL:     { bg: '#EAF3DE', color: '#3B6D11' },
  INCIDENCIAS: { bg: '#FAEEDA', color: '#854F0B' },
  ANALISIS:    { bg: '#CECBF6', color: '#3C3489' },
  'GESTIÓN':   { bg: '#F1EFE8', color: '#444441' },
  MEJORAS:     { bg: '#E0F2EF', color: '#0F6E56' },
  'REUNIÓN':   { bg: '#FBEAF0', color: '#72243E' },
  URGENTE:     { bg: '#FCEBEB', color: '#A32D2D' },
}

export function tagStyleFixed(tag: string) {
  return TAG_COLORS[tag] || { bg: '#F1EFE8', color: '#444441' }
}
