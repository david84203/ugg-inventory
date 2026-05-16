import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy, query
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../firebase/config'

export function useInventory() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'inventory'), orderBy('name'))
    const unsub = onSnapshot(q, snap => {
      setGames(snap.docs.map(d => ({ id: d.id, ...d.data() })))
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
    let imageUrl = oldImageUrl
    if (imageFile) {
      imageUrl = await uploadImage(imageFile)
      if (oldImageUrl) {
        try { await deleteObject(ref(storage, oldImageUrl)) } catch {}
      }
    }
    await updateDoc(doc(db, 'inventory', id), { ...data, imageUrl })
  }

  async function deleteGame(id, imageUrl) {
    await deleteDoc(doc(db, 'inventory', id))
    if (imageUrl) {
      try { await deleteObject(ref(storage, imageUrl)) } catch {}
    }
  }

  async function adjustStock(id, delta) {
    const game = games.find(g => g.id === id)
    if (!game) return
    const newStock = Math.max(0, (game.stock || 0) + delta)
    await updateDoc(doc(db, 'inventory', id), { stock: newStock })
  }

  return { games, loading, addGame, updateGame, deleteGame, adjustStock }
}
