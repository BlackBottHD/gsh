'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import LoginCheckPopup from '@/components/LoginCheckPopup'

type GameVariant = {
  id: number
  variant_name: string
  version: string
  excluded_pakete?: string[]
}

type Game = {
  id: string
  name: string
  variants?: GameVariant[]
}

type Paket = {
  id: string
  label?: string
  ram: number
  disk: number
  backup: number
  tables: number
  price_eur?: number
  price_dynamic?: boolean
  games?: Game[]
}

export default function ServerErstellenPage() {
  const searchParams = useSearchParams()
  const [paketId, setPaketId] = useState<string | null>(null)
  const [paket, setPaket] = useState<Paket | null>(null)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null)
  const [serverName, setServerName] = useState('')

  useEffect(() => {
    const param = searchParams?.get('paket')
    if (param && paketId !== param) {
      setPaketId(param)
    }
  }, [searchParams, paketId])

  useEffect(() => {
    if (!paketId) return

    fetch('http://10.1.0.122:3001/api/pakete')
      .then(res => res.json())
      .then((pakete: Paket[]) => {
        const found = pakete.find(p => p.id === paketId)
        if (found) setPaket(found)
        else console.warn(`Paket mit ID "${paketId}" nicht gefunden.`)
      })
      .catch(err => console.error('Fehler beim Laden der Paketdaten:', err))
  }, [paketId])

  const handleSubmit = async () => {
    if (!selectedGame || !serverName || !paket) {
      alert('Bitte Spiel und Namen auswählen.')
      return
    }

    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    if (!token) {
      alert('Nicht eingeloggt. Bitte neu anmelden.')
      return
    }

    const payload: any = {
      paketId: paket.id,
      gameId: selectedGame.id,
      serverName,
    }

    if (selectedVariantId) {
      payload.variantId = selectedVariantId
    }

    try {
      const res = await fetch('http://10.1.0.122:3001/api/server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Fehler beim Erstellen des Servers.')

      alert('Server wurde erfolgreich erstellt.')
    } catch (err) {
      console.error('Fehler beim Erstellen:', err)
      alert('Fehler beim Erstellen des Servers.')
    }
  }

  if (!paketId) return <div className="p-8 text-white">Lade Paket-ID…</div>
  if (!paket) return <div className="p-8 text-white">Lade Paketdaten…</div>

  return (
    <>
      <LoginCheckPopup />
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <main className="p-8 max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">
            Server erstellen <span className="text-green-400">{paket.label}</span>
          </h1>

          {/* Servername */}
          <div className="mb-4">
            <label className="block mb-1 font-medium">Servername</label>
            <input
              value={serverName}
              onChange={e => setServerName(e.target.value)}
              className="w-full p-2 border border-gray-700 bg-gray-800 rounded text-white"
              placeholder="z. B. Mein Minecraft Server"
            />
          </div>

          {/* Spielauswahl */}
          <div className="mb-6">
            <label className="block mb-1 font-medium">Spiel auswählen</label>
            <div className="flex gap-3 flex-wrap">
              {(paket.games || []).map(game => (
                <div
                  key={game.id}
                  onClick={() => {
                    setSelectedGame(game)
                    setSelectedVariantId(null) // Reset Variant on Game change
                  }}
                  className={`cursor-pointer border rounded p-2 flex flex-col items-center w-28 text-xs transition
                    ${selectedGame?.id === game.id
                      ? 'border-green-500 bg-green-800'
                      : 'border-gray-700 bg-gray-800 hover:bg-gray-700'}`}
                >
                  <img
                    src={`/games/${game.id}.jpg`}
                    alt={game.name}
                    className="w-12 h-12 object-cover rounded mb-1"
                  />
                  <span className="text-center font-semibold">{game.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Varianten-Auswahl */}
          {(selectedGame?.variants?.length ?? 0) > 0 && (
            <div className="mb-6">
              <label className="block mb-1 font-medium">Variante auswählen</label>
              <select
                className="w-full p-2 border border-gray-700 bg-gray-800 rounded text-white"
                value={selectedVariantId ?? ''}
                onChange={e => setSelectedVariantId(Number(e.target.value))}
              >
                <option value="" disabled>Bitte Variante wählen</option>
                {(selectedGame?.variants ?? [])
                  .filter(variant => !variant.excluded_pakete?.includes(paket.id))
                  .map(variant => (
                    <option key={variant.id} value={variant.id}>
                      {variant.variant_name} ({variant.version})
                    </option>
                  ))}
              </select>
            </div>
          )}




          {/* Paketbeschreibung */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Dein gewähltes Paket</h2>
            <ul className="list-disc list-inside text-gray-300 text-sm">
              <li><strong>RAM:</strong> {paket.ram} GB</li>
              <li><strong>Speicher:</strong> {paket.disk} GB</li>
              <li><strong>Backups:</strong> {paket.backup}</li>
              <li><strong>Datenbank-Tabellen:</strong> {paket.tables}</li>
            </ul>
            <p className="mt-2 text-sm text-gray-400">
              Nach der Buchung kannst du dein Paket jederzeit im Verwaltungsportal erweitern.
            </p>
          </div>

          <button
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={!selectedGame || !serverName || (!!selectedGame.variants?.length && !selectedVariantId)}
          >
            Server erstellen
          </button>
        </main>
      </div>
    </>
  )
}
