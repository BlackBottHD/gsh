const express = require('express')
const router = express.Router()
const db = require('../../lib/db')
const jwt = require('jsonwebtoken')
const axios = require('axios')
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

// 🧠 Caching
let cachedEggs = []
let lastEggFetch = 0
const EGG_CACHE_DURATION_MS = 30 * 60 * 1000

const fetchPteroEggs = async () => {
  const now = Date.now()
  if (cachedEggs.length > 0 && now - lastEggFetch < EGG_CACHE_DURATION_MS) {
    return cachedEggs
  }

  if (!process.env.PTERO_API_URL || !process.env.PTERO_API_KEY) {
    throw new Error('Pterodactyl-Konfiguration fehlt')
  }

  const nestsRes = await axios.get(`${process.env.PTERO_API_URL}/nests`, {
    headers: {
      Authorization: `Bearer ${process.env.PTERO_API_KEY}`,
      Accept: 'application/json',
    },
  })

  const eggs = []

  for (const nest of nestsRes.data.data) {
    const nestId = nest.attributes.id

    const eggRes = await axios.get(`${process.env.PTERO_API_URL}/nests/${nestId}/eggs`, {
      headers: {
        Authorization: `Bearer ${process.env.PTERO_API_KEY}`,
        Accept: 'application/json',
      },
    })

    for (const egg of eggRes.data.data) {
      eggs.push({
        id: egg.attributes.id,
        name: egg.attributes.name,
        description: egg.attributes.description,
        docker_image: egg.attributes.docker_image,
        nest: nest.attributes.name,
        nest_id: nestId,
      })
    }
  }

  cachedEggs = eggs
  lastEggFetch = now
  return eggs
}

// 📌 GET /api/admin/eggs
router.get('/',
  requirePermission('admin.eggs.view'),
  async (req, res) => {
    try {
      const [rows] = await db.pool.query(`
        SELECT e.id, e.game_id, e.variant_id, e.egg_id, gv.variant_name
        FROM egg_map e
        LEFT JOIN game_variants gv ON e.variant_id = gv.id
        ORDER BY e.game_id ASC
      `)
      const eggs = await fetchPteroEggs()
      res.json({ map: rows, eggs })
    } catch (err) {
      console.error('[EGG GET]', err?.response?.data || err.message || err)
      res.status(500).json({ message: 'Fehler beim Abrufen der Eggs' })
    }
  }
)

// 📌 POST /api/admin/eggs
router.post('/',
  requirePermission('admin.eggs.create'),
  async (req, res) => {
    const { game_id, variant_id, egg_id } = req.body
    if (!game_id || !egg_id) {
      return res.status(400).json({ message: 'game_id und egg_id erforderlich' })
    }

    try {
      await db.pool.query(
        'INSERT INTO egg_map (game_id, variant_id, egg_id, created_at) VALUES (?, ?, ?, NOW())',
        [game_id, variant_id || null, egg_id]
      )
      res.status(201).json({ message: 'Zuordnung gespeichert' })
    } catch (err) {
      console.error('[EGG POST]', err)
      res.status(500).json({ message: 'Fehler beim Speichern' })
    }
  }
)

// 📌 DELETE /api/admin/eggs/:id
router.delete('/:id',
  requirePermission('admin.eggs.delete'),
  async (req, res) => {
    try {
      await db.pool.query('DELETE FROM egg_map WHERE id = ?', [req.params.id])
      res.json({ message: 'Zuordnung gelöscht' })
    } catch (err) {
      console.error('[EGG DELETE]', err)
      res.status(500).json({ message: 'Fehler beim Löschen' })
    }
  }
)

// 📌 PATCH /api/admin/eggs/:id
router.patch('/:id',
  requirePermission('admin.eggs.edit'),
  async (req, res) => {
    const { egg_id } = req.body
    if (!egg_id) {
      return res.status(400).json({ message: 'egg_id fehlt' })
    }

    try {
      await db.pool.query(
        'UPDATE egg_map SET egg_id = ? WHERE id = ?',
        [egg_id, req.params.id]
      )
      res.json({ message: 'Zuordnung aktualisiert' })
    } catch (err) {
      console.error('[EGG PATCH]', err)
      res.status(500).json({ message: 'Fehler beim Aktualisieren' })
    }
  }
)

module.exports = router
