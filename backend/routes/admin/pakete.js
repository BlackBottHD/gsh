const express = require('express')
const router = express.Router()
const db = require('../../lib/db')
const jwt = require('jsonwebtoken')

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Nicht autorisiert' })
  }

  const token = authHeader.split(' ')[1]
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'changemeplease')
    next()
  } catch {
    return res.status(403).json({ message: 'Token ungültig' })
  }
}

router.use(verifyToken)

// 📌 GET /api/admin/pakete
router.get('/', async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM pakete ORDER BY sort ASC')

    // Gruppieren nach Paket-Präfix (z. B. "bronze") und Version extrahieren
    const grouped = {}
    for (const row of rows) {
      const [prefix, version] = row.id.split('_')
      if (!grouped[prefix]) grouped[prefix] = []
      grouped[prefix].push({ ...row, version: version || '0' })
    }

    // Pro Gruppe: 1x nicht archiviert + 3x neueste archivierte
    const final = Object.values(grouped).flatMap(list => {
      const active = list.find(r => !r.archived)
      const archived = list
        .filter(r => r.archived)
        .sort((a, b) => parseFloat(b.version) - parseFloat(a.version))
        .slice(0, 3)
      return active ? [active, ...archived] : archived
    })

    res.json(final)
  } catch (err) {
    console.error('Fehler beim Laden der Pakete:', err)
    res.status(500).json({ error: 'Fehler beim Laden der Pakete' })
  }
})


// 📌 POST /api/admin/pakete
router.post('/', async (req, res) => {
  const { id, label, ram, disk, backup, tables, price_eur, price_dynamic } = req.body
  if (!id || !label) return res.status(400).json({ message: 'ID und Label erforderlich' })

  try {
    await db.query(
      `REPLACE INTO pakete (id, label, ram, disk, backup, tables, price_eur, price_dynamic, archived)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [id, label, ram, disk, backup, tables, price_eur, price_dynamic ? 1 : 0]
    )
    res.json({ message: 'Paket gespeichert' })
  } catch (err) {
    console.error('[PAKETE POST]', err)
    res.status(500).json({ message: 'Fehler beim Speichern des Pakets' })
  }
})

// 📌 PATCH /api/admin/pakete/:id/archive
router.patch('/:id/archive', async (req, res) => {
  try {
    await db.query('UPDATE pakete SET archived = 1 WHERE id = ?', [req.params.id])
    res.json({ message: 'Paket archiviert' })
  } catch (err) {
    console.error('[PAKETE ARCHIVE]', err)
    res.status(500).json({ message: 'Fehler beim Archivieren des Pakets' })
  }
})

// 📌 PATCH /api/admin/pakete/:id/unarchive
router.patch('/:id/unarchive', async (req, res) => {
  try {
    await db.query('UPDATE pakete SET archived = 0 WHERE id = ?', [req.params.id])
    res.json({ message: 'Paket reaktiviert' })
  } catch (err) {
    console.error('[PAKETE UNARCHIVE]', err)
    res.status(500).json({ message: 'Fehler beim Reaktivieren des Pakets' })
  }
})


// 📌 DELETE /api/admin/pakete/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM pakete WHERE id = ?', [req.params.id])
    res.json({ message: 'Paket gelöscht' })
  } catch (err) {
    console.error('[PAKETE DELETE]', err)
    res.status(500).json({ message: 'Fehler beim Löschen des Pakets' })
  }
})

// 📌 PATCH /api/admin/pakete
router.patch('/', async (req, res) => {
    const { id, label, ram, disk, backup, tables, price_eur, price_dynamic } = req.body
    if (!id || !label) return res.status(400).json({ message: 'ID und Label erforderlich' })
  
    try {
      await db.query(
        `UPDATE pakete SET
           label = ?,
           ram = ?,
           disk = ?,
           backup = ?,
           tables = ?,
           price_eur = ?,
           price_dynamic = ?
         WHERE id = ?`,
        [label, ram, disk, backup, tables, price_eur, price_dynamic ? 1 : 0, id]
      )
      res.json({ message: 'Paket aktualisiert' })
    } catch (err) {
      console.error('[PAKETE PATCH]', err)
      res.status(500).json({ message: 'Fehler beim Aktualisieren des Pakets' })
    }
  })
  

module.exports = router
