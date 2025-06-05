'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import LoginCheckPopup from '@/components/LoginCheckPopup'


type Paket = {
  id: string
  label?: string
  ram: number
  disk: number
  backup: number
  tables: number
  price_eur?: number
  price_dynamic?: boolean
  games?: string[]
}

export default function ServerErstellenPage() {
  const searchParams = useSearchParams()
  const [paketId, setPaketId] = useState<string | null>(null)
  const [paket, setPaket] = useState<Paket | null>(null)
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [serverName, setServerName] = useState('')

  // Paket-ID aus URL lesen
  useEffect(() => {
    const param = searchParams?.get('paket')
    if (!param) {
      console.warn('[HGDEVS] Kein Paket-Parameter in der URL übergeben.')
    } else if (paketId !== param) {
      console.debug('[HGDEVS] Paket-Parameter erkannt:', param)
      setPaketId(param)
    }
  }, [searchParams, paketId])

  // Paketdaten laden
  useEffect(() => {
    if (!paketId) return

    console.debug('[HGDEVS] Lade Daten für Paket-ID:', paketId)

    fetch('http://localhost:3001/api/pakete')
      .then(res => res.json())
      .then((pakete: Paket[]) => {
        const found = pakete.find(p => p.id === paketId)
        if (!found) {
          console.warn(`[HGDEVS] Paket mit ID "${paketId}" wurde nicht gefunden.`)
          return
        }

        setPaket(found)
      })
      .catch(err => {
        console.error('[HGDEVS] Fehler beim Laden der Daten:', err)
      })
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
  
    const payload = {
      paketId: paket.id,
      gameId: selectedGame,
      serverName,
    }
  
    try {
      const res = await fetch('http://localhost:3001/api/server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
  
      const data = await res.json()
  
      if (!res.ok) {
        throw new Error(data.message || 'Fehler beim Erstellen des Servers.')
      }
  
      console.log('[HGDEVS] Server erfolgreich erstellt:', data)
      alert('Server wurde erstellt.')
      // Optional: Redirect oder zur Verwaltungsseite
    } catch (err) {
      console.error('[HGDEVS] Fehler beim Erstellen:', err)
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

          <div className="mb-4">
            <label className="block mb-1 font-medium">Servername</label>
            <input
              value={serverName}
              onChange={e => setServerName(e.target.value)}
              className="w-full p-2 border border-gray-700 bg-gray-800 rounded text-white"
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
                  className={`cursor-pointer border rounded p-2 flex flex-col items-center w-24 text-xs ${selectedGame === gameId ? 'border-blue-500 bg-blue-800' : 'border-gray-700 bg-gray-800'}`}
                >
                  <img
                    src={`/games/${gameId}.jpg`}
                    alt={gameId}
                    className="w-12 h-12 object-cover rounded mb-1"
                  />
                  <span className="text-center font-semibold">{gameId}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Paket-Leistung anzeigen */}
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
            disabled={!selectedGame || !serverName}
          >
            Server erstellen
          </button>
        </main>
      </div>
    </>
  )
}
