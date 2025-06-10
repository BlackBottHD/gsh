'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePermissionGuard } from '@/lib/usePermissionGuard'

type User = {
  id: number
  username: string
  email: string
  mfa_active: boolean
  status: string
  rollen: string[]
}

type Rolle = {
  id: number
  name: string
  parent: string | null
}

export default function AdminUsersPage() {
  const router = useRouter()
  usePermissionGuard('admin.usermanagement.open')

  const [tab, setTab] = useState<'users' | 'rollen'>('users')
  const [users, setUsers] = useState<User[]>([])
  const [rollen, setRollen] = useState<Rolle[]>([])

  const [filter, setFilter] = useState({ name: '', email: '', rolle: '', mfa: '' })
  const [rolleFilter, setRolleFilter] = useState({ name: '', parent: '' })

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

  useEffect(() => {
    if (token) {
      fetchUsers()
      fetchRollen()
    }
  }, [token])

  const fetchUsers = async () => {
    const res = await fetch('http://10.1.0.122:3001/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
    const json = await res.json()
    const userList = Array.isArray(json) ? json : (json.users || [])
    const mapped = userList.map((u: any) => ({
      ...u,
      rollen: u.rollen ? u.rollen.split(',') : []
    }))
    setUsers(mapped)
  }

  const fetchRollen = async () => {
    const res = await fetch('http://10.1.0.122:3001/api/admin/rollen', {
      headers: { Authorization: `Bearer ${token}` }
    })
    const json = await res.json()
    const rollenArray = Array.isArray(json) ? json : json.rollen || []
    setRollen(rollenArray)
  }

  const deleteUser = async (id: number) => {
    if (!confirm('Benutzer wirklich löschen?')) return
    await fetch(`http://10.1.0.122:3001/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    fetchUsers()
  }

  const deleteRolle = async (id: number) => {
    if (!confirm('Rolle wirklich löschen?')) return
    await fetch(`http://10.1.0.122:3001/api/admin/rollen/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    fetchRollen()
  }

const createUser = async () => {
  router.push('/admin/users/u/new')
}

const createRolle = async () => {
  router.push('/admin/users/r/new')
}



  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(filter.name.toLowerCase()) &&
    u.email.toLowerCase().includes(filter.email.toLowerCase()) &&
    (filter.rolle ? u.rollen.includes(filter.rolle) : true) &&
    (filter.mfa === '' || String(u.mfa_active) === filter.mfa)
  )

  const filteredRollen = rollen.filter(r =>
    r.name.toLowerCase().includes(rolleFilter.name.toLowerCase()) &&
    (rolleFilter.parent ? (r.parent || '').includes(rolleFilter.parent) : true)
  )

  return (
    <div className="p-8 text-white">
      <h1 className="text-2xl font-bold mb-4">Nutzer & Rollenverwaltung</h1>

      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4">
          <button onClick={() => setTab('users')} className={`px-4 py-2 rounded ${tab === 'users' ? 'bg-blue-600' : 'bg-gray-700'}`}>Benutzer</button>
          <button onClick={() => setTab('rollen')} className={`px-4 py-2 rounded ${tab === 'rollen' ? 'bg-blue-600' : 'bg-gray-700'}`}>Rollen</button>
        </div>
        {tab === 'users' && (
          <button onClick={createUser} className="bg-green-600 px-4 py-2 rounded text-white hover:bg-green-700">
            👤 Benutzer erstellen
          </button>
        )}

        {tab === 'rollen' && (
          <button onClick={createRolle} className="bg-green-600 px-4 py-2 rounded text-white hover:bg-green-700">
            ➕ Rolle erstellen
          </button>
        )}
      </div>

      {tab === 'users' ? (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <input placeholder="Name" className="p-2 bg-gray-800 border border-gray-600 rounded" value={filter.name} onChange={e => setFilter({ ...filter, name: e.target.value })} />
            <input placeholder="Email" className="p-2 bg-gray-800 border border-gray-600 rounded" value={filter.email} onChange={e => setFilter({ ...filter, email: e.target.value })} />
            <input placeholder="Rolle" className="p-2 bg-gray-800 border border-gray-600 rounded" value={filter.rolle} onChange={e => setFilter({ ...filter, rolle: e.target.value })} />
            <select className="p-2 bg-gray-800 border border-gray-600 rounded" value={filter.mfa} onChange={e => setFilter({ ...filter, mfa: e.target.value })}>
              <option value="">MFA?</option>
              <option value="true">Aktiv</option>
              <option value="false">Inaktiv</option>
            </select>
          </div>

          <table className="w-full text-sm bg-gray-800 rounded">
            <thead>
              <tr className="bg-gray-700 text-left">
                <th className="p-2">Name</th>
                <th className="p-2">Email</th>
                <th className="p-2">Status</th>
                <th className="p-2">MFA</th>
                <th className="p-2">Rollen</th>
                <th className="p-2 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id} className="border-t border-gray-600">
                  <td className="p-2">{u.username}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">{u.status}</td>
                  <td className="p-2">{u.mfa_active ? '✔️' : '—'}</td>
                  <td className="p-2">{u.rollen.join(', ')}</td>
                  <td className="p-2 text-right">
                    <button className="text-yellow-400 mr-2" onClick={() => router.push(`/admin/users/u/${u.id}`)}>Bearbeiten</button>
                    <button className="text-red-400" onClick={() => deleteUser(u.id)}>Löschen</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <input placeholder="Name" className="p-2 bg-gray-800 border border-gray-600 rounded" value={rolleFilter.name} onChange={e => setRolleFilter({ ...rolleFilter, name: e.target.value })} />
            <input placeholder="Parent" className="p-2 bg-gray-800 border border-gray-600 rounded" value={rolleFilter.parent} onChange={e => setRolleFilter({ ...rolleFilter, parent: e.target.value })} />
          </div>

          <table className="w-full text-sm bg-gray-800 rounded">
            <thead>
              <tr className="bg-gray-700 text-left">
                <th className="p-2">Rolle</th>
                <th className="p-2">Parent</th>
                <th className="p-2 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filteredRollen.map(r => (
                <tr key={r.id} className="border-t border-gray-600">
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.parent || '—'}</td>
                  <td className="p-2 text-right">
                    <button className="text-yellow-400 mr-2" onClick={() => router.push(`/admin/users/r/${r.id}`)}>Bearbeiten</button>
                    <button className="text-red-400" onClick={() => deleteRolle(r.id)}>Löschen</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}
