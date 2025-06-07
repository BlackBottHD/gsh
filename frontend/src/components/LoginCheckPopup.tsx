'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'


export default function LoginCheckPopup({ forceShow = false, forceRedirectTo }: { forceShow?: boolean; forceRedirectTo?: string }) {
  const router = useRouter()
  const [showPopup, setShowPopup] = useState(false)
  const [tab, setTab] = useState<'login' | 'register'>('login')

  const [identifier, setIdentifier] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState('')

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

      if (forceShow || !data?.id) {
        setShowPopup(true)
      } else {
        setShowPopup(false)
      }
    })
    .catch(() => setShowPopup(true))
}, [forceShow])


  const handleSubmit = async () => {
    setError('')
    if (!password || (tab === 'register' && (!identifier || !username || password !== repeat))) {
      setError('Bitte fülle alle Felder korrekt aus.')
      return
    }

    try {
      const body = tab === 'login'
        ? { identifier, password }
        : { email: identifier, username, password }

      const res = await fetch(`http://localhost:3001/api/auth/${tab}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok || !data.token) {
        setError(data.message || 'Fehler beim Authentifizieren.')
        return
      }

      localStorage.setItem('auth_token', data.token)
      setShowPopup(false)

      if (forceRedirectTo) {
        router.push(forceRedirectTo) // ← Next.js Routing verwenden
      } else {
        router.refresh() // besser als reload
      }
    } catch (err) {
      setError('Serverfehler. Bitte später erneut versuchen.')
    }
  }


  if (!showPopup) return null

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
      <div className="bg-gray-900 text-white p-8 rounded-xl shadow-xl w-[90%] max-w-md space-y-6">
        <h2 className="text-xl font-semibold text-center">
          {tab === 'login' ? 'Einloggen' : 'Registrieren'}
        </h2>

        <div className="flex justify-center gap-4">
          <button
            className={`px-4 py-1 rounded ${tab === 'login' ? 'bg-blue-600' : 'bg-gray-700'} text-white`}
            onClick={() => setTab('login')}
          >
            Login
          </button>
          <button
            className={`px-4 py-1 rounded ${tab === 'register' ? 'bg-blue-600' : 'bg-gray-700'} text-white`}
            onClick={() => setTab('register')}
          >
            Registrieren
          </button>
        </div>

        <div className="space-y-3">
          {tab === 'register' ? (
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
            </>
          ) : (
            <input
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="E-Mail oder Benutzername"
              className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
            />
          )}

          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Passwort"
            className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
          />
          {tab === 'register' && (
            <input
              type="password"
              value={repeat}
              onChange={e => setRepeat(e.target.value)}
              placeholder="Passwort wiederholen"
              className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
            />
          )}
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
        >
          {tab === 'login' ? 'Einloggen' : 'Konto erstellen'}
        </button>
      </div>
    </div>
  )
}
