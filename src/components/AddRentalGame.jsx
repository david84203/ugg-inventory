import { useState, useRef } from 'react'
import { Search, Loader2, CheckCircle, ChevronDown, ChevronUp, ImagePlus, X } from 'lucide-react'

function calcRental(price) {
  const p = Number(price) || 0
  return p > 0 ? Math.ceil(p / 500) * 50 : 0
}

const emptyForm = {
  name: '',
  players: '',
  englishName: '',
  bggRating: '',
  bestPlayers: '',
  playTime: '',
  complexity: '',
  price: '',
  discountType: 'rate',
  discountRate: 65,
  bggUrl: '',
  category: '',
  tag1: '',
  tag2: '',
  tag3: '',
  sticker: '',
  youtubeLink: '',
  source: '',
  playerMode: '',
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
  const [showExtra, setShowExtra] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const fileInputRef = useRef(null)

  const price = Number(form.price) || 0
  const rental = calcRental(price)
  const isFree = form.discountType === 'free'
  const cost = isFree ? 0 : (price > 0 ? Math.round(price * form.discountRate / 100) : 0)

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
        englishName: data.englishName || f.englishName,
        bggRating: data.bggRating != null ? String(data.bggRating) : f.bggRating,
        bestPlayers: data.bestPlayers || f.bestPlayers,
        playTime: data.playTime != null ? String(data.playTime) : f.playTime,
        complexity: data.complexity != null ? String(data.complexity) : f.complexity,
        bggUrl: bggInput.trim(),
      }))
    } catch {
      setFetchError('網路錯誤，請稍後再試')
    } finally {
      setFetching(false)
    }
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function clearImage() {
    setImageFile(null)
    setImagePreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    setSaveError('')
    const data = {
      name: form.name.trim(),
      players: form.players.trim(),
      price,
      cost,
      rental,
      bggUrl: form.bggUrl,
      isFreeGift: isFree,
      ...(form.englishName && { englishName: form.englishName }),
      ...(form.bggRating && { bggRating: Number(form.bggRating) }),
      ...(form.bestPlayers && { bestPlayers: form.bestPlayers }),
      ...(form.playTime && { playTime: Number(form.playTime) }),
      ...(form.complexity && { complexity: Number(form.complexity) }),
      ...(form.category && { category: form.category }),
      ...(form.tag1 && { tag1: form.tag1 }),
      ...(form.tag2 && { tag2: form.tag2 }),
      ...(form.tag3 && { tag3: form.tag3 }),
      ...(form.sticker && { sticker: form.sticker }),
      ...(form.youtubeLink && { youtubeLink: form.youtubeLink }),
      ...(form.source && { source: form.source }),
      ...(form.playerMode && { playerMode: form.playerMode }),
    }
    try {
      await addGame(data, imageFile)
      setSaved(true)
      setForm(emptyForm)
      setBggInput('')
      setBggData(null)
      setShowExtra(false)
      clearImage()
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

        {fetchError && <p className="mt-2 text-xs text-red-500">{fetchError}</p>}

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
            placeholder="例：2-5（BGG 查詢自動填入）"
          />
        </div>
      </div>

      {/* 遊戲圖片 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">遊戲圖片</h3>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />
        {imagePreview ? (
          <div className="relative w-full">
            <img
              src={imagePreview}
              alt="預覽"
              className="w-full max-h-48 object-contain rounded-xl border border-gray-100 bg-gray-50"
            />
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center hover:bg-red-50 transition"
            >
              <X size={14} className="text-gray-500" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-28 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-orange-300 hover:text-orange-400 transition"
          >
            <ImagePlus size={24} />
            <span className="text-xs">點擊上傳圖片</span>
          </button>
        )}
        {imageFile && (
          <p className="mt-2 text-xs text-gray-400 truncate">{imageFile.name}</p>
        )}
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
            <select
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 bg-white"
              value={form.discountType}
              onChange={e => set('discountType', e.target.value)}
            >
              <option value="rate">自訂折數</option>
              <option value="free">廠商贈送</option>
            </select>
            {!isFree && (
              <div className="relative mt-1.5">
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
            )}
            <div className="text-xs text-gray-400 mt-1 pl-1">
              {isFree ? '= NT$ 0（免費）' : `= NT$ ${cost.toLocaleString()}`}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">租金（自動）</label>
            <div className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 text-sm text-gray-600">
              {rental > 0 ? `NT$ ${rental}` : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* 其他資訊（選填） */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowExtra(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
        >
          <span>
            其他資訊
            <span className="ml-1.5 text-xs font-normal text-gray-400">（選填）</span>
          </span>
          {showExtra ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>

        {showExtra && (
          <div className="px-5 pb-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
            <OptInput label="分類" value={form.category} onChange={v => set('category', v)} placeholder="例：重策" />
            <OptInput label="玩家模式" value={form.playerMode} onChange={v => set('playerMode', v)} placeholder="例：輕鬆、動腦、超燒腦" />
            <OptInput label="標籤 1" value={form.tag1} onChange={v => set('tag1', v)} placeholder="例：工人擺放" />
            <OptInput label="標籤 2" value={form.tag2} onChange={v => set('tag2', v)} placeholder="例：引擎構築" />
            <OptInput label="標籤 3" value={form.tag3} onChange={v => set('tag3', v)} placeholder="例：板塊拼放" />
            <OptInput label="貼紙" value={form.sticker} onChange={v => set('sticker', v)} placeholder="例：綠、黃、紅" />
            <div className="col-span-2">
              <OptInput label="教學連結" value={form.youtubeLink} onChange={v => set('youtubeLink', v)} placeholder="YouTube 教學網址" />
            </div>
            <div className="col-span-2">
              <OptInput label="出處" value={form.source} onChange={v => set('source', v)} placeholder="例：XIAN在玩桌遊" />
            </div>
          </div>
        )}
      </div>

      {saveError && <p className="text-xs text-red-500 px-1">{saveError}</p>}

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

function OptInput({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}
