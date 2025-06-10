'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ email: string, username: string } | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      router.push('/login?redirect=/dashboard')
      return
    }

    fetch('http://10.1.0.122:3001/api/auth/userinfo', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.id) {
          setUser(data)
        } else {
          router.push('/login?redirect=/dashboard')
        }
      })
      .catch(() => router.push('/login?redirect=/dashboard'))
  }, [router])


  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p>Lade Dashboard…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Willkommen, {user.username}!</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">🧠 Meine Server</h2>
          <p className="text-gray-400">Liste aller gebuchten Gameserver.</p>
        </div>

        <div className="bg-gray-800 p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">💳 Zahlungen</h2>
          <p className="text-gray-400">Verwalte Coins, Abos & Rechnungen.</p>
        </div>

        <div className="bg-gray-800 p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">⚙️ Einstellungen</h2>
          <p className="text-gray-400">Passwort ändern, 2FA aktivieren.</p>
        </div>
      </div>
    </div>
  )
}
