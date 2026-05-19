import { google } from 'googleapis'

const SHEET_ID = '1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw'
const SHEET_TAB = '工作表1'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const sa = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT)
    const auth = new google.auth.GoogleAuth({
      credentials: sa,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
    const sheets = google.sheets({ version: 'v4', auth })

    const { name, lang, location, bggUrl, price, category, imageUrl, tag1, tag2, tag3, sticker, tutorial } = req.body

    const today = new Date().toLocaleDateString('zh-TW', {
      timeZone: 'Asia/Taipei',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).replace(/\//g, '-')

    // 對應欄位（A=0, B=1 ... Z=25）
    const row = Array(26).fill('')
    row[0]  = name || ''       // A 中文名稱
    row[3]  = lang || ''       // D 語言
    row[5]  = location || ''   // F 位置（櫃位）
    row[10] = bggUrl || ''     // K BGG連結
    row[13] = price ? Number(price) : ''  // N 定價
    row[15] = category || ''   // P 分類
    row[16] = tag1 || ''       // Q 標籤1
    row[17] = tag2 || ''       // R 標籤2
    row[18] = tag3 || ''       // S 標籤3
    row[19] = sticker || ''    // T 貼紙
    row[20] = imageUrl || ''   // U 圖片（Firebase Storage URL 或留空）
    row[21] = tutorial || ''   // V 教學影片
    row[25] = today            // Z 到貨日

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_TAB}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] },
    })

    return res.status(200).json({ success: true, date: today })
  } catch (err) {
    console.error('add-rental-game error:', err)
    return res.status(500).json({ error: err.message })
  }
}
