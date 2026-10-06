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
