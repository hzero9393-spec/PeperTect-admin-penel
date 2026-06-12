'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { User, LogOut, Shield } from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [admin, setAdmin] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const fetchAdmin = async () => {
    try {
      const response = await fetch('/api/admin/auth')
      const result = await response.json()
      if (result.success) {
        setAdmin(result.data.admin)
        setFormData({
          name: result.data.admin.name,
          email: result.data.admin.email,
        })
      }
    } catch (error) {
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdmin()
  }, [])

  const handleUpdateProfile = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const result = await response.json()
      if (result.success) {
        toast.success('Profile updated successfully')
        fetchAdmin()
      } else {
        toast.error(result.error || 'Failed to update profile')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })
      const result = await response.json()
      if (result.success) {
        toast.success('Password changed successfully')
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        toast.error(result.error || 'Failed to change password')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' })
      toast.success('Logged out successfully')
      router.push('/admin/login')
    } catch (error) {
      toast.error('Logout failed')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D09C]" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#1a1a1a]">Profile</h1>
        <p className="text-[#6b7280] mt-1">Manage your admin account</p>
      </div>

      {/* Profile Information */}
      <Card className="border-[#e5e7eb] bg-white">
        <CardHeader>
          <CardTitle className="text-[#1a1a1a] flex items-center">
            <User className="h-5 w-5 mr-2 text-[#00D09C]" />
            Profile Information
          </CardTitle>
          <CardDescription className="text-[#6b7280]">
            Update your personal details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-[#6b7280]">Username</Label>
              <Input
                value={admin?.username}
                disabled
                className="bg-[#f5f7fa] border-[#e5e7eb] text-[#6b7280]"
              />
            </div>
            <div>
              <Label className="text-[#6b7280]">Role</Label>
              <Input
                value={admin?.role}
                disabled
                className="bg-[#f5f7fa] border-[#e5e7eb] text-[#6b7280]"
              />
            </div>
            <div>
              <Label className="text-[#6b7280]">Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]"
              />
            </div>
            <div>
              <Label className="text-[#6b7280]">Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]"
              />
            </div>
          </div>
          <Button
            onClick={handleUpdateProfile}
            disabled={saving}
            className="bg-[#00D09C] hover:bg-[#00C08F] text-[#1a1a1a]"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="border-[#e5e7eb] bg-white">
        <CardHeader>
          <CardTitle className="text-[#1a1a1a] flex items-center">
            <Shield className="h-5 w-5 mr-2 text-[#00D09C]" />
            Change Password
          </CardTitle>
          <CardDescription className="text-[#6b7280]">
            Update your password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label className="text-[#6b7280]">Current Password</Label>
              <Input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]"
              />
            </div>
            <div>
              <Label className="text-[#6b7280]">New Password</Label>
              <Input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]"
              />
            </div>
            <div>
              <Label className="text-[#6b7280]">Confirm New Password</Label>
              <Input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]"
              />
            </div>
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={saving}
            variant="outline"
            className="border-[#e5e7eb] text-[#1a1a1a] hover:bg-[#f0f2f5]"
          >
            {saving ? 'Changing...' : 'Change Password'}
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-900/50 bg-white">
        <CardHeader>
          <CardTitle className="text-[#1a1a1a]">Danger Zone</CardTitle>
          <CardDescription className="text-[#6b7280]">
            Irreversible actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-[#d44a2d] text-[#d44a2d] hover:bg-[#d44a2d] hover:text-[#1a1a1a]"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}