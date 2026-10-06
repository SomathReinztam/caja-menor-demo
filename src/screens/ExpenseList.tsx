import { useEffect, useState } from 'react'
import { api } from '../api'
import type { Expense } from '../types'
import { Badge, Card, Spinner, TopBar } from '../components/ui'
import {
  docKindLabel,
  fmtCop,
  signatureLabel,
  signatureTone,
  statusLabel,
  statusTone,
} from '../labels'

export default function ExpenseList({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<Expense[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .listExpenses()
      .then(setItems)
      .catch((e) => setError(String(e.message)))
  }, [])

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="Mis gastos" onBack={onBack} />
      <div className="p-4 space-y-3">
        {items === null && !error && (
          <div className="flex justify-center py-12 text-faint">
            <Spinner size={30} />
          </div>
        )}
        {error && (
          <Card>
            <div className="text-sm text-danger break-words">{error}</div>
          </Card>
        )}
        {items && items.length === 0 && (
          <div className="text-center text-faint py-12 text-sm">Aún no has registrado gastos.</div>
        )}
        {items?.map((e) => (
          <Card key={e.id}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-base font-semibold text-ink">
                  {docKindLabel[e.document_kind] ?? e.document_kind}
                </div>
                <div className="text-sm text-faint truncate">
                  {e.invoice_number || e.emitter_nit || '—'} · {e.issue_date}
                </div>
              </div>
              <div className="text-base font-semibold text-ink shrink-0">{fmtCop(e.total_value)}</div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone={statusTone[e.status] ?? 'neutral'}>{statusLabel[e.status] ?? e.status}</Badge>
              {e.signature_status !== 'not_required' && (
                <Badge tone={signatureTone[e.signature_status] ?? 'neutral'}>
                  {signatureLabel[e.signature_status] ?? e.signature_status}
                </Badge>
              )}
              <Badge tone="neutral">{e.payer === 'unergy' ? 'Unergy' : 'Solenium'}</Badge>
            </div>
            {e.zapsign_sign_url && (
              <a
                href={e.zapsign_sign_url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm font-semibold text-primary"
              >
                Abrir enlace de firma →
              </a>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
