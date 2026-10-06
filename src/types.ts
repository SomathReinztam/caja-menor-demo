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
}

export interface RutExtraction {
  name: string | null
  document_type: string
  document_number: string | null
  is_electronic_biller: boolean
  department: string | null
  municipality: string | null
  address: string | null
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
  payer: string
  project_name: string
  invoice_number: string
  issue_date: string
  emitter_nit: string
  total_value: number
  status: string
  signature_status: string
  zapsign_sign_url: string
  items: { id: number; concept: string; value: number }[]
  created_at: string
}
