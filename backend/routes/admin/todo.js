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

// GET: Alle Todos (nur mit View-Recht)
router.get('/', requirePermission('admin.todo.view'), async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM todos ORDER BY id DESC')
    res.json(rows)
  } catch (err) {
    console.error('[TODO] Fehler beim Laden:', err)
    res.status(500).json({ error: 'Fehler beim Laden' })
  }
})

// POST: Neues Todo anlegen
router.post('/', requirePermission('admin.todo.create'), async (req, res) => {
  const { title, description } = req.body
  const status = 'entwurf'
  const date = `in Ausarbeitung seit ${new Date().toLocaleDateString('de-DE')}`

  try {
    const [result] = await db.raw(
      'INSERT INTO todos (title, description, status, date) VALUES (?, ?, ?, ?)',
      [title, description, status, date]
    )

    const insertId = result.insertId
    console.debug('[TODO] Todo erstellt mit ID:', insertId)
    res.json({ id: insertId, title, description, status, date })
  } catch (err) {
    console.error('[TODO] Fehler beim Anlegen:', err)
    res.status(500).json({ error: 'Fehler beim Anlegen' })
  }
})

// PATCH: Todo bearbeiten (Status ODER Titel/Beschreibung)
router.patch('/:id', async (req, res) => {
  const { title, description, status } = req.body
  const id = req.params.id

  if (!status && !title && !description) {
    return res.status(400).json({ error: 'Keine Änderungen übergeben' })
  }

  try {
    const fields = []
    const values = []

    if (status) {
      await requirePermission('admin.todo.edit.status')(req, res, () => { })
      let dateText
      switch (status) {
        case 'geplant':
          dateText = `geplant für ${new Date().toLocaleDateString('de-DE')}`
          break
        case 'arbeit':
          dateText = `in Arbeit seit ${new Date().toLocaleDateString('de-DE')}`
          break
        case 'fertig':
          dateText = `abgeschlossen am ${new Date().toLocaleDateString('de-DE')}`
          break
        case 'abgelehnt':
          dateText = `abgelehnt am ${new Date().toLocaleDateString('de-DE')}`
          break
        default:
          dateText = `in Ausarbeitung seit ${new Date().toLocaleDateString('de-DE')}`
      }

      fields.push('status = ?', 'date = ?')
      values.push(status, dateText)
    }

    if (title || description) {
      await requirePermission('admin.todo.edit')(req, res, () => { })
    }

    if (title) {
      fields.push('title = ?')
      values.push(title)
    }

    if (description) {
      fields.push('description = ?')
      values.push(description)
    }

    values.push(id)
    await db.query(`UPDATE todos SET ${fields.join(', ')} WHERE id = ?`, values)

    console.debug('[TODO] Todo geändert:', id)
    res.json({ success: true })
  } catch (err) {
    console.error('[TODO] Fehler beim Bearbeiten:', err)
    res.status(500).json({ error: 'Fehler beim Bearbeiten' })
  }
})

// DELETE: Todo löschen
router.delete('/:id', requirePermission('admin.todo.delete'), async (req, res) => {
  try {
    await db.query('DELETE FROM todos WHERE id = ?', [req.params.id])
    console.debug('[TODO] Todo gelöscht:', req.params.id)
    res.json({ success: true })
  } catch (err) {
    console.error('[TODO] Fehler beim Löschen:', err)
    res.status(500).json({ error: 'Fehler beim Löschen' })
  }
})

module.exports = router
