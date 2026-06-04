// 從桌遊 APP 的 Google Sheet + 本地圖片，同步圖片 URL 到庫存系統 Firestore
// 策略：用 Google Sheet 查 BGG ID/英文名稱 → 找 Uggboardgame 本地圖片 → 直接引用桌遊 APP URL
// 執行方式：
//   node scripts/sync-images-from-sheet.mjs           ← 實際寫入
//   node scripts/sync-images-from-sheet.mjs --dry-run ← 預覽，不寫入

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { existsSync } from 'fs'
import path from 'path'

const firebaseConfig = {
  apiKey: 'AIzaSyBhKGhpyTpkLJ3TPBRtIkUGWaGtI4gWgy8',
  authDomain: 'ugg-store-system.firebaseapp.com',
  projectId: 'ugg-store-system',
  storageBucket: 'ugg-store-system.firebasestorage.app',
  messagingSenderId: '727899865595',
  appId: '1:727899865595:web:7bee42045059238f61cb5e',
}

const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTBJylM7ousC0ift39FwzpIB7NrFgYZBfaKug_pBLXU_l0UZKTKKlcfO9663eetX13d5pbsWBLGinVE/pub?gid=540615026&single=true&output=csv'

// 桌遊 APP 部署網址
const APP_BASE_URL = 'https://uggboardgame.vercel.app'

// 桌遊 APP 本地圖片資料夾（用來確認檔案存在）
const IMAGES_DIR = path.resolve('..', 'Uggboardgame', 'public', 'images')

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.avif']

const DRY_RUN = process.argv.includes('--dry-run')

// ── CSV 解析 ────────────────────────────────────────────────────────────────

function parseRow(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function parseSheet(text) {
  const lines = text.split('\n')
  const headerIdx = lines.findIndex(l => l.includes('中文名稱'))
  if (headerIdx < 0) throw new Error('找不到標題行（含「中文名稱」）')
  const headers = parseRow(lines[headerIdx])

  const col = (name) => headers.indexOf(name)
  const nameCol = col('中文名稱')
  const enCol = col('英文名稱')
  const bggCol = col('BGG連結')
  const imgCol = col('圖片')

  const entries = []
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i]?.trim()
    if (!line) continue
    const vals = parseRow(line)
    const name = vals[nameCol]?.trim()
    if (!name || name === '中文名稱') continue

    const bggLink = vals[bggCol]?.trim() || ''
    const bggMatch = bggLink.match(/boardgamegeek\.com\/boardgame(?:expansion)?\/(\d+)/)
    const bggId = bggMatch ? bggMatch[1] : null

    const englishName = vals[enCol]?.trim() || ''
    const isValidEn = englishName && englishName !== 'N/A' && englishName.length > 1
    const safeEn = isValidEn ? englishName.replace(/[\\/:*?"<>|]/g, '-').trim() : ''

    const imgRaw = vals[imgCol]?.trim() || ''
    const directUrl = imgRaw.startsWith('http') ? imgRaw : null

    entries.push({ name, bggId, englishName: safeEn, directUrl, rowId: headerIdx + i + 1 })
  }
  return entries
}

// ── 圖片查找 ────────────────────────────────────────────────────────────────

function findLocalImage(candidates) {
  for (const base of candidates) {
    if (!base) continue
    for (const ext of IMAGE_EXTS) {
      const file = path.join(IMAGES_DIR, base + ext)
      if (existsSync(file)) return base + ext
    }
  }
  return null
}

function resolveImageUrl(entry) {
  // 1. Sheet 直接有 HTTP URL
  if (entry.directUrl) return entry.directUrl

  // 2. 找本地圖片（BGG ID → 英文名稱 → row-{rowId}）
  const candidates = [
    entry.bggId,
    entry.englishName || null,
    entry.englishName ? entry.englishName.replace(/\s+/g, '-') : null,
    `row-${entry.rowId}`,
  ]
  const filename = findLocalImage(candidates)
  if (filename) return `${APP_BASE_URL}/images/${encodeURIComponent(filename)}`

  return null
}

function normalize(name) {
  return (name || '').trim().toLowerCase().replace(/\s+/g, '')
}

// ── 主流程 ──────────────────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function main() {
  if (DRY_RUN) console.log('🔍 DRY RUN 模式（不會寫入 Firestore）\n')

  // 確認圖片資料夾存在
  if (!existsSync(IMAGES_DIR)) {
    console.warn(`⚠️  找不到圖片資料夾：${IMAGES_DIR}`)
    console.warn('   請確認 Uggboardgame 專案與 ugg-inventory 在同一層目錄')
  } else {
    console.log(`✅ 找到圖片資料夾：${IMAGES_DIR}`)
  }

  console.log('\n📥 抓取 Google Sheet CSV…')
  const res = await fetch(SHEET_CSV_URL)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const csv = await res.text()

  const sheetEntries = parseSheet(csv)
  console.log(`✅ Sheet 共 ${sheetEntries.length} 筆遊戲資料`)

  // 建立查找 map（name → entry）
  const sheetByName = {}
  const sheetByNorm = {}
  for (const e of sheetEntries) {
    sheetByName[e.name] = e
    sheetByNorm[normalize(e.name)] = e
  }

  console.log('\n📦 讀取庫存 Firestore…')
  const snap = await getDocs(collection(db, 'inventory'))
  const all = snap.docs.map(d => ({ docId: d.id, ...d.data() })).filter(g => !g.deleted)
  console.log(`共 ${all.length} 款遊戲`)

  const noImage = all.filter(g => !g.imageUrl)
  console.log(`其中沒有圖片的：${noImage.length} 款\n`)

  let updated = 0
  let notFound = 0
  const notFoundList = []

  for (const game of noImage) {
    const name = game.name?.trim()
    const entry = sheetByName[name] || sheetByNorm[normalize(name)]

    if (!entry) {
      notFoundList.push(`${name}（Sheet 找不到）`)
      notFound++
      continue
    }

    const url = resolveImageUrl(entry)
    if (!url) {
      notFoundList.push(`${name}（無圖片檔）`)
      notFound++
      continue
    }

    if (!DRY_RUN) {
      await updateDoc(doc(db, 'inventory', game.docId), { imageUrl: url })
    }
    console.log(`  ✓ ${name}\n    → ${url}`)
    updated++
  }

  console.log(`\n完成！更新 ${updated} 款，找不到圖的 ${notFound} 款`)
  if (notFoundList.length > 0) {
    console.log('\n找不到圖片的遊戲（需手動上傳）：')
    notFoundList.forEach(n => console.log(`  - ${n}`))
  }
}

main().catch(err => { console.error(err); process.exit(1) })
