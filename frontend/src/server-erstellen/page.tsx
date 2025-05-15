'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'


type Paket = {
  id: string
  ram: number
  disk: number
  backup: number
  tables: number
  price_eur?: number
  price_dynamic?: boolean
  games?: string[]
}

type GameInfo = {
  id: string
  name: string
  engine: string
}

export default function ServerErstellenPage() {
  const searchParams = useSearchParams()
  const [paketId, setPaketId] = useState<string | null>(null)
  const [paket, setPaket] = useState<Paket | null>(null)
  const [gamesMap, setGamesMap] = useState<Record<string, GameInfo>>({})
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [serverName, setServerName] = useState('')

  // hole ?paket=...
  useEffect(() => {
    const param = searchParams.get('paket')
    if (param) setPaketId(param)
  }, [searchParams])

  // lade Paket + Games
  useEffect(() => {
    if (!paketId) return

    Promise.all([
      fetch('http://localhost:3001/api/pakete').then(r => r.json()),
      fetch('http://localhost:3001/api/games').then(r => r.json())
    ]).then(([pakete, games]) => {
      const found = pakete.find((p: Paket) => p.id === paketId)
      if (found) setPaket(found)

      const map: Record<string, GameInfo> = {}
      games.forEach((g: GameInfo) => (map[g.id] = g))
      setGamesMap(map)
    })
  }, [paketId])

  const handleSubmit = () => {
    if (!selectedGame || !serverName || !paket) {
      alert('Bitte Spiel und Namen auswählen.')
      return
    }

    console.log('Neuer Server:', {
      paket: paket.id,
      game: selectedGame,
      name: serverName,
    })

    // TODO: POST an Backend senden
  }

  if (!paketId) return <div className="p-8">Lade Paket...</div>
  if (!paket) return <div className="p-8">Lade Paketdaten...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Server erstellen ({paket.id.toUpperCase()})</h1>
      <Header />


      <div className="mb-4">
        <label className="block mb-1 font-medium">Servername</label>
        <input
          value={serverName}
          onChange={e => setServerName(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="z. B. Mein Minecraft Server"
        />
      </div>

      <div className="mb-6">
        <label className="block mb-1 font-medium">Spiel auswählen</label>
        <div className="flex gap-3 flex-wrap">
          {(paket.games || []).map(gameId => (
            <div
              key={gameId}
              onClick={() => setSelectedGame(gameId)}
              className={`cursor-pointer border rounded p-2 flex flex-col items-center w-24 text-xs ${
                selectedGame === gameId ? 'border-blue-600 bg-blue-100' : 'border-gray-300 bg-white'
              }`}
            >
              <img
                src={`/games/${gameId}.jpg`}
                alt={gameId}
                className="w-12 h-12 object-cover rounded mb-1"
              />
              <span className="text-center">{gamesMap[gameId]?.name || gameId}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={!selectedGame || !serverName}
      >
        Server erstellen
      </button>
    </div>
  )
}
