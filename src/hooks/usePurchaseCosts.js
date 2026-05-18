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
    const q = query(collection(db, 'purchaseCosts'), orderBy('__name__', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setRecords(snap.docs.map(d => ({ month: d.id, amount: d.data().amount ?? 0 })))
      setLoading(false)
    })
    return unsub
  }, [])

  const thisMonth = currentYearMonth()
  const thisMonthAmount = records.find(r => r.month === thisMonth)?.amount ?? 0

  return { records, loading, thisMonth, thisMonthAmount }
}
