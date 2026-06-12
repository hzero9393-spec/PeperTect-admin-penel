'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, RefreshCw, Search, Calendar, TrendingUp, TrendingDown, MoreHorizontal } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

interface Index {
  id: string
  symbol: string
  name: string
  lotSize: number
  expiryDay: string
  tickSize: number
  currentPrice: number
  previousClose: number
  change: number
  changePercent: number
  isEnabled: boolean
  lastUpdated: string
}

interface Stock {
  id: string
  symbol: string
  name: string
  sector: string
  exchange: string
  type: string
  lotSize: number
  tickSize: number
  currentPrice: number
  open: number
  high: number
  low: number
  previousClose: number
  change: number
  changePercent: number
  volume: number
  marketCap: number
  isEnabled: boolean
  lastUpdated: string
}

interface FnoBanEntry {
  id: string
  stockSymbol: string
  stockName: string
  stockId: string
  banStartDate: string
  banEndDate: string
  reason: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface MarketHoliday {
  id: string
  name: string
  date: string
  isMuhurat: boolean
  muhuratStart: string
  muhuratEnd: string
  createdAt: string
}

interface MarketData {
  indices: Index[]
  stocks: Stock[]
  fnoBanEntries: FnoBanEntry[]
  marketHolidays: MarketHoliday[]
}

export default function MarketPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<MarketData | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('indices')

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [editingItem, setEditingItem] = useState<any>(null)

