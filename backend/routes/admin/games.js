const express = require('express')
const router = express.Router()
const db = require('../../lib/db')
const jwt = require('jsonwebtoken')
const { requirePermission } = require('../../lib/requirePermission')

// Tokenprüfung
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

// GET /api/admin/games – Alle Spiele laden
router.get('/',
  requirePermission('admin.games.view'),
  async (req, res) => {
    try {
      const conn = await db.pool.getConnection()
      const [games] = await conn.query('SELECT * FROM games')
      const [variants] = await conn.query('SELECT * FROM game_variants')
      const [excludes] = await conn.query('SELECT * FROM game_paket_exclude')
      const [pakete] = await conn.query('SELECT * FROM game_paket_map')
      conn.release()

      const data = games.map(game => {
        const v = variants
          .filter(va => va.game_id === game.game_id)
          .map(va => ({
            id: va.id,
            variant_name: va.variant_name,
            version: va.version,
            excluded_pakete: excludes
              .filter(ex => String(ex.variant_id) === String(va.id))
              .map(ex => ex.paket_id)

          }))

        const p = pakete
          .filter(pm => pm.game_id === game.game_id)
          .map(pm => pm.paket_id)

        return {
          game_id: game.game_id,
          name: game.name,
          variants: v,
          pakete: p
        }
      })

      res.json(data)
    } catch (err) {
      console.error('[GAMES GET]', err)
      res.status(500).json({ message: 'Fehler beim Laden' })
    }
  }
)

// POST /api/admin/games – Spiel speichern
router.post('/',
  requirePermission('admin.games.edit'),
  async (req, res) => {
    const { game_id, name, variants, pakete } = req.body

    if (!game_id || !name || !Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({ message: 'Ungültige Daten' })
    }

    let conn
    try {
      conn = await db.pool.getConnection()
      await conn.beginTransaction()

      await conn.query(
        'INSERT INTO games (game_id, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = ?',
        [game_id, name, name]
      )

      await conn.query('DELETE FROM game_variants WHERE game_id = ?', [game_id])
      await conn.query('DELETE FROM game_paket_map WHERE game_id = ?', [game_id])
      await conn.query(`
        DELETE FROM game_paket_exclude
        WHERE variant_id IN (SELECT id FROM game_variants WHERE game_id = ?)
      `, [game_id])

      for (const v of variants) {
        const { variant_name, version, excluded_pakete = [] } = v
        if (!variant_name || !version) continue

        const [result] = await conn.query(
          'INSERT INTO game_variants (game_id, variant_name, version) VALUES (?, ?, ?)',
          [game_id, variant_name, version]
        )
        const variant_id = result.insertId

        for (const paket_id of excluded_pakete) {
          await conn.query(
            'INSERT INTO game_paket_exclude (variant_id, paket_id) VALUES (?, ?)',
            [variant_id, paket_id]
          )
        }
      }

      for (const paket_id of pakete || []) {
        await conn.query(
          'INSERT INTO game_paket_map (game_id, paket_id) VALUES (?, ?)',
          [game_id, paket_id]
        )
      }

      await conn.commit()
      res.status(201).json({ message: 'Spiel gespeichert' })
    } catch (err) {
      if (conn) await conn.rollback()
      console.error('[GAMES POST]', err)
      res.status(500).json({ message: 'Fehler beim Speichern' })
    } finally {
      if (conn) conn.release()
    }
  }
)

// DELETE /api/admin/games/:id – Spiel löschen
router.delete('/:id',
  requirePermission('admin.games.delete'),
  async (req, res) => {
    const gameId = req.params.id
    let conn
    try {
      conn = await db.pool.getConnection()
      await conn.beginTransaction()
      await conn.query(`
        DELETE FROM game_paket_exclude
        WHERE variant_id IN (SELECT id FROM game_variants WHERE game_id = ?)
      `, [gameId])
      await conn.query('DELETE FROM game_variants WHERE game_id = ?', [gameId])
      await conn.query('DELETE FROM game_paket_map WHERE game_id = ?', [gameId])
      await conn.query('DELETE FROM games WHERE game_id = ?', [gameId])
      await conn.commit()
      res.status(200).json({ message: 'Spiel gelöscht' })
    } catch (err) {
      if (conn) await conn.rollback()
      console.error('[GAMES DELETE]', err)
      res.status(500).json({ message: 'Fehler beim Löschen' })
    } finally {
      if (conn) conn.release()
    }
  }
)

module.exports = router
