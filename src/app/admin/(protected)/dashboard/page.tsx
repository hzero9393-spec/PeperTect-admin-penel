'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Users, Activity, DollarSign, CreditCard, TrendingUp, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Line, LineChart, Area, AreaChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'

interface DashboardData {
  stats: {
    totalUsers: number
    activeUsers: number
    premiumUsers: number
    totalRevenue: number
    activePositions: number
    openOrders: number
  }
  recentUsers: any[]
  recentTrades: any[]
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/dashboard')
      const result = await response.json()

      if (!response.ok) {
        // Show error details from server if available
        const errorMsg = result.details || result.error || 'Failed to load dashboard data'
        console.error('Dashboard error:', errorMsg)
        toast.error(errorMsg)
        // Still show the dashboard with empty data
        setData({
          stats: {
            totalUsers: 0,
            activeUsers: 0,
            premiumUsers: 0,
            totalRevenue: 0,
            activePositions: 0,
            openOrders: 0,
          },
          recentUsers: [],
          recentTrades: [],
        })
      } else {
        setData(result.data)
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error)
      toast.error('An error occurred loading dashboard')
      // Show empty data
      setData({
        stats: {
          totalUsers: 0,
          activeUsers: 0,
          premiumUsers: 0,
          totalRevenue: 0,
          activePositions: 0,
          openOrders: 0,
        },
        recentUsers: [],
        recentTrades: [],
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)
  }

  const formatRelativeTime = (date: string) => {
    const now = new Date()
    const past = new Date(date)
    const diff = Math.floor((now.getTime() - past.getTime()) / 1000)

    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return past.toLocaleDateString()
  }

  const statsCards = [
    {
      title: 'Total Users',
      value: data?.stats.totalUsers || 0,
      icon: Users,
      color: 'text-[#00D09C]',
      bgColor: 'bg-[#00D09C]/20',
    },
    {
      title: 'Active Users',
      value: data?.stats.activeUsers || 0,
      icon: Activity,
      color: 'text-[#00D09C]',
      bgColor: 'bg-[#00D09C]/20',
    },
    {
      title: 'Premium Users',
      value: data?.stats.premiumUsers || 0,
      icon: CreditCard,
      color: 'text-[#00b887]',
      bgColor: 'bg-[#00b887]/20',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(data?.stats.totalRevenue || 0),
      icon: DollarSign,
      color: 'text-[#00B386]',
      bgColor: 'bg-[#00B386]/20',
    },
    {
      title: 'Active Positions',
      value: data?.stats.activePositions || 0,
      icon: TrendingUp,
      color: 'text-[#00b887]',
      bgColor: 'bg-[#00b887]/20',
    },
    {
      title: 'Open Orders',
      value: data?.stats.openOrders || 0,
      icon: Clock,
      color: 'text-[#00D09C]',
      bgColor: 'bg-[#00D09C]/20',
    },
  ]

  // Sample chart data (replace with real data)
  const revenueData = [
    { month: 'Jan', revenue: 45000 },
    { month: 'Feb', revenue: 62000 },
    { month: 'Mar', revenue: 58000 },
    { month: 'Apr', revenue: 75000 },
    { month: 'May', revenue: 82000 },
    { month: 'Jun', revenue: 95000 },
  ]

  const userGrowthData = [
    { month: 'Jan', users: 120 },
    { month: 'Feb', users: 250 },
    { month: 'Mar', users: 380 },
    { month: 'Apr', users: 520 },
    { month: 'May', users: 680 },
    { month: 'Jun', users: 850 },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#1a1a1a]">Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border-[#e5e7eb] bg-white">
              <CardContent className="p-6">
                <div className="h-24 animate-pulse bg-[#f5f7fa] rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a]">Dashboard</h1>
          <p className="text-[#6b7280] mt-1">Welcome back! Here's what's happening.</p>
        </div>
        <Button
          onClick={fetchData}
          variant="outline"
          className="border-[#e5e7eb] text-[#1a1a1a] hover:bg-[#f5f7fa]"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title} className="border-[#e5e7eb] bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#6b7280] mb-1">{card.title}</p>
                    <h3 className="text-2xl font-bold text-[#1a1a1a]">{card.value}</h3>
                  </div>
                  <div className={`p-3 rounded-full ${card.bgColor}`}>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="border-[#e5e7eb] bg-white">
          <CardHeader>
            <CardTitle className="text-[#1a1a1a]">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: { color: '#00D09C' },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D09C" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00D09C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" tickFormatter={(value) => `₹${(value / 1000)}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#00D09C"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* User Growth Chart */}
        <Card className="border-[#e5e7eb] bg-white">
          <CardHeader>
            <CardTitle className="text-[#1a1a1a]">User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                users: { color: '#00D09C' },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#00D09C"
                    strokeWidth={2}
                    dot={{ fill: '#00D09C' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card className="border-[#e5e7eb] bg-white">
          <CardHeader>
            <CardTitle className="text-[#1a1a1a]">Recent Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[#6b7280]">Name</TableHead>
                  <TableHead className="text-[#6b7280]">Subscription</TableHead>
                  <TableHead className="text-[#6b7280]">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.recentUsers?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="text-[#1a1a1a]">
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name || 'N/A'}</span>
                        <span className="text-xs text-[#6b7280]">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.subscription === 'PREMIUM' ? 'default' : 'secondary'}
                        className={
                          user.subscription === 'PREMIUM'
                            ? 'bg-[#00D09C] text-black'
                            : 'bg-[#f5f7fa] text-[#6b7280]'
                        }
                      >
                        {user.subscription}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#6b7280]">
                      {formatRelativeTime(user.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Trades */}
        <Card className="border-[#e5e7eb] bg-white">
          <CardHeader>
            <CardTitle className="text-[#1a1a1a]">Recent Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[#6b7280]">User</TableHead>
                  <TableHead className="text-[#6b7280]">Symbol</TableHead>
                  <TableHead className="text-[#6b7280]">Type</TableHead>
                  <TableHead className="text-[#6b7280]">P&L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.recentTrades?.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="text-[#1a1a1a] text-sm">
                      {trade.userName || 'N/A'}
                    </TableCell>
                    <TableCell className="text-[#1a1a1a] font-medium">
                      {trade.symbol}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          trade.tradeDirection === 'BUY'
                            ? 'border-[#00D09C] text-[#00D09C]'
                            : 'border-[#d44a2d] text-[#d44a2d]'
                        }
                      >
                        {trade.tradeDirection}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={
                        trade.pnl > 0
                          ? 'text-[#00B386]'
                          : trade.pnl < 0
                          ? 'text-[#d44a2d]'
                          : 'text-[#6b7280]'
                      }
                    >
                      {trade.pnl ? formatCurrency(trade.pnl) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}