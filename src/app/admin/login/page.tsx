'use client'

import { useState } from 'react'
import { useAdmin } from '@/contexts/admin-context'

export default function AdminLoginPage() {
  const { login } = useAdmin()
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

    const success = await login(formData.username, formData.password)

    if (success) {
      // Full page reload to ensure cookies are set
      window.location.href = '/admin/dashboard'
    } else {
      setError('Invalid username or password')
      setIsLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F1117', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '400px', backgroundColor: '#1A1D29', padding: '2rem', borderRadius: '8px', border: '1px solid #2A2D3A' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: 'white', fontSize: '24px', marginBottom: '0.5rem' }}>Admin Login</h1>
          <p style={{ color: '#9CA3AF', fontSize: '14px' }}>Pepertect Trading Platform</p>
        </div>
        
        {error && (
          <div style={{ 
            padding: '0.75rem', 
            marginBottom: '1rem', 
            backgroundColor: '#dc262620', 
            border: '1px solid #dc2626',
            borderRadius: '4px',
            color: '#ef4444',
            textAlign: 'center',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ color: '#D1D5DB', display: 'block', marginBottom: '0.5rem', fontSize: '14px' }}>Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              disabled={isLoading}
              style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0F1117', border: '1px solid #2A2D3A', color: 'white', borderRadius: '4px' }}
              required
            />
          </div>
          <div>
            <label style={{ color: '#D1D5DB', display: 'block', marginBottom: '0.5rem', fontSize: '14px' }}>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={isLoading}
              style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0F1117', border: '1px solid #2A2D3A', color: 'white', borderRadius: '4px' }}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#00D09C',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1
            }}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}