'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import md5 from 'md5'
import { usePermissions } from '@/lib/usePermissions' // passe den Pfad ggf. an

type UserInfo = {
  email: string
  username: string
}

export default function Header() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { hasPermission, isReady } = usePermissions()

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) return

    fetch('http://localhost:3001/api/auth/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.id) {
          setUser(data)
        }
      })
      .catch(() => null)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    router.push('/login')
  }

  const gravatarUrl = user?.email
    ? `https://www.gravatar.com/avatar/${md5(user.email.trim().toLowerCase())}?s=36&d=identicon`
    : null

  return (
    <header className="bg-gradient-to-r from-gray-900 to-gray-700 text-white shadow p-4 flex justify-between items-center relative z-50">
      <Link href="/">
        <h1 className="text-lg font-bold tracking-wide">HGDEVS Gameserver Hosting</h1>
      </Link>

      {user && gravatarUrl ? (
        <div className="flex items-center gap-6">
          {/* Navigation */}
          <nav className="hidden sm:flex gap-4 text-sm">
            <Link href="/dashboard" className="hover:text-gray-300">Dashboard</Link>
            {isReady && hasPermission('admin.dashboard.open') && (
              <Link href="/admin" className="hover:text-gray-300">Adminportal</Link>
            )}
          </nav>

          {/* Gravatar + Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              className="flex items-center gap-2"
              onClick={() => setMenuOpen(prev => !prev)}
            >
              <img
                src={gravatarUrl}
                alt="User Avatar"
                className="w-10 h-10 rounded-full"
              />
              <span className="hidden sm:inline">{user.username}</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 bg-gray-800 border border-gray-600 rounded shadow-lg w-48 py-1 text-sm">
                <Link href="/account" className="block px-4 py-2 hover:bg-gray-700">Account</Link>
                <Link href="/guthaben" className="block px-4 py-2 hover:bg-gray-700">Guthaben</Link>
                <Link href="/aufladen" className="block px-4 py-2 hover:bg-gray-700">Aufladen</Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-red-600 hover:text-white"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <Link href="/login">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            Login
          </button>
        </Link>
      )}
    </header>
  )
}
