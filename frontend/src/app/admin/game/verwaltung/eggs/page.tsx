'use client'

import { useEffect, useState } from 'react'
import { usePermissionGuard } from '@/lib/usePermissionGuard'
import { usePermissions } from '@/lib/usePermissions'

type Mapping = {
  id: number
  game_id: string
  variant_id: number | null
  variant_name: string // Added optional property
  egg_id: number
}

type Egg = {
  id: number
  name: string
  description: string
  docker_image: string
  nest: string
  nest_id: number
}

type Game = {
  game_id: string
  name: string
  variants: {
    id: number
    variant_name: string
  }[]
}

export default function EggMappingPage() {
  usePermissionGuard('admin.eggs.view')
  const { hasPermission } = usePermissions()
  const [mappings, setMappings] = useState<Mapping[]>([])
  const [eggs, setEggs] = useState<Egg[]>([])
  const [gameOptions, setGameOptions] = useState<{ label: string, value: string }[]>([])
  const [gameSelection, setGameSelection] = useState('')
  const [eggSelection, setEggSelection] = useState('')

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editEggId, setEditEggId] = useState<string>('')

  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('auth_token'))
    }
  }, [])

  useEffect(() => {
    if (!token) return
    fetchMappings()
    fetchGames()
  }, [token])

  const fetchMappings = async () => {
    const res = await fetch('http://10.1.0.122:3001/api/admin/eggs', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (json.map) setMappings(json.map)
    if (json.eggs) setEggs(json.eggs)
  }

  const fetchGames = async () => {
    const res = await fetch('http://10.1.0.122:3001/api/admin/games', {
      headers: { Authorization: `Bearer ${token}` }
    })
    const games: Game[] = await res.json()
    const options: { label: string, value: string }[] = []

    for (const game of games) {
      options.push({ label: game.name, value: `${game.game_id}|` })
      for (const variant of game.variants) {
        options.push({ label: `${game.name} – ${variant.variant_name}`, value: `${game.game_id}|${variant.id}` })
      }
    }

    setGameOptions(options)
  }

  const saveMapping = async () => {
    if (!gameSelection || !eggSelection) return

    const [game_id, variant_id] = gameSelection.split('|')
    await fetch('http://10.1.0.122:3001/api/admin/eggs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        game_id,
        variant_id: variant_id ? Number(variant_id) : null,
        egg_id: Number(eggSelection)
      })
    })

    setGameSelection('')
    setEggSelection('')
    fetchMappings()
  }

  const deleteMapping = async (id: number) => {
    await fetch(`http://10.1.0.122:3001/api/admin/eggs/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    fetchMappings()
  }

  const updateMapping = async (id: number) => {
    if (!editEggId) return
    await fetch(`http://10.1.0.122:3001/api/admin/eggs/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ egg_id: Number(editEggId) }),
    })
    setEditingId(null)
    setEditEggId('')
    fetchMappings()
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

      <h1 className="text-2xl font-bold mb-6">Egg-Zuordnung</h1>


      {hasPermission('admin.eggs.create') && (<div className="flex gap-4 mb-6">
        <select
          value={gameSelection}
          onChange={e => setGameSelection(e.target.value)}
          className="p-2 bg-gray-800 border border-gray-700 rounded w-1/2"
        >
          <option value="">Spiel auswählen…</option>
          {gameOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          value={eggSelection}
          onChange={e => setEggSelection(e.target.value)}
          className="p-2 bg-gray-800 border border-gray-700 rounded w-1/2"
        >
          <option value="">Egg auswählen…</option>
          {eggs.map(egg => (
            <option key={egg.id} value={egg.id}>
              {egg.nest} / {egg.name}
            </option>
          ))}
        </select>

        <button
          onClick={saveMapping}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
        >
          Speichern
        </button>
      </div>)}

      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-700">
            <th className="p-2 text-left">game_id</th>
            <th className="p-2 text-left">variant_name</th>
            <th className="p-2 text-left">Egg-ID</th>
            <th className="p-2 text-right">Aktion</th>
          </tr>
        </thead>
        <tbody>
          {mappings.map(m => (
            <tr key={m.id} className="border-t border-gray-700">
              <td className="p-2">{m.game_id ? `${m.game_id || 'Unbekannt'}` : 'Hauptspiel'}</td>
              <td className="p-2">{m.variant_id ? `${m.variant_name} (#${m.variant_id})` : 'Hauptspiel'}</td>
              <td className="p-2">
                {editingId === m.id ? (
                  <select
                    value={editEggId}
                    onChange={e => setEditEggId(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1"
                  >
                    <option value="">Egg auswählen…</option>
                    {eggs.map(egg => (
                      <option key={egg.id} value={egg.id}>
                        {egg.nest} / {egg.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  m.egg_id
                )}
              </td>
              <td className="p-2 text-right space-x-2">
                {editingId === m.id ? (
                  <>
                    {hasPermission('admin.eggs.edit') && (
                      <button
                        onClick={() => updateMapping(m.id)}
                        className="text-green-400 hover:text-green-600"
                      >
                        Speichern
                      </button>
                    )}
                    <button
                      onClick={() => { setEditingId(null); setEditEggId('') }}
                      className="text-gray-400 hover:text-white"
                    >
                      Abbrechen
                    </button>
                  </>
                ) : (
                  <>
                    {hasPermission('admin.eggs.edit') && (
                      <button
                        onClick={() => {
                          setEditingId(m.id)
                          setEditEggId(String(m.egg_id))
                        }}
                        className="text-yellow-400 hover:text-yellow-600"
                      >
                        Bearbeiten
                      </button>
                    )}
                    {hasPermission('admin.eggs.delete') && (
                      <button
                        onClick={() => deleteMapping(m.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        Löschen
                      </button>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
