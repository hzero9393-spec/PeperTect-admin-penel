'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin/login')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f7fa]">
      <div className="text-[#6b7280]">Loading...</div>
    </div>
  )
}