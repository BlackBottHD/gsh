const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const { requireAnyPermission } = require('../../lib/requirePermission')

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

// 📊 Dashboard-Statistiken
router.get('/',
  requireAnyPermission([
    'admin.dashboard.stats.users',
    'admin.dashboard.stats.servers',
    'admin.dashboard.stats.resources',
    'admin.dashboard.stats.tickets',
    'admin.dashboard.stats.games',
    'admin.dashboard.stats.payments'
  ]),
  async (req, res) => {
    try {
      const data = []

      const addIfPermitted = (perm, block) => {
        if (req.user?.permissions?.includes(perm)) data.push(block)
      }

      addIfPermitted('admin.dashboard.stats.users', {
        title: '👤 Nutzerstatistiken',
        items: [
          { label: 'Neue Nutzer (30 Tage)', value: 42 },
          { label: 'Aktive Nutzer', value: 87 },
          { label: 'Inaktive Nutzer', value: 33 },
          { label: 'Registrierte Nutzer', value: 120 }
        ]
      })

      addIfPermitted('admin.dashboard.stats.servers', {
        title: '🖥️ Serverstatistiken',
        items: [
          { label: 'Erstellte Server', value: 45 },
          { label: 'Online', value: 28 },
          { label: 'Offline', value: 17 },
          { label: 'Backups', value: 96 },
          { label: 'Gesperrt', value: 3 }
        ]
      })

      addIfPermitted('admin.dashboard.stats.resources', {
        title: '🧠 Ressourcen',
        items: [
          { label: 'RAM (GB)', value: '256 GB' },
          { label: 'CPU (Cores)', value: '96 Cores' },
          { label: 'Speicher', value: '5.4 TB' },
          { label: 'Nodes', value: 4 },
          { label: 'Netzwerk', value: '1.2 Gbit/s' }
        ]
      })

      addIfPermitted('admin.dashboard.stats.tickets', {
        title: '📮 Tickets',
        items: [
          { label: 'Neu', value: 4 },
          { label: 'Offen', value: 8 },
          { label: 'Warte auf Antwort', value: 2 },
          { label: 'Geschlossen', value: 19 },
          { label: 'Zurückgestellt', value: 1 }
        ]
      })

      addIfPermitted('admin.dashboard.stats.games', {
        title: '🎮 Spiele (Rating)',
        items: [
          { label: 'Minecraft', value: '4.7 ★' },
          { label: 'Rust', value: '4.3 ★' },
          { label: 'ARK', value: '3.9 ★' }
        ]
      })

      addIfPermitted('admin.dashboard.stats.payments', {
        title: '💳 Zahlungen',
        items: [
          { label: 'Gesamtumsatz', value: '2.351,42 €' },
          { label: 'Monatlich', value: '812,00 €' },
          { label: 'Abos aktiv', value: 27 }
        ]
      })

      res.json({ stats: data })
    } catch (err) {
      console.error('[ADMIN STATS]', err)
      res.status(500).json({ message: 'Fehler beim Laden der Statistiken' })
    }
  }
)

module.exports = router
