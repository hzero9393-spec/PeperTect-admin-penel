'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        // Full page reload to ensure cookies are set
        window.location.href = '/admin/dashboard'
      } else {
        setError(data.error || 'Invalid username or password')
        setIsLoading(false)
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f7fa] p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#00D09C]">
            <TrendingUp className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1a1a1a]">Pepertect</h1>
            <p className="text-xs text-[#6b7280]">Admin Panel</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-[#e5e7eb] rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#1a1a1a] mb-2">Welcome Back</h2>
            <p className="text-sm text-[#6b7280]">Sign in to access your admin dashboard</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-[#e6faf5] border border-[#00a080]/20 rounded-lg">
              <p className="text-sm text-[#009070]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-[#1a1a1a] mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-[#f0f2f5] border border-[#e5e7eb] rounded-xl text-[#1a1a1a] placeholder:text-[#6b7280] focus:border-[#00D09C] focus:ring-2 focus:ring-[#00D09C]/10 outline-none transition-all disabled:opacity-50"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#1a1a1a] mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-[#f0f2f5] border border-[#e5e7eb] rounded-xl text-[#1a1a1a] placeholder:text-[#6b7280] focus:border-[#00D09C] focus:ring-2 focus:ring-[#00D09C]/10 outline-none transition-all disabled:opacity-50"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#00D09C] text-white font-medium rounded-xl hover:bg-[#00b887] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-[#6b7280] mt-6">
          Pepertect Trading Platform © 2024
        </p>
      </div>
    </div>
  )
}