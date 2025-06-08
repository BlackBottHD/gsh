const axios = require('axios')
const { canSendSMS, registerSMS } = require('./smsLimiter')

module.exports = async function sendSMS(to, text) {
  const apiKey = process.env.SMS_API_KEY
  if (!apiKey) throw new Error('SMS API Key fehlt')

  const allowed = await canSendSMS(to)
  if (!allowed) {
    throw new Error('SMS-Limit erreicht oder Wartezeit nicht eingehalten.')
  }

  const scheduledTime = new Date(Date.now() + 10 * 1000).toISOString()
  const validitySeconds = 60 * 60 * 4

  const payload = {
    to: [to],
    text,
    scheduledDeliveryTime: scheduledTime,
    validityPeriod: validitySeconds,
    callbackUrl: 'https://hooks.zapier.com/hooks/catch/10638901/uyuaj2z'
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }

  console.debug('[sendSMS] Payload:', JSON.stringify(payload, null, 2))
  console.debug('[sendSMS] Headers:', headers)

  try {
    const response = await axios.post(
      'https://api.peoplefone.com/customer/sms/v1/sms/messages',
      payload,
      { headers }
    )

    console.debug('[sendSMS] Response-Status:', response.status)
    console.debug('[sendSMS] Response-Daten:', response.data)

    if (response.status === 202) {
      console.debug('[sendSMS] SMS erfolgreich – registriere Limit')
      await registerSMS(to)
    }

    return response.data
  } catch (err) {
    console.warn('[sendSMS] Warnung, Fehler ignoriert:', err.message)
    return null
  }
}
