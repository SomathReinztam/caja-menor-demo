import { useCallback, useEffect, useRef, useState } from 'react'
import { setVisitor } from './api'
import type { Visitor } from './types'
import { PhoneFrame, Toast } from './components/ui'
import type { Tone } from './components/ui'
import Home from './screens/Home'
import CreateProvider from './screens/CreateProvider'
import RegisterExpense from './screens/RegisterExpense'
import ExpenseList from './screens/ExpenseList'
import TaxProfile from './screens/TaxProfile'

// Visitadores del servidor dev (id = visitor_visitor.id; todos con usuario asociado,
// requisito del modo demo). El demo "actúa como" uno de ellos; se manda como header
// X-Demo-Visitor. El primero es el que se elige por defecto.
const VISITORS: Visitor[] = [
  { id: 21, name: 'Camilo Rivera' },
  { id: 5, name: 'Mateo Vargas Medina' },
  { id: 7, name: 'Julio Cesar Ortiz Mestra' },
  { id: 8, name: 'Mauricio Madera Sotomayor' },
  { id: 9, name: 'Milton Darío Arcos Morales' },
  { id: 10, name: 'Andres Blanco' },
  { id: 11, name: 'Benjamin Julio Owen' },
  { id: 12, name: 'Carlos Patiño' },
  { id: 16, name: 'Derwin Urdaneta Sierra' },
  { id: 18, name: 'Bayron Cajica' },
  { id: 19, name: 'Miguel Riveros' },
  { id: 20, name: 'Google Tester' },
  { id: 23, name: 'Kelly Vega Gonzalez' },
  { id: 24, name: 'Maria José Borja' },
  { id: 25, name: 'Omar Rivera' },
  { id: 26, name: 'Jonathan Rocha' },
  { id: 27, name: 'Alexis Naranjo' },
  { id: 28, name: 'Visitador Ecuador' },
  { id: 29, name: 'Ale Perdomo' },
  { id: 30, name: 'Elian Giraldo' },
  { id: 31, name: 'Juan José Pacheco' },
  { id: 32, name: 'Jorge Andrés' },
  { id: 33, name: 'Sebastian Quintero Soto' },
  { id: 34, name: 'Juan Camilo Ibarra Rodríguez' },
  { id: 35, name: 'Brayan Stiven Navarro Herazo' },
  { id: 36, name: 'Oscar Hernan Ocampo Cuellar' },
  { id: 37, name: 'Daniel Rueda González' },
  { id: 38, name: 'Ray Sabana' },
  { id: 39, name: 'Dina Marcela Navarro Machado' },
]

type Screen = 'home' | 'createProvider' | 'registerExpense' | 'expenses' | 'taxProfile'

export default function App() {
  const [visitorId, setVisitorId] = useState(VISITORS[0].id)
  const [screen, setScreen] = useState<Screen>('home')
  const [toast, setToast] = useState<{ text: string; tone: Tone } | null>(null)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    setVisitor(visitorId)
  }, [visitorId])

  const showToast = useCallback((text: string, tone: Tone = 'neutral') => {
    setToast({ text, tone })
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(null), 3200)
  }, [])

  const visitor = VISITORS.find((v) => v.id === visitorId)!
  const home = () => setScreen('home')

  return (
    <PhoneFrame>
      {screen === 'home' && (
        <Home visitor={visitor} visitors={VISITORS} onChangeVisitor={setVisitorId} onNavigate={setScreen} />
      )}
      {screen === 'createProvider' && <CreateProvider onBack={home} onDone={home} showToast={showToast} />}
      {screen === 'registerExpense' && (
        <RegisterExpense onBack={home} onSeeExpenses={() => setScreen('expenses')} onGoTaxProfile={() => setScreen('taxProfile')} showToast={showToast} />
      )}
      {screen === 'expenses' && <ExpenseList onBack={home} showToast={showToast} />}
      {screen === 'taxProfile' && <TaxProfile onBack={home} onDone={home} showToast={showToast} />}
      <Toast toast={toast} />
    </PhoneFrame>
  )
}
