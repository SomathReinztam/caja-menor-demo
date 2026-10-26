import { useEffect, useState } from 'react'
import { api } from '../api'
import type { Card } from '../types'
import { Button, Field, Spinner } from './ui'
import type { Tone } from './ui'
import { cardLabel } from '../labels'

function shortErr(e: any) {
  const m = String(e?.message ?? e)
  return m.length > 140 ? m.slice(0, 140) + '…' : m
}

/** Tarjeta prepago del visitador (perfil fiscal). Solo una; se guardan los 4 últimos dígitos. */
export default function CardsSection({ showToast }: { showToast: (text: string, tone?: Tone) => void }) {
  const [cards, setCards] = useState<Card[] | null>(null)
  const [last4, setLast4] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () =>
    api
      .listCards()
      .then(setCards)
      .catch((e) => {
        setCards([])
        showToast('No se pudo cargar la tarjeta: ' + shortErr(e), 'danger')
      })

  useEffect(() => {
    load()
  }, [])

  async function add() {
    if (!/^\d{4}$/.test(last4)) return showToast('Ingresa exactamente los 4 últimos dígitos', 'warning')
    setSaving(true)
    try {
      await api.createCard({ bank: 'bancolombia', card_type: 'prepaid', last4, alias: '' })
      setLast4('')
      showToast('Tarjeta agregada', 'success')
      await load()
    } catch (e) {
      showToast('No se pudo agregar: ' + shortErr(e), 'danger')
    } finally {
      setSaving(false)
    }
  }

  async function remove(c: Card) {
    try {
      const r = await api.deleteCard(c.id)
      showToast(r ? 'Tarjeta desactivada (ya tiene gastos)' : 'Tarjeta eliminada', 'success')
      await load()
    } catch (e) {
      showToast('No se pudo quitar: ' + shortErr(e), 'danger')
    }
  }

  const card = (cards ?? []).find((c) => c.is_active)

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-ink">Mi tarjeta</h2>
      <div className="text-xs text-faint">
        Es la tarjeta prepago que te asignó Unergy. Solo guardamos los 4 últimos dígitos.
      </div>
      {cards === null && (
        <div className="flex justify-center py-4 text-faint">
          <Spinner size={22} />
        </div>
      )}
      {card && (
        <div className="flex items-center justify-between gap-2 bg-surface rounded-card p-3">
          <div className="text-sm font-semibold text-ink truncate">{cardLabel(card)}</div>
          <button onClick={() => remove(card)} className="text-faint p-1 shrink-0" aria-label="Quitar tarjeta">
            ✕
          </button>
        </div>
      )}
      {cards !== null && !card && (
        <div className="space-y-3 bg-surfaceLow rounded-card p-3">
          <Field
            label="Últimos 4 dígitos"
            value={last4}
            onChange={(v) => setLast4(v.replace(/\D/g, '').slice(0, 4))}
            inputMode="numeric"
            placeholder="1234"
          />
          <Button icon="plus" variant="outline" onClick={add} loading={saving}>
            Agregar tarjeta
          </Button>
        </div>
      )}
    </section>
  )
}
