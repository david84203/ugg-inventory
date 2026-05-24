import { useState, useEffect } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase/config'

function currentYearMonth() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function usePurchaseCosts() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 從 purchaseOrders 逐筆明細加總為月份合計
    const q = query(collection(db, 'purchaseOrders'), orderBy('orderDate', 'desc'))
    const unsub = onSnapshot(q, snap => {
      const byMonth = {}
      snap.docs.forEach(d => {
        const data = d.data()
        const month = data.monthKey || (data.orderDate || '').slice(0, 7)
        if (!month) return
        byMonth[month] = (byMonth[month] || 0) + (data.totalAmount || 0)
      })
      const grouped = Object.entries(byMonth).map(([month, amount]) => ({ month, amount }))
      setRecords(grouped)
      setLoading(false)
    })
    return unsub
  }, [])

  const thisMonth = currentYearMonth()
  const thisMonthAmount = records.find(r => r.month === thisMonth)?.amount ?? 0

  return { records, loading, thisMonth, thisMonthAmount }
}
