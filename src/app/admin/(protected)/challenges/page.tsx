'use client'

import { useEffect, useState } from 'react'
import {
  Plus,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Edit,
  Users,
  Calendar,
  Trophy,
  Target,
  RefreshCw,
  MoreVertical,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Challenge {
  id: string
  title: string
  description: string
  challengeType: string
  targetMetric: string
  targetValue: number
  prize: string | null
  prizeValue: number | null
  startDate: string
  endDate: string
  maxParticipants: number | null
  currentParticipants: number
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
  tier: string
  participationsCount: number
  createdAt: string
  updatedAt: string
}

interface Participation {
  id: string
  challengeId: string
  userId: string
  progress: number
  result: string | null
  reward: string | null
  joinedAt: string
  completedAt: string | null
  userName: string | null
  userEmail: string | null
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [participationsDialogOpen, setParticipationsDialogOpen] = useState(false)
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
  const [participations, setParticipations] = useState<Participation[]>([])
  const [participationsLoading, setParticipationsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    challengeType: 'TRADING',
    targetMetric: 'PROFIT_PERCENT',
    targetValue: '',
    prize: '',
    prizeValue: '',
    startDate: '',
    endDate: '',
    maxParticipants: '',
    tier: 'FREE',
  })

  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    status: '' as 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED',
  })

  // Fetch challenges
  const fetchChallenges = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/challenges')
      const result = await response.json()

      if (result.success) {
        setChallenges(result.data)
      } else {
        toast.error('Failed to fetch challenges')
      }
    } catch (error) {
      console.error('Error fetching challenges:', error)
      toast.error('Failed to fetch challenges')
    } finally {
      setLoading(false)
    }
  }

  // Fetch participations for a challenge
  const fetchParticipations = async (challengeId: string) => {
    try {
      setParticipationsLoading(true)
      const response = await fetch(`/api/admin/challenges/participations?challengeId=${challengeId}`)
      const result = await response.json()

      if (result.success) {
        setParticipations(result.data)
      } else {
        toast.error('Failed to fetch participations')
      }
    } catch (error) {
      console.error('Error fetching participations:', error)
      toast.error('Failed to fetch participations')
    } finally {
      setParticipationsLoading(false)
    }
  }

  useEffect(() => {
    fetchChallenges()
  }, [])

  // Handle create challenge
  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/admin/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          targetValue: parseFloat(formData.targetValue),
          prizeValue: formData.prizeValue ? parseFloat(formData.prizeValue) : null,
          maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Challenge created successfully')
        setCreateDialogOpen(false)
        setFormData({
          title: '',
          description: '',
          challengeType: 'TRADING',
          targetMetric: 'PROFIT_PERCENT',
          targetValue: '',
          prize: '',
          prizeValue: '',
          startDate: '',
          endDate: '',
          maxParticipants: '',
          tier: 'FREE',
        })
        fetchChallenges()
      } else {
        toast.error(result.error || 'Failed to create challenge')
      }
    } catch (error) {
      console.error('Error creating challenge:', error)
      toast.error('Failed to create challenge')
    }
  }

  // Handle update challenge
  const handleUpdateChallenge = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedChallenge) return

    try {
      const response = await fetch('/api/admin/challenges', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedChallenge.id,
          ...editFormData,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Challenge updated successfully')
        setEditDialogOpen(false)
        fetchChallenges()
      } else {
        toast.error(result.error || 'Failed to update challenge')
      }
    } catch (error) {
      console.error('Error updating challenge:', error)
      toast.error('Failed to update challenge')
    }
  }

  // Handle status action
  const handleStatusAction = async (challengeId: string, action: 'start' | 'pause' | 'complete' | 'cancel') => {
    try {
      setActionLoading(challengeId)
      const response = await fetch('/api/admin/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id: challengeId }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message || `Challenge ${action}ed successfully`)
        fetchChallenges()
      } else {
        toast.error(result.error || 'Failed to update challenge status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update challenge status')
    } finally {
      setActionLoading(null)
    }
  }

  // Open edit dialog
  const openEditDialog = (challenge: Challenge) => {
    setSelectedChallenge(challenge)
    setEditFormData({
      title: challenge.title,
      description: challenge.description,
      startDate: challenge.startDate.split('T')[0],
      endDate: challenge.endDate.split('T')[0],
      status: challenge.status,
    })
    setEditDialogOpen(true)
  }

  // Open participations dialog
  const openParticipationsDialog = (challenge: Challenge) => {
    setSelectedChallenge(challenge)
    setParticipationsDialogOpen(true)
    fetchParticipations(challenge.id)
  }

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return 'bg-[#00b887]/10 text-[#00b887] hover:bg-[#00b887]/20'
      case 'ONGOING':
        return 'bg-[#00D09C]/10 text-[#00D09C] hover:bg-[#00D09C]/20'
      case 'COMPLETED':
        return 'bg-[#f5f7fa]/10 text-[#6b7280] hover:bg-[#f5f7fa]/20'
      case 'CANCELLED':
        return 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
      default:
        return 'bg-gray-500/10 text-[#6b7280] hover:bg-gray-500/20'
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a]">Challenges Management</h1>
          <p className="text-[#6b7280] mt-1">Manage trading challenges and competitions</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={fetchChallenges}
            disabled={loading}
            className="border-[#e5e7eb] text-[#1a1a1a] hover:bg-[#f0f2f5]"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-[#00D09C] hover:bg-[#00D09C]/90 text-black font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Challenge
          </Button>
        </div>
      </div>

      {/* Challenges List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="bg-white border-[#e5e7eb]">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 bg-[#f0f2f5]" />
                <Skeleton className="h-4 w-1/2 bg-[#f0f2f5]" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full bg-[#f0f2f5]" />
                  <Skeleton className="h-4 w-full bg-[#f0f2f5]" />
                  <Skeleton className="h-4 w-2/3 bg-[#f0f2f5]" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <Card className="bg-white border-[#e5e7eb]">
          <CardContent className="py-12">
            <div className="text-center">
              <Trophy className="w-16 h-16 mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-[#1a1a1a] mb-2">No challenges yet</h3>
              <p className="text-[#6b7280] mb-6">Create your first challenge to get started</p>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-[#00D09C] hover:bg-[#00D09C]/90 text-black font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Challenge
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((challenge) => (
            <Card key={challenge.id} className="bg-white border-[#e5e7eb] hover:border-[#00D09C]/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-[#1a1a1a] text-lg mb-2">{challenge.title}</CardTitle>
                    <CardDescription className="text-[#6b7280] line-clamp-2">
                      {challenge.description}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4 text-[#6b7280]" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white border-[#e5e7eb]">
                      <DropdownMenuItem
                        onClick={() => openEditDialog(challenge)}
                        className="text-[#1a1a1a] hover:bg-[#f0f2f5] cursor-pointer"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openParticipationsDialog(challenge)}
                        className="text-[#1a1a1a] hover:bg-[#f0f2f5] cursor-pointer"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        View Participations
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className={getStatusBadgeColor(challenge.status)}>
                    {challenge.status}
                  </Badge>
                  <Badge variant="outline" className="border-[#e5e7eb] text-[#6b7280]">
                    {challenge.tier}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center text-[#6b7280]">
                      <Target className="w-3 h-3 mr-1" />
                      Type
                    </div>
                    <div className="text-[#1a1a1a] font-medium">{challenge.challengeType}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center text-[#6b7280]">
                      <Target className="w-3 h-3 mr-1" />
                      Target
                    </div>
                    <div className="text-[#1a1a1a] font-medium">{challenge.targetMetric}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center text-[#6b7280]">
                      <Trophy className="w-3 h-3 mr-1" />
                      Prize
                    </div>
                    <div className="text-[#1a1a1a] font-medium">
                      {challenge.prize || challenge.prizeValue
                        ? `${challenge.prize || ''}${challenge.prizeValue ? ` ₹${challenge.prizeValue}` : ''}`
                        : 'None'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center text-[#6b7280]">
                      <Users className="w-3 h-3 mr-1" />
                      Participants
                    </div>
                    <div className="text-[#1a1a1a] font-medium">
                      {challenge.participationsCount}
                      {challenge.maxParticipants && ` / ${challenge.maxParticipants}`}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#e5e7eb]">
                  <div className="flex items-center text-[#6b7280] text-sm mb-3">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDate(challenge.startDate)} - {formatDate(challenge.endDate)}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {challenge.status === 'UPCOMING' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusAction(challenge.id, 'start')}
                        disabled={actionLoading === challenge.id}
                        className="flex-1 border-[#00D09C]/50 text-[#00D09C] hover:bg-[#00D09C]/10"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Start
                      </Button>
                    )}
                    {challenge.status === 'ONGOING' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusAction(challenge.id, 'pause')}
                          disabled={actionLoading === challenge.id}
                          className="flex-1 border-[#e5e7eb] text-[#1a1a1a] hover:bg-[#f0f2f5]"
                        >
                          <Pause className="w-3 h-3 mr-1" />
                          Pause
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusAction(challenge.id, 'complete')}
                          disabled={actionLoading === challenge.id}
                          className="flex-1 border-[#00D09C]/50 text-[#00D09C] hover:bg-[#00D09C]/10"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Complete
                        </Button>
                      </>
                    )}
                    {(challenge.status === 'ONGOING' || challenge.status === 'UPCOMING') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusAction(challenge.id, 'cancel')}
                        disabled={actionLoading === challenge.id}
                        className="flex-1 border-red-500/50 text-red-500 hover:bg-red-500/10"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Challenge Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-white border-[#e5e7eb] text-[#1a1a1a] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Challenge</DialogTitle>
            <DialogDescription className="text-[#6b7280]">
              Create a new trading challenge for users to participate in
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateChallenge} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="challengeType">Challenge Type *</Label>
                <Select
                  value={formData.challengeType}
                  onValueChange={(value) => setFormData({ ...formData, challengeType: value })}
                >
                  <SelectTrigger className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#e5e7eb]">
                    <SelectItem value="TRADING">Trading</SelectItem>
                    <SelectItem value="LEARNING">Learning</SelectItem>
                    <SelectItem value="PORTFOLIO">Portfolio</SelectItem>
                    <SelectItem value="REFERRAL">Referral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a] min-h-[100px]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetMetric">Target Metric *</Label>
                <Select
                  value={formData.targetMetric}
                  onValueChange={(value) => setFormData({ ...formData, targetMetric: value })}
                >
                  <SelectTrigger className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#e5e7eb]">
                    <SelectItem value="PROFIT_PERCENT">Profit Percentage</SelectItem>
                    <SelectItem value="PROFIT_AMOUNT">Profit Amount</SelectItem>
                    <SelectItem value="TRADES_COUNT">Number of Trades</SelectItem>
                    <SelectItem value="WIN_RATE">Win Rate</SelectItem>
                    <SelectItem value="MODULES_COMPLETED">Modules Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetValue">Target Value *</Label>
                <Input
                  id="targetValue"
                  type="number"
                  step="0.01"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                  className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prize">Prize Description</Label>
                <Input
                  id="prize"
                  value={formData.prize}
                  onChange={(e) => setFormData({ ...formData, prize: e.target.value })}
                  className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]"
                  placeholder="e.g., Premium Subscription"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prizeValue">Prize Value (₹)</Label>
                <Input
                  id="prizeValue"
                  type="number"
                  step="0.01"
                  value={formData.prizeValue}
                  onChange={(e) => setFormData({ ...formData, prizeValue: e.target.value })}
                  className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]"
                  placeholder="e.g., 999"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxParticipants">Max Participants</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                  className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]"
                  placeholder="Leave empty for unlimited"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tier">Tier</Label>
                <Select
                  value={formData.tier}
                  onValueChange={(value) => setFormData({ ...formData, tier: value })}
                >
                  <SelectTrigger className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#e5e7eb]">
                    <SelectItem value="FREE">FREE</SelectItem>
                    <SelectItem value="PREMIUM">PREMIUM</SelectItem>
                    <SelectItem value="PRO">PRO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                className="border-[#e5e7eb] text-[#1a1a1a] hover:bg-[#f0f2f5]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#00D09C] hover:bg-[#00D09C]/90 text-black font-semibold"
              >
                Create Challenge
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Challenge Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-white border-[#e5e7eb] text-[#1a1a1a] max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Challenge</DialogTitle>
            <DialogDescription className="text-[#6b7280]">
              Update challenge details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateChallenge} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editTitle">Title</Label>
              <Input
                id="editTitle"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a] min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editStartDate">Start Date</Label>
                <Input
                  id="editStartDate"
                  type="date"
                  value={editFormData.startDate}
                  onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                  className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEndDate">End Date</Label>
                <Input
                  id="editEndDate"
                  type="date"
                  value={editFormData.endDate}
                  onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                  className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editStatus">Status</Label>
              <Select
                value={editFormData.status}
                onValueChange={(value: any) => setEditFormData({ ...editFormData, status: value })}
              >
                <SelectTrigger className="bg-[#f5f7fa] border-[#e5e7eb] text-[#1a1a1a]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#e5e7eb]">
                  <SelectItem value="UPCOMING">UPCOMING</SelectItem>
                  <SelectItem value="ONGOING">ONGOING</SelectItem>
                  <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                  <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className="border-[#e5e7eb] text-[#1a1a1a] hover:bg-[#f0f2f5]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#00D09C] hover:bg-[#00D09C]/90 text-black font-semibold"
              >
                Update Challenge
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Participations Dialog */}
      <Dialog open={participationsDialogOpen} onOpenChange={setParticipationsDialogOpen}>
        <DialogContent className="bg-white border-[#e5e7eb] text-[#1a1a1a] max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Challenge Participations</DialogTitle>
            <DialogDescription className="text-[#6b7280]">
              {selectedChallenge?.title} - {selectedChallenge?.participationsCount} participants
            </DialogDescription>
          </DialogHeader>

          {participationsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full bg-[#f0f2f5]" />
              ))}
            </div>
          ) : participations.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-gray-600 mb-3" />
              <p className="text-[#6b7280]">No participants yet</p>
            </div>
          ) : (
            <div className="overflow-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#e5e7eb] hover:bg-transparent">
                    <TableHead className="text-[#6b7280]">User</TableHead>
                    <TableHead className="text-[#6b7280]">Email</TableHead>
                    <TableHead className="text-[#6b7280]">Progress</TableHead>
                    <TableHead className="text-[#6b7280]">Result</TableHead>
                    <TableHead className="text-[#6b7280]">Joined At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participations.map((participation) => (
                    <TableRow key={participation.id} className="border-[#e5e7eb] hover:bg-[#f0f2f5]/50">
                      <TableCell className="text-[#1a1a1a] font-medium">
                        {participation.userName || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-[#6b7280]">
                        {participation.userEmail || '-'}
                      </TableCell>
                      <TableCell className="text-[#1a1a1a]">
                        {participation.progress.toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        {participation.result ? (
                          <Badge
                            className={
                              participation.result === 'WON'
                                ? 'bg-[#00D09C]/10 text-[#00D09C]'
                                : 'bg-red-500/10 text-red-500'
                            }
                          >
                            {participation.result}
                          </Badge>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-[#6b7280]">
                        {formatDate(participation.joinedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}