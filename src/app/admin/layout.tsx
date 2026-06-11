import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'

export const dynamic = 'force-dynamic'

async function checkAdminAuth() {
  const cookieStore = cookies()
  const token = cookieStore.get('admin-token')?.value

  if (!token) {
    return null
  }

  try {
    const { getAdminFromToken } = await import('@/lib/admin-auth')
    return await getAdminFromToken(token)
  } catch (error) {
    return null
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}