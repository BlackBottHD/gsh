'use client'

import { useEffect, useState } from 'react'

export function useAuth(): boolean {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    if (!token) {
      setIsAuthenticated(false)
      return
    }

    fetch('http://10.1.0.122:3001/api/auth/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        setIsAuthenticated(!!data?.user)
      })
      .catch(() => setIsAuthenticated(false))
  }, [])

  return isAuthenticated
}
