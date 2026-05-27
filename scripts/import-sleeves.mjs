// 一次性腳本：批次匯入牌套庫存到 Firebase Firestore
// 執行方式：node scripts/import-sleeves.mjs

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc } from 'firebase/firestore'

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

// ── 所有牌套資料 ────────────────────────────────────────────
// 格式：{ name, brand, size, count, type, stock }
// name = 顯示名稱（品牌 + 尺寸 + 類型）
const sleeves = [
  // 🟢 棋寶
  { brand: '棋寶',     size: '45x68',  count: 110, type: '厚套', stock: 9  },
  { brand: '棋寶',     size: '56x87',  count: 110, type: '厚套', stock: 5  },
  { brand: '棋寶',     size: '59x92',  count: 110, type: '厚套', stock: 10 },
  { brand: '棋寶',     size: '63.5x88',count: 110, type: '厚套', stock: 23 },
  { brand: '棋寶',     size: '65x100', count: 110, type: '厚套', stock: 4  },

  // 🟢 棋寶 (盒裝)
  { brand: '棋寶(盒裝)', size: '59x92', count: 55, type: '厚套', stock: 5 },
  { brand: '棋寶(盒裝)', size: '63.5x88', count: 55, type: '厚套', stock: 8 },

  // 🟢 栢龍
  { brand: '栢龍', size: '40x89',  count: 110, type: '厚套', stock: 7  },
  { brand: '栢龍', size: '43x65',  count: 110, type: '厚套', stock: 4  },
  { brand: '栢龍', size: '45x68',  count: 110, type: '厚套', stock: 1  },
  { brand: '栢龍', size: '56x87',  count: 110, type: '厚套', stock: 5  },
  { brand: '栢龍', size: '59x92',  count: 110, type: '厚套', stock: 2  },
  { brand: '栢龍', size: '61x112', count: 110, type: '厚套', stock: 2  },
  { brand: '栢龍', size: '65x100', count: 110, type: '厚套', stock: 1  },
  { brand: '栢龍', size: '70x120', count: 110, type: '厚套', stock: 3  },
  { brand: '栢龍', size: '80x120', count: 110, type: '厚套', stock: 2  },
  { brand: '栢龍', size: '90x140', count: 110, type: '厚套', stock: 5  },

  // 🟢 牌套王
  { brand: '牌套王', size: '40x89', count: 110, type: '厚套', stock: 1 },
  { brand: '牌套王', size: '70x70', count: 110, type: '厚套', stock: 1 },

  // 🟢 勃根地
  { brand: '勃根地', size: '73x103', count: 80, type: '厚套', stock: 6 },

  // 🟢 鵝堡
  { brand: '鵝堡', size: '40x40',   count: 160, type: '薄套',    stock: 5  },
  { brand: '鵝堡', size: '43x65',   count: 160, type: '薄套',    stock: 6  },
  { brand: '鵝堡', size: '43x65',   count: 100, type: '厚套',    stock: 17 },
  { brand: '鵝堡', size: '44x68',   count: 120, type: '新版薄套', stock: 3  },
  { brand: '鵝堡', size: '45x70',   count: 160, type: '薄套',    stock: 45 },
  { brand: '鵝堡', size: '45x70',   count: 120, type: '新版薄套', stock: 19 },
  { brand: '鵝堡', size: '45x70',   count: 100, type: '厚套',    stock: 12 },
  { brand: '鵝堡', size: '47x47',   count: 160, type: '薄套',    stock: 13 },
  { brand: '鵝堡', size: '47x70',   count: 160, type: '薄套',    stock: 6  },
  { brand: '鵝堡', size: '51x67',   count: 160, type: '薄套',    stock: 1  },
  { brand: '鵝堡', size: '52x52',   count: 160, type: '薄套',    stock: 10 },
  { brand: '鵝堡', size: '55x82',   count: 80,  type: '厚套',    stock: 10 },
  { brand: '鵝堡', size: '56x87',   count: 160, type: '薄套',    stock: 9  },
  { brand: '鵝堡', size: '56x87',   count: 100, type: '厚套',    stock: 22 },
  { brand: '鵝堡', size: '57x90',   count: 160, type: '薄套',    stock: 19 },
  { brand: '鵝堡', size: '57x90',   count: 120, type: '新版薄套', stock: 7  },
  { brand: '鵝堡', size: '57x90',   count: 100, type: '厚套',    stock: 3  },
  { brand: '鵝堡', size: '57x110',  count: 160, type: '薄套',    stock: 3  },
  { brand: '鵝堡', size: '60x60',   count: 160, type: '薄套',    stock: 4  },
  { brand: '鵝堡', size: '60x90',   count: 160, type: '薄套',    stock: 18 },
  { brand: '鵝堡', size: '60x90',   count: 120, type: '新版薄套', stock: 10 },
  { brand: '鵝堡', size: '60x90',   count: 100, type: '厚套',    stock: 30 },
  { brand: '鵝堡', size: '60x92',   count: 160, type: '薄套',    stock: 36 },
  { brand: '鵝堡', size: '60x92',   count: 120, type: '新版薄套', stock: 1  },
  { brand: '鵝堡', size: '60x92',   count: 100, type: '厚套',    stock: 16 },
  { brand: '鵝堡', size: '60x92',   count: null, type: '未標示',  stock: 6  },
  { brand: '鵝堡', size: '60x120',  count: 150, type: '薄套',    stock: 3  },
  { brand: '鵝堡', size: '64x89',   count: 120, type: '新版薄套', stock: 1  },
  { brand: '鵝堡', size: '65x65',   count: 160, type: '薄套',    stock: 2  },
  { brand: '鵝堡', size: '65x90',   count: 120, type: '新版薄套', stock: 5  },
  { brand: '鵝堡', size: '65x90',   count: 100, type: '厚套',    stock: 4  },
  { brand: '鵝堡', size: '65x100',  count: 165, type: '薄套',    stock: 2  },
  { brand: '鵝堡', size: '65x115',  count: 120, type: '新版薄套', stock: 9  },
  { brand: '鵝堡', size: '65x115',  count: 80,  type: '厚套',    stock: 4  },
  { brand: '鵝堡', size: '70x70',   count: 160, type: '薄套',    stock: 4  },
  { brand: '鵝堡', size: '70x100',  count: 150, type: '薄套',    stock: 4  },
  { brand: '鵝堡', size: '70x110',  count: 150, type: '薄套',    stock: 2  },
  { brand: '鵝堡', size: '70x110',  count: 75,  type: '厚套',    stock: 3  },
  { brand: '鵝堡', size: '70x120',  count: 70,  type: '厚套',    stock: 9  },
  { brand: '鵝堡', size: '75x75',   count: 75,  type: '厚套',    stock: 4  },
  { brand: '鵝堡', size: '80x80',   count: 80,  type: '厚套',    stock: 15 },
  { brand: '鵝堡', size: '80x122',  count: 170, type: '薄套',    stock: 5  },
  { brand: '鵝堡', size: '80x122',  count: 90,  type: '厚套',    stock: 10 },
  { brand: '鵝堡', size: '90x90',   count: 130, type: '薄套',    stock: 2  },
  { brand: '鵝堡', size: '103x128', count: 50,  type: '厚套',    stock: 2  },
]

// ── 組成顯示名稱 ────────────────────────────────────────────
function makeName(item) {
  const countStr = item.count ? `${item.count}張` : '張數未標'
  return `${item.brand} ${item.size} ${countStr} ${item.type}`
}

// ── 批次寫入 ────────────────────────────────────────────────
async function run() {
  console.log(`準備匯入 ${sleeves.length} 筆牌套資料…`)
  let success = 0
  let fail = 0

  for (const item of sleeves) {
    const name = makeName(item)
    const doc = {
      name,
      category: '牌套',
      stock: item.stock,
      price: 0,       // 售價待補
      cost: 0,        // 成本待補
      rental: 0,
      players: '',
      minAge: '',
      imageUrl: '',
      createdAt: Date.now(),
      // 額外資訊
      brand: item.brand,
      size: item.size,
      sleeveCount: item.count ?? null,
      sleeveType: item.type,
    }

    try {
      await addDoc(collection(db, 'inventory'), doc)
      console.log(`✅ ${name}`)
      success++
    } catch (err) {
      console.error(`❌ ${name}：${err.message}`)
      fail++
    }
  }

  console.log(`\n完成！成功 ${success} 筆，失敗 ${fail} 筆`)
  process.exit(0)
}

run()
