'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePermissionGuard } from '@/lib/usePermissionGuard'
import { usePermissions } from '@/lib/usePermissions'

export default function GamesDashboardPage() {
  usePermissionGuard('admin.dashboard.open')
  const { hasPermission } = usePermissions()

  const sections = [
    {
      label: 'Pakete verwalten',
      href: '/admin/game/verwaltung/pakete',
      perm: 'admin.pakete.view',
      description: 'Hosting-Pakete erstellen, bearbeiten und verwalten.',
    },
    {
      label: 'Spiele verwalten',
      href: '/admin/game/verwaltung/games',
      perm: 'admin.games.view',
      description: 'Spiele und Varianten für Server konfigurieren.',
    },
    {
      label: 'Eggs verwalten',
      href: '/admin/game/verwaltung/eggs',
      perm: 'admin.eggs.view',
      description: 'Pterodactyl-Eggs zuweisen und verwalten.',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">🧩 Spiele & Pakete</h1>
      <p className="text-gray-400 mb-6">Verwalte deine Gameserver-Integrationen, Hosting-Pakete und Eggs.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sections.map((s, i) =>
          hasPermission(s.perm) ? (
            <Link href={s.href} key={i}>
              <div className="bg-gray-800 p-4 rounded shadow cursor-pointer hover:bg-gray-700 transition">
                <h2 className="text-lg font-semibold mb-2">{s.label}</h2>
                <p className="text-gray-400 text-sm">{s.description}</p>
              </div>
            </Link>
          ) : null
        )}
      </div>
    </div>
  )
}
