require('dotenv').config()
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

router.get('/users', requirePermission('admin.dashboard.stats.users'), async (req, res) => {
  res.json({
    stats: [{
      title: '👤 Nutzerstatistiken (DEMO-DATEN)',
      items: [
        { label: 'Neue Nutzer (30 Tage)', value: 42 },
        { label: 'Aktive Nutzer', value: 87 },
        { label: 'Inaktive Nutzer', value: 33 },
        { label: 'Registrierte Nutzer', value: 120 }
      ]
    }]
  })
})

router.get('/servers', requirePermission('admin.dashboard.stats.servers'), async (req, res) => {
  try {
    const rows = await db.query(`
      SELECT
        SUM(servers_total) AS total,
        SUM(servers_running) AS running,
        SUM(servers_suspended) AS suspended
      FROM nodes_resources
    `)

    const r = rows[0] || {}
    const online = r.running ?? 0
    const suspended = r.suspended ?? 0
    const total = r.total ?? 0
    const offline = total - online - suspended

    res.json({
      stats: [{
        title: '🖥️ Serverstatistiken',
        items: [
          { label: 'Erstellte Server', value: total },
          { label: 'Online', value: online },
          { label: 'Offline', value: offline },
          { label: 'Suspendiert', value: suspended }
        ]
      }]
    })
  } catch (err) {
    console.error('[STATS SERVERS]', err)
    res.status(500).json({ error: 'Fehler beim Laden der Serverstatistiken' })
  }
})

router.get('/resources', requirePermission('admin.dashboard.stats.resources'), async (req, res) => {
  const rows = await db.query(`
    SELECT 
      SUM(max_ram) as ram_max,
      SUM(used_ram) as ram_used,
      SUM(max_cpu) as cpu_max,
      SUM(used_cpu) as cpu_used,
      SUM(max_disk) as disk_max,
      SUM(used_disk) as disk_used,
      COUNT(*) as node_count
    FROM nodes_resources
  `)
  const r = rows[0] || {}

  const formatStorage = (val) => {
    const tb = val / 1024 / 1024
    if (tb >= 1) return `${tb.toFixed(2)} TB`
    return `${(val / 1024).toFixed(1)} GB`
  }

  res.json({
    stats: [{
      title: '🧠 Ressourcen',
      items: [
        { label: 'RAM (vergeben)', value: `${(r.ram_used ? (r.ram_used / 1024).toFixed(1) : 0)} GB` },
        { label: 'RAM (gesamt)', value: `${(r.ram_max ? (r.ram_max / 1024).toFixed(1) : 0)} GB` },
        { label: 'CPU (vergeben)', value: `${r.cpu_used ?? 0} Cores` },
        { label: 'CPU (gesamt)', value: `${r.cpu_max ?? 0} Cores` },
        { label: 'Speicher (vergeben)', value: formatStorage(r.disk_used ?? 0) },
        { label: 'Speicher (gesamt)', value: formatStorage(r.disk_max ?? 0) },
        { label: 'Nodes', value: r.node_count ?? 0 }
      ]
    }]
  })
})

router.get('/tickets', requirePermission('admin.dashboard.stats.tickets'), async (req, res) => {
  res.json({
    stats: [{
      title: '📮 Tickets (DEMO-DATEN)',
      items: [
        { label: 'Neu', value: 4 },
        { label: 'Offen', value: 8 },
        { label: 'Warte auf Antwort', value: 2 },
        { label: 'Geschlossen', value: 19 },
        { label: 'Zurückgestellt', value: 1 }
      ]
    }]
  })
})

router.get('/games', requirePermission('admin.dashboard.stats.games'), async (req, res) => {
  res.json({
    stats: [{
      title: '🎮 Spiele (Rating) (DEMO-DATEN)',
      items: [
        { label: 'Minecraft', value: '4.7 ★' },
        { label: 'Rust', value: '4.3 ★' },
        { label: 'ARK', value: '3.9 ★' }
      ]
    }]
  })
})

router.get('/payments', requirePermission('admin.dashboard.stats.payments'), async (req, res) => {
  res.json({
    stats: [{
      title: '💳 Zahlungen (DEMO-DATEN)',
      items: [
        { label: 'Gesamtumsatz', value: '2.351,42 €' },
        { label: 'Monatlich', value: '812,00 €' },
        { label: 'Abos aktiv', value: 27 }
      ]
    }]
  })
})

module.exports = router
