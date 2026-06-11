'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Plus, Edit, Trash2, PlayCircle, Clock, CheckCircle, XCircle, RefreshCw, Save, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface LearningPath {
  id: string
  title: string
  description: string
  category: string
  difficulty: string
  totalModules: number
  estimatedHours: number
  modulesCount: number
  totalHours: number
  accentColor: string
  order: number
  isActive: boolean
  tier: string
  createdAt: string
  updatedAt: string
}

interface LearningModule {
  id: string
  pathId: string
  title: string
  description: string
  content: string
  videoUrl: string
  duration: number
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function LearningPage() {
  const [loading, setLoading] = useState(true)
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([])
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null)
  const [modules, setModules] = useState<LearningModule[]>([])
  const [modulesLoading, setModulesLoading] = useState(false)

  // Dialog states
  const [createPathDialogOpen, setCreatePathDialogOpen] = useState(false)
  const [editPathDialogOpen, setEditPathDialogOpen] = useState(false)
  const [addModuleDialogOpen, setAddModuleDialogOpen] = useState(false)
  const [editModuleDialogOpen, setEditModuleDialogOpen] = useState(false)

  // Form states
  const [pathForm, setPathForm] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'Beginner',
    tier: 'FREE',
    accentColor: '#00D09C',
    order: 0,
    isActive: true,
  })

  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
    content: '',
    videoUrl: '',
    duration: 0,
    order: 0,
    isActive: true,
  })

  const [editingPathId, setEditingPathId] = useState<string | null>(null)
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [deletingPathId, setDeletingPathId] = useState<string | null>(null)
  const [deletingModuleId, setDeletingModuleId] = useState<string | null>(null)

  const fetchLearningPaths = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/learning')
      const result = await response.json()
      if (result.success) {
        setLearningPaths(result.data)
      } else {
        toast.error('Failed to load learning paths')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchModules = async (pathId: string) => {
    setModulesLoading(true)
    try {
      const response = await fetch('/api/admin/learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fetchModules', pathId }),
      })
      const result = await response.json()

      if (result.success) {
        setModules(result.data || [])
      } else {
        toast.error('Failed to load modules')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setModulesLoading(false)
    }
  }

  useEffect(() => {
    fetchLearningPaths()
  }, [])

  const handleCreatePath = async () => {
    if (!pathForm.title || !pathForm.category || !pathForm.difficulty) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      const response = await fetch('/api/admin/learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pathForm),
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Learning path created successfully')
        setCreatePathDialogOpen(false)
        resetPathForm()
        fetchLearningPaths()
      } else {
        toast.error(result.error || 'Failed to create learning path')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const handleUpdatePath = async () => {
    if (!editingPathId) {
      toast.error('No path selected for editing')
      return
    }

    try {
      const response = await fetch('/api/admin/learning', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingPathId, ...pathForm }),
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Learning path updated successfully')
        setEditPathDialogOpen(false)
        resetPathForm()
        setEditingPathId(null)
        fetchLearningPaths()
      } else {
        toast.error(result.error || 'Failed to update learning path')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const handleDeletePath = async (id: string) => {
    setDeletingPathId(id)
    try {
      const response = await fetch(`/api/admin/learning?id=${id}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Learning path deleted successfully')
        if (selectedPath?.id === id) {
          setSelectedPath(null)
          setModules([])
        }
        fetchLearningPaths()
      } else {
        toast.error(result.error || 'Failed to delete learning path')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setDeletingPathId(null)
    }
  }

  const handleAddModule = async () => {
    if (!selectedPath || !moduleForm.title || !moduleForm.duration) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      const response = await fetch('/api/admin/learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addModule',
          pathId: selectedPath.id,
          ...moduleForm,
        }),
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Module added successfully')
        setAddModuleDialogOpen(false)
        resetModuleForm()
        fetchLearningPaths()
        fetchModules(selectedPath.id)
      } else {
        toast.error(result.error || 'Failed to add module')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const handleUpdateModule = async () => {
    if (!editingModuleId) {
      toast.error('No module selected for editing')
      return
    }

    try {
      const response = await fetch('/api/admin/learning', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateModule',
          moduleId: editingModuleId,
          ...moduleForm,
        }),
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Module updated successfully')
        setEditModuleDialogOpen(false)
        resetModuleForm()
        setEditingModuleId(null)
        if (selectedPath) {
          fetchModules(selectedPath.id)
        }
      } else {
        toast.error(result.error || 'Failed to update module')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const handleDeleteModule = async (moduleId: string) => {
    setDeletingModuleId(moduleId)
    try {
      const response = await fetch('/api/admin/learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteModule',
          moduleId,
        }),
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Module deleted successfully')
        if (selectedPath) {
          fetchModules(selectedPath.id)
        }
        fetchLearningPaths()
      } else {
        toast.error(result.error || 'Failed to delete module')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setDeletingModuleId(null)
    }
  }

  const resetPathForm = () => {
    setPathForm({
      title: '',
      description: '',
      category: '',
      difficulty: 'Beginner',
      tier: 'FREE',
      accentColor: '#00D09C',
      order: 0,
      isActive: true,
    })
  }

  const resetModuleForm = () => {
    setModuleForm({
      title: '',
      description: '',
      content: '',
      videoUrl: '',
      duration: 0,
      order: 0,
      isActive: true,
    })
  }

  const openEditPathDialog = (path: LearningPath) => {
    setEditingPathId(path.id)
    setPathForm({
      title: path.title,
      description: path.description,
      category: path.category,
      difficulty: path.difficulty,
      tier: path.tier,
      accentColor: path.accentColor,
      order: path.order,
      isActive: path.isActive,
    })
    setEditPathDialogOpen(true)
  }

  const openEditModuleDialog = (module: LearningModule) => {
    setEditingModuleId(module.id)
    setModuleForm({
      title: module.title,
      description: module.description,
      content: module.content,
      videoUrl: module.videoUrl,
      duration: module.duration,
      order: module.order,
      isActive: module.isActive,
    })
    setEditModuleDialogOpen(true)
  }

  const selectPath = (path: LearningPath) => {
    setSelectedPath(path)
    fetchModules(path.id)
  }

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return <Badge className="bg-green-500/20 text-green-400">Beginner</Badge>
      case 'Intermediate':
        return <Badge className="bg-blue-500/20 text-blue-400">Intermediate</Badge>
      case 'Advanced':
        return <Badge className="bg-purple-500/20 text-purple-400">Advanced</Badge>
      default:
        return <Badge className="bg-gray-500/20 text-gray-400">{difficulty}</Badge>
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const formatTotalHours = (totalHours: number) => {
    const hours = Math.floor(totalHours / 60)
    return `${hours}h`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Learning Management</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-[#2A2D3A] bg-[#1A1D29]">
            <CardContent className="p-6">
              <div className="h-64 animate-pulse bg-[#2A2D3A] rounded" />
            </CardContent>
          </Card>
          <Card className="border-[#2A2D3A] bg-[#1A1D29]">
            <CardContent className="p-6">
              <div className="h-64 animate-pulse bg-[#2A2D3A] rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Learning Management</h1>
          <p className="text-gray-400 mt-1">Manage learning paths and modules</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={createPathDialogOpen} onOpenChange={setCreatePathDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#00D09C] text-black hover:bg-[#00D09C]/80">
                <Plus className="h-4 w-4 mr-2" />
                Create Path
              </Button>
            </DialogTrigger>
            <DialogContent className="border-[#2A2D3A] bg-[#1A1D29] text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Learning Path</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Create a new learning path with modules
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Introduction to Trading"
                    value={pathForm.title}
                    onChange={(e) => setPathForm({ ...pathForm, title: e.target.value })}
                    className="border-[#2A2D3A] bg-[#0F1117] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the learning path"
                    value={pathForm.description}
                    onChange={(e) => setPathForm({ ...pathForm, description: e.target.value })}
                    className="border-[#2A2D3A] bg-[#0F1117] text-white min-h-[100px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Input
                      id="category"
                      placeholder="e.g., Trading, Investing"
                      value={pathForm.category}
                      onChange={(e) => setPathForm({ ...pathForm, category: e.target.value })}
                      className="border-[#2A2D3A] bg-[#0F1117] text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty *</Label>
                    <Select
                      value={pathForm.difficulty}
                      onValueChange={(value) => setPathForm({ ...pathForm, difficulty: value })}
                    >
                      <SelectTrigger className="border-[#2A2D3A] bg-[#0F1117] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-[#2A2D3A] bg-[#1A1D29]">
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tier">Tier</Label>
                    <Select
                      value={pathForm.tier}
                      onValueChange={(value) => setPathForm({ ...pathForm, tier: value })}
                    >
                      <SelectTrigger className="border-[#2A2D3A] bg-[#0F1117] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-[#2A2D3A] bg-[#1A1D29]">
                        <SelectItem value="FREE">Free</SelectItem>
                        <SelectItem value="PREMIUM">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order">Order</Label>
                    <Input
                      id="order"
                      type="number"
                      placeholder="0"
                      value={pathForm.order}
                      onChange={(e) => setPathForm({ ...pathForm, order: parseInt(e.target.value) || 0 })}
                      className="border-[#2A2D3A] bg-[#0F1117] text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={pathForm.accentColor}
                      onChange={(e) => setPathForm({ ...pathForm, accentColor: e.target.value })}
                      className="w-20 h-10 border-[#2A2D3A] bg-[#0F1117] text-white"
                    />
                    <Input
                      placeholder="#00D09C"
                      value={pathForm.accentColor}
                      onChange={(e) => setPathForm({ ...pathForm, accentColor: e.target.value })}
                      className="flex-1 border-[#2A2D3A] bg-[#0F1117] text-white"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">Active</Label>
                  <Switch
                    id="isActive"
                    checked={pathForm.isActive}
                    onCheckedChange={(checked) => setPathForm({ ...pathForm, isActive: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreatePathDialogOpen(false)}
                  className="border-[#2A2D3A] text-white hover:bg-[#2A2D3A]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreatePath}
                  className="bg-[#00D09C] text-black hover:bg-[#00D09C]/80"
                >
                  Create Path
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            onClick={fetchLearningPaths}
            variant="outline"
            className="border-[#2A2D3A] text-white hover:bg-[#2A2D3A]"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Learning Paths List */}
        <div className="lg:col-span-2">
          <Card className="border-[#2A2D3A] bg-[#1A1D29]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#00D09C]" />
                Learning Paths ({learningPaths.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {learningPaths.length > 0 ? (
                <div className="space-y-3">
                  {learningPaths.map((path) => (
                    <div
                      key={path.id}
                      className={`p-4 rounded-lg border transition-all cursor-pointer ${
                        selectedPath?.id === path.id
                          ? 'bg-[#00D09C]/10 border-[#00D09C]'
                          : 'bg-[#0F1117] border-[#2A2D3A] hover:border-[#2A2D3A]/80'
                      }`}
                      onClick={() => selectPath(path)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white">{path.title}</h3>
                            {getDifficultyBadge(path.difficulty)}
                            {!path.isActive && (
                              <Badge className="bg-red-500/20 text-red-400">Inactive</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mb-2">{path.category}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditPathDialog(path)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-red-400 h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeletePath(path.id)
                            }}
                            disabled={deletingPathId === path.id}
                          >
                            {deletingPathId === path.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <PlayCircle className="h-4 w-4" />
                          {path.modulesCount} modules
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatTotalHours(path.totalHours)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Badge
                            className={
                              path.tier === 'PREMIUM'
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'bg-green-500/20 text-green-400'
                            }
                          >
                            {path.tier}
                          </Badge>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No learning paths found</p>
                  <p className="text-sm mt-2">Create your first learning path to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modules Panel */}
        <div>
          <Card className="border-[#2A2D3A] bg-[#1A1D29] h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-[#00D09C]" />
                  {selectedPath ? selectedPath.title : 'Modules'}
                </CardTitle>
                {selectedPath && (
                  <Dialog open={addModuleDialogOpen} onOpenChange={setAddModuleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-[#00D09C] text-black hover:bg-[#00D09C]/80 h-8">
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="border-[#2A2D3A] bg-[#1A1D29] text-white max-w-2xl max-h-[90vh]">
                      <DialogHeader>
                        <DialogTitle>Add Module</DialogTitle>
                        <DialogDescription className="text-gray-400">
                          Add a new module to {selectedPath.title}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4 max-h-[50vh] overflow-y-auto">
                        <div className="space-y-2">
                          <Label htmlFor="moduleTitle">Title *</Label>
                          <Input
                            id="moduleTitle"
                            placeholder="e.g., Market Basics"
                            value={moduleForm.title}
                            onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                            className="border-[#2A2D3A] bg-[#0F1117] text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="moduleDescription">Description</Label>
                          <Textarea
                            id="moduleDescription"
                            placeholder="Brief description of this module"
                            value={moduleForm.description}
                            onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                            className="border-[#2A2D3A] bg-[#0F1117] text-white min-h-[80px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="moduleContent">Content (Markdown)</Label>
                          <Textarea
                            id="moduleContent"
                            placeholder="# Module Content&#10;&#10;Write your module content in markdown format..."
                            value={moduleForm.content}
                            onChange={(e) => setModuleForm({ ...moduleForm, content: e.target.value })}
                            className="border-[#2A2D3A] bg-[#0F1117] text-white min-h-[200px] font-mono text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="moduleVideoUrl">Video URL</Label>
                          <Input
                            id="moduleVideoUrl"
                            placeholder="https://..."
                            value={moduleForm.videoUrl}
                            onChange={(e) => setModuleForm({ ...moduleForm, videoUrl: e.target.value })}
                            className="border-[#2A2D3A] bg-[#0F1117] text-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="moduleDuration">Duration (minutes) *</Label>
                            <Input
                              id="moduleDuration"
                              type="number"
                              placeholder="30"
                              value={moduleForm.duration}
                              onChange={(e) => setModuleForm({ ...moduleForm, duration: parseInt(e.target.value) || 0 })}
                              className="border-[#2A2D3A] bg-[#0F1117] text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="moduleOrder">Order</Label>
                            <Input
                              id="moduleOrder"
                              type="number"
                              placeholder="0"
                              value={moduleForm.order}
                              onChange={(e) => setModuleForm({ ...moduleForm, order: parseInt(e.target.value) || 0 })}
                              className="border-[#2A2D3A] bg-[#0F1117] text-white"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="moduleIsActive">Active</Label>
                          <Switch
                            id="moduleIsActive"
                            checked={moduleForm.isActive}
                            onCheckedChange={(checked) => setModuleForm({ ...moduleForm, isActive: checked })}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setAddModuleDialogOpen(false)}
                          className="border-[#2A2D3A] text-white hover:bg-[#2A2D3A]"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddModule}
                          className="bg-[#00D09C] text-black hover:bg-[#00D09C]/80"
                        >
                          Add Module
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedPath ? (
                modulesLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="p-4 rounded-lg bg-[#0F1117] animate-pulse">
                        <div className="h-4 bg-[#2A2D3A] rounded w-3/4 mb-2" />
                        <div className="h-3 bg-[#2A2D3A] rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : modules.length > 0 ? (
                  <div className="space-y-3">
                    {modules.map((module) => (
                      <div
                        key={module.id}
                        className="p-4 rounded-lg bg-[#0F1117] border border-[#2A2D3A]"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-500">#{module.order + 1}</span>
                              <h4 className="font-medium text-white">{module.title}</h4>
                              {!module.isActive && (
                                <Badge className="bg-red-500/20 text-red-400 text-xs">Inactive</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-400">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(module.duration)}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-white h-8 w-8 p-0"
                              onClick={() => openEditModuleDialog(module)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-red-400 h-8 w-8 p-0"
                              onClick={() => handleDeleteModule(module.id)}
                              disabled={deletingModuleId === module.id}
                            >
                              {deletingModuleId === module.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <PlayCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No modules yet</p>
                    <p className="text-sm mt-1">Add your first module to get started</p>
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Select a learning path</p>
                  <p className="text-sm mt-1">Click on a path to view its modules</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Path Dialog */}
      <Dialog open={editPathDialogOpen} onOpenChange={setEditPathDialogOpen}>
        <DialogContent className="border-[#2A2D3A] bg-[#1A1D29] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Learning Path</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update the learning path details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="editTitle">Title *</Label>
              <Input
                id="editTitle"
                placeholder="e.g., Introduction to Trading"
                value={pathForm.title}
                onChange={(e) => setPathForm({ ...pathForm, title: e.target.value })}
                className="border-[#2A2D3A] bg-[#0F1117] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                placeholder="Brief description of the learning path"
                value={pathForm.description}
                onChange={(e) => setPathForm({ ...pathForm, description: e.target.value })}
                className="border-[#2A2D3A] bg-[#0F1117] text-white min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editCategory">Category *</Label>
                <Input
                  id="editCategory"
                  placeholder="e.g., Trading, Investing"
                  value={pathForm.category}
                  onChange={(e) => setPathForm({ ...pathForm, category: e.target.value })}
                  className="border-[#2A2D3A] bg-[#0F1117] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDifficulty">Difficulty *</Label>
                <Select
                  value={pathForm.difficulty}
                  onValueChange={(value) => setPathForm({ ...pathForm, difficulty: value })}
                >
                  <SelectTrigger className="border-[#2A2D3A] bg-[#0F1117] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[#2A2D3A] bg-[#1A1D29]">
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editTier">Tier</Label>
                <Select
                  value={pathForm.tier}
                  onValueChange={(value) => setPathForm({ ...pathForm, tier: value })}
                >
                  <SelectTrigger className="border-[#2A2D3A] bg-[#0F1117] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[#2A2D3A] bg-[#1A1D29]">
                    <SelectItem value="FREE">Free</SelectItem>
                    <SelectItem value="PREMIUM">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editOrder">Order</Label>
                <Input
                  id="editOrder"
                  type="number"
                  placeholder="0"
                  value={pathForm.order}
                  onChange={(e) => setPathForm({ ...pathForm, order: parseInt(e.target.value) || 0 })}
                  className="border-[#2A2D3A] bg-[#0F1117] text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editAccentColor">Accent Color</Label>
              <div className="flex gap-2">
                <Input
                  id="editAccentColor"
                  type="color"
                  value={pathForm.accentColor}
                  onChange={(e) => setPathForm({ ...pathForm, accentColor: e.target.value })}
                  className="w-20 h-10 border-[#2A2D3A] bg-[#0F1117] text-white"
                />
                <Input
                  placeholder="#00D09C"
                  value={pathForm.accentColor}
                  onChange={(e) => setPathForm({ ...pathForm, accentColor: e.target.value })}
                  className="flex-1 border-[#2A2D3A] bg-[#0F1117] text-white"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="editIsActive">Active</Label>
              <Switch
                id="editIsActive"
                checked={pathForm.isActive}
                onCheckedChange={(checked) => setPathForm({ ...pathForm, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditPathDialogOpen(false)}
              className="border-[#2A2D3A] text-white hover:bg-[#2A2D3A]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePath}
              className="bg-[#00D09C] text-black hover:bg-[#00D09C]/80"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Module Dialog */}
      <Dialog open={editModuleDialogOpen} onOpenChange={setEditModuleDialogOpen}>
        <DialogContent className="border-[#2A2D3A] bg-[#1A1D29] text-white max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Module</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update the module details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[50vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="editModuleTitle">Title *</Label>
              <Input
                id="editModuleTitle"
                placeholder="e.g., Market Basics"
                value={moduleForm.title}
                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                className="border-[#2A2D3A] bg-[#0F1117] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editModuleDescription">Description</Label>
              <Textarea
                id="editModuleDescription"
                placeholder="Brief description of this module"
                value={moduleForm.description}
                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                className="border-[#2A2D3A] bg-[#0F1117] text-white min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editModuleContent">Content (Markdown)</Label>
              <Textarea
                id="editModuleContent"
                placeholder="# Module Content&#10;&#10;Write your module content in markdown format..."
                value={moduleForm.content}
                onChange={(e) => setModuleForm({ ...moduleForm, content: e.target.value })}
                className="border-[#2A2D3A] bg-[#0F1117] text-white min-h-[200px] font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editModuleVideoUrl">Video URL</Label>
              <Input
                id="editModuleVideoUrl"
                placeholder="https://..."
                value={moduleForm.videoUrl}
                onChange={(e) => setModuleForm({ ...moduleForm, videoUrl: e.target.value })}
                className="border-[#2A2D3A] bg-[#0F1117] text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editModuleDuration">Duration (minutes) *</Label>
                <Input
                  id="editModuleDuration"
                  type="number"
                  placeholder="30"
                  value={moduleForm.duration}
                  onChange={(e) => setModuleForm({ ...moduleForm, duration: parseInt(e.target.value) || 0 })}
                  className="border-[#2A2D3A] bg-[#0F1117] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editModuleOrder">Order</Label>
                <Input
                  id="editModuleOrder"
                  type="number"
                  placeholder="0"
                  value={moduleForm.order}
                  onChange={(e) => setModuleForm({ ...moduleForm, order: parseInt(e.target.value) || 0 })}
                  className="border-[#2A2D3A] bg-[#0F1117] text-white"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="editModuleIsActive">Active</Label>
              <Switch
                id="editModuleIsActive"
                checked={moduleForm.isActive}
                onCheckedChange={(checked) => setModuleForm({ ...moduleForm, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditModuleDialogOpen(false)}
              className="border-[#2A2D3A] text-white hover:bg-[#2A2D3A]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateModule}
              className="bg-[#00D09C] text-black hover:bg-[#00D09C]/80"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}