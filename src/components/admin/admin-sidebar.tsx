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
          className="bg-[#1A1D29] text-white hover:bg-[#2A2D3A]"
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
          fixed lg:sticky top-0 h-screen w-64 bg-[#1A1D29] border-r border-[#2A2D3A]
          flex flex-col z-50
          transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-[#2A2D3A]">
          <Link href="/admin/dashboard" className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-[#00D09C]/20 flex items-center justify-center">
              <CandlestickChart className="h-6 w-6 text-[#00D09C]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Pepertect</h1>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                  ${isActive
                    ? 'bg-[#00D09C]/20 text-[#00D09C]'
                    : 'text-gray-400 hover:text-white hover:bg-[#2A2D3A]'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-[#2A2D3A]">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-gray-400 hover:text-white hover:bg-[#2A2D3A]"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>
    </>
  )
}