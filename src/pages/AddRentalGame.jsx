import { useState, useRef } from 'react'
import { Upload, X, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase/config'

const FIELDS = [
  { key: 'name',     label: '中文名稱',  type: 'text',     placeholder: '例：卡坦島' },
  { key: 'lang',     label: '語言版本',  type: 'text',     placeholder: '例：繁中、簡中、英文' },
  { key: 'location', label: '放置櫃位',  type: 'text',     placeholder: '例：A3、B1' },
  { key: 'price',    label: '定價（NT$）', type: 'number', placeholder: '例：1200' },
  { key: 'category', label: '分類',      type: 'text',     placeholder: '例：策略、家庭' },
  { key: 'tag1',     label: '標籤 1',    type: 'text',     placeholder: '' },
  { key: 'tag2',     label: '標籤 2',    type: 'text',     placeholder: '' },
  { key: 'tag3',     label: '標籤 3',    type: 'text',     placeholder: '' },
  { key: 'sticker',  label: '貼紙',      type: 'text',     placeholder: '例：熱門、推薦' },
  { key: 'bggUrl',   label: 'BGG 連結',  type: 'url',      placeholder: 'https://boardgamegeek.com/...' },
  { key: 'tutorial', label: '教學影片 URL', type: 'url',   placeholder: 'https://youtube.com/...' },
]

const empty = () => Object.fromEntries(FIELDS.map(f => [f.key, '']))

export default function AddRentalGame() {
  const [form, setForm] = useState(empty())
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [status, setStatus] = useState('idle') // idle | uploading | success | error
  const [errorMsg, setErrorMsg] = useState('')
  const fileRef = useRef()

  function handleField(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function handleImage(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function clearImage() {
    setImageFile(null)
    setImagePreview('')
    fileRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      setErrorMsg('請填入中文名稱')
      return
    }

    setStatus('uploading')
    setErrorMsg('')

    try {
      // 1. 上傳圖片到 Firebase Storage
      let imageUrl = ''
      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const path = `rental-games/${Date.now()}_${form.name.trim()}.${ext}`
        const storageRef = ref(storage, path)
        await uploadBytes(storageRef, imageFile)
        imageUrl = await getDownloadURL(storageRef)
      }

      // 2. 寫入 Google Sheet
      const res = await fetch('/api/add-rental-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, imageUrl }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '寫入失敗')
      }

      setStatus('success')
      setForm(empty())
      clearImage()
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-gray-800">新增開盒遊戲</h1>
        <p className="text-sm text-gray-400 mt-1">寫入 Google Sheet，時間戳記自動記錄。欄位非必填，之後可補。</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 圖片上傳 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">遊戲圖片</label>
          {imagePreview ? (
            <div className="relative w-32 h-32">
              <img src={imagePreview} alt="preview" className="w-32 h-32 object-cover rounded-xl border border-gray-200" />
              <button type="button" onClick={clearImage}
                className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-red-50">
                <X size={12} className="text-gray-500" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current.click()}
              className="w-32 h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-orange-300 hover:bg-orange-50 transition-colors">
              <Upload size={20} className="text-gray-400" />
              <span className="text-xs text-gray-400">上傳圖片</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
        </div>

        {/* 文字欄位 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FIELDS.map(f => (
            <div key={f.key} className={f.key === 'bggUrl' || f.key === 'tutorial' ? 'sm:col-span-2' : ''}>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                {f.label}
                {f.key === 'name' && <span className="text-orange-500 ml-1">*</span>}
              </label>
              <input
                type={f.type}
                value={form[f.key]}
                onChange={e => handleField(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
              />
            </div>
          ))}
        </div>

        {/* 錯誤訊息 */}
        {errorMsg && (
          <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
            <AlertCircle size={14} />
            {errorMsg}
          </div>
        )}

        {/* 成功訊息 */}
        {status === 'success' && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
            <CheckCircle size={14} />
            已寫入 Google Sheet！
          </div>
        )}

        {/* 送出按鈕 */}
        <button
          type="submit"
          disabled={status === 'uploading'}
          className="w-full py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {status === 'uploading' ? (
            <><Loader size={14} className="animate-spin" /> 寫入中...</>
          ) : '新增到 Google Sheet'}
        </button>
      </form>
    </div>
  )
}
