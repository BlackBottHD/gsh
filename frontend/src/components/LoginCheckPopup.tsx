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
  const [repeat, setRepeat] = useState('')
  const [phone, setPhone] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    if (!token) return setShowPopup(true)

    fetch('http://localhost:3001/api/auth/userinfo', {
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

  const handleSubmit = async () => {
    setError('')
    setInfo('')

    if ((tab === 'register' && (!identifier || !username || !phone))) {
      setError('Bitte fülle alle Felder korrekt aus.')
      return
    }

    try {
      const body = tab === 'login'
        ? { identifier, password }
        : { email: identifier, username, password, phone }

      const res = await fetch(`http://localhost:3001/api/auth/${tab}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Fehler beim Authentifizieren.')
        return
      }

      if (tab === 'register') {
        setPhone(data.phone || phone)
        setStep('verify')
        return
      }

      if (data.token) {
        localStorage.setItem('auth_token', data.token)
        setShowPopup(false)
        forceRedirectTo ? router.push(forceRedirectTo) : router.refresh()
      }
    } catch {
      setError('Serverfehler. Bitte später erneut versuchen.')
    }
  }

  const handleVerify = async () => {
    setError('')
    try {
      const res = await fetch(`http://localhost:3001/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: smsCode })
      })
      const data = await res.json()

      if (!res.ok || !data.token) {
        setError(data.message || 'Code ungültig oder abgelaufen.')
        return
      }

      setStep('done')
      setInfo('Deine Nummer wurde bestätigt. Eine E-Mail mit einem Link zum Passwortsetzen wurde gesendet. Du wirst gleich weitergeleitet…')

      setTimeout(() => {
        setShowPopup(false)
        router.push('/login')
      }, 10000)
    } catch {
      setError('Fehler bei der Verifizierung.')
    }
  }

  const handleForgotSubmit = async () => {
    setError('')
    setInfo('')

    if (!identifier) {
      setError('Bitte gib deinen Benutzernamen oder deine E-Mail an.')
      return
    }

    try {
      const res = await fetch('http://localhost:3001/api/auth/forgot-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Nutzer nicht gefunden.')
        return
      }

      setPhone(data.phone)
      setStep('verify')
    } catch {
      setError('Serverfehler beim Senden des Codes.')
    }
  }

  const handleForgotVerify = async () => {
    setError('')
    try {
      const res = await fetch(`http://localhost:3001/api/auth/forgot-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: smsCode })
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Code ungültig.')
        return
      }

      setStep('done')
      setInfo('Ein Link zum Zurücksetzen deines Passworts wurde an deine E-Mail gesendet. Du wirst gleich zur Login-Seite weitergeleitet…')

      setTimeout(() => {
        setShowPopup(false)
        router.push('/login')
      }, 10000)

    } catch {
      setError('Fehler bei der Verifizierung.')
    }
  }

  const renderForm = () => {
    if (tab === 'forgot') {
      if (step === 'form') {
        return (
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
            >
              Code anfordern
            </button>
          </>
        )
      } else if (step === 'verify') {
        return (
          <>
            <p className="text-sm">Ein SMS-Code wurde an <strong>{phone}</strong> gesendet.</p>
            <input
              type="text"
              value={smsCode}
              onChange={e => setSmsCode(e.target.value)}
              placeholder="SMS-Code eingeben"
              className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
            />
            <button
              onClick={handleForgotVerify}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
            >
              Code bestätigen
            </button>
          </>
        )
      } else {
        return <p className="text-green-500 text-sm">{info}</p>
      }
    }

    if (step === 'verify') {
      return (
        <>
          <p className="text-sm">Ein SMS-Code wurde an <strong>{phone}</strong> gesendet.</p>
          <input
            type="text"
            value={smsCode}
            onChange={e => setSmsCode(e.target.value)}
            placeholder="SMS-Code eingeben"
            className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
          />
          <button
            onClick={handleVerify}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
          >
            Code bestätigen
          </button>
        </>
      )
    }

    return (
      <>
        {tab === 'register' && (
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
          </>
        )}
        {tab === 'login' && (
          <>
            {error && (
              <div className="bg-red-800 text-red-200 px-4 py-2 rounded text-sm text-center mb-2">
                {error}
              </div>
            )}
            {info && (
              <div className="bg-green-800 text-green-200 px-4 py-2 rounded text-sm text-center mb-2">
                {info}
              </div>
            )}
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
          </>
        )}
        <button
          onClick={handleSubmit}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
        >
          {tab === 'login' ? 'Einloggen' : 'Konto erstellen'}
        </button>
        {tab === 'login' && (
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
