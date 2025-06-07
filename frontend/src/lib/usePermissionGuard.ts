'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { usePermissions } from './usePermissions' // oder aus anderem Pfad

export function usePermissionGuard(required: string | string[]) {
  const { hasPermission, isReady } = usePermissions()
  const router = useRouter()

  useEffect(() => {
    if (!isReady) return

    const perms = Array.isArray(required) ? required : [required]
    const granted = perms.some(p => hasPermission(p))

    if (!granted) {
      router.replace('/unauthorized') // Zeige Fehlerseite an
    }
  }, [required, hasPermission, isReady])
}
