import { useState } from 'react'
import { api } from '../api'
import type { Tone } from '../components/ui'
import { Button, Card, Field, FileUpload, LoadingOverlay, Switch, TopBar } from '../components/ui'

function shortErr(e: any) {
  const m = String(e?.message ?? e)
  return m.length > 140 ? m.slice(0, 140) + '…' : m
}

export default function CreateProvider({
  onBack,
  onDone,
  showToast,
}: {
  onBack: () => void
  onDone: () => void
  showToast: (text: string, tone?: Tone) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [extracted, setExtracted] = useState(false)
  const [f, setF] = useState({
    name: '',
    document_number: '',
    is_electronic_biller: false,
    department: '',
    municipality: '',
    address: '',
  })

  const upd = (k: keyof typeof f, v: string | boolean) => setF((s) => ({ ...s, [k]: v }))

  async function onFile(picked: File) {
    setFile(picked)
    setExtracting(true)
    try {
      const r = await api.extractRut(picked)
      setF({
        name: r.name ?? '',
        document_number: r.document_number ?? '',
        is_electronic_biller: !!r.is_electronic_biller,
        department: r.department ?? '',
        municipality: r.municipality ?? '',
        address: r.address ?? '',
      })
      setExtracted(true)
    } catch (e) {
      showToast('No se pudo leer el RUT: ' + shortErr(e), 'danger')
    } finally {
      setExtracting(false)
    }
  }

  async function save() {
    if (!f.name.trim() || !f.document_number.trim()) return showToast('Completa nombre y NIT', 'warning')
    setSaving(true)
    try {
      await api.createProvider({ ...f, document_type: 'NIT' }, file)
      showToast('Proveedor creado', 'success')
      onDone()
    } catch (e) {
      showToast('No se pudo guardar: ' + shortErr(e), 'danger')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col relative">
      <TopBar title="Crear proveedor" onBack={onBack} />
      <div className="p-4 space-y-4">
        <FileUpload hint="Sube el RUT del proveedor (PDF o imagen)" fileName={file?.name} onFile={onFile} />
        {extracted && (
          <Card className="!bg-chip/60">
            <div className="text-sm text-chipInk">
              ✨ Rellenamos el formulario desde el RUT. Revisa y corrige lo que haga falta.
            </div>
          </Card>
        )}
        <Field label="Razón social / establecimiento" value={f.name} onChange={(v) => upd('name', v)} placeholder="Nombre del comercio" />
        <Field label="NIT" value={f.document_number} onChange={(v) => upd('document_number', v)} placeholder="900123456-7" inputMode="numeric" />
        <div className="bg-surface rounded-input px-3 py-3">
          <Switch label="¿Facturador electrónico?" checked={f.is_electronic_biller} onChange={(v) => upd('is_electronic_biller', v)} />
          <div className="text-xs text-faint mt-1">Si no lo es, el gasto se legalizará con una cuenta de cobro.</div>
        </div>
        <Field label="Departamento" value={f.department} onChange={(v) => upd('department', v)} />
        <Field label="Municipio" value={f.municipality} onChange={(v) => upd('municipality', v)} />
        <Field label="Dirección" value={f.address} onChange={(v) => upd('address', v)} />
        <div className="pt-1 pb-6">
          <Button icon="check" onClick={save} loading={saving}>
            Guardar proveedor
          </Button>
        </div>
      </div>
      {extracting && <LoadingOverlay text="Leyendo el RUT con IA…" />}
    </div>
  )
}
