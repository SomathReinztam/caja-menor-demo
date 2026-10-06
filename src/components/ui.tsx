import React from 'react'

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ')
}

/* ── Íconos (estilo lucide, stroke) ─────────────────────────────── */
const ICONS: Record<string, React.ReactNode> = {
  back: <polyline points="15 18 9 12 15 6" />,
  right: <polyline points="9 18 15 12 9 6" />,
  upload: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </>
  ),
  check: <polyline points="20 6 9 17 4 12" />,
  store: (
    <>
      <path d="M3 9l1.2-5h15.6L21 9" />
      <path d="M4 9v11h16V9" />
      <path d="M9 20v-6h6v6" />
    </>
  ),
  receipt: (
    <>
      <path d="M5 2v20l2.5-1.5L10 22l2-1.5L14 22l2.5-1.5L19 22V2l-2.5 1.5L14 2l-2 1.5L10 2 7.5 3.5z" />
      <line x1="8.5" y1="8" x2="15.5" y2="8" />
      <line x1="8.5" y1="12" x2="15.5" y2="12" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </>
  ),
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  list: (
    <>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </>
  ),
}

export function Icon({ name, size = 24, className }: { name: keyof typeof ICONS | string; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {ICONS[name] ?? null}
    </svg>
  )
}

/* ── Marco de móvil ─────────────────────────────────────────────── */
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex items-start sm:items-center justify-center p-0 sm:p-6">
      <div className="relative w-full sm:max-w-[420px] bg-bg sm:rounded-[36px] sm:shadow-2xl overflow-hidden min-h-screen sm:min-h-[820px] sm:border-[10px] sm:border-black/85 flex flex-col">
        {children}
      </div>
    </div>
  )
}

/* ── Barra superior de subpantalla ──────────────────────────────── */
export function TopBar({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <div className="sticky top-0 z-10 bg-bg/95 backdrop-blur px-4 py-3 flex items-center gap-3 border-b border-line/60">
      {onBack && (
        <button onClick={onBack} className="p-1 -ml-1 text-ink rounded-pill hover:bg-surface" aria-label="Volver">
          <Icon name="back" size={24} />
        </button>
      )}
      <h1 className="text-[22px] font-semibold text-ink leading-tight">{title}</h1>
    </div>
  )
}

/* ── Botón ──────────────────────────────────────────────────────── */
type BtnVariant = 'filled' | 'outline' | 'danger'
export function Button({
  children,
  onClick,
  variant = 'filled',
  icon,
  disabled,
  loading,
  type = 'button',
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: BtnVariant
  icon?: string
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit'
}) {
  const styles: Record<BtnVariant, string> = {
    filled: 'bg-btn text-white',
    outline: 'bg-transparent text-ink border border-lineInput',
    danger: 'bg-danger text-white',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cx(
        'w-full h-12 rounded-pill px-4 inline-flex items-center justify-center gap-2 text-sm font-semibold tracking-[0.3px] transition',
        styles[variant],
        (disabled || loading) && 'opacity-40',
      )}
    >
      {loading ? <Spinner size={18} /> : icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  )
}

/* ── Campo de texto (label externo) ─────────────────────────────── */
export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  hint,
  inputMode,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  hint?: string
  inputMode?: 'text' | 'numeric' | 'decimal'
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-ink mb-1">{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface rounded-input border border-lineInput px-3 py-3 text-sm text-ink placeholder:text-faint outline-none focus:bg-[#DED8E0]"
      />
      {hint && <span className="block text-xs text-faint mt-1">{hint}</span>}
    </label>
  )
}

/* ── Segmented (opciones) ───────────────────────────────────────── */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label?: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div>
      {label && <span className="block text-xs font-semibold text-ink mb-1">{label}</span>}
      <div className="flex gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cx(
              'flex-1 h-10 rounded-pill text-sm font-semibold border transition',
              value === o.value
                ? 'bg-chip border-chip text-chipInk'
                : 'bg-transparent border-lineInput text-muted',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Switch ─────────────────────────────────────────────────────── */
export function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className="w-full flex items-center justify-between py-1">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <span className={cx('w-12 h-7 rounded-pill p-0.5 transition', checked ? 'bg-primary' : 'bg-lineInput')}>
        <span className={cx('block w-6 h-6 rounded-pill bg-white transition-transform', checked && 'translate-x-5')} />
      </span>
    </button>
  )
}

/* ── Zona de subida (borde punteado) ────────────────────────────── */
export function FileUpload({
  hint,
  fileName,
  onFile,
  accept = 'application/pdf,image/*',
}: {
  hint: string
  fileName?: string | null
  onFile: (f: File) => void
  accept?: string
}) {
  const ref = React.useRef<HTMLInputElement>(null)
  return (
    <button
      onClick={() => ref.current?.click()}
      className="w-full rounded-input bg-surface border-2 border-dashed border-lineInput px-4 py-7 flex flex-col items-center gap-2 text-center"
    >
      <span className="text-primary">
        <Icon name="upload" size={30} />
      </span>
      <span className="text-sm text-muted">{fileName ? fileName : hint}</span>
      {fileName && <span className="text-xs text-faint">Toca para cambiar</span>}
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />
    </button>
  )
}

/* ── Card ───────────────────────────────────────────────────────── */
export function Card({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <div
      onClick={onClick}
      className={cx('bg-surface rounded-card p-4', onClick && 'cursor-pointer active:opacity-80', className)}
    >
      {children}
    </div>
  )
}

/* ── Badge ──────────────────────────────────────────────────────── */
export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'
export function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const map: Record<Tone, string> = {
    success: 'bg-successBg text-success',
    warning: 'bg-warningBg text-warning',
    danger: 'bg-dangerBg text-danger',
    info: 'bg-infoBg text-info',
    neutral: 'bg-chip text-chipInk',
  }
  return (
    <span className={cx('inline-flex items-center px-2.5 py-1 rounded-pill text-xs font-semibold', map[tone])}>
      {children}
    </span>
  )
}

/* ── Spinner + overlay de carga ─────────────────────────────────── */
export function Spinner({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={cx('animate-spin', className)} fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function LoadingOverlay({ text }: { text: string }) {
  return (
    <div className="absolute inset-0 z-30 bg-black/45 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl px-6 py-7 flex flex-col items-center gap-3 shadow-xl">
        <span className="text-primary">
          <Spinner size={34} />
        </span>
        <span className="text-sm font-medium text-ink text-center">{text}</span>
      </div>
    </div>
  )
}

/* ── Toast ──────────────────────────────────────────────────────── */
export function Toast({ toast }: { toast: { text: string; tone: Tone } | null }) {
  if (!toast) return null
  const map: Record<Tone, string> = {
    success: 'bg-success text-white',
    warning: 'bg-warning text-white',
    danger: 'bg-danger text-white',
    info: 'bg-info text-white',
    neutral: 'bg-ink text-white',
  }
  return (
    <div className="absolute bottom-5 left-4 right-4 z-40 flex justify-center">
      <div className={cx('rounded-pill px-4 py-2.5 text-sm font-medium shadow-lg text-center', map[toast.tone])}>
        {toast.text}
      </div>
    </div>
  )
}
