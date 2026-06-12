'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Search,
  Download,
  MoreVertical,
  Eye,
  Edit,
  Ban,
  RefreshCw,
  ArrowUpDown,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

interface User {
  id: string
  name: string | null
  email: string
  phone: string | null
  role: string
  subscription: string
  status: string
  isActive: boolean
  cashBalance: number
  totalPnL: number
  isEmailVerified: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

interface UsersResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function UsersPage() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  // Filters
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [subscription, setSubscription] = useState('')
  const [status, setStatus] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC')

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    subscription: '',
    isActive: true,
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
      })

      if (search) params.append('search', search)
      if (role) params.append('role', role)
      if (subscription) params.append('subscription', subscription)
      if (status) params.append('status', status)

      const response = await fetch(`/api/admin/users?${params}`)
      const result = await response.json()

      if (result.success) {
        setUsers(result.data.users)
        setPagination(result.data.pagination)
      } else {
        toast.error('Failed to load users')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, search, role, subscription, status, sortBy, sortOrder])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination((prev) => ({ ...prev, page: 1 }))
      fetchUsers()
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  // Fetch on filter/sort changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchUsers()
  }, [role, subscription, status, sortBy, sortOrder])

  useEffect(() => {
    fetchUsers()
  }, [pagination.page])

  const handleView = (user: User) => {
    setSelectedUser(user)
    setViewDialogOpen(true)
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setEditForm({
      name: user.name || '',
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      subscription: user.subscription,
      isActive: user.isActive,
    })
    setEditDialogOpen(true)
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          ...editForm,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('User updated successfully')
        setEditDialogOpen(false)
        fetchUsers()
      } else {
        toast.error(result.error || 'Failed to update user')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const handleToggleActive = async (user: User) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          isActive: !user.isActive,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`User ${user.isActive ? 'blocked' : 'unblocked'} successfully`)
        fetchUsers()
      } else {
        toast.error(result.error || 'Failed to update user')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const handleResetBalance = async (user: User) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          cashBalance: 100000,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Balance reset successfully')
        fetchUsers()
      } else {
        toast.error(result.error || 'Failed to reset balance')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users?id=${userId}&confirmation=DELETE`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast.success('User deleted successfully')
        fetchUsers()
      } else {
        toast.error(result.error || 'Failed to delete user')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Role', 'Subscription', 'Balance', 'P&L', 'Status', 'Created']
    const csvContent = [
      headers.join(','),
      ...users.map((user) =>
        [
          user.name || '',
          user.email,
          user.phone || '',
          user.role,
          user.subscription,
          user.cashBalance,
          user.totalPnL,
          user.isActive ? 'ACTIVE' : 'INACTIVE',
          formatDate(user.createdAt),
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('CSV exported successfully')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a]">Users Management</h1>
          <p className="text-[#6b7280] mt-1">Manage and monitor all users</p>
        </div>
        <Button
          onClick={fetchUsers}
          variant="outline"
          className="border-[#e5e7eb] text-[#1a1a1a] hover:bg-[#f0f2f5]"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="border border-[#e5e7eb] rounded-lg bg-white p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6b7280]" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a] placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Role Filter */}
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-full lg:w-[180px] bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent className="bg-white border-[#e5e7eb]">
              <SelectItem value="">All Roles</SelectItem>
              <SelectItem value="USER">USER</SelectItem>
              <SelectItem value="ADMIN">ADMIN</SelectItem>
              <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
            </SelectContent>
          </Select>

          {/* Subscription Filter */}
          <Select value={subscription} onValueChange={setSubscription}>
            <SelectTrigger className="w-full lg:w-[180px] bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]">
              <SelectValue placeholder="Subscription" />
            </SelectTrigger>
            <SelectContent className="bg-white border-[#e5e7eb]">
              <SelectItem value="">All</SelectItem>
              <SelectItem value="FREE">FREE</SelectItem>
              <SelectItem value="PREMIUM">PREMIUM</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full lg:w-[180px] bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-white border-[#e5e7eb]">
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="ACTIVE">ACTIVE</SelectItem>
              <SelectItem value="INACTIVE">INACTIVE</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-[180px] bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#e5e7eb]">
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="cashBalance">Balance</SelectItem>
                <SelectItem value="subscription">Subscription</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'ASC' | 'DESC')}>
              <SelectTrigger className="w-[100px] bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#e5e7eb]">
                <SelectItem value="ASC">Asc</SelectItem>
                <SelectItem value="DESC">Desc</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export */}
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="border-[#e5e7eb] text-[#1a1a1a] hover:bg-[#f0f2f5]"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-[#e5e7eb] rounded-lg bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[#e5e7eb] hover:bg-[#f0f2f5]/50">
                <TableHead className="text-[#6b7280] font-medium">Name</TableHead>
                <TableHead className="text-[#6b7280] font-medium">Email</TableHead>
                <TableHead className="text-[#6b7280] font-medium">Phone</TableHead>
                <TableHead className="text-[#6b7280] font-medium">Role</TableHead>
                <TableHead className="text-[#6b7280] font-medium">Subscription</TableHead>
                <TableHead className="text-[#6b7280] font-medium">Balance</TableHead>
                <TableHead className="text-[#6b7280] font-medium">P&L</TableHead>
                <TableHead className="text-[#6b7280] font-medium">Status</TableHead>
                <TableHead className="text-[#6b7280] font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i} className="border-[#e5e7eb]">
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-[#6b7280]">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="border-[#e5e7eb] hover:bg-[#f0f2f5]/30">
                    <TableCell className="text-[#1a1a1a] font-medium">
                      {user.name || 'N/A'}
                    </TableCell>
                    <TableCell className="text-[#6b7280]">{user.email}</TableCell>
                    <TableCell className="text-[#6b7280]">{user.phone || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          user.role === 'SUPER_ADMIN'
                            ? 'border-yellow-500 text-yellow-500'
                            : user.role === 'ADMIN'
                            ? 'border-[#00D09C] text-[#00D09C]'
                            : 'border-gray-500 text-[#6b7280]'
                        }
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.subscription === 'PREMIUM' ? 'default' : 'secondary'}
                        className={
                          user.subscription === 'PREMIUM'
                            ? 'bg-[#00D09C] text-black'
                            : 'bg-[#f0f2f5] text-[#6b7280]'
                        }
                      >
                        {user.subscription}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#1a1a1a]">
                      {formatCurrency(user.cashBalance)}
                    </TableCell>
                    <TableCell
                      className={
                        user.totalPnL > 0
                          ? 'text-green-400'
                          : user.totalPnL < 0
                          ? 'text-red-400'
                          : 'text-[#6b7280]'
                      }
                    >
                      {formatCurrency(user.totalPnL)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.isActive ? 'default' : 'secondary'}
                        className={
                          user.isActive
                            ? 'bg-[#00D09C]/20 text-[#00D09C] border-[#00D09C]/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                        }
                      >
                        {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-[#6b7280] hover:text-[#1a1a1a] hover:bg-[#f0f2f5]"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white border-[#e5e7eb]">
                          <DropdownMenuLabel className="text-[#6b7280]">Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-[#f0f2f5]" />
                          <DropdownMenuItem
                            onClick={() => handleView(user)}
                            className="text-[#6b7280] focus:text-[#1a1a1a] focus:bg-[#f0f2f5] cursor-pointer"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEdit(user)}
                            className="text-[#6b7280] focus:text-[#1a1a1a] focus:bg-[#f0f2f5] cursor-pointer"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleActive(user)}
                            className={`${
                              user.isActive ? 'text-red-400' : 'text-green-400'
                            } focus:bg-[#f0f2f5] cursor-pointer`}
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            {user.isActive ? 'Block User' : 'Unblock User'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-[#f0f2f5]" />
                          <DropdownMenuItem
                            onClick={() => handleResetBalance(user)}
                            className="text-yellow-400 focus:text-yellow-300 focus:bg-[#f0f2f5] cursor-pointer"
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reset Balance
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-[#f0f2f5]" />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
                              >
                                Delete User
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white border-[#e5e7eb]">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-[#1a1a1a]">
                                  Delete User
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-[#6b7280]">
                                  Are you sure you want to delete this user? This action cannot be undone.
                                  Type <span className="text-[#00D09C] font-mono">DELETE</span> to confirm.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-[#f0f2f5] text-[#1a1a1a] hover:bg-[#3A3D4A]">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="bg-red-500 hover:bg-red-600 text-[#1a1a1a]"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                  }
                  className={
                    pagination.page === 1
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer text-[#6b7280] hover:text-[#1a1a1a] hover:bg-[#f0f2f5]'
                  }
                />
              </PaginationItem>

              {pagination.page > 2 && (
                <>
                  <PaginationItem>
                    <PaginationLink
                      onClick={() => setPagination((prev) => ({ ...prev, page: 1 }))}
                      className="cursor-pointer text-[#6b7280] hover:text-[#1a1a1a] hover:bg-[#f0f2f5]"
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                  {pagination.page > 3 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                </>
              )}

              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1
                } else if (pagination.page <= 3) {
                  pageNum = i + 1
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i
                } else {
                  pageNum = pagination.page - 2 + i
                }

                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setPagination((prev) => ({ ...prev, page: pageNum }))}
                      isActive={pagination.page === pageNum}
                      className={
                        pagination.page === pageNum
                          ? 'bg-[#00D09C] text-black cursor-pointer'
                          : 'cursor-pointer text-[#6b7280] hover:text-[#1a1a1a] hover:bg-[#f0f2f5]'
                      }
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}

              {pagination.page < pagination.totalPages - 1 && (
                <>
                  {pagination.page < pagination.totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationLink
                      onClick={() =>
                        setPagination((prev) => ({ ...prev, page: pagination.totalPages }))
                      }
                      className="cursor-pointer text-[#6b7280] hover:text-[#1a1a1a] hover:bg-[#f0f2f5]"
                    >
                      {pagination.totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.min(pagination.totalPages, prev.page + 1),
                    }))
                  }
                  className={
                    pagination.page === pagination.totalPages
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer text-[#6b7280] hover:text-[#1a1a1a] hover:bg-[#f0f2f5]'
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* View Profile Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="bg-white border-[#e5e7eb] text-[#1a1a1a] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">User Profile</DialogTitle>
            <DialogDescription className="text-[#6b7280]">
              Complete user details and information
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-[#6b7280]">Full Name</label>
                  <p className="text-[#1a1a1a] font-medium">{selectedUser.name || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[#6b7280]">Email</label>
                  <p className="text-[#1a1a1a]">{selectedUser.email}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[#6b7280]">Phone</label>
                  <p className="text-[#1a1a1a]">{selectedUser.phone || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[#6b7280]">Role</label>
                  <Badge
                    variant="outline"
                    className={
                      selectedUser.role === 'SUPER_ADMIN'
                        ? 'border-yellow-500 text-yellow-500'
                        : selectedUser.role === 'ADMIN'
                        ? 'border-[#00D09C] text-[#00D09C]'
                        : 'border-gray-500 text-[#6b7280]'
                    }
                  >
                    {selectedUser.role}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[#6b7280]">Subscription</label>
                  <Badge
                    variant={selectedUser.subscription === 'PREMIUM' ? 'default' : 'secondary'}
                    className={
                      selectedUser.subscription === 'PREMIUM'
                        ? 'bg-[#00D09C] text-black'
                        : 'bg-[#f0f2f5] text-[#6b7280]'
                    }
                  >
                    {selectedUser.subscription}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[#6b7280]">Status</label>
                  <Badge
                    variant={selectedUser.isActive ? 'default' : 'secondary'}
                    className={
                      selectedUser.isActive
                        ? 'bg-[#00D09C]/20 text-[#00D09C] border-[#00D09C]/30'
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }
                  >
                    {selectedUser.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[#6b7280]">Cash Balance</label>
                  <p className="text-[#1a1a1a] text-xl font-bold">{formatCurrency(selectedUser.cashBalance)}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[#6b7280]">Total P&L</label>
                  <p
                    className={`text-xl font-bold ${
                      selectedUser.totalPnL > 0
                        ? 'text-green-400'
                        : selectedUser.totalPnL < 0
                        ? 'text-red-400'
                        : 'text-[#6b7280]'
                    }`}
                  >
                    {formatCurrency(selectedUser.totalPnL)}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[#6b7280]">Email Verified</label>
                  <Badge
                    variant={selectedUser.isEmailVerified ? 'default' : 'secondary'}
                    className={
                      selectedUser.isEmailVerified
                        ? 'bg-[#00D09C]/20 text-[#00D09C] border-[#00D09C]/30'
                        : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    }
                  >
                    {selectedUser.isEmailVerified ? 'Verified' : 'Not Verified'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[#6b7280]">Status (DB)</label>
                  <p className="text-[#1a1a1a]">{selectedUser.status || 'N/A'}</p>
                </div>
              </div>

              <div className="border-t border-[#e5e7eb] pt-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-[#6b7280]">User ID</label>
                  <p className="text-[#1a1a1a] text-sm font-mono bg-[#f5f7fa] p-2 rounded">
                    {selectedUser.id}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-[#6b7280]">Created At</label>
                    <p className="text-[#1a1a1a] text-sm">{formatDateTime(selectedUser.createdAt)}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-[#6b7280]">Updated At</label>
                    <p className="text-[#1a1a1a] text-sm">{formatDateTime(selectedUser.updatedAt)}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-[#6b7280]">Last Login</label>
                    <p className="text-[#1a1a1a] text-sm">{formatDateTime(selectedUser.lastLoginAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-white border-[#e5e7eb] text-[#1a1a1a] max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription className="text-[#6b7280]">
              Update user information and settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm text-[#6b7280]">Full Name</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]"
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[#6b7280]">Email</label>
              <Input
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]"
                placeholder="Enter email"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[#6b7280]">Phone</label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]"
                placeholder="Enter phone number"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-[#6b7280]">Role</label>
                <Select
                  value={editForm.role}
                  onValueChange={(v) => setEditForm({ ...editForm, role: v })}
                >
                  <SelectTrigger className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#e5e7eb]">
                    <SelectItem value="USER">USER</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                    <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[#6b7280]">Subscription</label>
                <Select
                  value={editForm.subscription}
                  onValueChange={(v) => setEditForm({ ...editForm, subscription: v })}
                >
                  <SelectTrigger className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#e5e7eb]">
                    <SelectItem value="FREE">FREE</SelectItem>
                    <SelectItem value="PREMIUM">PREMIUM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={editForm.isActive}
                onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-[#e5e7eb] bg-[#f5f7fa] text-[#00D09C] focus:ring-[#00D09C]"
              />
              <label htmlFor="isActive" className="text-sm text-[#6b7280]">
                Active Account
              </label>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              onClick={() => setEditDialogOpen(false)}
              variant="outline"
              className="border-[#e5e7eb] text-[#1a1a1a] hover:bg-[#f0f2f5]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateUser}
              className="bg-[#00D09C] text-black hover:bg-[#00D09C]/90"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}