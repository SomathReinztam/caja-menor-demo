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

// Visitadores reales de la BD restaurada (id = visitor_visitor.id). El demo
// "actúa como" uno de ellos; se manda como header X-Demo-Visitor.
const VISITORS: Visitor[] = [
  { id: 1, name: 'Juan Fernando Cogollo Doria' },
  { id: 3, name: 'Alberto Quintana Requena' },
  { id: 4, name: 'Andrea Valderrama Gomez' },
  { id: 5, name: 'Mateo Vargas Medina' },
  { id: 6, name: 'Jaider Castañeda' },
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
        <RegisterExpense onBack={home} onSeeExpenses={() => setScreen('expenses')} showToast={showToast} />
      )}
      {screen === 'expenses' && <ExpenseList onBack={home} />}
      {screen === 'taxProfile' && <TaxProfile onBack={home} onDone={home} showToast={showToast} />}
      <Toast toast={toast} />
    </PhoneFrame>
  )
}
