import { useEffect, useState } from 'react'
import { api } from '../api'
import type { Card as CardT, Expense, Provider } from '../types'
import type { Tone } from '../components/ui'
import {
  Badge,
  Button,
  Card,
  Field,
  FileUpload,
  Icon,
  LoadingOverlay,
  Segmented,
  Spinner,
  TopBar,
  cx,
} from '../components/ui'
import { cardLabel, docKindLabel, fmtCop, signatureLabel, signatureTone, statusLabel, statusTone } from '../labels'

type ItemRow = { concept: string; value: string }
type ProviderChoice = Provider | 'self' | null

function shortErr(e: any) {
  const m = String(e?.message ?? e)
  return m.length > 140 ? m.slice(0, 140) + '…' : m
}

export default function RegisterExpense({
  onBack,
  onSeeExpenses,
  onGoTaxProfile,
  showToast,
}: {
  onBack: () => void
  onSeeExpenses: () => void
  onGoTaxProfile: () => void
  showToast: (text: string, tone?: Tone) => void
}) {
  const [providers, setProviders] = useState<Provider[] | null>(null)
  const [choice, setChoice] = useState<ProviderChoice>(null)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'own'>('cash')
  // Por ahora el pagador es siempre Unergy (Solenium tiene otro Odoo; se agregará después).
  const payer = 'unergy'
  const [project, setProject] = useState('')
  // Tarjetas del visitador (se cargan al elegir pago con tarjeta). Sin tarjeta no se puede registrar.
  const [cards, setCards] = useState<CardT[] | null>(null)
  const [cardId, setCardId] = useState<number | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [emitterNit, setEmitterNit] = useState('')
  const [items, setItems] = useState<ItemRow[]>([{ concept: '', value: '' }])

  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<Expense | null>(null)

  useEffect(() => {
    api
      .listProviders()
      .then(setProviders)
      .catch((e) => showToast('No se pudieron cargar los proveedores: ' + shortErr(e), 'danger'))
  }, [])

  useEffect(() => {
    if (paymentMethod !== 'card') return
    setCards(null)
    api
      .listCards()
      .then((list) => {
        const active = list.filter((c) => c.is_active)
        setCards(active)
        setCardId((cur) => (active.some((c) => c.id === cur) ? cur : active.length === 1 ? active[0].id : null))
      })
      .catch((e) => {
        setCards([])
        showToast('No se pudieron cargar las tarjetas: ' + shortErr(e), 'danger')
      })
  }, [paymentMethod])

  const total = items.reduce((s, it) => s + (parseInt(it.value || '0', 10) || 0), 0)
  const isBiller = choice !== 'self' && choice !== null && choice.is_electronic_biller
  const willBeChargeAccount = choice !== null && !isBiller
  // Proveedor no facturador con RUT → la cuenta de cobro va a su nombre y él firma.
  const providerIssues = willBeChargeAccount && choice !== 'self' && !!choice?.rut_file

  async function onFile(f: File) {
    setFile(f)
    setExtracting(true)
    try {
      const r = await api.extractInvoice(f)
      setInvoiceNumber(r.invoice_number ?? '')
      setIssueDate(r.issue_date ?? '')
      setEmitterNit(r.emitter_nit ?? '')
      const rows = (r.items ?? [])
        .filter((i) => i.concept)
        .map((i) => ({ concept: i.concept, value: i.value != null ? String(i.value) : '' }))
      setItems(rows.length ? rows : [{ concept: '', value: '' }])
    } catch (e: any) {
      showToast('No se pudo leer la factura: ' + shortErr(e), 'danger')
    } finally {
      setExtracting(false)
    }
  }

  function setItem(i: number, patch: Partial<ItemRow>) {
    setItems((s) => s.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  }

  async function submit() {
    if (choice === null) return showToast('Elige un proveedor o "usar mis datos"', 'warning')
    const cleanItems = items
      .filter((it) => it.concept.trim() && it.value.trim())
      .map((it) => ({ concept: it.concept.trim(), value: parseInt(it.value, 10) || 0 }))
    if (!cleanItems.length) return showToast('Agrega al menos un ítem (concepto y valor)', 'warning')
    if (!issueDate) return showToast('Indica la fecha del gasto', 'warning')
    if (paymentMethod === 'card' && cardId === null)
      return showToast('Selecciona la tarjeta con la que pagaste', 'warning')

    setSaving(true)
    try {
      let expense = await api.createExpense({
        provider: choice === 'self' ? null : choice.id,
        payment_method: paymentMethod,
        card: paymentMethod === 'card' ? cardId : null,
        payer,
        project_name: project,
        invoice_number: invoiceNumber,
        issue_date: issueDate,
        emitter_nit: emitterNit,
        total_value: cleanItems.reduce((s, i) => s + i.value, 0),
        items: cleanItems,
      })
      // El create va en JSON y no lleva el archivo; se sube aparte para que el
      // soporte quede disponible en la revisión contable (TSF) y en Odoo.
      if (file) {
        try {
          expense = await api.uploadSourceFile(expense.id, file)
        } catch (e: any) {
          showToast('El gasto se registró, pero no se pudo subir el soporte: ' + shortErr(e), 'warning')
        }
      }
      setResult(expense)
    } catch (e: any) {
      showToast('No se pudo registrar: ' + shortErr(e), 'danger')
    } finally {
      setSaving(false)
    }
  }

  if (result) return <ResultView expense={result} onHome={onBack} onSeeExpenses={onSeeExpenses} />

  return (
    <div className="flex-1 flex flex-col relative">
      <TopBar title="Registrar gasto" onBack={onBack} />
      <div className="p-4 space-y-5">
        {/* 1. Proveedor */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-ink">1. Proveedor</h2>
          {providers === null && (
            <div className="flex justify-center py-6 text-faint">
              <Spinner size={24} />
            </div>
          )}
          {providers?.map((p) => (
            <ProviderRow key={p.id} p={p} selected={choice !== 'self' && choice?.id === p.id} onClick={() => setChoice(p)} />
          ))}
          <button
            onClick={() => setChoice('self')}
            className={cx(
              'w-full text-left rounded-card p-4 border transition',
              choice === 'self' ? 'bg-chip border-chip' : 'bg-surface border-transparent',
            )}
          >
            <div className="text-base font-semibold text-ink">Usar mis datos</div>
            <div className="text-sm text-faint">Sin proveedor · se generará una cuenta de cobro</div>
          </button>
          {willBeChargeAccount && choice !== 'self' && (
            <div className="text-xs text-warning bg-warningBg rounded-input px-3 py-2">
              {providerIssues ? (
                <>
                  Este proveedor no es facturador → se generará una <b>cuenta de cobro a nombre del proveedor</b>.
                  Él debe firmarla en este celular.
                </>
              ) : (
                <>
                  Este proveedor no es facturador y no tiene RUT → se generará una <b>cuenta de cobro con tus datos
                  fiscales</b>.
                </>
              )}
            </div>
          )}
        </section>

        {/* 2. Detalles */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-ink">2. Detalles</h2>
          <Segmented
            label="Medio de pago"
            value={paymentMethod}
            onChange={setPaymentMethod}
            options={[
              { value: 'cash', label: 'Efectivo' },
              { value: 'card', label: 'Tarjeta' },
              { value: 'own', label: 'Propio' },
            ]}
          />
          {paymentMethod === 'own' && (
            <div className="text-xs text-warning bg-warningBg rounded-input px-3 py-2">
              Úsalo si pagaste con tu dinero o con una tarjeta que no es la que te asignó Unergy. Unergy te lo
              reembolsará.
            </div>
          )}
          {paymentMethod === 'card' && (
            <div className="space-y-2">
              <span className="block text-xs font-semibold text-ink">Tarjeta</span>
              {cards === null && (
                <div className="flex justify-center py-3 text-faint">
                  <Spinner size={20} />
                </div>
              )}
              {cards !== null && cards.length === 0 && (
                <div className="text-xs text-warning bg-warningBg rounded-input px-3 py-2">
                  No tienes tarjetas registradas. Agrégalas en tu perfil fiscal para poder registrar gastos con
                  tarjeta.
                  <button onClick={onGoTaxProfile} className="block mt-2 font-semibold text-primary">
                    Ir a mi perfil fiscal
                  </button>
                </div>
              )}
              {cards?.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCardId(c.id)}
                  className={cx(
                    'w-full text-left rounded-card p-3 border transition text-sm font-semibold text-ink',
                    cardId === c.id ? 'bg-chip border-chip' : 'bg-surface border-transparent',
                  )}
                >
                  {cardLabel(c)}
                </button>
              ))}
            </div>
          )}
          <Field label="Proyecto (opcional)" value={project} onChange={setProject} placeholder="En qué estás trabajando" />
        </section>

        {/* 3. Factura */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-ink">3. Factura / soporte</h2>
          <FileUpload hint="Sube la factura (PDF o imagen)" fileName={file?.name} onFile={onFile} />
          <Field label="N.º de factura" value={invoiceNumber} onChange={setInvoiceNumber} placeholder="Opcional" />
          <Field label="Fecha" value={issueDate} onChange={setIssueDate} type="date" />
          <Field label="NIT del emisor" value={emitterNit} onChange={setEmitterNit} placeholder="Opcional" inputMode="numeric" />

          <div>
            <span className="block text-xs font-semibold text-ink mb-1">Ítems</span>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    value={it.concept}
                    placeholder="Concepto"
                    onChange={(e) => setItem(i, { concept: e.target.value })}
                    className="flex-1 min-w-0 bg-surface rounded-input border border-lineInput px-3 py-2.5 text-sm outline-none focus:bg-[#DED8E0]"
                  />
                  <input
                    value={it.value}
                    placeholder="Valor"
                    inputMode="numeric"
                    onChange={(e) => setItem(i, { value: e.target.value.replace(/[^0-9]/g, '') })}
                    className="w-24 shrink-0 bg-surface rounded-input border border-lineInput px-3 py-2.5 text-sm outline-none focus:bg-[#DED8E0]"
                  />
                  {items.length > 1 && (
                    <button onClick={() => setItems((s) => s.filter((_, idx) => idx !== i))} className="text-faint p-1" aria-label="Quitar">
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setItems((s) => [...s, { concept: '', value: '' }])}
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary"
            >
              <Icon name="plus" size={16} /> Agregar ítem
            </button>
          </div>

          <div className="flex items-center justify-between bg-surfaceLow rounded-input px-3 py-3">
            <span className="text-sm font-semibold text-ink">Total</span>
            <span className="text-base font-semibold text-ink">{fmtCop(total)}</span>
          </div>
        </section>

        <div className="pt-1 pb-6">
          <Button icon="check" onClick={submit} loading={saving} disabled={choice === null || (paymentMethod === 'card' && cardId === null)}>
            {willBeChargeAccount ? 'Generar cuenta de cobro' : 'Registrar gasto'}
          </Button>
        </div>
      </div>
      {extracting && <LoadingOverlay text="Leyendo la factura con IA…" />}
    </div>
  )
}

function ProviderRow({ p, selected, onClick }: { p: Provider; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'w-full text-left rounded-card p-4 border transition',
        selected ? 'bg-chip border-chip' : 'bg-surface border-transparent',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-base font-semibold text-ink truncate">{p.name}</div>
          <div className="text-sm text-faint truncate">NIT {p.document_number}</div>
        </div>
        <Badge tone={p.is_electronic_biller ? 'success' : 'warning'}>
          {p.is_electronic_biller ? 'Facturador' : 'No facturador'}
        </Badge>
      </div>
    </button>
  )
}

function ResultView({ expense, onHome, onSeeExpenses }: { expense: Expense; onHome: () => void; onSeeExpenses: () => void }) {
  const isCC = expense.document_kind === 'charge_account'
  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="Listo" />
      <div className="p-4 space-y-4">
        <div className="flex flex-col items-center text-center pt-4">
          <div className="w-16 h-16 rounded-pill bg-successBg text-success flex items-center justify-center">
            <Icon name="check" size={34} />
          </div>
          <h2 className="text-xl font-semibold text-ink mt-3">
            {isCC ? 'Cuenta de cobro generada' : 'Factura registrada'}
          </h2>
          <p className="text-sm text-faint mt-1">{docKindLabel[expense.document_kind]} · {fmtCop(expense.total_value)}</p>
        </div>

        <Card>
          <div className="flex flex-wrap gap-2">
            <Badge tone={statusTone[expense.status] ?? 'neutral'}>{statusLabel[expense.status] ?? expense.status}</Badge>
            {expense.signature_status !== 'not_required' && (
              <Badge tone={signatureTone[expense.signature_status] ?? 'neutral'}>
                {signatureLabel[expense.signature_status] ?? expense.signature_status}
              </Badge>
            )}
          </div>
          {isCC && expense.zapsign_sign_url && expense.charge_account_issuer === 'provider' && (
            <div className="mt-3 text-xs text-ink bg-chip rounded-input px-3 py-2">
              La cuenta de cobro está a nombre del proveedor: <b>entrégale el celular</b> para que firme en pantalla.
            </div>
          )}
          {isCC && expense.zapsign_sign_url && (
            <a
              href={expense.zapsign_sign_url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 w-full h-12 rounded-pill bg-primary text-white inline-flex items-center justify-center gap-2 text-sm font-semibold"
            >
              <Icon name="edit" size={18} />{' '}
              {expense.charge_account_issuer === 'provider' ? 'Firma del proveedor' : 'Firmar la cuenta de cobro'}
            </a>
          )}
          {isCC && !expense.zapsign_sign_url && (
            <div className="mt-3 text-xs text-warning bg-warningBg rounded-input px-3 py-2">
              El PDF se generó, pero el enlace de firma no está disponible (ZapSign sin configurar en el backend).
            </div>
          )}
        </Card>

        <div className="space-y-2 pt-2">
          <Button icon="list" variant="outline" onClick={onSeeExpenses}>Ver mis gastos</Button>
          <Button onClick={onHome}>Volver al inicio</Button>
        </div>
      </div>
    </div>
  )
}
