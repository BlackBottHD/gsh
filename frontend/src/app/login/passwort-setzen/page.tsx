'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PasswortSetzenPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setInfo('')
    if (!token) {
      setError('Token fehlt.')
      return
    }
    if (!password || password !== repeat) {
      setError('Passwörter stimmen nicht überein oder sind leer.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('http://localhost:3001/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Fehler beim Setzen des Passworts.')
        return
      }

      setInfo('Dein Passwort wurde erfolgreich geändert. Du wirst gleich weitergeleitet...')
      setTimeout(() => {
        router.push('/login')
      }, 10000)
    } catch {
      setError('Serverfehler beim Zurücksetzen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black/80 px-4">
      <div className="bg-gray-900 text-white p-8 rounded-xl shadow-xl w-[90%] max-w-md space-y-6">
        <h2 className="text-xl font-semibold text-center">Neues Passwort setzen</h2>

        <input
          type="password"
          placeholder="Neues Passwort"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
        />
        <input
          type="password"
          placeholder="Passwort wiederholen"
          value={repeat}
          onChange={e => setRepeat(e.target.value)}
          className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
        />

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {info && (
          <p className="text-green-400 text-sm">
            {info} <br />
            <a href="/login" className="underline text-blue-400">Jetzt einloggen</a>
          </p>
        )}


        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Wird gespeichert...' : 'Passwort speichern'}
        </button>
      </div>
    </div>
  )
}
