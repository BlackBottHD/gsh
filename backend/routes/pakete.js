const express = require('express')
const router = express.Router()
const db = require('../lib/db')

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT value, data FROM cfg WHERE value LIKE 'paket_%'")
    
    const pakete = rows.map(row => {
      return {
        id: row.value,
        ...JSON.parse(row.data)
      }
    })

    res.json(pakete)
  } catch (err) {
    console.error('Fehler beim Laden der Pakete:', err)
    res.status(500).json({ error: 'Fehler beim Laden der Pakete' })
  }
})

module.exports = router
