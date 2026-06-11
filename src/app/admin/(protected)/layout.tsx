import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'

export const dynamic = 'force-dynamic'

async function checkAdminAuth() {
  const { cookies } = await import('next/headers')
  const cookieStore = cookies()
  const token = cookieStore.get('admin-token')?.value

  if (!token) {
    return null
  }

  try {
    const { getAdminFromToken } = await import('@/lib/admin-auth')
    return await getAdminFromToken(token)
  } catch (error) {
    console.error('Auth check error:', error)
    return null
  }
}

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await checkAdminAuth()

  if (!admin) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-[#0F1117]">
      <AdminSidebar />
      <div className="lg:pl-64">
        <AdminHeader admin={admin} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}