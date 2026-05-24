import { useState, useMemo } from 'react'
import { Search, Plus, Package, BoxesIcon, DollarSign, History } from 'lucide-react'
import { useInventory } from '../hooks/useInventory'
import { usePurchaseCosts } from '../hooks/usePurchaseCosts'
import GameCard from '../components/GameCard'
import GameModal from '../components/GameModal'
import PurchaseCostModal from '../components/PurchaseCostModal'
import AddRentalGame from '../components/AddRentalGame'

function formatMonth(yyyyMM) {
  const [year, month] = yyyyMM.split('-')
  return `${year}年${parseInt(month)}月`
}

export default function Inventory() {
  const { games, loading, addGame, updateGame, deleteGame } = useInventory()
  const { records, thisMonth, thisMonthAmount } = usePurchaseCosts()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('inventory')
  const [showModal, setShowModal] = useState(false)
  const [editGame, setEditGame] = useState(null)
  const [showCostHistory, setShowCostHistory] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return games
    return games.filter(g => g.name?.toLowerCase().includes(q))
  }, [games, search])

  const EXCLUDED_CATEGORIES = ['牌套', '周邊']
  const totalGames = games.filter(g => !EXCLUDED_CATEGORIES.includes(g.category)).length
  const totalStock = games.reduce((s, g) => s + (g.stock || 0), 0)

  function openEdit(game) {
    setEditGame(game)
    setShowModal(true)
  }

  async function handleSave(data, imageFile, oldImageUrl) {
    if (editGame) {
      await updateGame(editGame.id, data, imageFile, oldImageUrl)
    } else {
      await addGame(data, imageFile)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部 */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <div>
          <div className="text-base font-bold text-gray-800">烏嘎嘎桌遊</div>
          <div className="text-xs text-gray-400">庫存管理系統</div>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Tab 導航 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === 'inventory'
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-orange-300'
            }`}
          >
            庫存管理
          </button>
          <button
            onClick={() => setActiveTab('add-rental')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === 'add-rental'
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-orange-300'
            }`}
          >
            新增開盒遊戲
          </button>
        </div>

        {activeTab === 'add-rental' && (
          <AddRentalGame addGame={addGame} />
        )}

        {activeTab === 'inventory' && <>
        {/* 統計卡片 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <BoxesIcon size={18} className="text-orange-500" />
              </div>
              <div>
                <div className="text-xs text-gray-400">遊戲款數</div>
                <div className="text-2xl font-bold text-gray-800">{totalGames}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Package size={18} className="text-blue-500" />
              </div>
              <div>
                <div className="text-xs text-gray-400">總庫存數</div>
                <div className="text-2xl font-bold text-gray-800">{totalStock}</div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowCostHistory(true)}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-green-300 hover:shadow-md transition-all text-left w-full"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <DollarSign size={18} className="text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-400 truncate">{formatMonth(thisMonth)} 進貨成本</span>
                  <History size={11} className="text-gray-300 flex-shrink-0" />
                </div>
                <div className="text-xl font-bold text-gray-800">NT$ {thisMonthAmount.toLocaleString()}</div>
              </div>
            </div>
          </button>
        </div>

        {/* 搜尋 + 新增 */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-orange-400"
              placeholder="搜尋遊戲名稱…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <a
            href="https://ugg-order-parser.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-900 transition"
          >
            ➡️ 前往進貨系統新增
          </a>
        </div>

        {/* 遊戲卡片網格 */}
        {loading ? (
          <div className="text-center text-gray-400 py-20 text-sm">載入中…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-400 py-20 text-sm">
            {search ? '找不到符合的遊戲' : '還沒有任何遊戲，點擊「新增遊戲」開始吧！'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map(game => (
              <GameCard key={game.id} game={game} onClick={() => openEdit(game)} />
            ))}
          </div>
        )}
        </>}
      </div>

      {showModal && (
        <GameModal
          game={editGame}
          onSave={handleSave}
          onDelete={deleteGame}
          onClose={() => setShowModal(false)}
        />
      )}

      {showCostHistory && (
        <PurchaseCostModal
          records={records}
          thisMonth={thisMonth}
          onClose={() => setShowCostHistory(false)}
        />
      )}
    </div>
  )
}
