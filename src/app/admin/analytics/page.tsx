'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Users, TrendingUp, DollarSign, BarChart3, PieChart as PieChartIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Line, LineChart, Area, AreaChart, Bar, BarChart, Pie, PieChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Legend } from 'recharts'
import { toast } from 'sonner'

interface AnalyticsData {
  userAnalytics: {
    registrationsOverTime: any[]
    activeUsers: {
      dau: number
      mau: number
      ratio: string
    }
    subscriptionDistribution: any[]
  }
  tradingAnalytics: {
    volumeTrends: any[]
    popularStocks: any[]
    avgTradeSizeBySegment: any[]
  }
  revenueAnalytics: {
    revenueTrends: any[]
    conversionFunnel: {
      signups: number
      premium: number
      active: number
      powerUsers: number
    }
    monthlyBreakdown: any[]
  }
}

const COLORS = {
  primary: '#00D09C',
  secondary: '#3B82F6',
  purple: '#8B5CF6',
  orange: '#F97316',
  pink: '#EC4899',
  yellow: '#EAB308'
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [period, setPeriod] = useState('30d')

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/analytics?period=${period}`)
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        toast.error('Failed to load analytics data')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [period])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
  }

  const formatCompactCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`
    return `₹${value}`
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  // Conversion funnel cards
  const funnelCards = data?.revenueAnalytics?.conversionFunnel ? [
    {
      title: 'Signups',
      value: data.revenueAnalytics.conversionFunnel.signups,
      icon: Users,
      color: COLORS.secondary,
      bgColor: 'bg-blue-500/20',
      description: 'Total user registrations'
    },
    {
      title: 'Premium Users',
      value: data.revenueAnalytics.conversionFunnel.premium,
      icon: DollarSign,
      color: COLORS.primary,
      bgColor: 'bg-[#00D09C]/20',
      description: 'Paid subscriptions'
    },
    {
      title: 'Active Traders',
      value: data.revenueAnalytics.conversionFunnel.active,
      icon: TrendingUp,
      color: COLORS.purple,
      bgColor: 'bg-purple-500/20',
      description: 'Users with trades'
    },
    {
      title: 'Power Users',
      value: data.revenueAnalytics.conversionFunnel.powerUsers,
      icon: BarChart3,
      color: COLORS.orange,
      bgColor: 'bg-orange-500/20',
      description: '10+ trades per user'
    }
  ] : []

  // Pie chart colors
  const pieColors = [COLORS.primary, COLORS.secondary, COLORS.purple, COLORS.orange, COLORS.pink]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
        </div>
        <div className="space-y-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-64 bg-[#1A1D29] border border-[#2A2D3A] rounded-xl animate-pulse" />
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
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 mt-1">Comprehensive insights into your platform performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="border-[#2A2D3A] bg-[#1A1D29] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1D29] border-[#2A2D3A]">
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={fetchData}
            variant="outline"
            className="border-[#2A2D3A] text-white hover:bg-[#2A2D3A]"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* ============================================ */}
      {/* USER ANALYTICS SECTION */}
      {/* ============================================ */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[#00D09C]" />
          <h2 className="text-xl font-semibold text-white">User Analytics</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Registration Chart */}
          <Card className="border-[#2A2D3A] bg-[#1A1D29]">
            <CardHeader>
              <CardTitle className="text-white">User Registration Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  registrations: { color: COLORS.primary },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.userAnalytics?.registrationsOverTime || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3A" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke={COLORS.primary}
                      strokeWidth={2}
                      dot={{ fill: COLORS.primary }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Active Users (DAU/MAU) */}
          <Card className="border-[#2A2D3A] bg-[#1A1D29]">
            <CardHeader>
              <CardTitle className="text-white">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center h-[200px]">
                <div className="grid grid-cols-2 gap-8 w-full">
                  <div className="text-center">
                    <p className="text-sm text-gray-400 mb-2">Daily Active Users</p>
                    <p className="text-4xl font-bold text-[#00D09C]">
                      {data?.userAnalytics?.activeUsers?.dau || 0}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400 mb-2">Monthly Active Users</p>
                    <p className="text-4xl font-bold text-blue-400">
                      {data?.userAnalytics?.activeUsers?.mau || 0}
                    </p>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-400">DAU/MAU Ratio</p>
                  <p className="text-2xl font-bold text-purple-400 mt-1">
                    {data?.userAnalytics?.activeUsers?.ratio || 0}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Engagement metric</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Distribution Pie Chart */}
        <Card className="border-[#2A2D3A] bg-[#1A1D29]">
          <CardHeader>
            <CardTitle className="text-white">User Distribution by Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{}}
              className="h-[350px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.userAnalytics?.subscriptionDistribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.planType}: ${entry.count}`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {(data?.userAnalytics?.subscriptionDistribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* TRADING ANALYTICS SECTION */}
      {/* ============================================ */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[#00D09C]" />
          <h2 className="text-xl font-semibold text-white">Trading Analytics</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trade Volume Chart */}
          <Card className="border-[#2A2D3A] bg-[#1A1D29]">
            <CardHeader>
              <CardTitle className="text-white">Daily Trade Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  volume: { color: COLORS.primary },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.tradingAnalytics?.volumeTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3A" />
                    <XAxis dataKey="date" stroke="#9CA3AF" tickFormatter={(value) => value.slice(5)} />
                    <YAxis stroke="#9CA3AF" tickFormatter={(value) => formatCompactCurrency(value)} />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Bar dataKey="totalVolume" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Average Trade Size by Segment */}
          <Card className="border-[#2A2D3A] bg-[#1A1D29]">
            <CardHeader>
              <CardTitle className="text-white">Average Trade Size by Segment</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  avgValue: { color: COLORS.secondary },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.tradingAnalytics?.avgTradeSizeBySegment || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3A" />
                    <XAxis dataKey="segment" stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#9CA3AF" tickFormatter={(value) => formatCompactCurrency(value)} />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Bar dataKey="avgValue" fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Popular Stocks Table */}
        <Card className="border-[#2A2D3A] bg-[#1A1D29]">
          <CardHeader>
            <CardTitle className="text-white">Top 10 Popular Stocks by Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-400">Rank</TableHead>
                  <TableHead className="text-gray-400">Symbol</TableHead>
                  <TableHead className="text-gray-400">Name</TableHead>
                  <TableHead className="text-gray-400">Trades</TableHead>
                  <TableHead className="text-gray-400">Total Volume</TableHead>
                  <TableHead className="text-gray-400">Avg Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.tradingAnalytics?.popularStocks?.map((stock, index) => (
                  <TableRow key={stock.symbol}>
                    <TableCell className="text-white">
                      <Badge className="bg-[#2A2D3A] text-white">#{index + 1}</Badge>
                    </TableCell>
                    <TableCell className="text-white font-bold">{stock.symbol}</TableCell>
                    <TableCell className="text-gray-300">{stock.name || 'N/A'}</TableCell>
                    <TableCell className="text-white">{stock.tradeCount}</TableCell>
                    <TableCell className="text-[#00D09C] font-medium">
                      {formatCurrency(stock.totalVolume)}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {Math.round(stock.avgQuantity).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* REVENUE ANALYTICS SECTION */}
      {/* ============================================ */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-[#00D09C]" />
          <h2 className="text-xl font-semibold text-white">Revenue Analytics</h2>
        </div>

        {/* Conversion Funnel */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {funnelCards.map((card) => {
            const Icon = card.icon
            return (
              <Card key={card.title} className="border-[#2A2D3A] bg-[#1A1D29]">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-400 mb-2">{card.title}</p>
                      <h3 className="text-3xl font-bold text-white">{card.value}</h3>
                      <p className="text-xs text-gray-500 mt-1">{card.description}</p>
                    </div>
                    <div className={`p-3 rounded-full ${card.bgColor}`}>
                      <Icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend Chart */}
          <Card className="border-[#2A2D3A] bg-[#1A1D29]">
            <CardHeader>
              <CardTitle className="text-white">Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  totalRevenue: { color: COLORS.primary },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.revenueAnalytics?.revenueTrends || []}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3A" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" tickFormatter={(value) => formatCompactCurrency(value)} />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Area
                      type="monotone"
                      dataKey="totalRevenue"
                      stroke={COLORS.primary}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Monthly Revenue Breakdown Table */}
          <Card className="border-[#2A2D3A] bg-[#1A1D29]">
            <CardHeader>
              <CardTitle className="text-white">Monthly Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-400">Month</TableHead>
                    <TableHead className="text-gray-400">Plan</TableHead>
                    <TableHead className="text-gray-400">Revenue</TableHead>
                    <TableHead className="text-gray-400">Subs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.revenueAnalytics?.monthlyBreakdown?.map((item, index) => (
                    <TableRow key={`${item.month}-${item.planType}-${index}`}>
                      <TableCell className="text-white">{item.month}</TableCell>
                      <TableCell>
                        <Badge
                          variant={item.planType === 'PRO' ? 'default' : 'secondary'}
                          className={
                            item.planType === 'PRO'
                              ? 'bg-[#00D09C] text-black'
                              : item.planType === 'PREMIUM'
                              ? 'bg-blue-500 text-white'
                              : 'bg-[#2A2D3A] text-gray-300'
                          }
                        >
                          {item.planType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[#00D09C] font-medium">
                        {formatCurrency(item.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-white">{item.subscriptionCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}