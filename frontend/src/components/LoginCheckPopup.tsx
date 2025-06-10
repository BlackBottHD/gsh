'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginCheckPopup({ forceShow = false, forceRedirectTo }: { forceShow?: boolean; forceRedirectTo?: string }) {
  const router = useRouter()
  const [showPopup, setShowPopup] = useState(false)
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login')
  const [step, setStep] = useState<'form' | 'verify' | 'done'>('form')

  const [identifier, setIdentifier] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    if (!token) return setShowPopup(true)

    fetch('http://10.1.0.122:3001/api/auth/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then(data => {
        if (forceShow || !data?.id) setShowPopup(true)
        else setShowPopup(false)
      })
      .catch(() => setShowPopup(true))
  }, [forceShow])

  // ----- Auth Actions -----

  const handleSubmit = async () => {
    setError('')
    setInfo('')
    setLoading(true)

    if (tab === 'register' && (!identifier || !username || !phone)) {
      setError('Bitte fülle alle Felder korrekt aus.')
      setLoading(false)
      return
    }

    try {
      const body = tab === 'login'
        ? { identifier, password }
        : { email: identifier, username, password, phone }

      const res = await fetch(`http://10.1.0.122:3001/api/auth/${tab}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Fehler beim Authentifizieren.')
        setLoading(false)
        return
      }

      if (tab === 'register') {
        setPhone(data.phone || phone)
        setStep('verify')
        setInfo('Ein SMS-Code wurde an dein Handy gesendet.')
        setLoading(false)
        return
      }

      if (data.token) {
        localStorage.setItem('auth_token', data.token)
        setShowPopup(false)
        setLoading(false)
        forceRedirectTo ? router.push(forceRedirectTo) : router.refresh()
      }
    } catch {
      setError('Serverfehler. Bitte später erneut versuchen.')
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    setError('')
    setInfo('')
    setLoading(true)
    try {
      const res = await fetch(`http://10.1.0.122:3001/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: smsCode })
      })
      const data = await res.json()

      if (!res.ok || !data.token) {
        setError(data.message || 'Code ungültig oder abgelaufen.')
        setLoading(false)
        return
      }

      setStep('done')
      setInfo('Deine Nummer wurde bestätigt. Eine E-Mail mit einem Link zum Passwortsetzen wurde gesendet. Du wirst gleich weitergeleitet…')
      setLoading(false)

      setTimeout(() => {
        setShowPopup(false)
        router.push('/login')
      }, 10000)
    } catch {
      setError('Fehler bei der Verifizierung.')
      setLoading(false)
    }
  }

  const handleForgotSubmit = async () => {
    setError('')
    setInfo('')
    setLoading(true)

    if (!identifier) {
      setError('Bitte gib deinen Benutzernamen oder deine E-Mail an.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('http://10.1.0.122:3001/api/auth/forgot-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Nutzer nicht gefunden.')
        setLoading(false)
        return
      }

      setPhone(data.phone)
      setStep('verify')
      setInfo('Ein SMS-Code wurde an dein Handy gesendet.')
      setLoading(false)
    } catch {
      setError('Serverfehler beim Senden des Codes.')
      setLoading(false)
    }
  }

  const handleForgotVerify = async () => {
    setError('')
    setInfo('')
    setLoading(true)
    try {
      const res = await fetch(`http://10.1.0.122:3001/api/auth/forgot-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: smsCode })
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Code ungültig.')
        setLoading(false)
        return
      }

      setStep('done')
      setInfo('Ein Link zum Zurücksetzen deines Passworts wurde an deine E-Mail gesendet. Du wirst gleich zur Login-Seite weitergeleitet…')
      setLoading(false)

      setTimeout(() => {
        setShowPopup(false)
        router.push('/login')
      }, 10000)
    } catch {
      setError('Fehler bei der Verifizierung.')
      setLoading(false)
    }
  }

  // ----- Resend SMS -----
  const handleResendCode = async () => {
    setError('')
    setInfo('')
    setResendLoading(true)
    let url = ''
    let body: any = {}
    if (tab === 'register') {
      url = `http://10.1.0.122:3001/api/auth/register/resend-sms`
      body = { phone }
    } else if (tab === 'forgot') {
      url = `http://10.1.0.122:3001/api/auth/forgot-resend-sms`
      body = { phone }
    } else {
      setResendLoading(false)
      return
    }
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'SMS konnte nicht erneut gesendet werden.')
        setResendLoading(false)
        return
      }
      setInfo('SMS erneut gesendet.')
      setResendLoading(false)
    } catch {
      setError('Fehler beim erneuten Senden der SMS.')
      setResendLoading(false)
    }
  }

  // ----- UI Rendering -----

  const renderForm = () => {
    // Error/info für ALLE Schritte
    return (
      <>
        {(error || info) && (
          <div className={`px-4 py-2 rounded text-sm text-center mb-2 ${error ? 'bg-red-800 text-red-200' : 'bg-green-800 text-green-200'}`}>
            {error || info}
          </div>
        )}
        {tab === 'forgot' && step === 'form' && (
          <>
            <input
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="E-Mail oder Benutzername"
              className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
            />
            <button
              onClick={handleForgotSubmit}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded mt-2"
              disabled={loading}
            >
              {loading ? 'Sende...' : 'Code anfordern'}
            </button>
          </>
        )}
        {tab === 'forgot' && step === 'verify' && (
          <>
            <p className="text-sm">Ein SMS-Code wurde an <strong>{phone}</strong> gesendet.</p>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={smsCode}
                onChange={e => setSmsCode(e.target.value)}
                placeholder="SMS-Code eingeben"
                className="flex-1 px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
              />
              <button
                onClick={handleResendCode}
                className="bg-gray-700 hover:bg-yellow-600 text-white px-3 rounded"
                disabled={resendLoading}
                type="button"
              >
                {resendLoading ? '...' : 'SMS erneut senden'}
              </button>
            </div>
            <button
              onClick={handleForgotVerify}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded mt-2"
              disabled={loading}
            >
              {loading ? 'Prüfe...' : 'Code bestätigen'}
            </button>
          </>
        )}
        {tab === 'forgot' && step === 'done' && (
          <p className="text-green-500 text-sm">{info}</p>
        )}

        {tab !== 'forgot' && step === 'verify' && (
          <>
            <p className="text-sm">Ein SMS-Code wurde an <strong>{phone}</strong> gesendet.</p>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={smsCode}
                onChange={e => setSmsCode(e.target.value)}
                placeholder="SMS-Code eingeben"
                className="flex-1 px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
              />
              <button
                onClick={handleResendCode}
                className="bg-gray-700 hover:bg-yellow-600 text-white px-3 rounded"
                disabled={resendLoading}
                type="button"
              >
                {resendLoading ? '...' : 'SMS erneut senden'}
              </button>
            </div>
            <button
              onClick={handleVerify}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded mt-2"
              disabled={loading}
            >
              {loading ? 'Prüfe...' : 'Code bestätigen'}
            </button>
          </>
        )}

        {tab !== 'forgot' && step === 'done' && (
          <p className="text-green-500 text-sm">{info}</p>
        )}

        {step === 'form' && tab === 'register' && (
          <>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Benutzername"
              className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
            />
            <input
              type="email"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="E-Mail"
              className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
            />
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Handynummer (z. B. +491701234567)"
              className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Passwort"
              className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
            />
            <button
              onClick={handleSubmit}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded mt-2"
              disabled={loading}
            >
              {loading ? 'Sende...' : 'Konto erstellen'}
            </button>
          </>
        )}

        {step === 'form' && tab === 'login' && (
          <>
            <input
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="E-Mail oder Benutzername"
              className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Passwort"
              className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
            />
            <button
              onClick={handleSubmit}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded mt-2"
              disabled={loading}
            >
              {loading ? 'Einloggen...' : 'Einloggen'}
            </button>
            <button
              className="text-sm text-blue-400 hover:underline mt-2"
              onClick={() => {
                setTab('forgot')
                setStep('form')
                setError('')
                setInfo('')
              }}
            >
              Passwort vergessen?
            </button>
          </>
        )}
      </>
    )
  }

  if (!showPopup) return null

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
      <div className="bg-gray-900 text-white p-8 rounded-xl shadow-xl w-[90%] max-w-md space-y-6">
        <h2 className="text-xl font-semibold text-center">
          {tab === 'forgot'
            ? step === 'done' ? 'Link gesendet' : 'Passwort zurücksetzen'
            : step === 'verify'
              ? 'SMS-Code bestätigen'
              : tab === 'login' ? 'Einloggen' : 'Registrieren'}
        </h2>
        <div className="flex justify-center gap-4 mb-2">
          {['login', 'register'].map(t => (
            <button
              key={t}
              className={`px-4 py-1 rounded ${tab === t ? 'bg-blue-600' : 'bg-gray-700'} text-white`}
              onClick={() => {
                setTab(t as 'login' | 'register')
                setStep('form')
                setError('')
                setInfo('')
              }}
            >
              {t === 'login' ? 'Login' : 'Registrieren'}
            </button>
          ))}
        </div>
        {renderForm()}
      </div>
    </div>
  )
}
