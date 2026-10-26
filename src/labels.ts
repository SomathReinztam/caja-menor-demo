import type { Tone } from './components/ui'

export const docKindLabel: Record<string, string> = {
  invoice: 'Factura',
  charge_account: 'Cuenta de cobro',
}

export const statusLabel: Record<string, string> = {
  submitted: 'Registrado',
  pending_signature: 'Pendiente de firma',
  verified: 'Verificado',
  synced_to_odoo: 'En Odoo',
  rejected: 'Rechazado',
}

export const statusTone: Record<string, Tone> = {
  submitted: 'neutral',
  pending_signature: 'warning',
  verified: 'info',
  synced_to_odoo: 'success',
  rejected: 'danger',
}

// Estado que ve el visitador en "Mis gastos" (backend: review_status).
export const reviewLabel: Record<string, string> = {
  in_review: 'En revisión',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
}

export const reviewTone: Record<string, Tone> = {
  in_review: 'warning',
  accepted: 'success',
  rejected: 'danger',
}

export const signatureLabel: Record<string, string> = {
  pending: 'Firma pendiente',
  signed: 'Firmada',
  refused: 'Firma rechazada',
}

export const signatureTone: Record<string, Tone> = {
  pending: 'warning',
  signed: 'success',
  refused: 'danger',
}

export function fmtCop(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—'
  return '$' + Math.round(n).toLocaleString('es-CO')
}

export const bankLabel: Record<string, string> = {
  bancolombia: 'Bancolombia',
  other: 'Otro banco',
}

export const cardTypeLabel: Record<string, string> = {
  credit: 'Crédito',
  debit: 'Débito',
  prepaid: 'Prepago',
}

export function cardLabel(c: { bank: string; card_type: string; last4: string; alias?: string }): string {
  const base = `${bankLabel[c.bank] ?? c.bank} ${cardTypeLabel[c.card_type] ?? c.card_type} ····${c.last4}`
  return c.alias ? `${c.alias} · ${base}` : base
}

export const movementLabel: Record<string, string> = {
  deposit: 'Consignación',
  card_load: 'Recarga de tarjeta',
}
