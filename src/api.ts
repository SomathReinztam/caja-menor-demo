import type { Expense, InvoiceExtraction, Provider, RutExtraction, TaxProfile } from './types'

const BASE = '/api/cajita-menor/app/v2'

// Visitador "actuando" en el demo. Se manda como header X-Demo-Visitor y el
// backend (DemoVisitorAuthentication, gateado) arma el owner correspondiente.
let currentVisitorId = 1
export function setVisitor(id: number) {
  currentVisitorId = id
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return { 'X-Demo-Visitor': String(currentVisitorId), ...extra }
}

async function handle(res: Response) {
  if (!res.ok) {
    let detail = ''
    try {
      detail = JSON.stringify(await res.json())
    } catch {
      detail = res.statusText
    }
    throw new Error(detail || `HTTP ${res.status}`)
  }
  if (res.status === 204) return null
  return res.json()
}

// DRF puede paginar los listados ({results:[...]}) o devolver una lista plana.
function asList<T>(data: any): T[] {
  return Array.isArray(data) ? data : (data?.results ?? [])
}

export interface ProviderInput {
  name: string
  document_type: string
  document_number: string
  is_electronic_biller: boolean
  department: string
  municipality: string
  address: string
}

export interface ExpenseInput {
  provider: number | null
  payment_method: string
  payer: string
  project_name: string
  invoice_number: string
  issue_date: string
  emitter_nit: string
  total_value: number
  items: { concept: string; value: number }[]
}

export const api = {
  extractRut(file: File): Promise<RutExtraction> {
    const fd = new FormData()
    fd.append('rut_file', file)
    return fetch(`${BASE}/providers/extract-rut/`, {
      method: 'POST',
      headers: headers(),
      body: fd,
    }).then(handle)
  },

  createProvider(p: ProviderInput, rutFile?: File | null): Promise<Provider> {
    const fd = new FormData()
    fd.append('visitor', String(currentVisitorId))
    fd.append('name', p.name)
    fd.append('document_type', p.document_type)
    fd.append('document_number', p.document_number)
    fd.append('is_electronic_biller', p.is_electronic_biller ? 'true' : 'false')
    fd.append('department', p.department)
    fd.append('municipality', p.municipality)
    fd.append('address', p.address)
    if (rutFile) fd.append('rut_file', rutFile)
    return fetch(`${BASE}/providers/`, {
      method: 'POST',
      headers: headers(),
      body: fd,
    }).then(handle)
  },

  listProviders(): Promise<Provider[]> {
    return fetch(`${BASE}/providers/`, { headers: headers() })
      .then(handle)
      .then((d) => asList<Provider>(d))
  },

  extractInvoice(file: File): Promise<InvoiceExtraction> {
    const fd = new FormData()
    fd.append('file', file)
    return fetch(`${BASE}/expenses/extract-invoice/`, {
      method: 'POST',
      headers: headers(),
      body: fd,
    }).then(handle)
  },

  createExpense(e: ExpenseInput): Promise<Expense> {
    return fetch(`${BASE}/expenses/`, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ ...e, visitor: currentVisitorId }),
    }).then(handle)
  },

  // Sube el soporte (imagen/PDF) DESPUÉS de crear el gasto. El create va en JSON
  // (por los ítems anidados) y no puede transportar el archivo, así que la imagen
  // de la factura se sube aquí para que quede en TSF y Odoo.
  uploadSourceFile(id: string, file: File): Promise<Expense> {
    const fd = new FormData()
    fd.append('source_file', file)
    return fetch(`${BASE}/expenses/${id}/source-file/`, {
      method: 'POST',
      headers: headers(),
      body: fd,
    }).then(handle)
  },

  listExpenses(): Promise<Expense[]> {
    return fetch(`${BASE}/expenses/`, { headers: headers() })
      .then(handle)
      .then((d) => asList<Expense>(d))
  },

  getTaxProfile(): Promise<TaxProfile | null> {
    return fetch(`${BASE}/tax-profile/?visitor=${currentVisitorId}`, { headers: headers() }).then(
      (res) => (res.status === 404 ? null : handle(res)),
    )
  },

  extractTaxRut(file: File): Promise<{
    full_name: string | null
    document_number: string | null
    address: string | null
    department: string | null
    municipality: string | null
  }> {
    const fd = new FormData()
    fd.append('rut_file', file)
    return fetch(`${BASE}/tax-profile/extract-rut/`, {
      method: 'POST',
      headers: headers(),
      body: fd,
    }).then(handle)
  },

  putTaxProfile(
    p: {
      full_name: string
      document_type: string
      document_number: string
      address: string
      department: string
      municipality: string
      email: string
      phone_country_code: string
      phone_number: string
    },
    rutFile?: File | null,
  ): Promise<TaxProfile> {
    const fd = new FormData()
    fd.append('visitor', String(currentVisitorId))
    fd.append('full_name', p.full_name)
    fd.append('document_type', p.document_type)
    fd.append('document_number', p.document_number)
    fd.append('address', p.address)
    fd.append('department', p.department)
    fd.append('municipality', p.municipality)
    fd.append('email', p.email)
    fd.append('phone_country_code', p.phone_country_code)
    fd.append('phone_number', p.phone_number)
    if (rutFile) fd.append('rut_file', rutFile)
    return fetch(`${BASE}/tax-profile/`, { method: 'PUT', headers: headers(), body: fd }).then(handle)
  },
}
