import { useEffect, useState } from 'react'
import { api } from '../api'
import type { Tone } from '../components/ui'
import { Button, Card, Field, FileUpload, LoadingOverlay, Segmented, Spinner, TopBar } from '../components/ui'
import CardsSection from '../components/CardsSection'

function shortErr(e: any) {
  const m = String(e?.message ?? e)
  return m.length > 140 ? m.slice(0, 140) + '…' : m
}

const EMPTY = {
  full_name: '',
  document_type: 'CC',
  document_number: '',
  address: '',
  department: '',
  municipality: '',
  email: '',
  phone_country_code: '57',
  phone_number: '',
}

export default function TaxProfile({
  onBack,
  onDone,
  showToast,
}: {
  onBack: () => void
  onDone: () => void
  showToast: (text: string, tone?: Tone) => void
}) {
  const [loading, setLoading] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [f, setF] = useState({ ...EMPTY })

  const upd = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }))

  useEffect(() => {
    api
      .getTaxProfile()
      .then((p) => {
        if (p) setF({ ...EMPTY, ...p, document_type: p.document_type || 'CC' })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function onFile(picked: File) {
    setFile(picked)
    setExtracting(true)
    try {
      const r = await api.extractTaxRut(picked)
      setF((s) => ({
        ...s,
        full_name: r.full_name ?? s.full_name,
        document_number: r.document_number ?? s.document_number,
        address: r.address ?? s.address,
        department: r.department ?? s.department,
        municipality: r.municipality ?? s.municipality,
      }))
    } catch (e) {
      showToast('No se pudo leer el RUT: ' + shortErr(e), 'danger')
    } finally {
      setExtracting(false)
    }
  }

  async function save() {
    if (!f.full_name.trim() || !f.document_number.trim()) return showToast('Completa nombre y documento', 'warning')
    setSaving(true)
    try {
      await api.putTaxProfile(f, file)
      showToast('Perfil fiscal guardado', 'success')
      onDone()
    } catch (e) {
      showToast('No se pudo guardar: ' + shortErr(e), 'danger')
    } finally {
      setSaving(false)
    }
  }

  if (loading)
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="Mi perfil fiscal" onBack={onBack} />
        <div className="flex justify-center py-12 text-faint">
          <Spinner size={30} />
        </div>
      </div>
    )

  return (
    <div className="flex-1 flex flex-col relative">
      <TopBar title="Mi perfil fiscal" onBack={onBack} />
      <div className="p-4 space-y-4">
        <Card className="!bg-surfaceLow">
          <div className="text-sm text-muted">
            Tus datos fiscales se usan para emitir la <b>cuenta de cobro</b> con tu RUT cuando el proveedor no es facturador.
          </div>
        </Card>
        <FileUpload hint="Sube tu RUT (PDF o imagen) para autocompletar" fileName={file?.name} onFile={onFile} />
        <Field label="Nombre completo" value={f.full_name} onChange={(v) => upd('full_name', v)} />
        <Segmented
          label="Tipo de documento"
          value={f.document_type}
          onChange={(v) => upd('document_type', v)}
          options={[
            { value: 'CC', label: 'Cédula' },
            { value: 'NIT', label: 'NIT' },
          ]}
        />
        <Field label="Número de documento" value={f.document_number} onChange={(v) => upd('document_number', v)} inputMode="numeric" />
        <Field label="Correo (firmante)" value={f.email} onChange={(v) => upd('email', v)} type="email" placeholder="Para el enlace de firma" />
        <div className="flex gap-2">
          <div className="w-20 shrink-0">
            <Field label="Indic." value={f.phone_country_code} onChange={(v) => upd('phone_country_code', v)} inputMode="numeric" />
          </div>
          <div className="flex-1">
            <Field label="Teléfono (firmante)" value={f.phone_number} onChange={(v) => upd('phone_number', v)} inputMode="numeric" />
          </div>
        </div>
        <Field label="Dirección" value={f.address} onChange={(v) => upd('address', v)} />
        <Field label="Departamento" value={f.department} onChange={(v) => upd('department', v)} />
        <Field label="Municipio" value={f.municipality} onChange={(v) => upd('municipality', v)} />
        <div className="pt-1 pb-6">
          <Button icon="check" onClick={save} loading={saving}>
            Guardar perfil fiscal
          </Button>
        </div>
        <CardsSection showToast={showToast} />
        <div className="pb-6" />
      </div>
      {extracting && <LoadingOverlay text="Leyendo tu RUT con IA…" />}
    </div>
  )
}
