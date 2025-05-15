'use client'

import Link from 'next/link'
import React from 'react'

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-gray-900 to-gray-700 text-white shadow p-4 flex justify-between items-center">
      <Link href="/">
        <h1 className="text-lg font-bold tracking-wide">HGDEVS Gameserver Hosting</h1>
      </Link>
      <Link href="/login">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
          Login
        </button>
      </Link>
    </header>
  )
}
