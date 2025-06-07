'use client'

import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold text-red-500 mb-4">🚫 Zugriff verweigert</h1>
      <p className="text-lg text-gray-300 mb-6">
        Du bist nicht berechtigt, diese Seite aufzurufen.
      </p>
      <Link href="/">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded">
          Zur Startseite
        </button>
      </Link>
    </div>
  )
}
