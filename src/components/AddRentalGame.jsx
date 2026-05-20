import { useState } from 'react'
import { Search, Minus, Plus, Loader2, CheckCircle } from 'lucide-react'

function calcRental(price) {
  const p = Number(price) || 0
  return p > 0 ? Math.ceil(p / 500) * 50 : 0
}

const emptyForm = {
  name: '',
  players: '',
  stock: 1,
  price: '',
  discountRate: 65,
  bggUrl: '',
}

export default function AddRentalGame({ addGame }) {
  const [form, setForm] = useState(emptyForm)
  const [bggInput, setBggInput] = useState('')
  const [bggData, setBggData] = useState(null)
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  const price = Number(form.price) || 0
  const rental = calcRental(price)
  const cost = price > 0 ? Math.round(price * form.discountRate / 100) : 0

  function set(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleFetchBgg() {
    if (!bggInput.trim()) return
    setFetching(true)
    setFetchError('')
    setBggData(null)
    try {
      const res = await fetch('/api/fetch-bgg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: bggInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setFetchError(data.error || '查詢失敗')
        return
      }
      setBggData(data)
      setForm(f => ({
        ...f,
        players: data.players || f.players,
        bggUrl: bggInput.trim(),
      }))
    } catch {
      setFetchError('網路錯誤，請稍後再試')
    } finally {
      setFetching(false)
    }
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    setSaveError('')
    const data = {
      name: form.name.trim(),
      players: form.players.trim(),
      stock: Number(form.stock) || 1,
      price,
      cost,
      rental,
      bggUrl: form.bggUrl,
    }
    try {
      await addGame(data, null)
      setSaved(true)
      setForm(emptyForm)
      setBggInput('')
      setBggData(null)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setSaveError(err?.message || '儲存失敗，請稍後再試')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* BGG 查詢 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">BGG 資料查詢</h3>
        <div className="flex gap-2">
          <input
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
            placeholder="貼上 BGG 連結，例：boardgamegeek.com/boardgame/…"
            value={bggInput}
            onChange={e => setBggInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleFetchBgg()}
          />
          <button
            onClick={handleFetchBgg}
            disabled={fetching || !bggInput.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition disabled:opacity-50"
          >
            {fetching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            查詢
          </button>
        </div>

        {fetchError && (
          <p className="mt-2 text-xs text-red-500">{fetchError}</p>
        )}

        {bggData && (
          <div className="mt-3 p-3 bg-blue-50 rounded-xl grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <InfoRow label="英文名稱" value={bggData.englishName} />
            <InfoRow label="人數" value={bggData.players} />
            <InfoRow label="BGG 評分" value={bggData.bggRating?.toFixed(1)} />
            <InfoRow label="最佳人數" value={bggData.bestPlayers} />
            <InfoRow label="遊戲時間" value={bggData.playTime ? `${bggData.playTime} 分` : null} />
            <InfoRow label="複雜度" value={bggData.complexity ? `${bggData.complexity.toFixed(2)} / 5` : null} />
          </div>
        )}
      </div>

      {/* 基本資料 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">基本資料</h3>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">中文名稱 *</label>
          <input
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="例：卡卡頌"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">人數</label>
          <input
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
            value={form.players}
            onChange={e => set('players', e.target.value)}
            placeholder="例：2-5"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">庫存數量</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => set('stock', Math.max(1, Number(form.stock) - 1))}
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
            >
              <Minus size={14} />
            </button>
            <input
              type="number"
              min="1"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:border-orange-400"
              value={form.stock}
              onChange={e => set('stock', Number(e.target.value))}
            />
            <button
              onClick={() => set('stock', Number(form.stock) + 1)}
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 定價 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">定價</h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">售價（NT$）</label>
            <input
              type="number"
              min="0"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
              value={form.price}
              onChange={e => set('price', e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">進貨折數</label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="100"
                className="w-full border border-gray-200 rounded-xl pl-3 pr-7 py-2 text-sm focus:outline-none focus:border-orange-400"
                value={form.discountRate}
                onChange={e => set('discountRate', Number(e.target.value) || 65)}
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
            </div>
            <div className="text-xs text-gray-400 mt-1 pl-1">= NT$ {cost.toLocaleString()}</div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">租金（自動）</label>
            <div className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 text-sm text-gray-600">
              {rental > 0 ? `NT$ ${rental}` : '—'}
            </div>
          </div>
        </div>
      </div>

      {saveError && (
        <p className="text-xs text-red-500 px-1">{saveError}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving || !form.name.trim()}
        className="w-full py-3 rounded-2xl bg-orange-500 text-white font-medium text-sm hover:bg-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? (
          <><Loader2 size={16} className="animate-spin" /> 儲存中…</>
        ) : saved ? (
          <><CheckCircle size={16} /> 已新增！</>
        ) : (
          '新增開盒遊戲'
        )}
      </button>
    </div>
  )
}

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <>
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-700 font-medium">{value}</span>
    </>
  )
}
