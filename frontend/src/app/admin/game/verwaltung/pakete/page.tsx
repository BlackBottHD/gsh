'use client'

import { useEffect, useState } from 'react'

import { usePermissionGuard } from '@/lib/usePermissionGuard'
import { usePermissions } from '@/lib/usePermissions'

export default function PaketeAdminPage() {
    usePermissionGuard('admin.pakete.view')
    const { hasPermission } = usePermissions()
    const [pakete, setPakete] = useState<any[]>([])
    const [edit, setEdit] = useState<any | null>(null)
    const [token, setToken] = useState<string | null>(null)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setToken(localStorage.getItem('auth_token'))
        }
    }, [])

    const fetchPakete = async () => {
        try {
            const res = await fetch('http://10.1.0.122:3001/api/admin/pakete', {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (!res.ok) {
                console.error('Fehler beim Laden:', await res.text())
                return
            }

            const data = await res.json()

            if (!Array.isArray(data)) {
                console.error('Unerwartetes Format:', data)
                return
            }

            setPakete(data)
        } catch (err) {
            console.error('Netzwerk-/Serverfehler:', err)
        }
    }

    useEffect(() => {
        if (token) fetchPakete()
    }, [token])

    const updateField = (field: string, value: any) => {
        setEdit((prev: any) => ({ ...prev, [field]: value }))
    }

    const save = async () => {
        const res = await fetch('http://10.1.0.122:3001/api/admin/pakete', {
            method: pakete.some(p => p.id === edit.id) ? 'PATCH' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(edit)
        })
        if (res.ok) {
            setEdit(null)
            fetchPakete()
        } else {
            alert('Fehler beim Speichern')
        }
    }

    const del = async (id: string) => {
        if (!confirm('Wirklich löschen?')) return
        await fetch(`http://10.1.0.122:3001/api/admin/pakete/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        })
        fetchPakete()
    }

    const archive = async (id: string) => {
        await fetch(`http://10.1.0.122:3001/api/admin/pakete/${id}/archive`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` }
        })
        fetchPakete()
    }

    const unarchive = async (id: string) => {
        await fetch(`http://10.1.0.122:3001/api/admin/pakete/${id}/unarchive`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` }
        })
        fetchPakete()
    }

    return (
        <div className="p-8 max-w-4xl mx-auto text-white">
            <div className="mb-4">
                <a
                    href="/admin/game/dashboard"
                    className="inline-block bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded"
                >
                    ← Zurück zur Übersicht
                </a>
            </div>
            <h1 className="text-2xl font-bold mb-6">Pakete verwalten</h1>
            {hasPermission('admin.pakete.create') && (
                <button
                    onClick={() => setEdit({ id: '', label: '', ram: 2, disk: 10, backup: 1, tables: 1, price_eur: 0, price_dynamic: false, sort: 0 })}
                    className="mb-6 bg-blue-600 px-4 py-2 rounded"
                >
                    ➕ Neues Paket
                </button>
            )}

            <table className="w-full text-sm mb-8">
                <thead>
                    <tr className="bg-gray-700">
                        <th className="p-2">ID</th>
                        <th className="p-2">Label</th>
                        <th className="p-2">RAM</th>
                        <th className="p-2">Disk</th>
                        <th className="p-2">€</th>
                        <th className="p-2">Coins</th>
                        <th className="p-2">Sort</th>
                        <th className="p-2"></th>
                    </tr>
                </thead>
                <tbody>
                    {pakete.map(p => (
                        <tr key={p.id} className="border-t border-gray-700">
                            <td className="p-2">{p.id}</td>
                            <td className="p-2">{p.label}</td>
                            <td className="p-2">{p.ram} GB</td>
                            <td className="p-2">{p.disk} GB</td>
                            <td className="p-2">
                                {p.price_eur != null && !isNaN(Number(p.price_eur))
                                    ? Number(p.price_eur).toFixed(2)
                                    : '–'}
                            </td>
                            <td className="p-2">{p.price_coins ?? '–'}</td>
                            <td className="p-2">{p.sort}</td>
                            <td className="p-2 text-right space-x-2">
                                {hasPermission('admin.pakete.edit') && (
                                    <button onClick={() => setEdit(p)} className="text-yellow-400">Bearbeiten</button>
                                )}

                                {hasPermission('admin.pakete.archive') && (p.archived ? (
                                    <button onClick={() => unarchive(p.id)} className="text-green-400">Reaktivieren</button>
                                ) : (
                                    <button onClick={() => archive(p.id)} className="text-gray-400">Archivieren</button>
                                )
                                )}
                                {hasPermission('admin.pakete.delete') && (
                                    <button onClick={() => del(p.id)} className="text-red-400">Löschen</button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {edit && (
                <div className="bg-gray-900 p-4 rounded space-y-4">
                    <h2 className="text-xl font-bold">{edit.id ? 'Paket bearbeiten' : 'Neues Paket erstellen'}</h2>
                    <div>
                        <label className="block text-sm mb-1">Paket ID</label>
                        <input
                            value={edit.id}
                            onChange={e => updateField('id', e.target.value)}
                            disabled={pakete.some(p => p.id === edit.id)}
                            placeholder="ID"
                            className="w-full p-2 bg-gray-800 border border-gray-700 rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Paket Name</label>
                        <input value={edit.label} onChange={e => updateField('label', e.target.value)} placeholder="Label" className="w-full p-2 bg-gray-800 border border-gray-700 rounded" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm mb-1">RAM (GB)</label>
                            <input type="number" value={edit.ram} onChange={e => updateField('ram', Number(e.target.value))} className="w-full p-2 bg-gray-800 border border-gray-700 rounded" />
                        </div>
                        <div>
                            <label className="block text-sm mb-1">Speicher (GB)</label>
                            <input type="number" value={edit.disk} onChange={e => updateField('disk', Number(e.target.value))} className="w-full p-2 bg-gray-800 border border-gray-700 rounded" />
                        </div>
                        <div>
                            <label className="block text-sm mb-1">Backups</label>
                            <input type="number" value={edit.backup} onChange={e => updateField('backup', Number(e.target.value))} className="w-full p-2 bg-gray-800 border border-gray-700 rounded" />
                        </div>
                        <div>
                            <label className="block text-sm mb-1">DB-Tabellen</label>
                            <input type="number" value={edit.tables} onChange={e => updateField('tables', Number(e.target.value))} className="w-full p-2 bg-gray-800 border border-gray-700 rounded" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm mb-1 mt-4">Preis (€)</label>
                        <input type="number" value={edit.price_eur} onChange={e => updateField('price_eur', parseFloat(e.target.value))} className="w-full p-2 bg-gray-800 border border-gray-700 rounded" />
                    </div>

                    <div>
                        <label className="block text-sm mb-1 mt-4">Sortierung</label>
                        <input type="number" value={edit.sort} onChange={e => updateField('sort', Number(e.target.value))} className="w-full p-2 bg-gray-800 border border-gray-700 rounded" />
                    </div>

                    <label className="flex items-center gap-2">
                        <input type="checkbox" checked={edit.price_dynamic} onChange={e => updateField('price_dynamic', e.target.checked)} />
                        Dynamisch?
                    </label>

                    <div className="space-x-2">
                        <button onClick={save} className="bg-green-600 px-4 py-2 rounded">Speichern</button>
                        <button onClick={() => setEdit(null)} className="bg-gray-700 px-4 py-2 rounded">Abbrechen</button>
                    </div>
                </div>
            )}
        </div>
    )
}
