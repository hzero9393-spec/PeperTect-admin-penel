'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Search, Filter, X, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Position {
  id: string
  userId: string
  stockId: string
  quantity: number
  avgPrice: number
  currentPrice: number
  totalValue: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  dayChange: number
  dayChangePercent: number
  type: string
  createdAt: string
  updatedAt: string
  userName: string
  userEmail: string
  stockSymbol: string
  stockName: string
  stockType: string
  exchange: string
}

interface Order {
  id: string
  userId: string
  stockId: string
  orderType: string
  tradeType: string
  quantity: number
  price: number | null
  stopPrice: number | null
  filledQuantity: number
  status: string
  reason: string | null
  createdAt: string
  updatedAt: string
  filledAt: string | null
  cancelledAt: string | null
  userName: string
  userEmail: string
  stockSymbol: string
  stockName: string
  stockType: string
  exchange: string
}

interface Trade {
  id: string
  userId: string
  stockId: string
  orderId: string | null
  tradeType: string
  quantity: number
  fillPrice: number
  totalValue: number
  pnl: number | null
  pnlPercent: number | null
  brokerage: number
  tax: number
  transactionType: string
  createdAt: string
  updatedAt: string
  userName: string
  userEmail: string
  stockSymbol: string
  stockName: string
  stockType: string
  exchange: string
}

