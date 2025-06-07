const nodemailer = require('nodemailer')
const fs = require('fs').promises
const path = require('path')
const db = require('../lib/db')
require('dotenv').config()

async function loadTemplate(templateName, replacements = {}) {
  const filePath = path.join(__dirname, '../templates/emails', `${templateName}.html`)
  let html = await fs.readFile(filePath, 'utf-8')

  for (const [key, value] of Object.entries(replacements)) {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), value)
  }

  return html
}

async function sendMail({ userId = 0, to, subject, text, html, template, replacements = {} }) {
  let server = null

  if (!server) {
    server = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      username: process.env.SMTP_USER,
      password: process.env.SMTP_PASS,
      frommail: process.env.SMTP_FROM,
      secure: false
    }
  }

  if (!html && template) {
    html = await loadTemplate(template, replacements)
  }

  const transporter = nodemailer.createTransport({
    host: server.host,
    port: server.port,
    secure: server.secure || false,
    auth: {
      user: server.username,
      pass: server.password
    }
  })

  const mailOptions = {
    from: server.frommail || server.username,
    to,
    subject,
    text: text || '',
    html
  }

  const info = await transporter.sendMail(mailOptions)
  console.log('[MAIL SENT]', info.messageId)
  return info
}

module.exports = sendMail
