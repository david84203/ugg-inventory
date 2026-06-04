// 一次性腳本：從訂單回填庫存的 lastPurchaseDate 欄位
// 執行方式：node scripts/backfill-purchase-dates.mjs

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyBhKGhpyTpkLJ3TPBRtIkUGWaGtI4gWgy8',
  authDomain: 'ugg-store-system.firebaseapp.com',
  projectId: 'ugg-store-system',
  storageBucket: 'ugg-store-system.firebasestorage.app',
  messagingSenderId: '727899865595',
  appId: '1:727899865595:web:7bee42045059238f61cb5e',
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function main() {
  // 抓所有訂單，按日期由新到舊
  const ordersSnap = await getDocs(query(collection(db, 'orders'), orderBy('orderDate', 'desc')))
  const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }))
  console.log(`讀取到 ${orders.length} 筆訂單`)

  // 建立 gameName → 最新 orderDate 的對應表（已按 desc 排序，first match 就是最新）
  const latestDateByName = {}
  for (const order of orders) {
    for (const item of (order.items || [])) {
      const name = item.name?.trim()
      if (name && !latestDateByName[name]) {
        latestDateByName[name] = order.orderDate
      }
    }
  }
  console.log(`共 ${Object.keys(latestDateByName).length} 款遊戲有訂單記錄`)

  // 抓所有庫存文件，逐一更新
  const inventorySnap = await getDocs(collection(db, 'inventory'))
  let updated = 0
  let skipped = 0

  for (const d of inventorySnap.docs) {
    const game = d.data()
    const latestDate = latestDateByName[game.name?.trim()]
    if (latestDate) {
      await updateDoc(doc(db, 'inventory', d.id), { lastPurchaseDate: latestDate })
      console.log(`  ✓ ${game.name} → ${latestDate}`)
      updated++
    } else {
      skipped++
    }
  }

  console.log(`\n完成！更新 ${updated} 筆，略過 ${skipped} 筆（無對應訂單）`)
}

main().catch(err => { console.error(err); process.exit(1) })