export default function TradingPage() {
  const [loading, setLoading] = useState(true)
  const [positions, setPositions] = useState<Position[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [activeTab, setActiveTab] = useState('positions')

  // Filters
  const [userSearch, setUserSearch] = useState('')
  const [symbolSearch, setSymbolSearch] = useState('')
  const [segment, setSegment] = useState('all')
  const [status, setStatus] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Dialog states
  const [squareOffDialog, setSquareOffDialog] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [cancelOrderDialog, setCancelOrderDialog] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (userSearch) params.append('userId', userSearch)
      if (symbolSearch) params.append('symbol', symbolSearch)
      if (segment && segment !== 'all') params.append('segment', segment)
      if (status && status !== 'all') params.append('status', status)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`/api/admin/trading?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setPositions(result.data.positions || [])
        setOrders(result.data.orders || [])
        setTrades(result.data.trades || [])
      } else {
        toast.error('Failed to load trading data')
      }
    } catch (error) {
      toast.error('An error occurred while fetching data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm')
  }

  const handleForceSquareOff = async () => {
    if (!selectedPosition) return

    setActionLoading(true)
    try {
      // Here you would implement the actual square-off API call
      // For now, just simulate it
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success(`Position ${selectedPosition.stockSymbol} squared off successfully`)
      setSquareOffDialog(false)
      setSelectedPosition(null)
      fetchData()
    } catch (error) {
      toast.error('Failed to square off position')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!selectedOrder) return

    setActionLoading(true)
    try {
      // Here you would implement the actual cancel order API call
      // For now, just simulate it
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success(`Order ${selectedOrder.id} cancelled successfully`)
      setCancelOrderDialog(false)
      setSelectedOrder(null)
      fetchData()
    } catch (error) {
      toast.error('Failed to cancel order')
    } finally {
      setActionLoading(false)
    }
  }

  const clearFilters = () => {
    setUserSearch('')
    setSymbolSearch('')
    setSegment('all')
    setStatus('all')
    setStartDate('')
    setEndDate('')
  }

  const renderPositions = () => (
    <div className="space-y-4">
      <Card className="border-[#2A2D3A] bg-[#1A1D29]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#2A2D3A] hover:bg-transparent">
                  <TableHead className="text-gray-400">User</TableHead>
                  <TableHead className="text-gray-400">Symbol</TableHead>
                  <TableHead className="text-gray-400">Segment</TableHead>
                  <TableHead className="text-gray-400 text-right">Quantity</TableHead>
                  <TableHead className="text-gray-400 text-right">Avg Price</TableHead>
                  <TableHead className="text-gray-400 text-right">Current Price</TableHead>
                  <TableHead className="text-gray-400 text-right">Unrealized P&L</TableHead>
                  <TableHead className="text-gray-400 text-right">P&L %</TableHead>
                  <TableHead className="text-gray-400 text-right">Day Change</TableHead>
                  <TableHead className="text-gray-400 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i} className="border-[#2A2D3A]">
                      {[...Array(10)].map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-[#2A2D3A] animate-pulse rounded" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : positions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-gray-400 py-8">
                      No positions found
                    </TableCell>
                  </TableRow>
                ) : (
                  positions.map((position) => (
                    <TableRow key={position.id} className="border-[#2A2D3A] hover:bg-[#2A2D3A]/30">
                      <TableCell>
                        <div className="text-white font-medium">{position.userName || 'N/A'}</div>
                        <div className="text-xs text-gray-400">{position.userEmail || ''}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-white font-medium">{position.stockSymbol}</div>
                        <div className="text-xs text-gray-400">{position.stockName || ''}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-[#2A2D3A] text-gray-300">
                          {position.stockType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white text-right">{position.quantity}</TableCell>
                      <TableCell className="text-white text-right">{formatCurrency(position.avgPrice)}</TableCell>
                      <TableCell className="text-white text-right">{formatCurrency(position.currentPrice)}</TableCell>
                      <TableCell className={`text-right font-medium ${
                        position.unrealizedPnl > 0 ? 'text-green-400' : position.unrealizedPnl < 0 ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {formatCurrency(position.unrealizedPnl)}
                      </TableCell>
                      <TableCell className={`text-right ${
                        position.unrealizedPnlPercent > 0 ? 'text-green-400' : position.unrealizedPnlPercent < 0 ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {position.unrealizedPnlPercent?.toFixed(2)}%
                      </TableCell>
                      <TableCell className={`text-right ${
                        position.dayChange > 0 ? 'text-green-400' : position.dayChange < 0 ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {position.dayChange > 0 ? '+' : ''}{position.dayChange?.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          onClick={() => {
                            setSelectedPosition(position)
                            setSquareOffDialog(true)
                          }}
                        >
                          Force Square-off
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderOrders = () => (
    <div className="space-y-4">
      <Card className="border-[#2A2D3A] bg-[#1A1D29]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#2A2D3A] hover:bg-transparent">
                  <TableHead className="text-gray-400">User</TableHead>
                  <TableHead className="text-gray-400">Symbol</TableHead>
                  <TableHead className="text-gray-400">Type</TableHead>
                  <TableHead className="text-gray-400 text-right">Quantity</TableHead>
                  <TableHead className="text-gray-400 text-right">Price</TableHead>
                  <TableHead className="text-gray-400 text-right">Filled</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Created At</TableHead>
                  <TableHead className="text-gray-400 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i} className="border-[#2A2D3A]">
                      {[...Array(9)].map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-[#2A2D3A] animate-pulse rounded" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-400 py-8">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id} className="border-[#2A2D3A] hover:bg-[#2A2D3A]/30">
                      <TableCell>
                        <div className="text-white font-medium">{order.userName || 'N/A'}</div>
                        <div className="text-xs text-gray-400">{order.userEmail || ''}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-white font-medium">{order.stockSymbol}</div>
                        <div className="text-xs text-gray-400">{order.stockName || ''}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Badge
                            variant="outline"
                            className={
                              order.tradeType === 'BUY'
                                ? 'border-green-500 text-green-500'
                                : 'border-red-500 text-red-500'
                            }
                          >
                            {order.tradeType}
                          </Badge>
                          <Badge variant="outline" className="border-[#2A2D3A] text-gray-300">
                            {order.orderType}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-white text-right">{order.quantity}</TableCell>
                      <TableCell className="text-white text-right">
                        {order.price ? formatCurrency(order.price) : 'Market'}
                      </TableCell>
                      <TableCell className="text-white text-right">
                        {order.filledQuantity || 0}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            order.status === 'FILLED'
                              ? 'border-green-500 text-green-500'
                              : order.status === 'PENDING'
                              ? 'border-yellow-500 text-yellow-500'
                              : order.status === 'CANCELLED'
                              ? 'border-red-500 text-red-500'
                              : 'border-gray-500 text-gray-400'
                          }
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-400">{formatDate(order.createdAt)}</TableCell>
                      <TableCell className="text-center">
                        {order.status === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                            onClick={() => {
                              setSelectedOrder(order)
                              setCancelOrderDialog(true)
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderTrades = () => (
    <div className="space-y-4">
      <Card className="border-[#2A2D3A] bg-[#1A1D29]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#2A2D3A] hover:bg-transparent">
                  <TableHead className="text-gray-400">User</TableHead>
                  <TableHead className="text-gray-400">Symbol</TableHead>
                  <TableHead className="text-gray-400">Type</TableHead>
                  <TableHead className="text-gray-400 text-right">Quantity</TableHead>
                  <TableHead className="text-gray-400 text-right">Fill Price</TableHead>
                  <TableHead className="text-gray-400 text-right">Total Value</TableHead>
                  <TableHead className="text-gray-400 text-right">P&L</TableHead>
                  <TableHead className="text-gray-400 text-right">Brokerage</TableHead>
                  <TableHead className="text-gray-400">Executed At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i} className="border-[#2A2D3A]">
                      {[...Array(9)].map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-[#2A2D3A] animate-pulse rounded" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : trades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-400 py-8">
                      No trades found
                    </TableCell>
                  </TableRow>
                ) : (
                  trades.map((trade) => (
                    <TableRow key={trade.id} className="border-[#2A2D3A] hover:bg-[#2A2D3A]/30">
                      <TableCell>
                        <div className="text-white font-medium">{trade.userName || 'N/A'}</div>
                        <div className="text-xs text-gray-400">{trade.userEmail || ''}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-white font-medium">{trade.stockSymbol}</div>
                        <div className="text-xs text-gray-400">{trade.stockName || ''}</div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            trade.tradeType === 'BUY'
                              ? 'border-green-500 text-green-500'
                              : 'border-red-500 text-red-500'
                          }
                        >
                          {trade.tradeType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white text-right">{trade.quantity}</TableCell>
                      <TableCell className="text-white text-right">{formatCurrency(trade.fillPrice)}</TableCell>
                      <TableCell className="text-white text-right">{formatCurrency(trade.totalValue)}</TableCell>
                      <TableCell className={`text-right font-medium ${
                        trade.pnl > 0 ? 'text-green-400' : trade.pnl < 0 ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {trade.pnl ? formatCurrency(trade.pnl) : '-'}
                      </TableCell>
                      <TableCell className="text-gray-400 text-right">{formatCurrency(trade.brokerage)}</TableCell>
                      <TableCell className="text-gray-400">{formatDate(trade.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Trading Management</h1>
          <p className="text-gray-400 mt-1">Monitor and manage positions, orders, and trades</p>
        </div>
        <Button
          onClick={fetchData}
          variant="outline"
          className="border-[#2A2D3A] text-white hover:bg-[#2A2D3A]"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-[#2A2D3A] bg-[#1A1D29]">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-[#00D09C]" />
            <span className="text-sm font-medium text-white">Filters</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-400">User ID/Name</label>
              <Input
                placeholder="Search user..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="bg-[#0F1117] border-[#2A2D3A] text-white placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Symbol</label>
              <Input
                placeholder="Search symbol..."
                value={symbolSearch}
                onChange={(e) => setSymbolSearch(e.target.value)}
                className="bg-[#0F1117] border-[#2A2D3A] text-white placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Segment</label>
              <Select value={segment} onValueChange={setSegment}>
                <SelectTrigger className="bg-[#0F1117] border-[#2A2D3A] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1D29] border-[#2A2D3A]">
                  <SelectItem value="all">All Segments</SelectItem>
                  <SelectItem value="EQUITY">Equity</SelectItem>
                  <SelectItem value="FUTURES">Futures</SelectItem>
                  <SelectItem value="OPTIONS">Options</SelectItem>
                  <SelectItem value="ETF">ETF</SelectItem>
                  <SelectItem value="INDEX">Index</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Order Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-[#0F1117] border-[#2A2D3A] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1D29] border-[#2A2D3A]">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="FILLED">Filled</SelectItem>
                  <SelectItem value="PARTIALLY_FILLED">Partially Filled</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-[#0F1117] border-[#2A2D3A] text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-[#0F1117] border-[#2A2D3A] text-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Button
              onClick={fetchData}
              className="bg-[#00D09C] hover:bg-[#00B889] text-black font-medium"
            >
              <Search className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
            <Button
              onClick={clearFilters}
              variant="outline"
              className="border-[#2A2D3A] text-white hover:bg-[#2A2D3A]"
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-[#1A1D29] border-[#2A2D3A] p-1">
          <TabsTrigger
            value="positions"
            className="data-[state=active]:bg-[#00D09C] data-[state=active]:text-black text-gray-400"
          >
            Positions
            {positions.length > 0 && (
              <span className="ml-2 bg-[#2A2D3A] text-white text-xs px-2 py-0.5 rounded-full">
                {positions.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="data-[state=active]:bg-[#00D09C] data-[state=active]:text-black text-gray-400"
          >
            Orders
            {orders.length > 0 && (
              <span className="ml-2 bg-[#2A2D3A] text-white text-xs px-2 py-0.5 rounded-full">
                {orders.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="trades"
            className="data-[state=active]:bg-[#00D09C] data-[state=active]:text-black text-gray-400"
          >
            Trades
            {trades.length > 0 && (
              <span className="ml-2 bg-[#2A2D3A] text-white text-xs px-2 py-0.5 rounded-full">
                {trades.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="positions">{renderPositions()}</TabsContent>
        <TabsContent value="orders">{renderOrders()}</TabsContent>
        <TabsContent value="trades">{renderTrades()}</TabsContent>
      </Tabs>

      {/* Force Square-off Dialog */}
      <Dialog open={squareOffDialog} onOpenChange={setSquareOffDialog}>
        <DialogContent className="bg-[#1A1D29] border-[#2A2D3A] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Force Square-off Position
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to force square-off this position? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedPosition && (
            <div className="bg-[#0F1117] p-4 rounded-lg space-y-2 border border-[#2A2D3A]">
              <div className="flex justify-between">
                <span className="text-gray-400">Symbol:</span>
                <span className="text-white font-medium">{selectedPosition.stockSymbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">User:</span>
                <span className="text-white">{selectedPosition.userName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Quantity:</span>
                <span className="text-white">{selectedPosition.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Avg Price:</span>
                <span className="text-white">{formatCurrency(selectedPosition.avgPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Unrealized P&L:</span>
                <span className={selectedPosition.unrealizedPnl > 0 ? 'text-green-400' : 'text-red-400'}>
                  {formatCurrency(selectedPosition.unrealizedPnl)}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSquareOffDialog(false)}
              className="border-[#2A2D3A] text-white hover:bg-[#2A2D3A]"
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleForceSquareOff}
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : 'Force Square-off'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Order Dialog */}
      <Dialog open={cancelOrderDialog} onOpenChange={setCancelOrderDialog}>
        <DialogContent className="bg-[#1A1D29] border-[#2A2D3A] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Cancel Order
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to cancel this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="bg-[#0F1117] p-4 rounded-lg space-y-2 border border-[#2A2D3A]">
              <div className="flex justify-between">
                <span className="text-gray-400">Symbol:</span>
                <span className="text-white font-medium">{selectedOrder.stockSymbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">User:</span>
                <span className="text-white">{selectedOrder.userName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Type:</span>
                <span className="text-white">{selectedOrder.tradeType} {selectedOrder.orderType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Quantity:</span>
                <span className="text-white">{selectedOrder.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Price:</span>
                <span className="text-white">{selectedOrder.price ? formatCurrency(selectedOrder.price) : 'Market'}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelOrderDialog(false)}
              className="border-[#2A2D3A] text-white hover:bg-[#2A2D3A]"
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCancelOrder}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : 'Confirm Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}