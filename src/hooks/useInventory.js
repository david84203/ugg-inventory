import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, addDoc, updateDoc, doc, query
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../firebase/config'

function sortByPurchaseDate(games) {
  return [...games].sort((a, b) => {
    const da = a.lastPurchaseDate || ''
    const db_ = b.lastPurchaseDate || ''
    if (da && db_) return db_.localeCompare(da) // 兩者都有日期：新的在前
    if (da) return -1                            // 只有 a 有日期：a 在前
    if (db_) return 1                            // 只有 b 有日期：b 在前
    return (a.name || '').localeCompare(b.name || '', 'zh-TW') // 都沒日期：按名稱
  })
}

export function useInventory() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'inventory'))
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(g => !g.deleted)
      setGames(sortByPurchaseDate(list))
      setLoading(false)
    })
    return unsub
  }, [])

  async function uploadImage(file) {
    const path = `inventory/${Date.now()}_${file.name}`
    const storageRef = ref(storage, path)
    await uploadBytes(storageRef, file)
    return await getDownloadURL(storageRef)
  }

  async function addGame(data, imageFile) {
    let imageUrl = ''
    if (imageFile) imageUrl = await uploadImage(imageFile)
    await addDoc(collection(db, 'inventory'), { ...data, imageUrl, createdAt: Date.now() })
  }

  async function updateGame(id, data, imageFile, oldImageUrl) {
    let imageUrl = oldImageUrl || ''
    if (imageFile) {
      imageUrl = await uploadImage(imageFile)
      if (oldImageUrl) {
        try { await deleteObject(ref(storage, oldImageUrl)) } catch {}
      }
    }
    await updateDoc(doc(db, 'inventory', id), { ...data, imageUrl })
  }

  async function deleteGame(id) {
    await updateDoc(doc(db, 'inventory', id), { deleted: true, deletedAt: Date.now() })
  }

  async function adjustStock(id, delta) {
    const game = games.find(g => g.id === id)
    if (!game) return
    const newStock = Math.max(0, (game.stock || 0) + delta)
    await updateDoc(doc(db, 'inventory', id), { stock: newStock })
  }

  return { games, loading, addGame, updateGame, deleteGame, adjustStock }
}
