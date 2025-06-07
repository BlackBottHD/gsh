const express = require('express')
const router = express.Router()
const db = require('../../lib/db')
const jwt = require('jsonwebtoken')
const { requirePermission } = require('../../lib/requirePermission')

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

// 🔎 Alle Rollen laden
router.get('/',
  requirePermission('admin.usermanagement.read.roles'),
  async (req, res) => {
    try {
      const [rollen] = await db.pool.query('SELECT * FROM rollen')
      res.json(rollen)
    } catch (err) {
      console.error('[ADMIN ROLLEN]', err)
      res.status(500).json({ message: 'Fehler beim Laden der Rollen' })
    }
  }
)

// ➕ Rolle anlegen
router.post('/',
  requirePermission('admin.usermanagement.create.role'),
  async (req, res) => {
    const { name, parent } = req.body
    if (!name) return res.status(400).json({ message: 'Name fehlt' })

    try {
      await db.pool.query('INSERT INTO rollen (name, parrent) VALUES (?, ?)', [name, parent || null])
      res.status(201).json({ message: 'Rolle erstellt' })
    } catch (err) {
      console.error('[ROLLEN POST]', err)
      res.status(500).json({ message: 'Fehler beim Erstellen der Rolle' })
    }
  }
)

// ✏️ Rolle bearbeiten
router.patch('/:id',
  requirePermission('admin.usermanagement.edit.role'),
  async (req, res) => {
    const { name, parent } = req.body
    try {
      await db.pool.query('UPDATE rollen SET name = ?, parrent = ? WHERE id = ?', [name, parent || null, req.params.id])
      res.json({ message: 'Rolle aktualisiert' })
    } catch (err) {
      console.error('[ROLLEN PATCH]', err)
      res.status(500).json({ message: 'Fehler beim Bearbeiten' })
    }
  }
)

// 🗑️ Rolle löschen
router.delete('/:id',
  requirePermission('admin.usermanagement.delete.role'),
  async (req, res) => {
    try {
      await db.pool.query('DELETE FROM rollen WHERE id = ?', [req.params.id])
      res.json({ message: 'Rolle gelöscht' })
    } catch (err) {
      console.error('[ROLLEN DELETE]', err)
      res.status(500).json({ message: 'Fehler beim Löschen' })
    }
  }
)

module.exports = router
