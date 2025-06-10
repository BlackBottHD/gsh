'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Game = {
  id: string
  name: string
  variants?: {
    id: number
    variant_name: string
    version: string
  }[]
}

type Paket = {
  id: string
  label?: string
  ram: number
  disk: number
  backup: number
  tables: number
  priceCoinDay?: number
  price_dynamic?: boolean
  games?: Game[]
}

export default function HomePage() {
  const router = useRouter()
  const [pakete, setPakete] = useState<Paket[]>([])

  useEffect(() => {
    fetch('http://10.1.0.122:3001/api/pakete')
      .then(res => res.json())
      .then(setPakete)
      .catch(err => console.error('Fehler beim Laden der Pakete:', err))
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <main className="p-8">
        <h2 className="text-2xl font-semibold mb-6 text-white text-center">
          Wähle dein Paket
        </h2>

        <div className="flex flex-wrap gap-8 justify-center">
          {pakete.map((paket) => {
            const games = paket.games || []
            const visibleGames = games.slice(0, 3)
            const hiddenGames = games.slice(3)

            return (
              <div
                key={paket.id}
                className="w-80 h-[420px] bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col justify-between hover:ring-2 hover:ring-green-600 transition"
              >
                <div className="flex-grow">
                  <h3 className="text-xl font-bold mb-2 uppercase text-white">
                    {paket.label || paket.id}
                  </h3>
                  <div className="mb-5 text-sm text-gray-300">
                    {paket.price_dynamic ? (
                      <ul className="space-y-1">
                        <li>
                          <span className="font-medium text-green-400">
                            Konfiguriere dir deinen Wunsch-Server!
                          </span>
                        </li>
                        <li>RAM: <span className="font-medium">ab 17 GB</span></li>
                        <li>Speicher: <span className="font-medium">ab 60 GB</span></li>
                        <li>Backups: <span className="font-medium">2 Backups</span></li>
                        <li>
                          Preis: <span className="text-green-400 font-semibold">ab 6 Coins / Tag</span>
                        </li>
                      </ul>
                    ) : (
                      <ul className="space-y-1">
                        <li>RAM: <span className="font-medium">{paket.ram} GB</span></li>
                        <li>Speicher: <span className="font-medium">{paket.disk} GB</span></li>
                        <li>Backups: <span className="font-medium">{paket.backup}</span></li>
                        <li>Datenbank-Tabellen: <span className="font-medium">{paket.tables}</span></li>
                        <li>
                          Preis: <span className="text-green-400 font-semibold">{paket.priceCoinDay?.toFixed(2)} Coins / Tag</span>
                        </li>
                      </ul>
                    )}
                  </div>

                  {/* Spieleanzeige */}
                  <div className="relative group mt-2">
                    <div className="flex gap-2 flex-wrap">
                      {visibleGames.map(game => (
                        <div
                          key={game.id}
                          className="flex items-center gap-1 bg-gray-700 px-2 py-1 rounded text-xs text-gray-200"
                        >
                          <img src={`/games/${game.id}.jpg`} alt={game.name} className="w-4 h-4 rounded" />
                          <span>{game.name}</span>
                        </div>
                      ))}

                      {hiddenGames.length > 0 && (
                        <span className="px-2 py-1 bg-gray-600 rounded text-xs cursor-pointer group-hover:hidden text-gray-300">
                          weitere Spiele
                        </span>
                      )}
                    </div>

                    {/* Dropdown bei Hover */}
                    {hiddenGames.length > 0 && (
                      <div className="absolute z-20 hidden group-hover:flex flex-wrap gap-2 bg-gray-900 border border-gray-700 rounded shadow-lg p-2 mt-2">
                        {hiddenGames.map(game => (
                          <div
                            key={game.id}
                            className="flex items-center gap-1 bg-gray-700 px-2 py-1 rounded text-xs text-gray-200"
                          >
                            <img src={`/games/${game.id}.jpg`} alt={game.name} className="w-4 h-4 rounded" />
                            <span>{game.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => router.push(`/server-erstellen?paket=${paket.id}`)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl w-full mt-6 font-semibold transition"
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
