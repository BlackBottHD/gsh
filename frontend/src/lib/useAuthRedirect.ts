'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function useAuthRedirect() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    if (!token) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
      return
    }

    fetch('http://10.1.0.122:3001/api/auth/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        if (!data?.user) {
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
        }
      })
      .catch(() => {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
      })
  }, [router, pathname])
}
