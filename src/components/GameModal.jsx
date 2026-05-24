import { useState, useRef } from 'react'
import { X, Upload, Trash2, Minus, Plus } from 'lucide-react'

// 租金自動計算：每 500 元加 50 元
function calcRental(price) {
  const p = Number(price) || 0
  return p > 0 ? Math.ceil(p / 500) * 50 : 0
}

// 從已有的 cost/price 反推折數（編輯舊資料時用）
function inferDiscount(cost, price) {
  const p = Number(price) || 0
  const c = Number(cost) || 0
  if (p <= 0) return 65
  return Math.round(c / p * 100) || 65
}

const EXCLUDED_CATEGORIES = ['牌套', '周邊']

const emptyForm = {
  name: '',
  players: '',
  minAge: '',
  stock: 0,
  price: '',
  discountRate: 65,
  category: '',
}

export default function GameModal({ game, onSave, onDelete, onClose }) {
  const isEdit = !!game
  const [form, setForm] = useState(isEdit ? {
    name: game.name || '',
    players: game.players || '',
    minAge: game.minAge || '',
    stock: game.stock ?? 0,
    price: game.price || '',
    discountRate: inferDiscount(game.cost, game.price),
    category: game.category || '',
  } : emptyForm)

  const price = Number(form.price) || 0
  const isExcluded = EXCLUDED_CATEGORIES.includes(form.category)
  const rental = isExcluded ? 0 : calcRental(price)
  const cost = price > 0 ? Math.round(price * form.discountRate / 100) : 0
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(game?.imageUrl || '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const fileRef = useRef()

  function set(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handleImage(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    setSaveError('')
    const data = {
      name: form.name.trim(),
      players: form.players.trim(),
      minAge: form.minAge.trim(),
      stock: Number(form.stock) || 0,
      price,
      cost,
      rental,
      category: form.category || '',
    }
    try {
      await onSave(data, imageFile, game?.imageUrl)
      setSaving(false)
      onClose()
    } catch (err) {
      setSaving(false)
      setSaveError(err?.message || '儲存失敗，請稍後再試')
      console.error('Save error:', err)
    }
  }

  async function handleDelete() {
    setSaving(true)
    await onDelete(game.id)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">{isEdit ? '編輯遊戲' : '新增遊戲'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* 封面圖 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">封面圖</label>
            <div
              onClick={() => fileRef.current.click()}
              className="relative border-2 border-dashed border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:border-orange-300 transition aspect-square max-w-40 mx-auto flex items-center justify-center bg-gray-50"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="" className="w-full h-full object-contain p-2" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-gray-400">
                  <Upload size={24} />
                  <span className="text-xs">點擊上傳</span>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </div>

          {/* 類別 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">類別</label>
            <div className="flex gap-2">
              {[['', '🎲 桌遊'], ['牌套', '🛡️ 牌套'], ['周邊', '🎁 周邊']].map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => set('category', val)}
                  className={`flex-1 py-1.5 rounded-xl text-sm font-medium border transition ${
                    form.category === val
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'border-gray-200 text-gray-500 hover:border-orange-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 遊戲名稱 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">品名 *</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="例：卡卡頌"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">遊戲人數</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                value={form.players}
                onChange={e => set('players', e.target.value)}
                placeholder="例：2-5"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">適合年齡</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                value={form.minAge}
                onChange={e => set('minAge', e.target.value)}
                placeholder="例：8"
              />
            </div>
          </div>

          {/* 庫存數量 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">庫存數量</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => set('stock', Math.max(0, Number(form.stock) - 1))}
                className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
              >
                <Minus size={14} />
              </button>
              <input
                type="number"
                min="0"
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
            <div className="text-[11px] text-amber-500 mt-1.5 flex items-start leading-tight">
              ⚠️ 進貨請勿在此增加，會漏算成本！此處僅供盤點修正使用
            </div>
          </div>

          <div className={`grid gap-3 ${isExcluded ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {/* 售價 */}
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

            {/* 折數 → 自動算成本 */}
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
              <div className="text-xs text-gray-400 mt-1 pl-1">
                = NT$ {cost.toLocaleString()}
              </div>
            </div>

            {/* 租金（桌遊專用） */}
            {!isExcluded && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">租金（自動）</label>
                <div className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 text-sm text-gray-600">
                  {rental > 0 ? `NT$ ${rental}` : '—'}
                </div>
              </div>
            )}
          </div>
        </div>

        {saveError && (
          <div className="mx-5 mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
            ⚠️ {saveError}
          </div>
        )}

        <div className="px-5 pb-5 flex gap-2">
          {isEdit && !confirmDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-500 text-sm hover:bg-red-50 transition"
            >
              <Trash2 size={14} /> 刪除
            </button>
          )}
          {confirmDelete && (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500 text-white text-sm hover:bg-red-600 transition disabled:opacity-50"
            >
              確定刪除
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="flex-1 py-2 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition disabled:opacity-50"
          >
            {saving ? '儲存中…' : '儲存'}
          </button>
        </div>
      </div>
    </div>
  )
}
