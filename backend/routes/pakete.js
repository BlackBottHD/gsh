const express = require('express')
const router = express.Router()
const db = require('../lib/db')

// 📌 GET /api/pakete – alle Pakete laden
router.get('/', async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM pakete WHERE archived = 0 ORDER BY sort ASC')
    res.json(rows)
  } catch (err) {
    console.error('Fehler beim Laden der Pakete:', err)
    res.status(500).json({ error: 'Fehler beim Laden der Pakete' })
  }
})

module.exports = router
