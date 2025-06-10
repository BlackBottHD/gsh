const express = require('express')
const router = express.Router()
const db = require('../lib/db')

// GET /api/pakete – Pakete samt Spiele+Varianten+Excludes ausliefern
router.get('/', async (req, res) => {
  try {
    console.log('[API /pakete] Lade Daten …')

    const [pakete = []] = await db.query('SELECT * FROM pakete WHERE archived = 0 ORDER BY sort ASC')
    const [maps = []] = await db.query('SELECT * FROM game_paket_map')
    const [games = []] = await db.query('SELECT * FROM games')
    const [variants = []] = await db.query('SELECT * FROM game_variants')
    const [excludes = []] = await db.query('SELECT * FROM game_paket_exclude')

    console.log(`[API /pakete] ${pakete.length} Pakete geladen`)
    console.log(`[API /pakete] ${games.length} Spiele geladen`)
    console.log(`[API /pakete] ${variants.length} Varianten geladen`)
    console.log(`[API /pakete] ${excludes.length} Ausschlüsse geladen`)
    console.log('[DEBUG] Beispiel exclude:', excludes?.[0])

    // Spiele-Objekt vorbereiten
    const gamesMap = {}
    for (const game of games) {
      gamesMap[game.game_id] = {
        id: game.game_id,
        name: game.name,
        variants: []
      }
    }

    // Varianten inkl. Excludes zuordnen
    for (const variant of variants) {
      const excluded = excludes
        .filter(ex => String(ex.variant_id) === String(variant.id))
        .map(ex => ex.paket_id)

      console.debug(`[VARIANT] ID ${variant.id} (${variant.variant_name}) → Excludes:`, excluded)

      if (gamesMap[variant.game_id]) {
        gamesMap[variant.game_id].variants.push({
          id: variant.id,
          variant_name: variant.variant_name,
          version: variant.version,
          excluded_pakete: excluded
        })
      }
    }

    // Spiele pro Paket zusammenstellen
    const mapByPaket = {}
    for (const row of maps) {
      if (!mapByPaket[row.paket_id]) mapByPaket[row.paket_id] = []

      const gameObj = gamesMap[row.game_id]
      if (gameObj) {
        // Deep Clone pro Paket, damit Varianten pro Paket angepasst bleiben
        const cloned = JSON.parse(JSON.stringify(gameObj))
        mapByPaket[row.paket_id].push(cloned)
      }
    }

    // Endgültiges Paket-Objekt
    const result = pakete.map(paket => {
      const priceCoinDay = paket.price_coins ? Math.ceil(paket.price_coins / 30) : 0
      const games = mapByPaket[paket.id] || []

      console.log(`[PAKET] ${paket.id} enthält ${games.length} Spiele`)

      return {
        id: paket.id,
        label: paket.label,
        ram: paket.ram,
        disk: paket.disk,
        backup: paket.backup,
        tables: paket.tables,
        price_dynamic: paket.price_dynamic === 1,
        priceCoinDay,
        games
      }
    })

    console.log('[API /pakete] Daten erfolgreich aufgebaut')
    res.json(result)
  } catch (err) {
    console.error('[API /pakete] Fehler beim Laden:', err)
    res.status(500).json({ error: 'Fehler beim Laden der Pakete' })
  }
})

module.exports = router
