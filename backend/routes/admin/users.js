const express = require('express')
const router = express.Router()
const db = require('../../lib/db')
const generateUniqueResetToken = require('../../lib/generateUniqueResetToken')
const jwt = require('jsonwebtoken')
const { requirePermission, requireAnyPermission } = require('../../lib/requirePermission')
const sendMail = require('../../lib/sendMail')

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

// 🔎 Alle Benutzer laden mit Rollennamen als Komma-Liste
router.get('/', requirePermission('admin.usermanagement.read.users'), async (req, res) => {
  try {
    const [users] = await db.pool.query(`
      SELECT u.*, GROUP_CONCAT(r.name) AS rollen
      FROM users u
      LEFT JOIN user_rollen_link l ON u.id = l.user_id
      LEFT JOIN rollen r ON l.rollen_id = r.id
      GROUP BY u.id
    `)
    res.json(users)
  } catch (err) {
    console.error('[ADMIN USERS]', err)
    res.status(500).json({ message: 'Fehler beim Laden der Benutzer' })
  }
})

// ➕ Benutzer anlegen
router.post('/new', requirePermission('admin.usermanagement.create.user'), async (req, res) => {
  const {
    username,
    email,
    password_hash,
    status = 'active',
    mfa_active = false,
    rollen = []
  } = req.body

  if (!username || !email) {
    return res.status(400).json({ message: 'Fehlende Felder' })
  }

  const conn = await db.pool.getConnection()
  try {
    await conn.beginTransaction()

    const { token: resetToken, expires: resetExpires } = await generateUniqueResetToken()

    const [result] = await conn.query(
      'INSERT INTO users (username, email, status, mfa_active, password_reset_token, password_reset_expires) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, status, mfa_active ? 1 : 0, resetToken, resetExpires]
    )

    const userId = result.insertId
    console.log('[USER CREATE]', `Neuer Benutzer ${username} (${userId}) angelegt`)

    for (const rid of rollen) {
      await conn.query('INSERT INTO user_rollen_link (user_id, rollen_id) VALUES (?, ?)', [userId, rid])
    }

    await conn.commit()

    const resetLink = `${process.env.APP_URL || 'http://10.1.0.122:3000'}/login/passwort-setzen?token=${resetToken}`

    await sendMail({
      userId,
      to: email,
      subject: 'Willkommen bei HGDEVS – Zugangsdaten',
      template: 'welcome',
      replacements: {
        name: username,
        resetLink
      }
    })

    res.status(201).json({ message: 'Benutzer angelegt', id: userId })
  } catch (err) {
    await conn.rollback()
    console.error('[USER CREATE]', err)
    res.status(500).json({ message: 'Fehler beim Anlegen' })
  } finally {
    conn.release()
  }
})

// ✏️ Benutzer bearbeiten (inkl. Rollen, Status, MFA)
router.patch('/:id', requirePermission('admin.usermanagement.edit.user'), async (req, res) => {
  const id = req.params.id
  const { username, email, status, mfa_active, rollen } = req.body
  const conn = await db.pool.getConnection()

  try {
    await conn.beginTransaction()

    await conn.query(
      'UPDATE users SET username = ?, email = ?, status = ?, mfa_active = ? WHERE id = ?',
      [username, email, status, mfa_active ? 1 : 0, id]
    )

    if (Array.isArray(rollen)) {
      await conn.query('DELETE FROM user_rollen_link WHERE user_id = ?', [id])
      for (const rid of rollen) {
        await conn.query('INSERT INTO user_rollen_link (user_id, rollen_id) VALUES (?, ?)', [id, rid])
      }
    }

    await conn.commit()
    res.json({ message: 'Benutzer aktualisiert' })
  } catch (err) {
    await conn.rollback()
    console.error('[USER PATCH]', err)
    res.status(500).json({ message: 'Fehler beim Aktualisieren' })
  } finally {
    conn.release()
  }
})

// 🗑️ Benutzer löschen (inkl. Rollenbeziehungen)
router.delete('/:id', requirePermission('admin.usermanagement.delete.user'), async (req, res) => {
  const id = req.params.id
  const conn = await db.pool.getConnection()
  try {
    await conn.beginTransaction()
    await conn.query('DELETE FROM user_rollen_link WHERE user_id = ?', [id])
    await conn.query('DELETE FROM users WHERE id = ?', [id])
    await conn.commit()
    res.json({ message: 'Benutzer gelöscht' })
  } catch (err) {
    await conn.rollback()
    console.error('[USER DELETE]', err)
    res.status(500).json({ message: 'Fehler beim Löschen' })
  } finally {
    conn.release()
  }
})

