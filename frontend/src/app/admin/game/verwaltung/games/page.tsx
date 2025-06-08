'use client'

import { useEffect, useState } from 'react'
import { usePermissionGuard } from '@/lib/usePermissionGuard'
import { usePermissions } from '@/lib/usePermissions'

type Paket = { id: string; label?: string }
type Variant = { id?: number; variant_name: string; version: string; excluded_pakete: string[] }
type Game = { game_id: string; name: string; variants: Variant[]; pakete: string[] }

export default function GamesAdminPage() {
  usePermissionGuard('admin.games.view')
  const { hasPermission } = usePermissions()
  const [games, setGames] = useState<Game[]>([])
  const [edit, setEdit] = useState<Game | null>(null)
  const [pakete, setPakete] = useState<Paket[]>([])
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('auth_token'))
    }
  }, [])

  useEffect(() => {
    if (!token) return
    fetch('http://localhost:3001/api/pakete').then(res => res.json()).then(setPakete)
    fetchGames()
  }, [token])

  const fetchGames = async () => {
    const res = await fetch('http://localhost:3001/api/admin/games', {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    setGames(data)
  }

  const updateField = (field: keyof Game, value: any) => {
    setEdit(prev => prev ? { ...prev, [field]: value } : null)
  }

  const updateVariant = (index: number, field: keyof Variant, value: string) => {
    if (!edit) return
    const updated = [...edit.variants]
    if (field === 'excluded_pakete') {
      updated[index][field] = value.split(',') as string[]
    } else {
      updated[index][field as keyof Variant] = value as never
    }
    setEdit({ ...edit, variants: updated })
  }

  const toggleExclude = (variantIndex: number, paketId: string) => {
    if (!edit) return
    const updated = [...edit.variants]
    const list = updated[variantIndex].excluded_pakete
    updated[variantIndex].excluded_pakete = list.includes(paketId)
      ? list.filter(id => id !== paketId)
      : [...list, paketId]
    setEdit({ ...edit, variants: updated })
  }

  const toggleGlobalPaket = (paketId: string) => {
    if (!edit) return
    const newList = edit.pakete.includes(paketId)
      ? edit.pakete.filter(id => id !== paketId)
      : [...edit.pakete, paketId]
    setEdit({ ...edit, pakete: newList })
  }

  const save = async () => {
    if (!edit?.game_id || !edit.name || !edit.variants.length) return alert('Felder unvollständig')
    const method = 'POST'

    const res = await fetch('http://localhost:3001/api/admin/games', {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(edit)
    })

    if (res.ok) {
      setEdit(null)
      fetchGames()
    } else {
      alert('Fehler beim Speichern')
    }
  }

  const del = async (id: string) => {
    if (!confirm('Wirklich löschen?')) return
    await fetch(`http://localhost:3001/api/admin/games/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    fetchGames()
  }

  const addVariant = () => {
    if (!edit) return
    setEdit({
      ...edit,
      variants: [...edit.variants, { variant_name: '', version: 'latest', excluded_pakete: [] }]
    })
  }

  const removeVariant = (index: number) => {
    if (!edit) return
    const updated = [...edit.variants]
    updated.splice(index, 1)
    setEdit({ ...edit, variants: updated })
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

      <h1 className="text-2xl font-bold mb-6">Spiele verwalten</h1>
      {hasPermission('admin.games.create') && (
        <button onClick={() =>
          setEdit({ game_id: '', name: '', variants: [], pakete: [] })
        } className="mb-6 bg-blue-600 px-4 py-2 rounded">
          ➕ Neues Spiel
        </button>
      )}

      <table className="w-full text-sm mb-8">
        <thead>
          <tr className="bg-gray-700">
            <th className="p-2">ID</th>
            <th className="p-2">Name</th>
            <th className="p-2">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {games.map(g => (
            <tr key={g.game_id} className="border-t border-gray-700">
              <td className="p-2">{g.game_id}</td>
              <td className="p-2">{g.name}</td>
              <td className="p-2 text-right space-x-2">
                {hasPermission('admin.games.edit') && (
                  <button onClick={() => setEdit({
                    game_id: g.game_id,
                    name: g.name,
                    variants: g.variants.map(v => ({
                      id: (v as any).id, // wichtig für späteren Bezug auf excluded_pakete
                      variant_name: v.variant_name,
                      version: v.version,
                      excluded_pakete: [...v.excluded_pakete]
                    })),
                    pakete: [...g.pakete]
                  })} className="text-yellow-400">Bearbeiten</button>
                )}
                {hasPermission('admin.games.delete') && (
                  <button onClick={() => del(g.game_id)} className="text-red-400">Löschen</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {edit && (
        <div className="bg-gray-900 p-4 rounded space-y-4">
          <h2 className="text-xl font-bold">{edit.game_id ? 'Bearbeiten' : 'Neu erstellen'}</h2>

          <input
            value={edit.game_id}
            onChange={e => updateField('game_id', e.target.value)}
            disabled={games.some(g => g.game_id === edit.game_id)}
            placeholder="Game ID"
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded"
          />
          <input
            value={edit.name}
            onChange={e => updateField('name', e.target.value)}
            placeholder="Name"
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded"
          />

          <div>
            <h3 className="font-semibold">Varianten</h3>
            {edit.variants.map((v, i) => (
              <div key={i} className="border p-3 rounded mb-3">
                <div className="flex gap-2 mb-2">
                  <input
                    value={v.variant_name}
                    onChange={e => updateVariant(i, 'variant_name', e.target.value)}
                    placeholder="Variante"
                    className="w-1/2 p-2 bg-gray-800 border border-gray-700 rounded"
                  />
                  <input
                    value={v.version}
                    onChange={e => updateVariant(i, 'version', e.target.value)}
                    placeholder="Version"
                    className="w-1/2 p-2 bg-gray-800 border border-gray-700 rounded"
                  />
                  <button onClick={() => removeVariant(i)} className="text-red-400">✕</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {pakete.map(p => (
                    <label key={p.id} className="flex gap-2 items-center">
                      <input
                        type="checkbox"
                        checked={v.excluded_pakete.includes(p.id)}
                        onChange={() => toggleExclude(i, p.id)}
                      />
                      <span className="text-gray-300">{p.label || p.id} <span className="text-red-400">(nicht verfügbar)</span></span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={addVariant} className="text-blue-400">➕ Variante</button>
          </div>

          <div>
            <h3 className="font-semibold mt-4">Globale Pakete</h3>
            <div className="grid grid-cols-2 gap-2">
              {pakete.map(p => (
                <label key={p.id} className="flex gap-2 items-center">
                  <input
                    type="checkbox"
                    checked={edit.pakete.includes(p.id)}
                    onChange={() => toggleGlobalPaket(p.id)}
                  />
                  <span>{p.label || p.id}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-x-2">
            <button onClick={save} className="bg-green-600 px-4 py-2 rounded">Speichern</button>
            <button onClick={() => setEdit(null)} className="bg-gray-700 px-4 py-2 rounded">Abbrechen</button>
          </div>
        </div>
      )}
    </div>
  )
}
