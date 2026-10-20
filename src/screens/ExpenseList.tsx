import { useEffect, useState } from 'react'
import { api } from '../api'
import type { Expense } from '../types'
import { Badge, Card, Spinner, TopBar, type Tone } from '../components/ui'
import { cardLabel, docKindLabel, fmtCop, reviewLabel, reviewTone, signatureLabel, signatureTone } from '../labels'

export default function ExpenseList({
  onBack,
  showToast,
}: {
  onBack: () => void
  showToast: (text: string, tone?: Tone) => void
}) {
  const [items, setItems] = useState<Expense[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function onDelete(e: Expense) {
    if (!window.confirm('¿Eliminar este gasto? No se puede deshacer.')) return
    setDeletingId(e.id)
    try {
      await api.deleteExpense(e.id)
      setItems((prev) => prev?.filter((x) => x.id !== e.id) ?? null)
      showToast('Gasto eliminado', 'success')
    } catch (err) {
      showToast('No se pudo eliminar: ' + String((err as Error).message), 'danger')
    } finally {
      setDeletingId(null)
    }
  }

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
              <Badge tone={reviewTone[e.review_status] ?? 'neutral'}>
                {reviewLabel[e.review_status] ?? e.review_status}
              </Badge>
              {e.review_status === 'in_review' && e.signature_status !== 'not_required' && (
                <Badge tone={signatureTone[e.signature_status] ?? 'neutral'}>
                  {signatureLabel[e.signature_status] ?? e.signature_status}
                </Badge>
              )}
              <Badge tone="neutral">{e.payer === 'unergy' ? 'Unergy' : 'Solenium'}</Badge>
              {e.card_detail && <Badge tone="info">{cardLabel(e.card_detail)}</Badge>}
            </div>
            {e.review_status === 'rejected' && e.rejection_reason && (
              <div className="mt-3 text-xs text-danger bg-dangerBg rounded-input px-3 py-2">
                Motivo: {e.rejection_reason}
              </div>
            )}
            {e.review_status === 'in_review' && e.signature_status === 'pending' && e.zapsign_sign_url && (
              <a
                href={e.zapsign_sign_url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm font-semibold text-primary"
              >
                Abrir enlace de firma →
              </a>
            )}
            {e.can_delete && (
              <button
                onClick={() => onDelete(e)}
                disabled={deletingId === e.id}
                className="mt-3 block text-sm font-semibold text-danger disabled:opacity-50"
              >
                {deletingId === e.id ? 'Eliminando…' : 'Eliminar gasto'}
              </button>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
