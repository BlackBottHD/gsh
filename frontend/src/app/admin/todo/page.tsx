'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePermissions } from '@/lib/usePermissions'
import { usePermissionGuard } from '@/lib/usePermissionGuard'
import { useRouter } from 'next/navigation'

type Todoo = {
  id: number
  title: string
  description: string
  status: 'entwurf' | 'geplant' | 'arbeit' | 'fertig' | 'abgelehnt'
  date: string
}

const statusOrder: Todoo['status'][] = [
  'entwurf',
  'geplant',
  'arbeit',
  'fertig',
  'abgelehnt',
]

const statusLabels: Record<Todoo['status'], string> = {
  entwurf: 'Entwurf',
  geplant: 'Geplant',
  arbeit: 'In Arbeit',
  fertig: 'Abgeschlossen',
  abgelehnt: 'Abgelehnt',
}

export default function AdminTodooPage() {
  usePermissionGuard('admin.todo.view')
  const { hasPermission, isReady } = usePermissions()
  const router = useRouter()
  const [todoos, setTodoos] = useState<Todoo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeTodo, setActiveTodo] = useState<Todoo | null>(null)
  const [statusUpdating, setStatusUpdating] = useState(false)

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

    fetch('http://10.1.0.122:3001/api/admin/todo', {
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

  // Todos nach Status gruppieren
  const grouped: Record<Todoo['status'], Todoo[]> = {
    entwurf: [],
    geplant: [],
    arbeit: [],
    fertig: [],
    abgelehnt: [],
  }
  todoos.forEach(todo => {
    grouped[todo.status]?.push(todo)
  })

  // Status ändern im Modal
  async function handleStatusChange(todoId: number, newStatus: Todoo['status']) {
    setStatusUpdating(true)
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    try {
      const res = await fetch(`http://10.1.0.122:3001/api/admin/todo/${todoId}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setTodoos((prev) =>
          prev.map(t => t.id === todoId ? { ...t, status: newStatus } : t)
        )
        setActiveTodo(a => a && a.id === todoId ? { ...a, status: newStatus } : a)
      } else {
        alert('Fehler beim Status-Update')
      }
    } catch (e) {
      alert('Fehler beim Status-Update')
    }
    setStatusUpdating(false)
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        {statusOrder.map(status => (
          <div key={status} className="bg-gray-900 rounded-lg p-4 shadow">
            <h2 className="text-lg font-bold mb-3">{statusLabels[status]}</h2>
            <ul className="space-y-3">
              {grouped[status].length > 0 ? (
                grouped[status].map(todo => (
                  <li key={todo.id} className="bg-gray-800 rounded p-3">
                    <div className="font-semibold">{todo.title}</div>
                    <div className="text-sm text-gray-400">
                      {todo.description.length > 100
                        ? todo.description.substring(0, 100) + '...'
                        : todo.description}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 italic">{todo.date}</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {hasPermission('admin.todo.edit') && (
                        <Link
                          href={`/admin/todo/${todo.id}`}
                          className="text-xs text-blue-400 hover:underline"
                        >
                          ✏️ Bearbeiten
                        </Link>
                      )}
                      {hasPermission('admin.todo.delete') && (
                        <button
                          className="text-xs text-red-400 hover:underline"
                          onClick={async () => {
                            if (!confirm('Wirklich löschen?')) return
                            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
                            try {
                              const res = await fetch(`http://10.1.0.122:3001/api/admin/todo/${todo.id}`, {
                                method: 'DELETE',
                                headers: {
                                  Authorization: `Bearer ${token}`,
                                },
                              })
                              if (res.ok) {
                                setTodoos((prev) => prev.filter(t => t.id !== todo.id))
                                if (activeTodo?.id === todo.id) setActiveTodo(null)
                              } else {
                                alert('Fehler beim Löschen')
                              }
                            } catch (e) {
                              alert('Fehler beim Löschen')
                            }
                          }}
                        >
                          🗑️ Löschen
                        </button>
                      )}
                      <button
                        className="text-xs text-yellow-400 hover:underline"
                        onClick={() => setActiveTodo(todo)}
                      >
                        👁️ Mehr lesen
                      </button>
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-sm text-gray-500 italic">Keine Einträge</li>
              )}
            </ul>
          </div>
        ))}
      </div>

      {/* Modal für Detailansicht */}
      {activeTodo && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="bg-gray-900 rounded-lg p-6 min-w-[300px] max-w-lg relative">
            <button
              onClick={() => setActiveTodo(null)}
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
              aria-label="Schließen"
            >✖️</button>
            <h3 className="text-xl font-bold mb-2">{activeTodo.title}</h3>
            <div className="mb-2 text-gray-300">{activeTodo.description}</div>
            <div className="mb-4 text-xs text-gray-500 italic">{activeTodo.date}</div>
            <div className="mb-4">
              <label>Status: </label>
              <select
                value={activeTodo.status}
                disabled={statusUpdating}
                onChange={e => handleStatusChange(activeTodo.id, e.target.value as Todoo['status'])}
                className="ml-2 rounded bg-gray-800 text-white px-2 py-1"
              >
                {statusOrder.map(s => (
                  <option key={s} value={s}>{statusLabels[s]}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
