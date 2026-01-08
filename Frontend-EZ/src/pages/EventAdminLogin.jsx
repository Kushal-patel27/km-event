import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../services/api'
import Logo from '../components/Logo'

export default function EventAdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await API.post('/auth/admin/login', {
        email,
        password,
      })

      // Check if user is event admin
      if (res.data?.role === 'event_admin') {
        login(res.data)
        navigate('/event-admin')
      } else {
        setError('Access denied. Event Admin credentials required.')
        setLoading(false)
      }
    } catch (err) {
      console.error('Event Admin login error:', err)
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to login. Please check your credentials.'
      )
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12 text-blue-900">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <div className="hidden lg:flex flex-col justify-between rounded-2xl p-8 bg-blue-50 text-blue-900 border border-blue-100 shadow-sm lg:ml-4 xl:ml-6">
          <div className="space-y-4">
            <Link to="/" className="inline-flex w-full items-center justify-center mb-4 text-blue-800">
              <Logo dark={false} />
            </Link>
            <h1 className="text-3xl font-extrabold leading-tight text-blue-900">Event Admin Portal</h1>
            <p className="text-blue-700 text-base">Coordinate your events, track bookings, and guide staff with live insights.</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-700 text-sm font-semibold shadow-sm">1</span>
              <div>
                <p className="font-semibold text-blue-900">Real-time dashboards</p>
                <p className="text-blue-700 text-sm">Monitor bookings and gate scans live.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-700 text-sm font-semibold shadow-sm">2</span>
              <div>
                <p className="font-semibold text-blue-900">Staff orchestration</p>
                <p className="text-blue-700 text-sm">Assign, rotate, and support gate teams.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-700 text-sm font-semibold shadow-sm">3</span>
              <div>
                <p className="font-semibold text-blue-900">Secure access</p>
                <p className="text-blue-700 text-sm">Role-based controls for every action.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100 flex flex-col justify-center">
          <div className="lg:hidden text-center mb-6">
            <Link to="/" className="inline-flex items-center justify-center gap-2 mb-3 text-blue-800">
              <Logo dark={false} />
            </Link>
            <h2 className="text-3xl font-bold text-blue-900">Event Admin Login</h2>
            <p className="text-blue-700 mt-1">Manage your assigned events</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="your@email.com"
                required
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <nav className="flex flex-wrap justify-center items-center gap-x-3 gap-y-2 text-sm text-gray-600">
              <Link to="/" className="text-indigo-600 hover:text-indigo-700 font-medium">Go to Home</Link>
              <span className="text-gray-400">•</span>
              <Link to="/login?mode=admin" className="text-indigo-600 hover:text-indigo-700 font-medium">Login as Admin</Link>
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
} 
