'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Paket = {
  id: string
  label?: string
  ram: number
  disk: number
  backup: number
  tables: number
  priceCoinDay?: number
  price_dynamic?: boolean
  games?: string[]
}

export default function HomePage() {
  const router = useRouter()
  const [pakete, setPakete] = useState<Paket[]>([])

  useEffect(() => {
    fetch('http://localhost:3001/api/pakete')
      .then(res => res.json())
      .then(setPakete)
      .catch(err => console.error('Fehler beim Laden der Pakete:', err))
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <main className="p-8">
        <h2 className="text-2xl font-semibold mb-4">Wähle dein Paket</h2>

        <div className="flex flex-wrap gap-6 justify-center">
          {pakete.map((paket) => {
            const games = paket.games || []
            const visibleGames = games.slice(0, 3)
            const hiddenGames = games.slice(4)

            return (
              <div
                key={paket.id}
                className="w-72 h-[420px] bg-white rounded-xl shadow p-6 flex flex-col justify-between"
              >
                <div className="flex-grow">
                  <h3 className="text-lg font-bold mb-1 uppercase">{paket.label || paket.id}</h3>
                  <div className="mb-4 text-sm">
                    {paket.price_dynamic ? (
                      <p className="italic text-gray-600">Konfiguriere dir deinen Wunsch-Server!</p>
                    ) : (
                      <ul>
                        <li>RAM: {paket.ram} GB</li>
                        <li>Speicher: {paket.disk} GB</li>
                        <li>Backups: {paket.backup}</li>
                        <li>Datenbank-Tabellen: {paket.tables}</li>
                        <li>Preis: {paket.priceCoinDay?.toFixed(2)} Coins / Tag</li>
                      </ul>
                    )}
                  </div>

                  {/* Spieleanzeige */}
                  <div className="relative">
                    <div className="flex gap-2 flex-wrap">
                      {visibleGames.map(gameId => (
                        <div
                          key={gameId}
                          className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs"
                        >
                          <img src={`/games/${gameId}.jpg`} alt={gameId} className="w-4 h-4" />
                          <span>{gameId}</span>
                        </div>
                      ))}
                      {hiddenGames.length > 0 && (
                        <span className="px-2 py-1 bg-gray-300 rounded text-xs cursor-pointer group-hover:hidden">
                          weitere Spiele
                        </span>
                      )}
                    </div>

                    {hiddenGames.length > 0 && (
                      <div className="absolute z-10 hidden group-hover:flex flex-wrap gap-2 bg-white border border-gray-300 rounded shadow p-2 mt-2">
                        {hiddenGames.map(gameId => (
                          <div
                            key={gameId}
                            className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs"
                          >
                            <img src={`/games/${gameId}.jpg`} alt={gameId} className="w-4 h-4" />
                            <span>{gameId}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => router.push(`/server-erstellen?paket=${paket.id}`)}
                  className="bg-green-600 text-white px-4 py-2 rounded w-full mt-4"
                >
                  Jetzt starten
                </button>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
