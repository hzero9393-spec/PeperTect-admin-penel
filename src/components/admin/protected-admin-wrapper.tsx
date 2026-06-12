'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAdmin } from '@/contexts/admin-context'

export function ProtectedAdminWrapper({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAdmin()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !admin) {
      router.push('/admin/login')
    }
  }, [admin, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F1117]">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!admin) {
    return null
  }

  return <>{children}</>
}