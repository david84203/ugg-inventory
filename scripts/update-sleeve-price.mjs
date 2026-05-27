// 批次更新牌套的 price=60, cost=42
// 執行方式：node scripts/update-sleeve-price.mjs

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'

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

async function run() {
  const q = query(collection(db, 'inventory'), where('category', '==', '牌套'))
  const snap = await getDocs(q)

  console.log(`找到 ${snap.size} 筆牌套，開始更新…`)
  let success = 0

  for (const d of snap.docs) {
    await updateDoc(doc(db, 'inventory', d.id), { price: 60, cost: 42 })
    console.log(`✅ ${d.data().name}`)
    success++
  }

  console.log(`\n完成！共更新 ${success} 筆`)
  process.exit(0)
}

run()
