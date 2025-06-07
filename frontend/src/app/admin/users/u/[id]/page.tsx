'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

type Rolle = {
    id: number
    name: string
    active: boolean
}

type Permission = {
    id: number
    name: string
    beschreibung: string
    type: 'admin' | 'user' | 'beide'
    active: boolean
}

type User = {
    id?: number
    username: string
    email: string
    status: string
    mfa_active: boolean
}

export default function UserEditPage() {
    const { id } = useParams()
    const router = useRouter()

    const [user, setUser] = useState<User | null>(null)
    const [rollen, setRollen] = useState<Rolle[]>([])
    const [permissions, setPermissions] = useState<Permission[]>([])
    const [tab, setTab] = useState<'rollen' | 'perms'>('rollen')
    const [search, setSearch] = useState('')
    const [saving, setSaving] = useState(false)

    const [allRollen, setAllRollen] = useState<{ id: number; name: string }[]>([])
    const [rolleToAdd, setRolleToAdd] = useState<number | null>(null)

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

    useEffect(() => {
        if (!id || !token) return

        if (id === 'new') {
            setUser({ username: '', email: '', status: 'active', mfa_active: false })
            setRollen([])
            setPermissions([])
        } else {
            fetchUser()
        }

        fetchAllRollen()
    }, [id, token])

    const fetchUser = async () => {
        const res = await fetch(`http://localhost:3001/api/admin/users/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        setUser({
            id: data.id,
            username: data.username,
            email: data.email,
            status: data.status,
            mfa_active: data.mfa_active
        })
        setRollen(data.rollen || [])
        setPermissions(data.permissions || [])
    }

    const fetchAllRollen = async () => {
        const res = await fetch('http://localhost:3001/api/admin/rollen', {
            headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        setAllRollen(data || [])
    }

    const togglePermission = async (perm: Permission) => {
        const res = await fetch(`http://localhost:3001/api/admin/users/${id}/perms`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ perms: perm.name, active: !perm.active })
        })

        if (res.ok) {
            setPermissions(prev =>
                prev.map(p => p.name === perm.name ? { ...p, active: !p.active } : p)
            )
        }
    }

    const saveUser = async () => {
        if (!user) return
        setSaving(true)

        const res = await fetch(`http://localhost:3001/api/admin/users/${id}`, {
            method: id === 'new' ? 'POST' : 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(user)
        })

        if (res.ok) {
            const result = await res.json()
            if (id === 'new') {
                router.push(`/admin/users/u/${result.id}`)
            }
        }


        setSaving(false)
    }

    const filtered = tab === 'rollen'
        ? rollen
        : permissions.filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.beschreibung.toLowerCase().includes(search.toLowerCase())
        )

    const unassignedRollen = allRollen.filter(
        r => !rollen.some(assigned => assigned.id === r.id)
    )

    return (
        <div className="p-8 text-white">
            <button
                onClick={() => router.push('/admin/users')}
                className="mb-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
                ← Zurück zur Übersicht
            </button>

            <h1 className="text-2xl font-bold mb-4">Benutzer bearbeiten</h1>

            {user && (
                <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                        value={user.username}
                        onChange={e => setUser({ ...user, username: e.target.value })}
                        placeholder="Benutzername"
                        className="p-2 bg-gray-800 border border-gray-600 rounded"
                    />
                    <input
                        value={user.email}
                        onChange={e => setUser({ ...user, email: e.target.value })}
                        placeholder="E-Mail"
                        className="p-2 bg-gray-800 border border-gray-600 rounded"
                    />
                    <select
                        value={user.status}
                        onChange={e => setUser({ ...user, status: e.target.value })}
                        className="p-2 bg-gray-800 border border-gray-600 rounded"
                    >
                        <option value="active">Aktiv</option>
                        <option value="disabled">Deaktiviert</option>
                        <option value="pending">Ausstehend</option>
                    </select>
                    <select
                        value={user.mfa_active ? 'true' : 'false'}
                        onChange={e => setUser({ ...user, mfa_active: e.target.value === 'true' })}
                        className="p-2 bg-gray-800 border border-gray-600 rounded"
                    >
                        <option value="true">MFA aktiv</option>
                        <option value="false">MFA inaktiv</option>
                    </select>
                    <button
                        onClick={saveUser}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded col-span-1 sm:col-span-2"
                    >
                        {saving ? 'Speichern…' : 'Benutzer speichern'}
                    </button>
                </div>
            )}

            <div className="flex gap-4 mb-4">
                <button onClick={() => setTab('rollen')} className={`px-4 py-2 rounded ${tab === 'rollen' ? 'bg-blue-600' : 'bg-gray-700'}`}>
                    Rollen
                </button>
                <button onClick={() => setTab('perms')} className={`px-4 py-2 rounded ${tab === 'perms' ? 'bg-blue-600' : 'bg-gray-700'}`}>
                    User-Permissions
                </button>
            </div>

            {tab === 'rollen' ? (
                <>
                    <div className="mb-4 flex flex-wrap gap-2 items-center">
                        <select
                            value={rolleToAdd || ''}
                            onChange={e => setRolleToAdd(Number(e.target.value))}
                            className="p-2 bg-gray-800 border border-gray-600 rounded"
                        >
                            <option value="">Rolle wählen…</option>
                            {unassignedRollen.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                        <button
                            onClick={async () => {
                                if (!rolleToAdd) return
                                await fetch(`http://localhost:3001/api/admin/users/${id}/rollen`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        Authorization: `Bearer ${token}`
                                    },
                                    body: JSON.stringify({ rollen_id: rolleToAdd })
                                })
                                setRolleToAdd(null)
                                fetchUser()
                            }}
                            disabled={!rolleToAdd}
                            className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded text-white"
                        >
                            ➕ Rolle hinzufügen
                        </button>
                    </div>

                    <table className="w-full text-sm bg-gray-800 rounded">
                        <thead>
                            <tr className="bg-gray-700 text-left">
                                <th className="p-2">Rolle</th>
                                <th className="p-2">Aktion</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rollen.map(r => (
                                <tr key={r.id} className="border-t border-gray-700">
                                    <td className="p-2">{r.name}</td>
                                    <td className="p-2">
                                        <button
                                            onClick={async () => {
                                                await fetch(`http://localhost:3001/api/admin/users/${id}/rollen`, {
                                                    method: 'DELETE',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        Authorization: `Bearer ${token}`
                                                    },
                                                    body: JSON.stringify({ rollen_id: r.id })
                                                })
                                                fetchUser()
                                            }}
                                            className="px-3 py-1 rounded bg-red-600"
                                        >
                                            🗑️ Entfernen
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            ) : (
                <>
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Berechtigung suchen…"
                        className="p-2 bg-gray-800 border border-gray-600 rounded w-full sm:w-1/2 mb-4"
                    />

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
                            {(filtered as Permission[]).map((p) => (
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
                </>
            )}
        </div>
    )
}
