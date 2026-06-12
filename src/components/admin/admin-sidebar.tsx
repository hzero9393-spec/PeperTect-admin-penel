'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  CandlestickChart,
  BarChart3,
  Trophy,
  BookOpen,
  HeadphonesIcon,
  Bell,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
  { icon: Users, label: 'Users', href: '/admin/users' },
  { icon: CreditCard, label: 'Subscriptions', href: '/admin/subscriptions' },
  { icon: CandlestickChart, label: 'Trading', href: '/admin/trading' },
  { icon: BarChart3, label: 'Market Data', href: '/admin/market' },
  { icon: Trophy, label: 'Challenges', href: '/admin/challenges' },
  { icon: BookOpen, label: 'Learning', href: '/admin/learning' },
  { icon: HeadphonesIcon, label: 'Support', href: '/admin/support' },
  { icon: Bell, label: 'Notifications', href: '/admin/notifications' },
  { icon: TrendingUp, label: 'Analytics', href: '/admin/analytics' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' })
      toast.success('Logged out successfully')
      window.location.href = '/admin/login'
    } catch (error) {
      toast.error('Logout failed')
    }
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 z-50 p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-white text-gray-700 hover:bg-gray-100 border border-[#e5e7eb]"
        >
          {isMobileOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 h-screen w-64 bg-white border-r border-[#e5e7eb]
          flex flex-col z-50
          transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-[#e5e7eb]">
          <div className="flex size-9 items-center justify-center rounded-lg bg-[#00D09C]">
            <TrendingUp className="size-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#1a1a1a]">Pepertect</h1>
            <p className="text-[10px] text-[#6b7280]">Admin Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-3">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-colors
                    ${isActive
                      ? 'bg-[#00D09C]/10 text-[#00D09C]'
                      : 'text-[#6b7280] hover:bg-[#f0f2f5] hover:text-[#1a1a1a]'
                    }
                  `}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </ScrollArea>

        {/* Logout */}
        <div className="px-3 py-3 border-t border-[#e5e7eb]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs font-medium text-[#d44a2d] hover:bg-[#eb5b3c]/10 transition-colors"
          >
            <LogOut className="size-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}