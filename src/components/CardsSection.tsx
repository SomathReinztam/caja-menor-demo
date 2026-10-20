import { useEffect, useState } from 'react'
import { api } from '../api'
import type { Card, CardBank, CardType } from '../types'
import { Badge, Button, Field, Icon, Segmented, Spinner } from './ui'
import type { Tone } from './ui'
import { bankLabel, cardLabel } from '../labels'

function shortErr(e: any) {
  const m = String(e?.message ?? e)
  return m.length > 140 ? m.slice(0, 140) + '…' : m
}

/** Tarjetas del visitador (perfil fiscal): lista + alta. Solo últimos 4 dígitos. */
export default function CardsSection({ showToast }: { showToast: (text: string, tone?: Tone) => void }) {
  const [cards, setCards] = useState<Card[] | null>(null)
  const [bank, setBank] = useState<CardBank>('bancolombia')
  const [cardType, setCardType] = useState<CardType>('credit')
  const [last4, setLast4] = useState('')
  const [alias, setAlias] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () =>
    api
      .listCards()
      .then(setCards)
      .catch((e) => {
        setCards([])
        showToast('No se pudieron cargar las tarjetas: ' + shortErr(e), 'danger')
      })

  useEffect(() => {
    load()
  }, [])

  async function add() {
    if (!/^\d{4}$/.test(last4)) return showToast('Ingresa exactamente los 4 últimos dígitos', 'warning')
    setSaving(true)
    try {
      await api.createCard({ bank, card_type: cardType, last4, alias: alias.trim() })
      setLast4('')
      setAlias('')
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

  const active = (cards ?? []).filter((c) => c.is_active)

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-ink">Mis tarjetas</h2>
      <div className="text-xs text-faint">
        Para registrar gastos con tarjeta debes tener al menos una. Solo guardamos los 4 últimos dígitos.
      </div>
      {cards === null && (
        <div className="flex justify-center py-4 text-faint">
          <Spinner size={22} />
        </div>
      )}
      {cards !== null && active.length === 0 && (
        <div className="text-xs text-warning bg-warningBg rounded-input px-3 py-2">Aún no tienes tarjetas.</div>
      )}
      {active.map((c) => (
        <div key={c.id} className="flex items-center justify-between gap-2 bg-surface rounded-card p-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-ink truncate">{cardLabel(c)}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge tone="neutral">{bankLabel[c.bank] ?? c.bank}</Badge>
            <button onClick={() => remove(c)} className="text-faint p-1" aria-label="Quitar tarjeta">
              ✕
            </button>
          </div>
        </div>
      ))}

      <div className="space-y-3 bg-surfaceLow rounded-card p-3">
        <Segmented
          label="Banco"
          value={bank}
          onChange={setBank}
          options={[
            { value: 'bancolombia', label: 'Bancolombia' },
            { value: 'other', label: 'Otro' },
          ]}
        />
        <Segmented
          label="Tipo"
          value={cardType}
          onChange={setCardType}
          options={[
            { value: 'credit', label: 'Crédito' },
            { value: 'debit', label: 'Débito' },
          ]}
        />
        <Field
          label="Últimos 4 dígitos"
          value={last4}
          onChange={(v) => setLast4(v.replace(/\D/g, '').slice(0, 4))}
          inputMode="numeric"
          placeholder="1234"
        />
        <Field label="Alias (opcional)" value={alias} onChange={setAlias} placeholder="Ej. Tarjeta empresa" />
        <Button icon="plus" variant="outline" onClick={add} loading={saving}>
          Agregar tarjeta
        </Button>
      </div>
    </section>
  )
}