// ➕ Rolle zu Benutzer hinzufügen
router.post('/:id/rollen', requirePermission('admin.usermanagement.edit.user'), async (req, res) => {
  const userId = req.params.id
  const { rollen_id } = req.body

  if (!rollen_id) {
    return res.status(400).json({ message: 'rollen_id erforderlich' })
  }

  try {
    // Duplikate verhindern
    const [exists] = await db.pool.query(
      'SELECT * FROM user_rollen_link WHERE user_id = ? AND rollen_id = ?',
      [userId, rollen_id]
    )

    if (exists.length === 0) {
      await db.pool.query(
        'INSERT INTO user_rollen_link (user_id, rollen_id) VALUES (?, ?)',
        [userId, rollen_id]
      )
    }

    res.json({ message: 'Rolle hinzugefügt' })
  } catch (err) {
    console.error('[USER ROLLEN POST]', err)
    res.status(500).json({ message: 'Fehler beim Hinzufügen' })
  }
})

// 🗑️ Rolle vom Benutzer entfernen
router.delete('/:id/rollen', requirePermission('admin.usermanagement.edit.user'), async (req, res) => {
  const userId = req.params.id
  const { rollen_id } = req.body

  if (!rollen_id) {
    return res.status(400).json({ message: 'rollen_id erforderlich' })
  }

  try {
    await db.pool.query(
      'DELETE FROM user_rollen_link WHERE user_id = ? AND rollen_id = ?',
      [userId, rollen_id]
    )
    res.json({ message: 'Rolle entfernt' })
  } catch (err) {
    console.error('[USER ROLLEN DELETE]', err)
    res.status(500).json({ message: 'Fehler beim Entfernen' })
  }
})

// 📄 Einzelnen Benutzer abrufen inkl. Rollen
router.get('/:id', requireAnyPermission([
  'admin.usermanagement.read.users',
  'admin.usermanagement.read.users.perms'
]), async (req, res) => {
  const userId = req.params.id
  try {
    // Benutzerdaten
    const [[user]] = await db.pool.query('SELECT * FROM users WHERE id = ?', [userId])
    if (!user) return res.status(404).json({ message: 'Benutzer nicht gefunden' })

    // Rollen
    const [rollen] = await db.pool.query(`
      SELECT r.id, r.name
      FROM user_rollen_link l
      JOIN rollen r ON l.rollen_id = r.id
      WHERE l.user_id = ?
    `, [userId])

    // Alle möglichen Berechtigungen
    const [allPermissions] = await db.pool.query(`
      SELECT id, name, beschreibung, type
      FROM permissions_master
      ORDER BY name
    `)

    // Aktive Benutzerberechtigungen
    const [userPerms] = await db.pool.query(`
      SELECT perms FROM permissions_user WHERE user_id = ?
    `, [userId])

    const userPermNames = new Set(userPerms.map(p => p.perms))

    // Zusammenführen mit aktiv-Status
    const permissions = allPermissions.map(p => ({
      ...p,
      active: userPermNames.has(p.name)
    }))

    res.json({
      ...user,
      rollen,
      permissions
    })
  } catch (err) {
    console.error('[USER GET]', err)
    res.status(500).json({ message: 'Fehler beim Abrufen des Benutzers' })
  }
})

// ✅ Permission für Benutzer setzen oder entfernen
router.patch('/:id/perms', requirePermission('admin.usermanagement.edit.user.perms'), async (req, res) => {
  const userId = req.params.id
  const { perms, active } = req.body

  if (!perms || typeof active !== 'boolean') {
    return res.status(400).json({ message: 'perms und active (boolean) erforderlich' })
  }

  try {
    if (active) {
      // Hinzufügen
      const [exists] = await db.pool.query(
        'SELECT * FROM permissions_user WHERE user_id = ? AND perms = ?',
        [userId, perms]
      )

      if (exists.length === 0) {
        await db.pool.query(
          'INSERT INTO permissions_user (user_id, perms) VALUES (?, ?)',
          [userId, perms]
        )
      }

      res.json({ message: 'Permission hinzugefügt' })
    } else {
      // Entfernen
      await db.pool.query(
        'DELETE FROM permissions_user WHERE user_id = ? AND perms = ?',
        [userId, perms]
      )

      res.json({ message: 'Permission entfernt' })
    }
  } catch (err) {
    console.error('[USER PERMS PATCH]', err)
    res.status(500).json({ message: 'Fehler beim Setzen der Berechtigung' })
  }
})


module.exports = router
