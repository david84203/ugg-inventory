import { useState, useMemo } from 'react'
import { Search, Package, BoxesIcon, DollarSign, History, ShieldCheck } from 'lucide-react'
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
  const [categoryFilter, setCategoryFilter] = useState(null) // null=全部, '桌遊'=桌遊, '牌套'=牌套
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [priceMode, setPriceMode] = useState('original') // 'original' | 'member' | 'custom'
  const [customDiscount, setCustomDiscount] = useState('')
  const [activeTab, setActiveTab] = useState('inventory')
  const [showModal, setShowModal] = useState(false)
  const [editGame, setEditGame] = useState(null)
  const [showCostHistory, setShowCostHistory] = useState(false)

  const EXCLUDED_CATEGORIES = ['牌套', '周邊']

  const filtered = useMemo(() => {
    let list = games
    if (categoryFilter === '桌遊') {
      list = list.filter(g => !EXCLUDED_CATEGORIES.includes(g.category))
    } else if (categoryFilter === '牌套') {
      list = list.filter(g => g.category === '牌套')
    }
    const q = search.trim().toLowerCase()
    if (q) list = list.filter(g => g.name?.toLowerCase().includes(q))
    const min = priceMin !== '' ? Number(priceMin) : null
    const max = priceMax !== '' ? Number(priceMax) : null
    if (min !== null || max !== null) {
      list = list.filter(g => {
        const p = priceMode === 'member'
          ? Math.floor((g.price || 0) * 0.9)
          : priceMode === 'custom' && customDiscount !== ''
          ? Math.floor((g.price || 0) * (parseFloat(customDiscount) / 10))
          : (g.price || 0)
        if (min !== null && p < min) return false
        if (max !== null && p > max) return false
        return true
      })
    }
    return list
  }, [games, search, categoryFilter, priceMin, priceMax, priceMode, customDiscount])

  const totalGames = games.filter(g => !EXCLUDED_CATEGORIES.includes(g.category)).length
  const totalSleeves = games.filter(g => g.category === '牌套').length
  const totalSleeveStock = games.filter(g => g.category === '牌套').reduce((s, g) => s + (g.stock || 0), 0)
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
        <div className="grid grid-cols-4 gap-4 mb-6">
          {/* 桌遊款數（可點擊篩選） */}
          <button
            onClick={() => setCategoryFilter(f => f === '桌遊' ? null : '桌遊')}
            className={`rounded-2xl p-4 shadow-sm border transition-all text-left w-full ${
              categoryFilter === '桌遊'
                ? 'bg-orange-500 border-orange-500'
                : 'bg-white border-gray-100 hover:border-orange-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                categoryFilter === '桌遊' ? 'bg-orange-400' : 'bg-orange-50'
              }`}>
                <BoxesIcon size={18} className={categoryFilter === '桌遊' ? 'text-white' : 'text-orange-500'} />
              </div>
              <div>
                <div className={`text-xs ${categoryFilter === '桌遊' ? 'text-orange-100' : 'text-gray-400'}`}>桌遊款數</div>
                <div className={`text-2xl font-bold ${categoryFilter === '桌遊' ? 'text-white' : 'text-gray-800'}`}>{totalGames}</div>
              </div>
            </div>
          </button>

          {/* 牌套款數（可點擊篩選） */}
          <button
            onClick={() => setCategoryFilter(f => f === '牌套' ? null : '牌套')}
            className={`rounded-2xl p-4 shadow-sm border transition-all text-left w-full ${
              categoryFilter === '牌套'
                ? 'bg-blue-500 border-blue-500'
                : 'bg-white border-gray-100 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                categoryFilter === '牌套' ? 'bg-blue-400' : 'bg-blue-50'
              }`}>
                <ShieldCheck size={18} className={categoryFilter === '牌套' ? 'text-white' : 'text-blue-500'} />
              </div>
              <div>
                <div className={`text-xs ${categoryFilter === '牌套' ? 'text-blue-100' : 'text-gray-400'}`}>
                  牌套款數
                </div>
                <div className={`text-2xl font-bold ${categoryFilter === '牌套' ? 'text-white' : 'text-gray-800'}`}>
                  {totalSleeves}
                  {categoryFilter === '牌套' && (
                    <span className="text-sm font-normal ml-1.5 opacity-80">庫存 {totalSleeveStock}</span>
                  )}
                </div>
              </div>
            </div>
          </button>

          {/* 總庫存 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <Package size={18} className="text-purple-500" />
              </div>
              <div>
                <div className="text-xs text-gray-400">總庫存數</div>
                <div className="text-2xl font-bold text-gray-800">{totalStock}</div>
              </div>
            </div>
          </div>

          {/* 進貨成本 */}
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
        <div className="flex gap-3 mb-3">
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

        {/* 價格區間搜尋 */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className="text-xs text-gray-500 shrink-0">價格區間</span>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400 text-xs">$</span>
            <input
              type="number"
              min="0"
              className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-orange-400"
              placeholder="最低"
              value={priceMin}
              onChange={e => setPriceMin(e.target.value)}
            />
            <span className="text-gray-400 text-xs">～</span>
            <input
              type="number"
              min="0"
              className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-orange-400"
              placeholder="最高"
              value={priceMax}
              onChange={e => setPriceMax(e.target.value)}
            />
          </div>
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setPriceMode('original')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                priceMode === 'original' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              原價
            </button>
            <button
              onClick={() => setPriceMode('member')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                priceMode === 'member' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              會員9折
            </button>
            <button
              onClick={() => setPriceMode('custom')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                priceMode === 'custom' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              自訂折
            </button>
          </div>
          {priceMode === 'custom' && (
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="1"
                max="9.9"
                step="0.1"
                className="w-14 px-2 py-1.5 border border-blue-300 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-400 text-center"
                placeholder="折數"
                value={customDiscount}
                onChange={e => setCustomDiscount(e.target.value)}
              />
              <span className="text-xs text-gray-500">折</span>
            </div>
          )}
          {(priceMin || priceMax) && (
            <button
              onClick={() => { setPriceMin(''); setPriceMax(''); setCustomDiscount('') }}
              className="text-xs text-gray-400 hover:text-red-400 transition"
            >
              清除
            </button>
          )}
          {(priceMin || priceMax) && (
            <span className="text-xs text-gray-400">
              找到 {filtered.length} 款
            </span>
          )}
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
