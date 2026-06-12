'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  RefreshCw,
  MessageSquare,
  Send,
  Filter,
  X,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Ticket {
  id: string
  userId: string
  userName: string | null
  userEmail: string | null
  subject: string
  description: string
  status: string
  priority: string
  category: string | null
  createdAt: string
  updatedAt: string
  replyCount: number
}

interface TicketReply {
  id: string
  isAdmin: number
  message: string
  createdAt: string
  adminName: string | null
}

interface TicketDetail extends Ticket {
  replies: TicketReply[]
}

interface TicketsResponse {
  tickets: Ticket[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function SupportPage() {
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  // Filters
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [category, setCategory] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Dialog states
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null)
  const [ticketLoading, setTicketLoading] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  // Update states
  const [updateStatus, setUpdateStatus] = useState('')
  const [updatePriority, setUpdatePriority] = useState('')
  const [updateCategory, setUpdateCategory] = useState('')

  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when replies change
  useEffect(() => {
    if (scrollAreaRef.current && selectedTicket) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [selectedTicket])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; bg: string }> = {
      OPEN: { color: 'text-[#00D09C]', bg: 'bg-[#00D09C]/10' },
      IN_PROGRESS: { color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
      RESOLVED: { color: 'text-green-400', bg: 'bg-green-400/10' },
      CLOSED: { color: 'text-[#6b7280]', bg: 'bg-gray-400/10' },
    }
    const style = variants[status] || { color: 'text-[#6b7280]', bg: 'bg-gray-400/10' }
    return (
      <Badge className={`${style.bg} ${style.color} border-none`}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { color: string; bg: string }> = {
      LOW: { color: 'text-[#6b7280]', bg: 'bg-gray-400/10' },
      MEDIUM: { color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
      HIGH: { color: 'text-[#00b887]', bg: 'bg-[#00b887]/10' },
      URGENT: { color: 'text-red-400', bg: 'bg-red-400/10' },
    }
    const style = variants[priority] || { color: 'text-[#6b7280]', bg: 'bg-gray-400/10' }
    return (
      <Badge className={`${style.bg} ${style.color} border-none`}>
        {priority}
      </Badge>
    )
  }

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (status) params.append('status', status)
      if (priority) params.append('priority', priority)
      if (category) params.append('category', category)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`/api/admin/support?${params}`)
      const result = await response.json()

      if (result.success) {
        setTickets(result.data.tickets)
        setPagination(result.data.pagination)
      } else {
        toast.error('Failed to load tickets')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, status, priority, category, startDate, endDate])

  // Fetch on mount and filter changes
  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const clearFilters = () => {
    setStatus('')
    setPriority('')
    setCategory('')
    setStartDate('')
    setEndDate('')
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleViewTicket = async (ticket: Ticket) => {
    setTicketLoading(true)
    setDetailDialogOpen(true)
    setSelectedTicket(null)
    setReplyText('')

    try {
      const response = await fetch(`/api/admin/support/${ticket.id}`)
      const result = await response.json()

      if (result.success && result.data) {
        setSelectedTicket(result.data)
        setUpdateStatus(result.data.status)
        setUpdatePriority(result.data.priority)
        setUpdateCategory(result.data.category || '')
      } else {
        toast.error('Failed to load ticket details')
        setDetailDialogOpen(false)
      }
    } catch (error) {
      toast.error('An error occurred')
      setDetailDialogOpen(false)
    } finally {
      setTicketLoading(false)
    }
  }

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return

    setSendingReply(true)
    try {
      const response = await fetch('/api/admin/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply',
          ticketId: selectedTicket.id,
          message: replyText,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Reply sent successfully')
        setReplyText('')

        // Refresh ticket details
        const detailResponse = await fetch(`/api/admin/support/${selectedTicket.id}`)
        const detailResult = await detailResponse.json()
        if (detailResult.success) {
          setSelectedTicket(detailResult.data)
          setUpdateStatus(detailResult.data.status)
        }

        // Refresh tickets list
        fetchTickets()
      } else {
        toast.error(result.error || 'Failed to send reply')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setSendingReply(false)
    }
  }

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return

    try {
      const response = await fetch('/api/admin/support', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTicket.id,
          status: updateStatus,
          priority: updatePriority,
          category: updateCategory,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Ticket updated successfully')

        // Refresh ticket details
        const detailResponse = await fetch(`/api/admin/support/${selectedTicket.id}`)
        const detailResult = await detailResponse.json()
        if (detailResult.success) {
          setSelectedTicket(detailResult.data)
        }

        // Refresh tickets list
        fetchTickets()
      } else {
        toast.error(result.error || 'Failed to update ticket')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const hasActiveFilters = status || priority || category || startDate || endDate

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Support Tickets</h1>
          <p className="text-[#6b7280] mt-1">Manage customer support tickets and inquiries</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="bg-white border-[#e5e7eb] text-[#1a1a1a] hover:bg-[#f0f2f5]"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge className="ml-2 bg-[#00D09C] text-black">Active</Badge>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTickets}
            disabled={loading}
            className="bg-white border-[#e5e7eb] text-[#1a1a1a] hover:bg-[#f0f2f5]"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-4 bg-white border-[#e5e7eb]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#6b7280]">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#e5e7eb]">
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#6b7280]">Priority</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]">
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#e5e7eb]">
                  <SelectItem value="">All Priority</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#6b7280]">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#e5e7eb]">
                  <SelectItem value="">All Categories</SelectItem>
                  <SelectItem value="ACCOUNT">Account</SelectItem>
                  <SelectItem value="BILLING">Billing</SelectItem>
                  <SelectItem value="TECHNICAL">Technical</SelectItem>
                  <SelectItem value="TRADING">Trading</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#6b7280]">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#6b7280]">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-[#e5e7eb] flex items-center justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-[#6b7280] hover:text-[#1a1a1a]"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Tickets Table */}
      <Card className="bg-white border-[#e5e7eb]">
        <Table>
          <TableHeader>
            <TableRow className="border-[#e5e7eb] hover:bg-white">
              <TableHead className="text-[#6b7280] font-medium">ID</TableHead>
              <TableHead className="text-[#6b7280] font-medium">User</TableHead>
              <TableHead className="text-[#6b7280] font-medium">Subject</TableHead>
              <TableHead className="text-[#6b7280] font-medium">Status</TableHead>
              <TableHead className="text-[#6b7280] font-medium">Priority</TableHead>
              <TableHead className="text-[#6b7280] font-medium">Category</TableHead>
              <TableHead className="text-[#6b7280] font-medium">Created At</TableHead>
              <TableHead className="text-[#6b7280] font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-[#e5e7eb]">
                  <TableCell>
                    <Skeleton className="h-4 w-16 bg-[#f0f2f5]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32 bg-[#f0f2f5]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48 bg-[#f0f2f5]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20 bg-[#f0f2f5]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20 bg-[#f0f2f5]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24 bg-[#f0f2f5]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24 bg-[#f0f2f5]" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-20 ml-auto bg-[#f0f2f5]" />
                  </TableCell>
                </TableRow>
              ))
            ) : tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-[#6b7280]">
                  No tickets found
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow
                  key={ticket.id}
                  className="border-[#e5e7eb] hover:bg-[#242836] cursor-pointer"
                  onClick={() => handleViewTicket(ticket)}
                >
                  <TableCell className="text-[#6b7280] font-mono text-sm">
                    #{ticket.id.slice(-6)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#f0f2f5] flex items-center justify-center">
                        <User className="h-4 w-4 text-[#6b7280]" />
                      </div>
                      <div>
                        <div className="text-[#1a1a1a] font-medium">
                          {ticket.userName || 'Unknown'}
                        </div>
                        <div className="text-[#6b7280] text-xs">
                          {ticket.userEmail || ''}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-[#1a1a1a] font-medium max-w-xs truncate">
                    {ticket.subject}
                  </TableCell>
                  <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                  <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                  <TableCell className="text-[#6b7280]">
                    {ticket.category || '—'}
                  </TableCell>
                  <TableCell className="text-[#6b7280]">
                    {formatDate(ticket.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {ticket.replyCount > 0 && (
                        <Badge variant="outline" className="border-[#e5e7eb] text-[#6b7280]">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {ticket.replyCount}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#00D09C] hover:bg-[#00D09C]/10"
                      >
                        View
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#e5e7eb]">
            <div className="text-sm text-[#6b7280]">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} tickets
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="bg-white border-[#e5e7eb] text-[#1a1a1a] hover:bg-[#f0f2f5]"
              >
                Previous
              </Button>
              <span className="text-sm text-[#6b7280] px-2">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="bg-white border-[#e5e7eb] text-[#1a1a1a] hover:bg-[#f0f2f5]"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-white border-[#e5e7eb] text-[#1a1a1a]">
          <DialogHeader>
            <DialogTitle className="text-xl">Ticket Details</DialogTitle>
            <DialogDescription className="text-[#6b7280]">
              Manage and respond to support ticket
            </DialogDescription>
          </DialogHeader>

          {ticketLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-8 w-full bg-[#f0f2f5]" />
              <Skeleton className="h-32 w-full bg-[#f0f2f5]" />
              <Skeleton className="h-20 w-full bg-[#f0f2f5]" />
            </div>
          ) : selectedTicket ? (
            <div className="space-y-4 py-2">
              {/* Ticket Info */}
              <Card className="p-4 bg-[#f5f7fa] border-[#e5e7eb]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-[#6b7280]">Subject</label>
                    <p className="text-[#1a1a1a] font-medium mt-1">{selectedTicket.subject}</p>
                  </div>
                  <div>
                    <label className="text-sm text-[#6b7280]">User</label>
                    <p className="text-[#1a1a1a] mt-1">{selectedTicket.userName || 'Unknown'}</p>
                    <p className="text-[#6b7280] text-sm">{selectedTicket.userEmail || ''}</p>
                  </div>
                  <div>
                    <label className="text-sm text-[#6b7280]">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm text-[#6b7280]">Priority</label>
                    <div className="mt-1">{getPriorityBadge(selectedTicket.priority)}</div>
                  </div>
                  <div>
                    <label className="text-sm text-[#6b7280]">Category</label>
                    <p className="text-[#1a1a1a] mt-1">{selectedTicket.category || '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-[#6b7280]">Created</label>
                    <p className="text-[#1a1a1a] mt-1">{formatDateTime(selectedTicket.createdAt)}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-sm text-[#6b7280]">Description</label>
                  <p className="text-[#6b7280] mt-1 bg-white p-3 rounded border border-[#e5e7eb]">
                    {selectedTicket.description}
                  </p>
                </div>
              </Card>

              {/* Update Controls */}
              <Card className="p-4 bg-[#f5f7fa] border-[#e5e7eb]">
                <h3 className="text-sm font-medium text-[#6b7280] mb-3">Update Ticket</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Status</label>
                    <Select value={updateStatus} onValueChange={setUpdateStatus}>
                      <SelectTrigger className="bg-white border-[#e5e7eb] text-[#1a1a1a] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#e5e7eb]">
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Priority</label>
                    <Select value={updatePriority} onValueChange={setUpdatePriority}>
                      <SelectTrigger className="bg-white border-[#e5e7eb] text-[#1a1a1a] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#e5e7eb]">
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Category</label>
                    <Select value={updateCategory} onValueChange={setUpdateCategory}>
                      <SelectTrigger className="bg-white border-[#e5e7eb] text-[#1a1a1a] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#e5e7eb]">
                        <SelectItem value="">—</SelectItem>
                        <SelectItem value="ACCOUNT">Account</SelectItem>
                        <SelectItem value="BILLING">Billing</SelectItem>
                        <SelectItem value="TECHNICAL">Technical</SelectItem>
                        <SelectItem value="TRADING">Trading</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleUpdateTicket}
                      className="w-full bg-[#00D09C] hover:bg-[#00B889] text-black"
                      size="sm"
                    >
                      Update
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Conversation Thread */}
              <Card className="bg-[#f5f7fa] border-[#e5e7eb]">
                <div className="p-4 border-b border-[#e5e7eb]">
                  <h3 className="text-sm font-medium text-[#6b7280]">Conversation</h3>
                </div>
                <ScrollArea className="h-80 p-4" ref={scrollAreaRef}>
                  <div className="space-y-4">
                    {/* Initial Ticket Message */}
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#f0f2f5] flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-[#6b7280]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[#1a1a1a] font-medium text-sm">
                            {selectedTicket.userName || 'User'}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {formatDate(selectedTicket.createdAt)}
                          </span>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-[#6b7280] text-sm">
                          {selectedTicket.description}
                        </div>
                      </div>
                    </div>

                    {/* Replies */}
                    {selectedTicket.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className={`flex gap-3 ${
                          reply.isAdmin ? 'flex-row-reverse' : ''
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            reply.isAdmin
                              ? 'bg-[#00D09C] text-black'
                              : 'bg-[#f0f2f5]'
                          }`}
                        >
                          {reply.isAdmin ? (
                            <MessageSquare className="h-4 w-4" />
                          ) : (
                            <User className="h-4 w-4 text-[#6b7280]" />
                          )}
                        </div>
                        <div className={`flex-1 ${reply.isAdmin ? 'text-right' : ''}`}>
                          <div
                            className={`flex items-center gap-2 mb-1 ${
                              reply.isAdmin ? 'justify-end' : ''
                            }`}
                          >
                            <span className="text-[#1a1a1a] font-medium text-sm">
                              {reply.isAdmin ? 'Admin' : selectedTicket.userName || 'User'}
                            </span>
                            <span className="text-gray-500 text-xs">
                              {formatDate(reply.createdAt)}
                            </span>
                          </div>
                          <div
                            className={`rounded-lg p-3 text-sm ${
                              reply.isAdmin
                                ? 'bg-[#00D09C]/20 text-gray-200'
                                : 'bg-white text-[#6b7280]'
                            }`}
                          >
                            {reply.message}
                          </div>
                        </div>
                      </div>
                    ))}

                    {selectedTicket.replies.length === 0 && (
                      <div className="text-center text-gray-500 text-sm py-4">
                        No replies yet. Be the first to respond!
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Reply Input */}
                <div className="p-4 border-t border-[#e5e7eb]">
                  <div className="flex gap-3">
                    <Textarea
                      placeholder="Type your reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="flex-1 bg-white border-[#e5e7eb] text-[#1a1a1a] resize-none min-h-[60px]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                          handleSendReply()
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendReply}
                      disabled={!replyText.trim() || sendingReply}
                      className="bg-[#00D09C] hover:bg-[#00B889] text-black px-4"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Press Ctrl+Enter to send
                  </p>
                </div>
              </Card>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}