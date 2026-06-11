'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Shield, Zap, Clock, Database } from 'lucide-react'
import { toast } from 'sonner'

interface Admin {
  id: string
  username: string
  name: string
  email: string
  role: string
  isActive: boolean
  lastLoginAt: string
  createdAt: string
}

interface ActivityLog {
  id: string
  action: string
  targetId: string
  details: string
  ipAddress: string
  createdAt: string
  adminName: string
}

interface Setting {
  id: string
  key: string
  value: string
  type: string
  description: string
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<Setting[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [admins, setAdmins] = useState<Admin[]>([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/settings')
      const result = await response.json()
      if (result.success) {
        setSettings(result.data.settings || [])
        setActivityLogs(result.data.activityLogs || [])
        setAdmins(result.data.admins || [])
      } else {
        toast.error('Failed to load settings')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleUpdateSetting = async (id: string, value: string | boolean) => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, value: String(value) }),
      })
      const result = await response.json()
      if (result.success) {
        toast.success('Setting updated')
        fetchData()
      } else {
        toast.error('Failed to update setting')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const formatRelativeTime = (date: string) => {
    const now = new Date()
    const past = new Date(date)
    const diff = Math.floor((now.getTime() - past.getTime()) / 1000)

    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return past.toLocaleDateString()
  }

  const getSettingValue = (key: string) => {
    const setting = settings.find(s => s.key === key)
    return setting?.value
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-[#2A2D3A] bg-[#1A1D29]">
            <CardContent className="p-6">
              <div className="h-32 animate-pulse bg-[#2A2D3A] rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-1">Platform configuration and administration</p>
        </div>
        <Button
          onClick={fetchData}
          variant="outline"
          className="border-[#2A2D3A] text-white hover:bg-[#2A2D3A]"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Platform Settings */}
      <Card className="border-[#2A2D3A] bg-[#1A1D29]">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Zap className="h-5 w-5 mr-2 text-[#00D09C]" />
            Platform Settings
          </CardTitle>
          <CardDescription className="text-gray-400">
            Configure platform-wide settings and features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Trading Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Trading</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Default Virtual Cash (₹)</Label>
                <Input
                  type="number"
                  value={getSettingValue('DEFAULT_VIRTUAL_CASH') || '100000'}
                  onChange={(e) => handleUpdateSetting('DEFAULT_VIRTUAL_CASH', e.target.value)}
                  className="bg-[#0F1117] border-[#2A2D3A] text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Max Daily Trades</Label>
                <Input
                  type="number"
                  value={getSettingValue('MAX_DAILY_TRADES') || '0'}
                  onChange={(e) => handleUpdateSetting('MAX_DAILY_TRADES', e.target.value)}
                  className="bg-[#0F1117] border-[#2A2D3A] text-white"
                />
              </div>
            </div>
          </div>

          {/* Feature Flags */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Feature Flags</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-[#0F1117] rounded-lg border border-[#2A2D3A]">
                <div>
                  <p className="text-white font-medium">Equity Trading</p>
                  <p className="text-sm text-gray-400">Enable stock trading</p>
                </div>
                <Switch
                  checked={getSettingValue('EQUITY_TRADING') === 'true'}
                  onCheckedChange={(checked) => handleUpdateSetting('EQUITY_TRADING', checked)}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-[#0F1117] rounded-lg border border-[#2A2D3A]">
                <div>
                  <p className="text-white font-medium">F&O Trading</p>
                  <p className="text-sm text-gray-400">Enable futures and options</p>
                </div>
                <Switch
                  checked={getSettingValue('FNO_TRADING') === 'true'}
                  onCheckedChange={(checked) => handleUpdateSetting('FNO_TRADING', checked)}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-[#0F1117] rounded-lg border border-[#2A2D3A]">
                <div>
                  <p className="text-white font-medium">Options Trading</p>
                  <p className="text-sm text-gray-400">Enable options</p>
                </div>
                <Switch
                  checked={getSettingValue('OPTIONS_TRADING') === 'true'}
                  onCheckedChange={(checked) => handleUpdateSetting('OPTIONS_TRADING', checked)}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-[#0F1117] rounded-lg border border-[#2A2D3A]">
                <div>
                  <p className="text-white font-medium">Short Selling</p>
                  <p className="text-sm text-gray-400">Allow short selling</p>
                </div>
                <Switch
                  checked={getSettingValue('SHORT_SELLING') === 'true'}
                  onCheckedChange={(checked) => handleUpdateSetting('SHORT_SELLING', checked)}
                />
              </div>
            </div>
          </div>

          {/* Rate Limits */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Rate Limits</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-gray-300">API Calls / Min</Label>
                <Input
                  type="number"
                  value={getSettingValue('API_CALLS_PER_MINUTE') || '60'}
                  onChange={(e) => handleUpdateSetting('API_CALLS_PER_MINUTE', e.target.value)}
                  className="bg-[#0F1117] border-[#2A2D3A] text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">WS Messages / Sec</Label>
                <Input
                  type="number"
                  value={getSettingValue('WS_MESSAGES_PER_SECOND') || '10'}
                  onChange={(e) => handleUpdateSetting('WS_MESSAGES_PER_SECOND', e.target.value)}
                  className="bg-[#0F1117] border-[#2A2D3A] text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Login Attempts / Hour</Label>
                <Input
                  type="number"
                  value={getSettingValue('LOGIN_ATTEMPTS_PER_HOUR') || '5'}
                  onChange={(e) => handleUpdateSetting('LOGIN_ATTEMPTS_PER_HOUR', e.target.value)}
                  className="bg-[#0F1117] border-[#2A2D3A] text-white"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Accounts */}
      <Card className="border-[#2A2D3A] bg-[#1A1D29]">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Shield className="h-5 w-5 mr-2 text-[#00D09C]" />
            Admin Accounts
          </CardTitle>
          <CardDescription className="text-gray-400">
            Manage admin users and their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-gray-400">Name</TableHead>
                <TableHead className="text-gray-400">Username</TableHead>
                <TableHead className="text-gray-400">Email</TableHead>
                <TableHead className="text-gray-400">Role</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Last Login</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="text-white">{admin.name}</TableCell>
                  <TableCell className="text-white">{admin.username}</TableCell>
                  <TableCell className="text-white">{admin.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        admin.role === 'SUPER_ADMIN'
                          ? 'border-purple-500 text-purple-500'
                          : 'border-[#00D09C] text-[#00D09C]'
                      }
                    >
                      {admin.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={admin.isActive ? 'bg-[#00D09C] text-black' : 'bg-red-500'}
                    >
                      {admin.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-400">
                    {admin.lastLoginAt ? formatRelativeTime(admin.lastLoginAt) : 'Never'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Activity Logs */}
      <Card className="border-[#2A2D3A] bg-[#1A1D29]">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Clock className="h-5 w-5 mr-2 text-[#00D09C]" />
            Activity Logs
          </CardTitle>
          <CardDescription className="text-gray-400">
            Recent admin activities (last 50)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-gray-400">Admin</TableHead>
                <TableHead className="text-gray-400">Action</TableHead>
                <TableHead className="text-gray-400">Target</TableHead>
                <TableHead className="text-gray-400">Details</TableHead>
                <TableHead className="text-gray-400">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activityLogs.slice(0, 50).map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-white">{log.adminName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-[#2A2D3A] text-gray-300">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-400">{log.targetId || '-'}</TableCell>
                  <TableCell className="text-gray-400 text-sm max-w-xs truncate">
                    {log.details}
                  </TableCell>
                  <TableCell className="text-gray-400">
                    {formatRelativeTime(log.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}