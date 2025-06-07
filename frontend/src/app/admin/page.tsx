'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePermissionGuard } from '@/lib/usePermissionGuard'

type StatGroup = {
  title: string
  items: { label: string, value: string | number }[]
}

export default function AdminDashboardPage() {
  usePermissionGuard('admin.dashboard.open')
  const [stats, setStats] = useState<StatGroup[]>([])

  useEffect(() => {
    const load = async () => {
      const res = await fetch('http://localhost:3001/api/admin/stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      })
      const json = await res.json()
      if (json.stats) setStats(json.stats)
    }
    load()
  }, [])

  const [rollen, setRollen] = useState<any[]>([])

  useEffect(() => {
    const fetchRollen = async () => {
      const res = await fetch('/api/rollen')
      const json = await res.json()
      const rollenData = json.rollen
      setRollen(Array.isArray(rollenData) ? rollenData : [])
    }
    fetchRollen()
  }, [])

  const gefilterteRollen = Array.isArray(rollen) ? rollen : []

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
        {stats.map((group, i) => (
          <div key={i} className="bg-gray-800 rounded shadow p-4">
            <h2 className="text-lg font-semibold mb-2">{group.title}</h2>
            <ul className="space-y-1 text-sm text-gray-300">
              {group.items.map((item, j) => (
                <li key={j} className="flex justify-between border-b border-gray-700 py-1">
                  <span>{item.label}</span>
                  <span className="font-semibold">{item.value}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/users">
          <div className="bg-gray-800 p-4 rounded shadow cursor-pointer hover:bg-gray-700 transition">
            <h2 className="text-lg font-semibold mb-2">👥 Nutzerverwaltung</h2>
            <p className="text-gray-400 text-sm">Benutzerkonten prüfen und verwalten.</p>
          </div>
        </Link>

        <div className="bg-gray-800 p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">🧩 Spiele & Pakete</h2>
          <p className="text-gray-400 text-sm">Games, Varianten & Hosting-Pakete.</p>
        </div>

        <div className="bg-gray-800 p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">🧾 Abrechnungen</h2>
          <p className="text-gray-400 text-sm">Umsätze, Coins, Stripe & Rechnungen.</p>
        </div>
      </div>
    </div>
  )
}
