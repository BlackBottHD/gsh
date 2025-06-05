'use client'

import LoginCheckPopup from '@/components/LoginCheckPopup'
import { useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const params = useSearchParams()
  const redirect = params.get('redirect') || '/'

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <LoginCheckPopup forceShow forceRedirectTo={redirect} />
    </div>
  )
}
