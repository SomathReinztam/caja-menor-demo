export interface Visitor {
  id: number
  name: string
}

export interface Provider {
  id: number
  visitor: number
  name: string
  document_type: string
  document_number: string
  is_electronic_biller: boolean
  department: string
  municipality: string
  address: string
  email: string
  responsability_type: string
  /** URL del RUT; null si el proveedor no tiene RUT cargado. */
  rut_file: string | null
}

export interface RutExtraction {
  name: string | null
  document_type: string
  document_number: string | null
  is_electronic_biller: boolean
  department: string | null
  municipality: string | null
  address: string | null
  /** Correo del RUT (suele venir en facturadores electrónicos); null si no aparece. */
  email: string | null
  /** Códigos DIAN (ej. "52-49") construidos desde las responsabilidades del RUT. */
  responsability_type: string
  /** Texto crudo de cada responsabilidad/calidad/atributo del RUT. */
  responsibilities: string[]
}

export interface InvoiceItem {
  concept: string
  value: number | null
}

export interface InvoiceExtraction {
  invoice_number: string | null
  issue_date: string | null
  emitter_nit: string | null
  items: InvoiceItem[]
  total_value: number | null
}

export interface TaxProfile {
  id: number
  visitor: number
  full_name: string
  document_type: string
  document_number: string
  address: string
  department: string
  municipality: string
  email: string
  phone_country_code: string
  phone_number: string
}

export interface Expense {
  id: string
  provider: number | null
  document_kind: 'invoice' | 'charge_account'
  payment_method: string
  /** Tarjeta con la que se pagó (id); null si fue efectivo o es un gasto anterior. */
  card: number | null
  card_detail: Card | null
  payer: string
  project_name: string
  invoice_number: string
  issue_date: string
  emitter_nit: string
  total_value: number
  status: string
  /** Estado simplificado para el visitador. */
  review_status: 'in_review' | 'accepted' | 'rejected'
  /** Motivo si contabilidad lo rechazó. */
  rejection_reason: string
  /** Solo antes de que contabilidad lo verifique (y se envíe a Odoo). */
  can_delete: boolean
  signature_status: string
  /** A nombre de quién va la cuenta de cobro (y quién firma). '' en facturas. */
  charge_account_issuer: '' | 'provider' | 'visitor'
  zapsign_sign_url: string
  items: { id: number; concept: string; value: number }[]
  created_at: string
}

export type CardBank = 'bancolombia' | 'other'
export type CardType = 'credit' | 'debit' | 'prepaid'

/** Tarjeta del visitador (solo últimos 4 dígitos; nunca el número completo). */
export interface Card {
  id: number
  visitor: number
  bank: CardBank
  card_type: CardType
  last4: string
  alias: string
  is_active: boolean
}

/** Consignación de efectivo (la reporta el visitador) o recarga de la tarjeta (la registra contabilidad). */
export interface Movement {
  id: number
  visitor: number
  kind: 'deposit' | 'card_load'
  amount: string
  date: string
  /** URL del comprobante; solo en consignaciones. */
  receipt_file: string | null
  notes: string
  created_at: string
}
