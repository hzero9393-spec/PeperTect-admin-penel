'use client'

import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'
import { ProtectedAdminWrapper } from '@/components/admin/protected-admin-wrapper'
import { AdminProvider } from '@/contexts/admin-context'

// Default admin object for server-side rendering
const defaultAdmin = {
  id: 'server',
  username: 'admin',
  name: 'Admin',
  email: 'admin@pepertect.com',
  role: 'SUPER_ADMIN',
}

export default function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminProvider>
      <ProtectedAdminWrapper>
        <div className="min-h-screen bg-[#f5f7fa]">
          <AdminSidebar />
          <div className="lg:pl-64">
            <AdminHeader admin={defaultAdmin} />
            <main className="p-6">
              {children}
            </main>
          </div>
        </div>
      </ProtectedAdminWrapper>
    </AdminProvider>
  )
}