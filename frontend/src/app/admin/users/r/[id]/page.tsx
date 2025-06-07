'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

type Permission = {
  id: number
  name: string
  beschreibung: string
  type: 'admin' | 'user' | 'beide'
  active: boolean
}

export default function RollenEditPage() {
  const { id } = useParams()
  const router = useRouter()

  const [rolleName, setRolleName] = useState('')
  const [rolleParent, setRolleParent] = useState('')
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

  useEffect(() => {
    if (!id || !token) return
    fetchRolle()
    fetchPermissions()
  }, [id, token])

  const fetchRolle = async () => {
    const res = await fetch(`http://localhost:3001/api/admin/rollen`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    const rolle = data.find((r: any) => String(r.id) === String(id))
    if (rolle) {
      setRolleName(rolle.name)
      setRolleParent(rolle.parent || '')
    }
  }

  const fetchPermissions = async () => {
    const res = await fetch(`http://localhost:3001/api/admin/rollen/perms/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    setPermissions(data)
  }

  const togglePermission = async (perm: Permission) => {
    const res = await fetch(`http://localhost:3001/api/admin/rollen/perms/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: perm.name,
        active: !perm.active
      })
    })

    if (res.ok) {
      setPermissions(prev =>
        prev.map(p => p.name === perm.name ? { ...p, active: !p.active } : p)
      )
    }
  }

  const saveRolle = async () => {
    setSaving(true)
    await fetch(`http://localhost:3001/api/admin/rollen/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name: rolleName, parent: rolleParent || null })
    })
    setSaving(false)
  }

  const filteredPermissions = permissions.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.beschreibung.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8 text-white">
      <button
        onClick={() => router.push('/admin/users')}
        className="mb-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
      >
        ← Zurück zur Übersicht
      </button>

      <h1 className="text-2xl font-bold mb-4">Rolle bearbeiten</h1>

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          value={rolleName}
          onChange={e => setRolleName(e.target.value)}
          placeholder="Rollenname"
          className="p-2 bg-gray-800 border border-gray-600 rounded"
        />
        <input
          value={rolleParent}
          onChange={e => setRolleParent(e.target.value)}
          placeholder="Parent (optional)"
          className="p-2 bg-gray-800 border border-gray-600 rounded"
        />
        <button
          onClick={saveRolle}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded col-span-1 sm:col-span-2"
        >
          {saving ? 'Speichern…' : 'Rolle speichern'}
        </button>
      </div>

      <h2 className="text-lg font-semibold mb-2">Berechtigungen</h2>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Berechtigung suchen…"
          className="p-2 bg-gray-800 border border-gray-600 rounded w-full sm:w-1/2"
        />
      </div>

      <table className="w-full text-sm bg-gray-800 rounded">
        <thead>
          <tr className="bg-gray-700 text-left">
            <th className="p-2">Typ</th>
            <th className="p-2">Name</th>
            <th className="p-2">Beschreibung</th>
            <th className="p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredPermissions.map(p => (
            <tr key={p.id} className="border-t border-gray-700">
              <td className="p-2 capitalize">{p.type}</td>
              <td className="p-2">{p.name}</td>
              <td className="p-2">{p.beschreibung}</td>
              <td className="p-2">
                <button
                  onClick={() => togglePermission(p)}
                  className={`px-3 py-1 rounded ${p.active ? 'bg-green-600' : 'bg-red-600'}`}
                >
                  {p.active ? '✔️ Aktiv' : '— Inaktiv'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
