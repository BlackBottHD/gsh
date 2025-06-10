'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePermissions } from '@/lib/usePermissions'
import { useRouter } from 'next/navigation'

type Todoo = {
  id: number
  title: string
  description: string
  status: 'entwurf' | 'geplant' | 'arbeit' | 'fertig' | 'abgelehnt'
  date: string
}

const statusLabels = {
  entwurf: 'Entwurf',
  geplant: 'Geplant',
  arbeit: 'In Arbeit',
  fertig: 'Abgeschlossen',
  abgelehnt: 'Abgelehnt',
}

export default function AdminTodooPage() {
  const { hasPermission, isReady } = usePermissions()
  const router = useRouter()
  const [todoos, setTodoos] = useState<Todoo[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isReady) return
    if (!hasPermission('admin.todo.view')) {
      router.push('/unauthorized')
      return
    }

    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    if (!token) {
      setError('Nicht eingeloggt')
      return
    }

    fetch('http://localhost:3001/api/admin/todo', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        setTodoos(data)
        console.debug('[TODO] Geladene Todos:', data)
      })
      .catch(err => {
        console.error('[TODO] Fehler beim Laden:', err)
        setError('Fehler beim Laden der Todos')
      })
  }, [isReady])

  const grouped = {
    entwurf: todoos.filter(t => t.status === 'entwurf'),
    geplant: todoos.filter(t => t.status === 'geplant'),
    arbeit: todoos.filter(t => t.status === 'arbeit'),
    fertig: todoos.filter(t => t.status === 'fertig'),
    abgelehnt: todoos.filter(t => t.status === 'abgelehnt'),
  }

  if (error) return <div className="text-red-400 p-6">{error}</div>

  return (
    <div className="p-6 text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">📝 Todos</h1>
        {hasPermission('admin.todo.create') && (
          <Link
            href="/admin/todo/new"
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
          >
            ➕ Neues Todo
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {(['entwurf', 'geplant', 'arbeit', 'fertig'] as Todoo['status'][]).map(status => (
          <div key={status} className="bg-gray-900 rounded-lg p-4 shadow">
            <h2 className="text-lg font-bold mb-3">{statusLabels[status]}</h2>
            <ul className="space-y-3">
              {grouped[status].map(todo => (
                <li key={todo.id} className="bg-gray-800 rounded p-3">
                  <div className="font-semibold">{todo.title}</div>
                  <div className="text-sm text-gray-400">{todo.description}</div>
                  <div className="text-xs text-gray-500 mt-1 italic">{todo.date}</div>

                  {hasPermission('admin.todo.edit') && (
                    <Link
                      href={`/admin/todo/${todo.id}`}
                      className="mt-2 text-xs text-blue-400 hover:underline block"
                    >
                      ✏️ Bearbeiten
                    </Link>
                  )}
                </li>
              ))}
              {grouped[status].length === 0 && (
                <li className="text-sm text-gray-500 italic">Keine Einträge</li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
