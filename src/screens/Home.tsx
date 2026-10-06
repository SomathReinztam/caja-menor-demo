import type { Visitor } from '../types'
import { Card, Icon } from '../components/ui'

type Screen = 'createProvider' | 'registerExpense' | 'expenses' | 'taxProfile'

interface Props {
  visitor: Visitor
  visitors: Visitor[]
  onChangeVisitor: (id: number) => void
  onNavigate: (s: Screen) => void
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

function ActionCard({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: string
  title: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <Card onClick={onClick}>
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-pill bg-chip text-chipInk flex items-center justify-center shrink-0">
          <Icon name={icon} size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-base font-semibold text-ink">{title}</div>
          <div className="text-sm text-faint">{subtitle}</div>
        </div>
        <span className="text-faint shrink-0">
          <Icon name="right" size={20} />
        </span>
      </div>
    </Card>
  )
}

export default function Home({ visitor, visitors, onChangeVisitor, onNavigate }: Props) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="px-4 pt-6 pb-3 flex items-center gap-3">
        <div className="w-12 h-12 rounded-pill bg-avatarBg text-avatarInk flex items-center justify-center font-semibold text-lg shrink-0">
          {initials(visitor.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[22px] font-semibold text-ink leading-tight truncate">
            Hola {visitor.name.split(' ')[0]}
          </div>
          <div className="text-sm text-faint">Caja menor de campo</div>
        </div>
      </div>

      {/* Selector de visitador — solo para el demo */}
      <div className="px-4 pb-1">
        <label className="block bg-surfaceLow rounded-input px-3 py-2 border border-line/50">
          <span className="block text-[11px] font-semibold text-faint uppercase tracking-wide">
            Demo · actuando como
          </span>
          <select
            value={visitor.id}
            onChange={(e) => onChangeVisitor(Number(e.target.value))}
            className="w-full bg-transparent text-sm font-medium text-ink outline-none py-0.5"
          >
            {visitors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="px-4 pt-4 space-y-3">
        <h2 className="text-base font-semibold text-ink">¿Qué quieres hacer?</h2>
        <ActionCard
          icon="store"
          title="Crear proveedor"
          subtitle="Sube el RUT y lo clasificamos automáticamente"
          onClick={() => onNavigate('createProvider')}
        />
        <ActionCard
          icon="receipt"
          title="Registrar gasto"
          subtitle="Factura o cuenta de cobro"
          onClick={() => onNavigate('registerExpense')}
        />
        <ActionCard
          icon="list"
          title="Mis gastos"
          subtitle="Seguimiento y estado"
          onClick={() => onNavigate('expenses')}
        />
        <ActionCard
          icon="user"
          title="Mi perfil fiscal"
          subtitle="Tus datos para la cuenta de cobro"
          onClick={() => onNavigate('taxProfile')}
        />
      </div>
    </div>
  )
}
