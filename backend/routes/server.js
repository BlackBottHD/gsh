const express = require('express')
const router = express.Router()
const db = require('../lib/db')
const jwt = require('jsonwebtoken')

// Token-Check Middleware
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

// POST /api/server/create
router.post('/create', async (req, res) => {
  const { paketId, gameId, serverName } = req.body
  if (!paketId || !gameId || !serverName) {
    return res.status(400).json({ message: 'Fehlende Angaben' })
  }

  try {
    // Beispiel: Serverdaten in DB speichern (Placeholder für Pterodactyl)
    await db.query(`
      INSERT INTO server (user_id, paket_id, game_id, name, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `, [req.user.id, paketId, gameId, serverName])

    res.status(201).json({ message: 'Server erstellt' })
  } catch (err) {
    console.error('[CREATE]', err)
    res.status(500).json({ message: 'Fehler beim Erstellen' })
  }
})

// GET /api/server/list
router.get('/list', async (req, res) => {
  try {
    const servers = await db.query(
      'SELECT * FROM server WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    )
    res.json(servers)
  } catch (err) {
    console.error('[LIST]', err)
    res.status(500).json({ message: 'Fehler beim Abrufen' })
  }
})

// POST /api/server/del
router.post('/del', async (req, res) => {
  const { serverId } = req.body
  try {
    await db.query('DELETE FROM server WHERE id = ? AND user_id = ?', [serverId, req.user.id])
    res.json({ message: 'Server gelöscht' })
  } catch (err) {
    console.error('[DELETE]', err)
    res.status(500).json({ message: 'Fehler beim Löschen' })
  }
})

// POST /api/server/start
router.post('/start', async (req, res) => {
  // TODO: Pterodactyl Start-Call
  res.json({ message: 'Start ausgeführt (Platzhalter)' })
})

// POST /api/server/stop
router.post('/stop', async (req, res) => {
  res.json({ message: 'Stopp ausgeführt (Platzhalter)' })
})

// POST /api/server/suspend
router.post('/suspend', async (req, res) => {
  res.json({ message: 'Suspend ausgeführt (Platzhalter)' })
})

// POST /api/server/export
router.post('/export', async (req, res) => {
  res.json({ message: 'Export gestartet (Platzhalter)' })
})

// POST /api/server/import
router.post('/import', async (req, res) => {
  res.json({ message: 'Import ausgeführt (Platzhalter)' })
})

// POST /api/server/upgrade
router.post('/upgrade', async (req, res) => {
  res.json({ message: 'Upgrade durchgeführt (Platzhalter)' })
})

// POST /api/server/downgrade
router.post('/downgrade', async (req, res) => {
  res.json({ message: 'Downgrade durchgeführt (Platzhalter)' })
})

// POST /api/server/autorenew
router.post('/autorenew', async (req, res) => {
  res.json({ message: 'Autorenew geändert (Platzhalter)' })
})

module.exports = router
