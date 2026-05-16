import { useState, useMemo } from 'react'
import { Search, Plus, Package, BoxesIcon, DollarSign } from 'lucide-react'
import { useInventory } from '../hooks/useInventory'
import GameCard from '../components/GameCard'
import GameModal from '../components/GameModal'

export default function Inventory() {
  const { games, loading, addGame, updateGame, deleteGame } = useInventory()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editGame, setEditGame] = useState(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return games
    return games.filter(g => g.name?.toLowerCase().includes(q))
  }, [games, search])

  const totalGames = games.length
  const totalStock = games.reduce((s, g) => s + (g.stock || 0), 0)
  const totalCost = games.reduce((s, g) => s + (g.cost || 0) * (g.stock || 0), 0)

  function openAdd() {
    setEditGame(null)
    setShowModal(true)
  }

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
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <DollarSign size={18} className="text-green-500" />
              </div>
              <div>
                <div className="text-xs text-gray-400">進貨成本</div>
                <div className="text-xl font-bold text-gray-800">NT$ {totalCost.toLocaleString()}</div>
              </div>
            </div>
          </div>
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
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition"
          >
            <Plus size={16} /> 新增遊戲
          </button>
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
      </div>

      {showModal && (
        <GameModal
          game={editGame}
          onSave={handleSave}
          onDelete={deleteGame}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
