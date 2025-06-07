'use client'

import { useEffect, useState } from 'react'

export function usePermissions() {
  const [permissions, setPermissions] = useState<string[]>([])
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    if (!token) return

    fetch('http://localhost:3001/api/auth/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        if (data?.permissions) setPermissions(data.permissions)
        setIsReady(true)
      })
      .catch(() => setIsReady(true))
  }, [])

  const hasPermission = (perm: string) => permissions.includes(perm)

  return { permissions, hasPermission, isReady }
}
