'use client'

export function useAuth(): boolean {
  if (typeof window === 'undefined') return false
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
  return !!token
}
