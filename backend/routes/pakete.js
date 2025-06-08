const express = require('express')
const router = express.Router()
const db = require('../lib/db')

// 📌 GET /api/pakete – alle nicht archivierten Pakete laden
router.get('/', async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM pakete WHERE archived = 0 ORDER BY sort ASC')

    const result = rows.map(paket => {
      const games = paket.games ? JSON.parse(paket.games) : []
      const priceCoinDay = paket.price_coins ? Math.ceil(paket.price_coins / 30) : 0

      return {
        id: paket.id,
        label: paket.label,
        ram: paket.ram,
        disk: paket.disk,
        backup: paket.backup,
        tables: paket.tables,
        price_dynamic: paket.price_dynamic === 1,
        priceCoinDay,
        games
      }
    })

    res.json(result)
  } catch (err) {
    console.error('[API /pakete] Fehler beim Laden:', err)
    res.status(500).json({ error: 'Fehler beim Laden der Pakete' })
  }
})

module.exports = router
