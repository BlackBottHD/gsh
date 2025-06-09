'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { usePermissions } from '@/lib/usePermissions'

export default function TodoNewPage() {
  const router = useRouter()
  const { hasPermission, isReady } = usePermissions()

  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    if (!token) {
      setError('Nicht eingeloggt')
      return
    }

    console.debug('[TODO] Sende Daten:', { title, description: desc })

    const res = await fetch('http://localhost:3001/api/admin/todo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title, description: desc }),
    })

    if (res.ok) {
      router.push('/admin/todo')
    } else {
      const err = await res.json().catch(() => ({ error: 'Unbekannter Fehler' }))
      console.error('[TODO] Fehler:', err)
      setError(err?.error || 'Fehler beim Erstellen')
    }
  }

  if (!isReady) return null
  if (!hasPermission('admin.todo.create')) return <p className="text-white p-6">Nicht erlaubt</p>

  return (
    <div className="p-6 text-white max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">➕ Neues Todo</h1>

      {error && (
        <div className="bg-red-800 text-red-200 px-4 py-2 rounded mb-4 text-sm text-center">
          {error}
        </div>
      )}

      <input
        className="w-full mb-2 px-3 py-2 bg-gray-700 rounded text-white"
        placeholder="Titel"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <textarea
        className="w-full mb-4 px-3 py-2 bg-gray-700 rounded text-white"
        placeholder="Beschreibung"
        value={desc}
        onChange={e => setDesc(e.target.value)}
      />
      <button
        onClick={handleCreate}
        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
      >
        Erstellen
      </button>
    </div>
  )
}
