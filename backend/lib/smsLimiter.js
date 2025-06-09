const db = require('./db')

const WHITELIST = ['+491702682218']  // Nummern ohne SMS-Limit

/**
 * Prüft, ob eine SMS an die Telefonnummer gesendet werden darf.
 */
async function canSendSMS(phone) {
  console.debug('[SMS LIMIT] Prüfung für Nummer:', phone)

  if (WHITELIST.includes(phone)) {
    console.debug('[SMS LIMIT] Whitelist aktiv – kein Limit für:', phone)
    return true
  }

  const rows = await db.query(
    'SELECT sms_last_sent, sms_daily_count FROM sms_limits WHERE phone = ?',
    [phone]
  )

  const now = new Date()
  const midnight = new Date()
  midnight.setHours(0, 0, 0, 0)

  const last = rows?.[0]?.sms_last_sent ? new Date(rows[0].sms_last_sent) : null
  const countToday = last && last >= midnight ? rows[0].sms_daily_count : 0

  console.debug('[SMS LIMIT] Letzter Versand:', last)
  console.debug('[SMS LIMIT] SMS heute gesendet:', countToday)

  if (countToday >= 5) {
    console.warn('[SMS LIMIT] Tageslimit erreicht für:', phone)
    return false
  }

  if (last && now - last < 30 * 60 * 1000) {
    const diff = Math.round((now - last) / 60000)
    console.warn(`[SMS LIMIT] 30 Minuten Sperre aktiv – nur ${diff} Min. vergangen`)
    return false
  }

  console.debug('[SMS LIMIT] SMS-Versand erlaubt für:', phone)
  return true
}

/**
 * Registriert den Versand einer SMS für eine Telefonnummer.
 */
async function registerSMS(phone) {
  console.debug('[SMS LIMIT] Registrierung für Nummer:', phone)

  if (WHITELIST.includes(phone)) {
    console.debug('[SMS LIMIT] Whitelist – Registrierung übersprungen für:', phone)
    return
  }

  const now = new Date()
  const midnight = new Date()
  midnight.setHours(0, 0, 0, 0)

  try {
    const rows = await db.query(
      'SELECT sms_last_sent, sms_daily_count FROM sms_limits WHERE phone = ?',
      [phone]
    )

    console.debug('[SMS LIMIT] Vorhandene Zeilen:', rows.length, rows)

    if (rows.length > 0) {
      const last = rows[0].sms_last_sent ? new Date(rows[0].sms_last_sent) : null
      const count = rows[0].sms_daily_count || 0
      const isToday = last && last >= midnight
      const newCount = isToday ? count + 1 : 1

      console.debug(`[SMS LIMIT] Update: now=${now.toISOString()}, newCount=${newCount}`)

      const result = await db.query(
        `UPDATE sms_limits
         SET sms_last_sent = ?, sms_daily_count = ?
         WHERE phone = ?`,
        [now, newCount, phone]
      )

      console.debug('[SMS LIMIT] UPDATE Ergebnis:', result)
    } else {
      console.debug('[SMS LIMIT] Kein Eintrag vorhanden – INSERT vorbereiten')
      console.debug(`[SMS LIMIT] INSERT Werte: phone=${phone}, now=${now.toISOString()}`)

      const result = await db.query(
        `INSERT INTO sms_limits (phone, sms_last_sent, sms_daily_count)
         VALUES (?, ?, 1)`,
        [phone, now]
      )

      console.debug('[SMS LIMIT] INSERT erfolgreich:', result)
    }
  } catch (err) {
    console.error('[SMS LIMIT] Fehler bei DB-Zugriff:', err.message)
    throw err
  }
}

module.exports = { canSendSMS, registerSMS }