  // Form states
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/market')
      const result = await response.json()
      if (result.success) {
        setData(result.data)
        toast.success('Market data loaded successfully')
      } else {
        toast.error('Failed to load market data')
      }
    } catch (error) {
      toast.error('An error occurred while fetching data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-IN').format(value)
  }

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(2)}%`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const handleEdit = (item: any, type: string) => {
    setEditingItem(item)
    setDialogMode('edit')
    setFormData({ ...item })
    setDialogOpen(true)
  }

  const handleCreate = (type: string) => {
    setEditingItem(null)
    setDialogMode('create')

    const defaultData: any = {}
    if (type === 'index') {
      defaultData.tickSize = 0.05
      defaultData.isEnabled = true
    } else if (type === 'stock') {
      defaultData.exchange = 'NSE'
      defaultData.tickSize = 0.05
      defaultData.isEnabled = true
    } else if (type === 'fnoBan') {
      defaultData.isActive = true
      defaultData.banStartDate = new Date().toISOString().split('T')[0]
    } else if (type === 'holiday') {
      defaultData.isMuhurat = false
    }

    setFormData(defaultData)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      const type = activeTab === 'f&o-ban' ? 'fnoBan' : activeTab === 'holidays' ? 'holiday' : activeTab.slice(0, -1)

      const response = await fetch('/api/admin/market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: dialogMode === 'create' ? 'create' : 'update',
          type,
          data: formData,
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success(result.message)
        setDialogOpen(false)
        fetchData()
      } else {
        toast.error(result.error || 'Failed to save')
      }
    } catch (error) {
      toast.error('An error occurred while saving')
    }
  }

  const handleToggleStatus = async (id: string, type: string, isEnabled: boolean) => {
    try {
      const response = await fetch('/api/admin/market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggleStatus',
          data: { id, type, isEnabled },
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Status updated successfully')
        fetchData()
      } else {
        toast.error('Failed to update status')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const handleMarkFnoBan = async (stock: Stock) => {
    try {
      const response = await fetch('/api/admin/market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'markFnoBan',
          data: {
            stockId: stock.id,
            stockSymbol: stock.symbol,
            stockName: stock.name,
            banStartDate: new Date().toISOString(),
            reason: 'Position limit breach',
          },
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Stock marked for F&O ban')
        fetchData()
      } else {
        toast.error('Failed to mark F&O ban')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const handleRemoveFnoBan = async (id: string) => {
    try {
      const response = await fetch('/api/admin/market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'removeFnoBan',
          data: { id },
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success('F&O ban removed')
        fetchData()
      } else {
        toast.error('Failed to remove F&O ban')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const handleDeleteHoliday = async (id: string) => {
    if (!confirm('Are you sure you want to delete this holiday?')) return

    try {
      const response = await fetch('/api/admin/market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteHoliday',
          data: { id },
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Holiday deleted successfully')
        fetchData()
      } else {
        toast.error('Failed to delete holiday')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const filterData = (items: any[], searchField: string) => {
    if (!searchTerm) return items
    return items.filter((item) =>
      item[searchField]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const filteredIndices = filterData(data?.indices || [], 'symbol')
  const filteredStocks = filterData(data?.stocks || [], 'symbol')
  const filteredFnoBans = filterData(data?.fnoBanEntries || [], 'stockSymbol')
  const filteredHolidays = filterData(data?.marketHolidays || [], 'name')

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#1a1a1a]">Market Data Management</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-[#e5e7eb] bg-white">
              <CardContent className="p-6">
                <div className="h-32 animate-pulse bg-[#f0f2f5] rounded" />
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a]">Market Data Management</h1>
          <p className="text-[#6b7280] mt-1">Manage indices, stocks, F&O bans, and market holidays</p>
        </div>
        <Button
          onClick={fetchData}
          variant="outline"
          className="border-[#e5e7eb] text-[#1a1a1a] hover:bg-[#f0f2f5]"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border border-[#e5e7eb]">
          <TabsTrigger value="indices" className="data-[state=active]:bg-[#00D09C] data-[state=active]:text-black">
            Indices
          </TabsTrigger>
          <TabsTrigger value="stocks" className="data-[state=active]:bg-[#00D09C] data-[state=active]:text-black">
            Stocks
          </TabsTrigger>
          <TabsTrigger value="f&o-ban" className="data-[state=active]:bg-[#00D09C] data-[state=active]:text-black">
            F&O Ban
          </TabsTrigger>
          <TabsTrigger value="holidays" className="data-[state=active]:bg-[#00D09C] data-[state=active]:text-black">
            Holidays
          </TabsTrigger>
        </TabsList>

        {/* Indices Tab */}
        <TabsContent value="indices">
          <Card className="border-[#e5e7eb] bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-[#1a1a1a]">Indices</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6b7280]" />
                    <Input
                      placeholder="Search indices..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a] w-64"
                    />
                  </div>
                  <Button
                    onClick={() => handleCreate('index')}
                    className="bg-[#00D09C] text-black hover:bg-[#00b88c]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Index
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[#6b7280]">Symbol</TableHead>
                    <TableHead className="text-[#6b7280]">Name</TableHead>
                    <TableHead className="text-[#6b7280]">Lot Size</TableHead>
                    <TableHead className="text-[#6b7280]">Expiry Day</TableHead>
                    <TableHead className="text-[#6b7280]">Tick Size</TableHead>
                    <TableHead className="text-[#6b7280]">Current Price</TableHead>
                    <TableHead className="text-[#6b7280]">Change</TableHead>
                    <TableHead className="text-[#6b7280]">Status</TableHead>
                    <TableHead className="text-[#6b7280]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIndices.map((index) => (
                    <TableRow key={index.id}>
                      <TableCell className="text-[#1a1a1a] font-medium">{index.symbol}</TableCell>
                      <TableCell className="text-[#1a1a1a]">{index.name}</TableCell>
                      <TableCell className="text-[#6b7280]">{index.lotSize}</TableCell>
                      <TableCell className="text-[#6b7280]">{index.expiryDay}</TableCell>
                      <TableCell className="text-[#6b7280]">{index.tickSize}</TableCell>
                      <TableCell className="text-[#1a1a1a]">{formatCurrency(index.currentPrice)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {index.changePercent >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-400" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-400" />
                          )}
                          <span className={index.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {formatPercent(index.changePercent)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={index.isEnabled ? 'default' : 'secondary'}
                          className={index.isEnabled ? 'bg-[#00D09C] text-black' : 'bg-[#f0f2f5] text-[#6b7280]'}
                        >
                          {index.isEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(index, 'index')}
                            className="text-[#6b7280] hover:text-[#1a1a1a]"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Switch
                            checked={index.isEnabled}
                            onCheckedChange={(checked) => handleToggleStatus(index.id, 'index', checked)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stocks Tab */}
        <TabsContent value="stocks">
          <Card className="border-[#e5e7eb] bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-[#1a1a1a]">Stocks</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6b7280]" />
                    <Input
                      placeholder="Search stocks..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a] w-64"
                    />
                  </div>
                  <Button
                    onClick={() => handleCreate('stock')}
                    className="bg-[#00D09C] text-black hover:bg-[#00b88c]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Stock
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[#6b7280]">Symbol</TableHead>
                    <TableHead className="text-[#6b7280]">Name</TableHead>
                    <TableHead className="text-[#6b7280]">Sector</TableHead>
                    <TableHead className="text-[#6b7280]">Type</TableHead>
                    <TableHead className="text-[#6b7280]">Current Price</TableHead>
                    <TableHead className="text-[#6b7280]">Change %</TableHead>
                    <TableHead className="text-[#6b7280]">Status</TableHead>
                    <TableHead className="text-[#6b7280]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStocks.slice(0, 50).map((stock) => (
                    <TableRow key={stock.id}>
                      <TableCell className="text-[#1a1a1a] font-medium">{stock.symbol}</TableCell>
                      <TableCell className="text-[#1a1a1a]">{stock.name}</TableCell>
                      <TableCell className="text-[#6b7280]">{stock.sector}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-[#e5e7eb] text-[#6b7280]">
                          {stock.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[#1a1a1a]">{formatCurrency(stock.currentPrice)}</TableCell>
                      <TableCell>
                        <span className={stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {formatPercent(stock.changePercent)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={stock.isEnabled ? 'default' : 'secondary'}
                          className={stock.isEnabled ? 'bg-[#00D09C] text-black' : 'bg-[#f0f2f5] text-[#6b7280]'}
                        >
                          {stock.isEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(stock, 'stock')}
                            className="text-[#6b7280] hover:text-[#1a1a1a]"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Switch
                            checked={stock.isEnabled}
                            onCheckedChange={(checked) => handleToggleStatus(stock.id, 'stock', checked)}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkFnoBan(stock)}
                            className="text-red-400 hover:text-red-300"
                            title="Mark F&O Ban"
                          >
                            <TrendingDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* F&O Ban Tab */}
        <TabsContent value="f&o-ban">
          <Card className="border-[#e5e7eb] bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-[#1a1a1a]">F&O Ban Entries</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6b7280]" />
                    <Input
                      placeholder="Search entries..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a] w-64"
                    />
                  </div>
                  <Button
                    onClick={() => handleCreate('fnoBan')}
                    className="bg-[#00D09C] text-black hover:bg-[#00b88c]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Entry
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[#6b7280]">Symbol</TableHead>
                    <TableHead className="text-[#6b7280]">Name</TableHead>
                    <TableHead className="text-[#6b7280]">Ban Start</TableHead>
                    <TableHead className="text-[#6b7280]">Ban End</TableHead>
                    <TableHead className="text-[#6b7280]">Reason</TableHead>
                    <TableHead className="text-[#6b7280]">Status</TableHead>
                    <TableHead className="text-[#6b7280]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFnoBans.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-[#1a1a1a] font-medium">{entry.stockSymbol}</TableCell>
                      <TableCell className="text-[#1a1a1a]">{entry.stockName}</TableCell>
                      <TableCell className="text-[#6b7280]">{formatDate(entry.banStartDate)}</TableCell>
                      <TableCell className="text-[#6b7280]">
                        {entry.banEndDate ? formatDate(entry.banEndDate) : 'Ongoing'}
                      </TableCell>
                      <TableCell className="text-[#6b7280]">{entry.reason || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={entry.isActive ? 'default' : 'secondary'}
                          className={entry.isActive ? 'bg-red-500 text-[#1a1a1a]' : 'bg-[#f0f2f5] text-[#6b7280]'}
                        >
                          {entry.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveFnoBan(entry.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredFnoBans.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-[#6b7280] py-8">
                        No F&O ban entries found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Holidays Tab */}
        <TabsContent value="holidays">
          <Card className="border-[#e5e7eb] bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-[#1a1a1a]">Market Holidays</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6b7280]" />
                    <Input
                      placeholder="Search holidays..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a] w-64"
                    />
                  </div>
                  <Button
                    onClick={() => handleCreate('holiday')}
                    className="bg-[#00D09C] text-black hover:bg-[#00b88c]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Holiday
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[#6b7280]">Name</TableHead>
                    <TableHead className="text-[#6b7280]">Date</TableHead>
                    <TableHead className="text-[#6b7280]">Type</TableHead>
                    <TableHead className="text-[#6b7280]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHolidays.map((holiday) => (
                    <TableRow key={holiday.id}>
                      <TableCell className="text-[#1a1a1a] font-medium">{holiday.name}</TableCell>
                      <TableCell className="text-[#6b7280]">{formatDate(holiday.date)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={holiday.isMuhurat ? 'default' : 'secondary'}
                          className={holiday.isMuhurat ? 'bg-[#00b887] text-black' : 'bg-[#f0f2f5] text-[#6b7280]'}
                        >
                          {holiday.isMuhurat ? 'Muhurat' : 'Regular'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(holiday, 'holiday')}
                            className="text-[#6b7280] hover:text-[#1a1a1a]"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteHoliday(holiday.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredHolidays.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-[#6b7280] py-8">
                        No holidays found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog for Add/Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white border-[#e5e7eb] text-[#1a1a1a] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? 'Add' : 'Edit'}{' '}
              {activeTab === 'f&o-ban' ? 'F&O Ban Entry' : activeTab === 'holidays' ? 'Holiday' : activeTab.slice(0, -1)}
            </DialogTitle>
            <DialogDescription className="text-[#6b7280]">
              {dialogMode === 'create' ? 'Fill in the details to create a new entry' : 'Update the entry details'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {activeTab === 'indices' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Symbol</Label>
                    <Input
                      value={formData.symbol || ''}
                      onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                      className="bg-[#f5f7fa] border-[#e5e7eb]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-[#f5f7fa] border-[#e5e7eb]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lot Size</Label>
                    <Input
                      type="number"
                      value={formData.lotSize || ''}
                      onChange={(e) => setFormData({ ...formData, lotSize: Number(e.target.value) })}
                      className="bg-[#f5f7fa] border-[#e5e7eb]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expiry Day</Label>
                    <Input
                      value={formData.expiryDay || ''}
                      onChange={(e) => setFormData({ ...formData, expiryDay: e.target.value })}
                      placeholder="e.g., Last Thursday"
                      className="bg-[#f5f7fa] border-[#e5e7eb]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tick Size</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.tickSize || ''}
                      onChange={(e) => setFormData({ ...formData, tickSize: Number(e.target.value) })}
                      className="bg-[#f5f7fa] border-[#e5e7eb]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Current Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.currentPrice || ''}
                      onChange={(e) => setFormData({ ...formData, currentPrice: Number(e.target.value) })}
                      className="bg-[#f5f7fa] border-[#e5e7eb]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Previous Close</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.previousClose || ''}
                      onChange={(e) => setFormData({ ...formData, previousClose: Number(e.target.value) })}
                      className="bg-[#f5f7fa] border-[#e5e7eb]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.isEnabled !== false ? 'true' : 'false'}
                      onValueChange={(value) => setFormData({ ...formData, isEnabled: value === 'true' })}
                    >
                      <SelectTrigger className="bg-[#f5f7fa] border-[#e5e7eb]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#e5e7eb]">
                        <SelectItem value="true">Enabled</SelectItem>
                        <SelectItem value="false">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'stocks' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Symbol</Label>
                    <Input
                      value={formData.symbol || ''}
                      onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                      className="bg-[#f5f7fa] border-[#e5e7eb]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-[#f5f7fa] border-[#e5e7eb]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sector</Label>
                    <Input
                      value={formData.sector || ''}
                      onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                      className="bg-[#f5f7fa] border-[#e5e7eb]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Exchange</Label>
                    <Select
                      value={formData.exchange || 'NSE'}
                      onValueChange={(value) => setFormData({ ...formData, exchange: value })}
                    >
                      <SelectTrigger className="bg-[#f5f7fa] border-[#e5e7eb]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#e5e7eb]">
                        <SelectItem value="NSE">NSE</SelectItem>
                        <SelectItem value="BSE">BSE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={formData.type || 'EQUITY'}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger className="bg-[#f5f7fa] border-[#e5e7eb]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#e5e7eb]">
                        <SelectItem value="EQUITY">Equity</SelectItem>
                        <SelectItem value="ETF">ETF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Lot Size</Label>
                    <Input
                      type="number"
                      value={formData.lotSize || ''}
                      onChange={(e) => setFormData({ ...formData, lotSize: Number(e.target.value) })}
                      className="bg-[#f5f7fa] border-[#e5e7eb]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tick Size</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.tickSize || ''}
                      onChange={(e) => setFormData({ ...formData, tickSize: Number(e.target.value) })}
                      className="bg-[#f5f7fa] border-[#e5e7eb]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Current Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.currentPrice || ''}
                      onChange={(e) => setFormData({ ...formData, currentPrice: Number(e.target.value) })}
                      className="bg-[#f5f7fa] border-[#e5e7eb]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Previous Close</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.previousClose || ''}
                      onChange={(e) => setFormData({ ...formData, previousClose: Number(e.target.value) })}
                      className="bg-[#f5f7fa] border-[#e5e7eb]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.isEnabled !== false ? 'true' : 'false'}
                      onValueChange={(value) => setFormData({ ...formData, isEnabled: value === 'true' })}
                    >
                      <SelectTrigger className="bg-[#f5f7fa] border-[#e5e7eb]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#e5e7eb]">
                        <SelectItem value="true">Enabled</SelectItem>
                        <SelectItem value="false">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'f&o-ban' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Stock Symbol</Label>
                    <Input
                      value={formData.stockSymbol || ''}
                      onChange={(e) => setFormData({ ...formData, stockSymbol: e.target.value.toUpperCase() })}
                      className="bg-[#f5f7fa] border-[#e5e7eb]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stock Name</Label>
                    <Input
                      value={formData.stockName || ''}
                      onChange={(e) => setFormData({ ...formData, stockName: e.target.value })}
                      className="bg-[#f5f7fa] border-[#e5e7eb]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stock ID</Label>
                    <Input
                      value={formData.stockId || ''}
                      onChange={(e) => setFormData({ ...formData, stockId: e.target.value })}
                      className="bg-[#f5f7fa] border-[#e5e7eb]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ban Start Date</Label>
                    <Input
                      type="date"
                      value={formData.banStartDate ? formData.banStartDate.split('T')[0] : ''}
                      onChange={(e) => setFormData({ ...formData, banStartDate: e.target.value })}
                      className="bg-[#f5f7fa] border-[#e5e7eb]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ban End Date</Label>
                    <Input
                      type="date"
                      value={formData.banEndDate ? formData.banEndDate.split('T')[0] : ''}
                      onChange={(e) => setFormData({ ...formData, banEndDate: e.target.value || null })}
                      className="bg-[#f5f7fa] border-[#e5e7eb]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.isActive !== false ? 'true' : 'false'}
                      onValueChange={(value) => setFormData({ ...formData, isActive: value === 'true' })}
                    >
                      <SelectTrigger className="bg-[#f5f7fa] border-[#e5e7eb]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#e5e7eb]">
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Reason</Label>
                    <Input
                      value={formData.reason || ''}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Reason for ban"
                      className="bg-[#f5f7fa] border-[#e5e7eb]"
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'holidays' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Holiday Name</Label>
                    <Input
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-[#f5f7fa] border-[#e5e7eb]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={formData.date ? formData.date.split('T')[0] : ''}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="bg-[#f5f7fa] border-[#e5e7eb]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={formData.isMuhurat ? 'true' : 'false'}
                      onValueChange={(value) => setFormData({ ...formData, isMuhurat: value === 'true' })}
                    >
                      <SelectTrigger className="bg-[#f5f7fa] border-[#e5e7eb]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#e5e7eb]">
                        <SelectItem value="false">Regular</SelectItem>
                        <SelectItem value="true">Muhurat Trading</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.isMuhurat && (
                    <>
                      <div className="space-y-2">
                        <Label>Muhurat Start Time</Label>
                        <Input
                          type="time"
                          value={formData.muhuratStart || ''}
                          onChange={(e) => setFormData({ ...formData, muhuratStart: e.target.value })}
                          className="bg-[#f5f7fa] border-[#e5e7eb]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Muhurat End Time</Label>
                        <Input
                          type="time"
                          value={formData.muhuratEnd || ''}
                          onChange={(e) => setFormData({ ...formData, muhuratEnd: e.target.value })}
                          className="bg-[#f5f7fa] border-[#e5e7eb]"
                        />
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-[#e5e7eb] text-[#1a1a1a] hover:bg-[#f0f2f5]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-[#00D09C] text-black hover:bg-[#00b88c]"
            >
              {dialogMode === 'create' ? 'Create' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}