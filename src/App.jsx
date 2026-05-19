import { useState } from 'react'
import Inventory from './pages/Inventory'
import AddRentalGame from './pages/AddRentalGame'
import './index.css'

const TABS = [
  { key: 'inventory', label: '庫存管理' },
  { key: 'add-rental', label: '新增開盒遊戲' },
]

export default function App() {
  const [tab, setTab] = useState('inventory')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4">
        <div className="flex gap-0 max-w-7xl mx-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'inventory' && <Inventory />}
      {tab === 'add-rental' && <AddRentalGame />}
    </div>
  )
}
