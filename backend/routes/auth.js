const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../lib/db');
const jwt = require('jsonwebtoken');
const { getUserPermissions } = require('../lib/requirePermission');
const sendSMS = require('../lib/sendSMS')
const { canSendSMS, registerSMS } = require('../lib/smsLimiter')
const sendMail = require('../lib/sendMail')
const crypto = require('crypto')


const JWT_SECRET = process.env.JWT_SECRET || 'changemeplease';

// 📌 Registrierung
router.post('/register', async (req, res) => {
  const { username, email, phone } = req.body;
  console.debug('[REGISTER] Eingehende Daten:', { username, email, phone });

  if (!username || !email || !phone) {
    console.warn('[REGISTER] Fehlende Felder');
    return res.status(400).json({ message: 'Alle Felder sind erforderlich' });
  }

  try {
    const existing = await db.query(
      'SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1',
      [email, username]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: 'Benutzername oder E-Mail bereits vergeben' });
    }

    const { token: resetToken, expires: resetExpires } = await generateUniqueResetToken();

    const smsCode = Math.floor(100000 + Math.random() * 900000).toString();
    const smsExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 Minuten

    const result = await db.query(
      `INSERT INTO users 
        (username, email, phone, status, password_reset_token, password_reset_expires, SMS_token, SMS_token_expire) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, email, phone, 'pending', resetToken, resetExpires, smsCode, smsExpire]
    );

    const userId = result.insertId;

    const resetLink = `${process.env.APP_URL || 'http://10.1.0.122:3000'}/login/passwort-setzen?token=${resetToken}`;

    // ✉️ Mail
    await sendMail({
      userId,
      to: email,
      subject: 'Willkommen bei HGDEVS – Passwort festlegen',
      template: 'welcome',
      replacements: {
        name: username,
        resetLink
      }
    });

    // 📲 SMS
    await sendSMS(phone, `Dein HGDEVS Bestätigungscode: ${smsCode}`);

    console.log('[REGISTER] Registrierung abgeschlossen. Mail & SMS versendet.');
    res.status(201).json({ success: true, phone });
  } catch (err) {
    console.error('[REGISTER] Fehler:', err);
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});



// 📌 Login (mit Benutzername oder E-Mail)
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ message: 'Felder dürfen nicht leer sein' });
  }

  try {
    const users = await db.query(
      'SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1',
      [identifier, identifier]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Benutzer nicht gefunden' });
    }

    const user = users[0];
    console.debug('[LOGIN] Benutzer: ', user);

    if (user.status === 'pending') return res.status(403).json({ message: 'Konto noch nicht freigeschaltet' });
    if (user.status === 'inactive') return res.status(403).json({ message: 'Konto deaktiviert' });
    if (user.status === 'suspended') return res.status(403).json({ message: 'Konto gesperrt' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ message: 'Falsches Passwort' });

    await db.query('UPDATE users SET lastseen = NOW() WHERE id = ?', [user.id]);

    // 🔐 JWT erzeugen
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({ message: 'Login erfolgreich', token });
  } catch (err) {
    console.error('[LOGIN]', err);
    return res.status(500).json({ message: 'Interner Serverfehler' });
  }
});



// 📌 Middleware zum Token prüfen
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Nicht autorisiert' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token ungültig' });
  }
};


// 📌 Geschützte Route: Userinfo
router.get('/userinfo', verifyToken, async (req, res) => {
  try {
    const users = await db.query(
      'SELECT id, username, email, lastseen FROM users WHERE id = ?',
      [req.user.id]
    )
    const user = users[0]
    if (!user) return res.status(404).json({ message: 'Benutzer nicht gefunden' })

    const permObj = await getUserPermissions(user.id)
    const permissions = Object.keys(permObj)

    res.json({ ...user, permissions })
  } catch (err) {
    console.error('[USERINFO]', err)
    res.status(500).json({ message: 'Interner Serverfehler' })
  }
})

router.post('/sms', async (req, res) => {
  const { phone } = req.body

  if (!phone || !/^\+?[1-9]\d{7,15}$/.test(phone)) {
    return res.status(400).json({ message: 'Ungültige Telefonnummer' })
  }

  if (!canSendSMS(phone)) {
    return res.status(429).json({ message: 'SMS Limit erreicht. Bitte später versuchen.' })
  }

  const token = Math.floor(100000 + Math.random() * 900000).toString()
  const expire = new Date(Date.now() + 15 * 60 * 1000) // 15 Min gültig

  try {
    await sendSMS(phone, `Ihr HGDEVS Bestätigungscode: ${token}`)

    await db.query(`
      UPDATE users SET sms_token = ?, sms_token_expire = ?
      WHERE email = ? OR username = ?`,
      [token, expire, phone, phone]
    )

    res.json({ message: 'Verifizierungscode gesendet.' })
  } catch (err) {
    console.error('[SMS]', err.message)
    res.status(500).json({ message: 'Fehler beim Senden der SMS' })
  }
})

router.post('/verify', async (req, res) => {
  const { phone, code } = req.body

  if (!phone || !code) {
    return res.status(400).json({ message: 'Telefonnummer und Code sind erforderlich.' })
  }

  try {
    const [rows] = await db.pool.execute(
      'SELECT id, username, email, SMS_token, SMS_token_expire FROM users WHERE phone = ?',
      [phone]
    )

    if (!rows.length) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden.' })
    }

    const user = rows[0]

    if (!user.SMS_token || user.SMS_token !== code) {
      return res.status(401).json({ message: 'Ungültiger Code.' })
    }

    const expireDate = new Date(user.SMS_token_expire)
    if (expireDate < new Date()) {
      return res.status(410).json({ message: 'Code abgelaufen.' })
    }

    // Token gültig → SMS-Token löschen (optional)
    await db.pool.execute(
      `UPDATE users 
       SET SMS_token = NULL, SMS_token_expire = NULL 
       WHERE id = ?`,
      [user.id]
    )

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({ token })
  } catch (err) {
    console.error('[SMS VERIFY] Fehler:', err)
    res.status(500).json({ message: 'Serverfehler bei Verifizierung.' })
  }
})

router.post('/forgot-request', async (req, res) => {
  const { identifier } = req.body
  console.debug('[forgot-request] Eingehender Request:', identifier)

  if (!identifier) return res.status(400).json({ message: 'Fehlender Identifier' })

  try {
    const [rows] = await db.pool.query(
      'SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1',
      [identifier, identifier]
    )
    const user = rows[0]
    console.debug('[forgot-request] Benutzer gefunden:', user)

    if (!user) return res.status(404).json({ message: 'Benutzer nicht gefunden' })
    if (!user.phone) return res.status(400).json({ message: 'Keine Handynummer hinterlegt.' })

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expire = new Date(Date.now() + 15 * 60 * 1000)

    console.debug(`[forgot-request] Generierter Code: ${code}, gültig bis: ${expire.toISOString()}`)

    await db.pool.query(
      'UPDATE users SET SMS_token = ?, SMS_token_expire = ? WHERE id = ?',
      [code, expire, user.id]
    )

    console.debug('[forgot-request] Code gespeichert – SMS wird gesendet…')
    await sendSMS(user.phone, `HGDEVS Code: ${code}`)

    console.debug('[forgot-request] SMS versendet an:', user.phone)
    res.json({ success: true, phone: user.phone }) // ✅ Telefonnummer mit zurückgeben
  } catch (err) {
    console.error('[forgot-request] Fehler:', err)
    res.status(500).json({ message: 'Serverfehler' })
  }
})

async function generateUniqueResetToken() {
  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 15 * 60 * 1000)
  return { token, expires }
}

router.post('/forgot-verify', async (req, res) => {
  const { phone, code } = req.body
  console.debug('[forgot-verify] Eingehende Daten:', { phone, code })

  if (!phone || !code) return res.status(400).json({ message: 'Fehlende Daten' })

  try {
    const [rows] = await db.pool.query(
      'SELECT * FROM users WHERE phone = ? AND SMS_token = ? AND SMS_token_expire > NOW() LIMIT 1',
      [phone, code]
    )
    const user = rows[0]

    if (!user) return res.status(400).json({ message: 'Ungültiger oder abgelaufener Code' })

    const { token: resetToken, expires: resetExpires } = await generateUniqueResetToken()

    await db.pool.query(
      'UPDATE users SET password_reset_token = ?, password_reset_expires = ?, SMS_token = NULL, SMS_token_expire = NULL WHERE id = ?',
      [resetToken, resetExpires, user.id]
    )

    const resetLink = `${process.env.APP_URL || 'http://10.1.0.122:3000'}/login/passwort-setzen?token=${resetToken}`

    await sendMail({
      userId: user.id,
      to: user.email,
      subject: 'Passwort zurücksetzen – HGDEVS',
      template: 'reset-password',
      replacements: {
        name: user.username || user.email,
        resetLink
      }
    })

    console.debug('[forgot-verify] Reset-Link gesendet an:', user.email)
    res.json({ success: true })
  } catch (err) {
    console.error('[forgot-verify] Fehler:', err)
    res.status(500).json({ message: 'Fehler beim Verifizieren' })
  }
})

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  console.debug('[reset-password] Token:', token);

  if (!token || !password) {
    return res.status(400).json({ message: 'Token oder Passwort fehlt.' });
  }

  try {
    const [rows] = await db.pool.query(
      'SELECT * FROM users WHERE password_reset_token = ? LIMIT 1',
      [token]
    );
    const user = rows[0];
    if (!user) {
      console.warn('[reset-password] Ungültiger Token');
      return res.status(400).json({ message: 'Ungültiger oder abgelaufener Link.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    await db.pool.query(
      'UPDATE users SET password_hash = ?, password_reset_token = NULL WHERE id = ?',
      [password_hash, user.id]
    );

    console.log('[reset-password] Passwort zurückgesetzt für User ID:', user.id);
    await sendMail({
      userId: user.id,
      to: user.email,
      subject: 'Passwort geändert',
      template: 'changed-password',
      replacements: {
        name: user.username || user.email,
      }
    })
    res.json({ success: true });
  } catch (err) {
    console.error('[reset-password] Fehler:', err);
    res.status(500).json({ message: 'Serverfehler beim Zurücksetzen.' });
  }
});

// 📌 Registrierung: SMS erneut senden (mit Limit)
router.post('/register/resend-sms', async (req, res) => {
  const { phone } = req.body
  if (!phone || !/^\+?[1-9]\d{7,15}$/.test(phone)) {
    return res.status(400).json({ message: 'Ungültige Telefonnummer' })
  }

  try {
    // Nutzer muss existieren & pending sein
    const [users] = await db.pool.query(
      'SELECT id FROM users WHERE phone = ? AND status = "pending" LIMIT 1',
      [phone]
    )
    if (!users.length) {
      return res.status(404).json({ message: 'Kein Benutzer mit dieser Nummer (pending) gefunden' })
    }
    const userId = users[0].id

    // Hole sms_limits
    const [limits] = await db.pool.query(
      'SELECT sms_last_sent, sms_resend_count FROM sms_limits WHERE phone = ?',
      [phone]
    )

    let smsResendCount = 0
    let lastResend = null
    if (limits.length) {
      smsResendCount = limits[0].sms_resend_count || 0
      lastResend = limits[0].sms_last_sent ? new Date(limits[0].sms_last_sent) : null
    }

    // Begrenzung: max 3 Resends
    if (smsResendCount >= 3) {
      return res.status(429).json({ message: 'Maximale Anzahl an SMS-Wiederholungen erreicht.' })
    }

    // Begrenzung: min 2 Min Abstand
    if (lastResend) {
      const now = new Date()
      if (now - lastResend < 2 * 60 * 1000) {
        return res.status(429).json({ message: 'Du musst 2 Minuten warten, bevor du erneut eine SMS anfordern kannst.' })
      }
    }

    const smsCode = Math.floor(100000 + Math.random() * 900000).toString()
    const smsExpire = new Date(Date.now() + 15 * 60 * 1000)
    const now = new Date()

    // SMS schicken
    await sendSMS(phone, `Dein HGDEVS Bestätigungscode: ${smsCode}`)

    // SMS-Code im User speichern
    await db.pool.query(
      'UPDATE users SET SMS_token = ?, SMS_token_expire = ? WHERE id = ?',
      [smsCode, smsExpire, userId]
    )

    // sms_limits aktualisieren
    if (limits.length) {
      await db.pool.query(
        'UPDATE sms_limits SET sms_last_sent = ?, sms_resend_count = sms_resend_count + 1 WHERE phone = ?',
        [now, phone]
      )
    } else {
      await db.pool.query(
        'INSERT INTO sms_limits (phone, sms_last_sent, sms_daily_count, sms_resend_count) VALUES (?, ?, 0, 1)',
        [phone, now]
      )
    }

    res.json({ success: true, message: 'SMS erneut versendet.' })
  } catch (err) {
    console.error('[register/resend-sms] Fehler:', err)
    res.status(500).json({ message: 'Fehler beim erneuten Senden der SMS.' })
  }
})

// 📌 Passwort-Reset: SMS erneut senden (mit Limit)
router.post('/forgot-resend-sms', async (req, res) => {
  const { phone } = req.body
  if (!phone || !/^\+?[1-9]\d{7,15}$/.test(phone)) {
    return res.status(400).json({ message: 'Ungültige Telefonnummer' })
  }

  try {
    // Nutzer muss existieren
    const [users] = await db.pool.query(
      'SELECT id FROM users WHERE phone = ? LIMIT 1',
      [phone]
    )
    if (!users.length) {
      return res.status(404).json({ message: 'Kein Benutzer mit dieser Nummer gefunden' })
    }
    const userId = users[0].id

    // Hole sms_limits
    const [limits] = await db.pool.query(
      'SELECT sms_last_sent, sms_resend_count FROM sms_limits WHERE phone = ?',
      [phone]
    )

    let smsResendCount = 0
    let lastResend = null
    if (limits.length) {
      smsResendCount = limits[0].sms_resend_count || 0
      lastResend = limits[0].sms_last_sent ? new Date(limits[0].sms_last_sent) : null
    }

    // Begrenzung: max 3 Resends
    if (smsResendCount >= 3) {
      return res.status(429).json({ message: 'Maximale Anzahl an SMS-Wiederholungen erreicht.' })
    }

    // Begrenzung: min 2 Min Abstand
    if (lastResend) {
      const now = new Date()
      if (now - lastResend < 2 * 60 * 1000) {
        return res.status(429).json({ message: 'Du musst 2 Minuten warten, bevor du erneut eine SMS anfordern kannst.' })
      }
    }

    const smsCode = Math.floor(100000 + Math.random() * 900000).toString()
    const smsExpire = new Date(Date.now() + 15 * 60 * 1000)
    const now = new Date()

    // SMS schicken
    await sendSMS(phone, `HGDEVS Code: ${smsCode}`)

    // SMS-Code im User speichern
    await db.pool.query(
      'UPDATE users SET SMS_token = ?, SMS_token_expire = ? WHERE id = ?',
      [smsCode, smsExpire, userId]
    )

    // sms_limits aktualisieren
    if (limits.length) {
      await db.pool.query(
        'UPDATE sms_limits SET sms_last_sent = ?, sms_resend_count = sms_resend_count + 1 WHERE phone = ?',
        [now, phone]
      )
    } else {
      await db.pool.query(
        'INSERT INTO sms_limits (phone, sms_last_sent, sms_daily_count, sms_resend_count) VALUES (?, ?, 0, 1)',
        [phone, now]
      )
    }

    res.json({ success: true, message: 'SMS erneut versendet.' })
  } catch (err) {
    console.error('[forgot/resend-sms] Fehler:', err)
    res.status(500).json({ message: 'Fehler beim erneuten Senden der SMS.' })
  }
})

async function generateUniqueResetToken() {
  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 15 * 60 * 1000)
  return { token, expires }
}

module.exports = router;