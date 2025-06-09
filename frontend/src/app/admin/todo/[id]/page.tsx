'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { usePermissions } from '@/lib/usePermissions'

type Todoo = {
  id: number
  title: string
  description: string
  status: 'entwurf' | 'geplant' | 'arbeit' | 'fertig'
  date: string
}

const statusLabels = {
  entwurf: 'Entwurf',
  geplant: 'Geplant',
  arbeit: 'In Arbeit',
  fertig: 'Abgeschlossen',
}

export default function TodoEditPage() {
  const router = useRouter()
  const params = useParams()
  const { hasPermission, isReady } = usePermissions()

  const [todo, setTodo] = useState<Todoo | null>(null)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [status, setStatus] = useState<Todoo['status']>('entwurf')
  const [error, setError] = useState<string | null>(null)

  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : null

  useEffect(() => {
    if (!isReady || !id) return
    if (!hasPermission('admin.todo.view')) {
      router.push('/unauthorized')
      return
    }

    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    if (!token) {
      setError('Nicht eingeloggt')
      return
    }

    fetch(`http://localhost:3001/api/admin/todo`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then((data: Todoo[]) => {
        const found = data.find(t => t.id === Number(id))
        if (found) {
          setTodo(found)
          setTitle(found.title)
          setDesc(found.description)
          setStatus(found.status)
        } else {
          setError('Todo nicht gefunden')
        }
      })
      .catch(err => {
        console.error('[TODO] Fehler beim Laden:', err)
        setError('Fehler beim Laden')
      })
  }, [isReady, id])

  const handleSave = async () => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    if (!token || !todo) return

    const body: any = {}
    if (hasPermission('admin.todo.edit')) {
      body.title = title
      body.description = desc
    }
    if (hasPermission('admin.todo.edit.status')) {
      body.status = status
    }

    console.debug('[TODO] Sende Änderungen:', body)

    const res = await fetch(`http://localhost:3001/api/admin/todo/${todo.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      router.push('/admin/todo')
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data?.error || 'Fehler beim Speichern')
      console.error('[TODO] Fehler beim Speichern:', data)
    }
  }

  if (!isReady) return <div className="text-white p-6">Lade...</div>
  if (error) return <div className="text-red-400 p-6">{error}</div>
  if (!todo) return null

  return (
    <div className="p-6 text-white max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">✏️ Todo bearbeiten</h1>

      {hasPermission('admin.todo.edit') && (
        <>
          <label className="block mb-1">Titel</label>
          <input
            className="w-full mb-3 px-3 py-2 bg-gray-700 rounded text-white"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />

          <label className="block mb-1">Beschreibung</label>
          <textarea
            className="w-full mb-4 px-3 py-2 bg-gray-700 rounded text-white"
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
        </>
      )}

      {hasPermission('admin.todo.edit.status') && (
        <>
          <label className="block mb-1">Status</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value as Todoo['status'])}
            className="w-full mb-4 px-3 py-2 bg-gray-700 text-white rounded"
          >
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </>
      )}

      <button
        onClick={handleSave}
        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded w-full"
      >
        Speichern
      </button>
    </div>
  )
}
