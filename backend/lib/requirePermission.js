const db = require('./db')

async function getUserPermissions(userId) {

  // Benutzer-Permissions
  const userPermRows = await db.query(
    'SELECT perms FROM permissions_user WHERE user_id = ?',
    [userId]
  )

  // Rollen-Zuordnung
  const rollenRows = await db.query(
    'SELECT rollen_id FROM user_rollen_link WHERE user_id = ?',
    [userId]
  )

  const rollenIds = rollenRows.map(r => r.rollen_id)

  // Rollen-Permissions
  let rollenPermRows = []
  if (rollenIds.length > 0) {
    const placeholders = rollenIds.map(() => '?').join(',')
    rollenPermRows = await db.query(
      `SELECT perms FROM permissions_rolle WHERE rollen_id IN (${placeholders})`,
      rollenIds
    )
  } else {
    console.debug('[PERMS] Keine Rollen vorhanden → keine rollenbasierten Berechtigungen geladen')
  }

  // Zusammenführen
  const userPerms = userPermRows.map(r => r.perms)
  const rollenPerms = rollenPermRows.map(r => r.perms)

  const allPerms = [...userPerms, ...rollenPerms]

  // In Objekt umwandeln
  const permObj = {}
  for (const p of allPerms) {
    if (p) permObj[p] = true
  }

  return permObj
}

function requirePermission(permission) {
  return async (req, res, next) => {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'Nicht eingeloggt' })

    try {
      const perms = await getUserPermissions(userId)
      

      if (!perms[permission]) {
        return res.status(403).json({ message: 'Keine Berechtigung' })
      }

      next()
    } catch (err) {
      console.error('[PERMISSION CHECK]', err)
      res.status(500).json({ message: 'Berechtigungsprüfung fehlgeschlagen' })
    }
  }
}

function requireAnyPermission(permissions) {
  return async (req, res, next) => {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'Nicht eingeloggt' })

    try {
      const perms = await getUserPermissions(userId)

      const hasPermission = permissions.some(p => perms[p])
      if (!hasPermission) {
        return res.status(403).json({ message: 'Keine ausreichenden Berechtigungen' })
      }

      next()
    } catch (err) {
      console.error('[PERMISSION ANY CHECK]', err)
      res.status(500).json({ message: 'Berechtigungsprüfung fehlgeschlagen' })
    }
  }
}

module.exports = {
  requirePermission,
  requireAnyPermission,
  getUserPermissions
}
