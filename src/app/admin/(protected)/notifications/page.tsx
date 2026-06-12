'use client'

import { useEffect, useState } from 'react'
import {
  Bell,
  Send,
  RefreshCw,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  Crown,
  Mail,
  Search,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

interface Notification {
  id: string
  title: string
  type: string
  target: string
  sentCount: number
  readCount: number
  sentAt: string
}

const NOTIFICATION_TYPES = [
  { value: 'INFO', label: 'Info', icon: Info, color: 'bg-[#00D09C]/20 text-[#00D09C] border-[#00D09C]/30' },
  { value: 'WARNING', label: 'Warning', icon: AlertTriangle, color: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30' },
  { value: 'SUCCESS', label: 'Success', icon: CheckCircle, color: 'bg-[#00D09C]/20 text-[#00B386] border-[#00D09C]/30' },
  { value: 'ERROR', label: 'Error', icon: XCircle, color: 'bg-[#d44a2d]/20 text-[#d44a2d] border-[#d44a2d]/30' },
]

const TARGET_TYPES = [
  { value: 'ALL_USERS', label: 'All Users', icon: Users },
  { value: 'PREMIUM_USERS', label: 'Premium Users', icon: Crown },
  { value: 'FREE_USERS', label: 'Free Users', icon: Users },
  { value: 'SPECIFIC_USER', label: 'Specific User', icon: Mail },
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Form state
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState('INFO')
  const [target, setTarget] = useState('ALL_USERS')
  const [specificEmail, setSpecificEmail] = useState('')
  const [filterType, setFilterType] = useState('')

  // Fetch notifications
  const fetchNotifications = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) {
        setRefreshing(true)
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })

      if (filterType) {
        params.append('type', filterType)
      }

      const response = await fetch(`/api/admin/notifications?${params}`)
      const result = await response.json()

      if (result.success) {
        setNotifications(result.data.notifications)
        setTotalPages(result.data.pagination.totalPages)
        setTotal(result.data.pagination.total)
      } else {
        toast.error(result.error || 'Failed to fetch notifications')
      }
    } catch (error) {
      toast.error('Failed to fetch notifications')
      console.error('Fetch notifications error:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Send notification
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !body.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    if (target === 'SPECIFIC_USER' && !specificEmail.trim()) {
      toast.error('Please enter a specific user email')
      return
    }

    setSending(true)

    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          type,
          target,
          specificEmail: target === 'SPECIFIC_USER' ? specificEmail.trim() : undefined,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Notification sent to ${result.data.sentCount} user(s)`)
        // Reset form
        setTitle('')
        setBody('')
        setType('INFO')
        setTarget('ALL_USERS')
        setSpecificEmail('')
        // Refresh notifications
        await fetchNotifications()
      } else {
        toast.error(result.error || 'Failed to send notification')
      }
    } catch (error) {
      toast.error('Failed to send notification')
      console.error('Send notification error:', error)
    } finally {
      setSending(false)
    }
  }

  // Get type badge
  const getTypeBadge = (type: string) => {
    const typeConfig = NOTIFICATION_TYPES.find(t => t.value === type)
    if (!typeConfig) return null

    const Icon = typeConfig.icon

    return (
      <Badge className={`${typeConfig.color} border flex items-center gap-1.5`}>
        <Icon className="h-3.5 w-3.5" />
        {typeConfig.label}
      </Badge>
    )
  }

  // Get target badge
  const getTargetBadge = (target: string) => {
    const targetConfig = TARGET_TYPES.find(t => t.value === target)
    if (!targetConfig) return null

    let color = 'bg-[#f5f7fa]/20 text-[#6b7280] border-[#e5e7eb]/30'
    if (target === 'PREMIUM_USERS') {
      color = 'bg-[#00b887]/20 text-[#00b887] border-[#00b887]/30'
    } else if (target === 'FREE_USERS') {
      color = 'bg-[#f0f2f5]/20 text-[#6b7280] border-[#e5e7eb]/30'
    } else if (target === 'SPECIFIC_USER') {
      color = 'bg-[#00D09C]/20 text-[#00D09C] border-[#00D09C]/30'
    }

    return (
      <Badge variant="outline" className={color}>
        {targetConfig.label}
      </Badge>
    )
  }

  // Format date relative
  const formatRelativeTime = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  // Calculate read percentage
  const getReadPercentage = (sent: number, read: number) => {
    if (sent === 0) return 0
    return Math.round((read / sent) * 100)
  }

  useEffect(() => {
    fetchNotifications()
  }, [page, filterType])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1a1a1a]">Notifications Management</h1>
          <p className="text-[#6b7280] mt-1">Send and manage user notifications</p>
        </div>
        <Button
          onClick={() => fetchNotifications(true)}
          disabled={refreshing}
          variant="outline"
          className="border-[#e5e7eb] bg-white text-[#1a1a1a] hover:bg-[#f0f2f5] hover:text-[#1a1a1a]"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        {/* Send Notification Panel */}
        <Card className="bg-white border-[#e5e7eb]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#00D09C]" />
              <CardTitle className="text-[#1a1a1a]">Send Notification</CardTitle>
            </div>
            <CardDescription className="text-[#6b7280]">
              Create and send notifications to users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendNotification} className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-[#6b7280]">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter notification title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={sending}
                  className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a] placeholder:text-gray-500"
                />
              </div>

              {/* Body */}
              <div className="space-y-2">
                <Label htmlFor="body" className="text-[#6b7280]">Message *</Label>
                <Textarea
                  id="body"
                  placeholder="Enter notification message..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  disabled={sending}
                  rows={6}
                  className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a] placeholder:text-gray-500 resize-none"
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type" className="text-[#6b7280]">Type *</Label>
                <Select value={type} onValueChange={setType} disabled={sending}>
                  <SelectTrigger className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#e5e7eb]">
                    {NOTIFICATION_TYPES.map((typeOption) => (
                      <SelectItem
                        key={typeOption.value}
                        value={typeOption.value}
                        className="text-[#1a1a1a]"
                      >
                        <div className="flex items-center gap-2">
                          <typeOption.icon className={`h-4 w-4 ${typeOption.color.includes('yellow') ? 'text-[#f59e0b]' : typeOption.color.includes('#00B386') ? 'text-[#00B386]' : typeOption.color.includes('#d44a2d') ? 'text-[#d44a2d]' : 'text-[#00D09C]'}`} />
                          {typeOption.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Target */}
              <div className="space-y-2">
                <Label htmlFor="target" className="text-[#6b7280]">Target *</Label>
                <Select value={target} onValueChange={setTarget} disabled={sending}>
                  <SelectTrigger className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#e5e7eb]">
                    {TARGET_TYPES.map((targetOption) => (
                      <SelectItem
                        key={targetOption.value}
                        value={targetOption.value}
                        className="text-[#1a1a1a]"
                      >
                        <div className="flex items-center gap-2">
                          <targetOption.icon className="h-4 w-4 text-[#00D09C]" />
                          {targetOption.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Specific User Email */}
              {target === 'SPECIFIC_USER' && (
                <div className="space-y-2">
                  <Label htmlFor="specificEmail" className="text-[#6b7280]">User Email *</Label>
                  <Input
                    id="specificEmail"
                    type="email"
                    placeholder="Enter user email address"
                    value={specificEmail}
                    onChange={(e) => setSpecificEmail(e.target.value)}
                    disabled={sending}
                    className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a] placeholder:text-gray-500"
                  />
                </div>
              )}

              {/* Send Button */}
              <Button
                type="submit"
                disabled={sending}
                className="w-full bg-[#00D09C] text-black hover:bg-[#00b88c] font-medium"
              >
                {sending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Notification
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Notification History */}
        <Card className="bg-white border-[#e5e7eb]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[#1a1a1a]">Notification History</CardTitle>
                <CardDescription className="text-[#6b7280]">
                  View all sent notifications
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={filterType}
                  onValueChange={(value) => {
                    setFilterType(value)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="w-[140px] bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#e5e7eb]">
                    <SelectItem value="" className="text-[#1a1a1a]">All Types</SelectItem>
                    {NOTIFICATION_TYPES.map((typeOption) => (
                      <SelectItem
                        key={typeOption.value}
                        value={typeOption.value}
                        className="text-[#1a1a1a]"
                      >
                        {typeOption.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full bg-[#f5f7fa]" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-[#1a1a1a] font-semibold text-lg">No notifications found</h3>
                <p className="text-[#6b7280] mt-1">Send your first notification to get started</p>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-[#e5e7eb] overflow-hidden">
                  <Table>
                    <TableHeader className="bg-[#f5f7fa]">
                      <TableRow className="border-[#e5e7eb] hover:bg-[#f5f7fa]/50">
                        <TableHead className="text-[#6b7280] font-medium">Title</TableHead>
                        <TableHead className="text-[#6b7280] font-medium">Type</TableHead>
                        <TableHead className="text-[#6b7280] font-medium">Target</TableHead>
                        <TableHead className="text-[#6b7280] font-medium text-center">Sent</TableHead>
                        <TableHead className="text-[#6b7280] font-medium text-center">Read</TableHead>
                        <TableHead className="text-[#6b7280] font-medium text-right">Sent At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notifications.map((notification) => (
                        <TableRow key={notification.id} className="border-[#e5e7eb] hover:bg-[#f5f7fa]/50">
                          <TableCell className="text-[#1a1a1a] font-medium">{notification.title}</TableCell>
                          <TableCell>{getTypeBadge(notification.type)}</TableCell>
                          <TableCell>{getTargetBadge(notification.target)}</TableCell>
                          <TableCell className="text-center">
                            <span className="text-[#1a1a1a]">{notification.sentCount}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-[#1a1a1a]">{notification.readCount}</span>
                              <span className="text-xs text-gray-500">
                                {getReadPercentage(notification.sentCount, notification.readCount)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-[#6b7280] whitespace-nowrap">
                            {formatRelativeTime(notification.sentAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-[#6b7280]">
                      Showing {Math.min((page - 1) * 20 + 1, total)} to {Math.min(page * 20, total)} of {total} notifications
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        variant="outline"
                        size="sm"
                        className="border-[#e5e7eb] bg-white text-[#1a1a1a] hover:bg-[#f0f2f5] hover:text-[#1a1a1a]"
                      >
                        Previous
                      </Button>
                      <div className="text-sm text-[#1a1a1a]">
                        Page {page} of {totalPages}
                      </div>
                      <Button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        variant="outline"
                        size="sm"
                        className="border-[#e5e7eb] bg-white text-[#1a1a1a] hover:bg-[#f0f2f5] hover:text-[#1a1a1a]"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}