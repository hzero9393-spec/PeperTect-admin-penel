'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Users, CreditCard, DollarSign, TrendingUp, AlertCircle, Plus, Gift } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Line, LineChart, Area, AreaChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'

interface SubscriptionData {
  activeSubscriptions: any[]
  expiringSoon: any[]
  stats: {
    activeSubscriptions: number
    expiringSoon: number
    mrr: number
    totalRevenue: number
    churnRate: number
  }
  monthlyRevenue: {
    month: string
    revenue: number
    subscriptions: number
  }[]
}

export default function SubscriptionsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [grantDialogOpen, setGrantDialogOpen] = useState(false)
  const [granting, setGranting] = useState(false)
  const [grantEmail, setGrantEmail] = useState('')
  const [grantPlan, setGrantPlan] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/subscriptions')
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        toast.error('Failed to load subscriptions data')
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

  const handleGrantSubscription = async () => {
    if (!grantEmail || !grantPlan) {
      toast.error('Please fill all fields')
      return
    }

    setGranting(true)
    try {
      const response = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: grantEmail, planType: grantPlan }),
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Subscription granted successfully')
        setGrantDialogOpen(false)
        setGrantEmail('')
        setGrantPlan('')
        fetchData()
      } else {
        toast.error(result.error || 'Failed to grant subscription')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setGranting(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getDaysUntilExpiry = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const statsCards = [
    {
      title: 'Active Subscriptions',
      value: data?.stats.activeSubscriptions || 0,
      icon: Users,
      color: 'text-[#00D09C]',
      bgColor: 'bg-[#00D09C]/20',
    },
    {
      title: 'Expiring Soon',
      value: data?.stats.expiringSoon || 0,
      icon: AlertCircle,
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/20',
    },
    {
      title: 'MRR',
      value: formatCurrency(data?.stats.mrr || 0),
      icon: CreditCard,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/20',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(data?.stats.totalRevenue || 0),
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'bg-green-400/20',
    },
    {
      title: 'Churn Rate',
      value: `${(data?.stats.churnRate || 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-pink-400',
      bgColor: 'bg-pink-400/20',
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Subscriptions</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="border-[#2A2D3A] bg-[#1A1D29]">
              <CardContent className="p-6">
                <div className="h-24 animate-pulse bg-[#2A2D3A] rounded" />
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
          <h1 className="text-3xl font-bold text-white">Subscriptions</h1>
          <p className="text-gray-400 mt-1">Manage user subscriptions and revenue</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={grantDialogOpen} onOpenChange={setGrantDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#00D09C] text-black hover:bg-[#00D09C]/80">
                <Gift className="h-4 w-4 mr-2" />
                Grant Subscription
              </Button>
            </DialogTrigger>
            <DialogContent className="border-[#2A2D3A] bg-[#1A1D29] text-white">
              <DialogHeader>
                <DialogTitle>Grant Subscription</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Manually grant a subscription to a user
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">User Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={grantEmail}
                    onChange={(e) => setGrantEmail(e.target.value)}
                    className="border-[#2A2D3A] bg-[#0F1117] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan">Plan Type</Label>
                  <Select value={grantPlan} onValueChange={setGrantPlan}>
                    <SelectTrigger className="border-[#2A2D3A] bg-[#0F1117] text-white">
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent className="border-[#2A2D3A] bg-[#1A1D29]">
                      <SelectItem value="PREMIUM">Premium (₹999/month)</SelectItem>
                      <SelectItem value="PRO">Pro (₹1999/month)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setGrantDialogOpen(false)}
                  className="border-[#2A2D3A] text-white hover:bg-[#2A2D3A]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGrantSubscription}
                  disabled={granting}
                  className="bg-[#00D09C] text-black hover:bg-[#00D09C]/80"
                >
                  {granting ? 'Granting...' : 'Grant Subscription'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statsCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title} className="border-[#2A2D3A] bg-[#1A1D29]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">{card.title}</p>
                    <h3 className="text-2xl font-bold text-white">{card.value}</h3>
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

      {/* Charts and Expiring Soon */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 border-[#2A2D3A] bg-[#1A1D29]">
          <CardHeader>
            <CardTitle className="text-white">Revenue Trend (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: { color: '#00D09C' },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.monthlyRevenue || []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D09C" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00D09C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3A" />
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

        {/* Expiring Soon */}
        <Card className="border-[#2A2D3A] bg-[#1A1D29]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-400" />
              Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.expiringSoon && data.expiringSoon.length > 0 ? (
              <div className="space-y-3">
                {data.expiringSoon.slice(0, 5).map((sub) => (
                  <div key={sub.id} className="p-3 rounded-lg bg-[#0F1117] border border-[#2A2D3A]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-white">{sub.userName || sub.userEmail}</span>
                      <Badge
                        className={
                          sub.planType === 'PRO'
                            ? 'bg-purple-500/20 text-purple-400'
                            : sub.planType === 'PREMIUM'
                            ? 'bg-[#00D09C]/20 text-[#00D09C]'
                            : 'bg-gray-500/20 text-gray-400'
                        }
                      >
                        {sub.planType}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400">
                      Expires in <span className="text-orange-400 font-medium">{getDaysUntilExpiry(sub.expiresAt)} days</span>
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No subscriptions expiring soon</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Subscriptions Table */}
      <Card className="border-[#2A2D3A] bg-[#1A1D29]">
        <CardHeader>
          <CardTitle className="text-white">Active Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.activeSubscriptions && data.activeSubscriptions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-400">User</TableHead>
                  <TableHead className="text-gray-400">Plan</TableHead>
                  <TableHead className="text-gray-400">Amount</TableHead>
                  <TableHead className="text-gray-400">Started At</TableHead>
                  <TableHead className="text-gray-400">Expires At</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.activeSubscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="text-white">
                      <div className="flex flex-col">
                        <span className="font-medium">{sub.userName || 'N/A'}</span>
                        <span className="text-xs text-gray-400">{sub.userEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          sub.planType === 'PRO'
                            ? 'bg-purple-500/20 text-purple-400'
                            : sub.planType === 'PREMIUM'
                            ? 'bg-[#00D09C]/20 text-[#00D09C]'
                            : 'bg-gray-500/20 text-gray-400'
                        }
                      >
                        {sub.planType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white font-medium">{formatCurrency(sub.amount)}</TableCell>
                    <TableCell className="text-gray-400">{formatDate(sub.startedAt)}</TableCell>
                    <TableCell className="text-gray-400">{formatDate(sub.expiresAt)}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                        onClick={() => {
                          toast.info('Action details would go here')
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active subscriptions found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}