const crypto = require('crypto')
const db = require('./db')

async function generateUniqueResetToken() {
  let token
  let exists = true

  while (exists) {
    token = crypto.randomBytes(32).toString('hex')
    const result = await db.query(
      'SELECT id FROM users WHERE password_reset_token = ? AND password_reset_expires > NOW()',
      [token]
    )

    const rows = result?.[0] || []
    exists = rows.length > 0
  }

  const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 Minuten
  return { token, expires }
}

module.exports = generateUniqueResetToken
