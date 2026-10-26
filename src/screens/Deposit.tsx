import { useState } from 'react'
import { api } from '../api'
import type { Tone } from '../components/ui'
import { Button, Card, Field, FileUpload, TopBar } from '../components/ui'

function shortErr(e: any) {
  const m = String(e?.message ?? e)
  return m.length > 140 ? m.slice(0, 140) + '…' : m
}

const today = () => new Date().toLocaleDateString('en-CA') // YYYY-MM-DD en hora local

/** Consignación de efectivo: el visitador devuelve efectivo a Unergy y sube el comprobante. */
export default function Deposit({
  onBack,
  onDone,
  showToast,
}: {
  onBack: () => void
  onDone: () => void
  showToast: (text: string, tone?: Tone) => void
}) {
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(today())
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit() {
    const value = parseInt(amount, 10)
    if (!value || value <= 0) return showToast('Indica el monto de la consignación', 'warning')
    if (!date) return showToast('Indica la fecha de la consignación', 'warning')
    if (!file) return showToast('Adjunta el comprobante de la consignación', 'warning')
    setSaving(true)
    try {
      await api.createDeposit({ amount: value, date }, file)
      showToast('Consignación registrada', 'success')
      onDone()
    } catch (e) {
      showToast('No se pudo registrar: ' + shortErr(e), 'danger')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="Consignar efectivo" onBack={onBack} />
      <div className="p-4 space-y-4">
        <Card className="!bg-surfaceLow">
          <div className="text-xs text-faint">
            Úsalo cuando devuelves efectivo a Unergy. Queda en tu historial y se descuenta del efectivo que
            tienes en poder.
          </div>
        </Card>
        <Field
          label="Monto consignado"
          value={amount}
          onChange={(v) => setAmount(v.replace(/\D/g, ''))}
          inputMode="numeric"
          placeholder="Ej. 150000"
        />
        <Field label="Fecha de la consignación" value={date} onChange={setDate} type="date" />
        <FileUpload hint="Sube el comprobante (PDF o imagen)" fileName={file?.name} onFile={setFile} />
        <Button icon="check" onClick={submit} loading={saving}>
          Registrar consignación
        </Button>
      </div>
    </div>
  )
}
