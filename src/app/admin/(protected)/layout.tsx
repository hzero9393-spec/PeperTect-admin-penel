import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'

export const dynamic = 'force-dynamic'

async function checkAdminAuth() {
  try {
    const { headers } = await import('next/headers')
    const headersList = headers()
    const cookieHeader = headersList.get('cookie') || ''
    
    // Parse cookies manually from the header
    const cookies: Record<string, string> = {}
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=')
      if (name && value) {
        cookies[name] = value
      }
    })
    
    const token = cookies['admin-token']

    if (!token) {
      // TEMPORARY: Return a dummy admin for testing
      return {
        id: 'test',
        username: 'admin',
        name: 'Admin',
        email: 'admin@test.com',
        role: 'SUPER_ADMIN',
      }
    }

    const { getAdminFromToken } = await import('@/lib/admin-auth')
    return await getAdminFromToken(token)
  } catch (error) {
    console.error('Auth check error:', error)
    // TEMPORARY: Return a dummy admin for testing
    return {
      id: 'test',
      username: 'admin',
      name: 'Admin',
      email: 'admin@test.com',
      role: 'SUPER_ADMIN',
    }
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