'use client'

import { Bell, Search, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface AdminHeaderProps {
  admin: {
    name: string
    username: string
    role: string
  }
}

export function AdminHeader({ admin }: AdminHeaderProps) {
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' })
      window.location.href = '/admin/login'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#e5e7eb]">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Search */}
        <div className="flex items-center space-x-4 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7280]" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-10 bg-[#f0f2f5] border-[#e5e7eb] text-[#1a1a1a] placeholder:text-[#6b7280] focus:border-[#00D09C] focus:ring-[#00D09C]/10"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="text-[#6b7280] hover:text-[#1a1a1a] hover:bg-[#f0f2f5]">
            <Bell className="h-5 w-5" />
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <Avatar className="h-8 w-8 bg-[#00D09C]/10">
                  <AvatarFallback className="text-[#00D09C]">
                    {admin.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-[#1a1a1a]">{admin.name}</span>
                  <span className="text-xs text-[#6b7280]">{admin.role}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border-[#e5e7eb] text-[#1a1a1a]">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#e5e7eb]" />
              <DropdownMenuItem asChild>
                <a href="/admin/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#e5e7eb]" />
              <DropdownMenuItem onClick={handleLogout} className="text-[#00a080] hover:text-[#00a080] hover:bg-[#00a080]/10">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}