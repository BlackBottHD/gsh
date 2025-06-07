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

// 📄 Rollen-Permissions abrufen
router.get('/:rolleId',
  requirePermission('admin.usermanagement.read.roles.perms'),
  async (req, res) => {
    const rolleId = req.params.rolleId
    try {
      const [allPerms] = await db.pool.query('SELECT * FROM permissions_master ORDER BY name ASC')
      const [rollePerms] = await db.pool.query('SELECT perms FROM permissions_rolle WHERE rollen_id = ?', [rolleId])

      const activePerms = rollePerms.map(rp => rp.perms)

      const withStatus = allPerms.map(p => ({
        id: p.id,
        name: p.name,
        beschreibung: p.beschreibung,
        type: p.type,
        active: activePerms.includes(p.name)
      }))

      res.json(withStatus)
    } catch (err) {
      console.error('[ROLLE PERMS GET]', err)
      res.status(500).json({ message: 'Fehler beim Laden der Berechtigungen' })
    }
  }
)

// ✅ Rollen-Permissions ändern
router.patch('/:rolleId',
  requirePermission('admin.usermanagement.edit.role.perms'),
  async (req, res) => {
    const rolleId = req.params.rolleId
    const { name, active } = req.body
    if (!name) return res.status(400).json({ message: 'name erforderlich' })

    try {
      if (active) {
        const [exists] = await db.pool.query(
          'SELECT * FROM permissions_rolle WHERE rollen_id = ? AND perms = ?',
          [rolleId, name]
        )
        if (exists.length === 0) {
          await db.pool.query(
            'INSERT INTO permissions_rolle (rollen_id, perms) VALUES (?, ?)',
            [rolleId, name]
          )
        }
      } else {
        await db.pool.query(
          'DELETE FROM permissions_rolle WHERE rollen_id = ? AND perms = ?',
          [rolleId, name]
        )
      }

      res.json({ message: 'Aktualisiert' })
    } catch (err) {
      console.error('[ROLLE PERMS PATCH]', err)
      res.status(500).json({ message: 'Fehler beim Aktualisieren' })
    }
  }
)

module.exports = router
