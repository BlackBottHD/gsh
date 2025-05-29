const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../lib/db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'changemeplease';

// 📌 Registrierung
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    console.debug('[REGISTER] Eingehende Daten:', { username, email, password });
  
    if (!username || !email || !password) {
      console.warn('[REGISTER] Fehlende Felder');
      return res.status(400).json({ message: 'Alle Felder sind erforderlich' });
    }
  
    try {
      const existing = await db.query(
        'SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1',
        [email, username]
      );
  
      console.debug('[REGISTER] Prüfergebnis bestehender Benutzer:', existing);
  
      if (existing.length > 0) {
        console.warn('[REGISTER] Benutzername oder E-Mail bereits vergeben:', existing[0]);
        return res.status(409).json({ message: 'Benutzername oder E-Mail bereits vergeben' });
      }
  
      const password_hash = await bcrypt.hash(password, 10);
      console.debug('[REGISTER] Passwort-Hash erstellt');
  
      const insertFields = [username, email, password_hash];
      let sql = 'INSERT INTO users (username, email, password_hash';
  
      if (process.env.NODE_ENV !== 'production') {
        sql += ', password';
        insertFields.push(password);
      }
  
      sql += ') VALUES (?, ?, ?' + (process.env.NODE_ENV !== 'production' ? ', ?' : '') + ')';
  
      console.debug('[REGISTER] SQL-Befehl:', sql);
      console.debug('[REGISTER] Insert-Werte:', insertFields);
  
      const result = await db.query(sql, insertFields);
  
      console.log('[REGISTER] Registrierung erfolgreich, ID:', result.insertId);
      return res.status(201).json({ message: 'Registrierung erfolgreich', userId: result.insertId });
    } catch (err) {
      console.error('[REGISTER] Interner Fehler:', err);
      return res.status(500).json({ message: 'Interner Serverfehler' });
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
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ message: 'Falsches Passwort' });
    }

    // Letzten Login-Zeitpunkt aktualisieren
    await db.query('UPDATE users SET lastseen = NOW() WHERE id = ?', [user.id]);

    // JWT erstellen
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({ message: 'Login erfolgreich', token });
  } catch (err) {
    console.error('[LOGIN]', err);
    return res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

module.exports = router;
