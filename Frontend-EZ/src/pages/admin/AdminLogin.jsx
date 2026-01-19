import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import API from '../../services/api'
import Logo from '../../components/common/Logo'

export default function AdminLogin() {
  const [email, setEmail] = useState('admin@local')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { user, login } = useAuth()
  const navigate = useNavigate()

  const roleRedirect = useMemo(() => {
    if (user?.role === 'super_admin') return '/super-admin'
    if (user?.role === 'event_admin') return '/event-admin'
    if (user?.role === 'staff_admin') return '/staff-admin'
    if (user?.role === 'admin') return '/admin'
    return null
  }, [user])

  useEffect(() => {
    if (roleRedirect) navigate(roleRedirect, { replace: true })
  }, [roleRedirect, navigate])

  const getPostLoginRedirect = (role) => {
    if (role === 'super_admin') return '/super-admin'
    if (role === 'event_admin') return '/event-admin'
    if (role === 'staff_admin') return '/staff-admin'
    return '/admin'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await API.post('/auth/admin/login', {
        email,
        password,
      })

      login(res.data)
      navigate(getPostLoginRedirect(res.data?.role))
    } catch (err) {
      console.error('Admin login error:', err)
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to connect to server. Is the backend running?'
      )
    } finally {
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
            <h1 className="text-3xl font-extrabold leading-tight text-blue-900">Admin Portal</h1>
            <p className="text-blue-700 text-base">Manage events, bookings, teams, and communications across the platform.</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-700 text-sm font-semibold shadow-sm">1</span>
              <div>
                <p className="font-semibold text-blue-900">Centralized control</p>
                <p className="text-blue-700 text-sm">Oversee events, bookings, and messaging.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-700 text-sm font-semibold shadow-sm">2</span>
              <div>
                <p className="font-semibold text-blue-900">Team management</p>
                <p className="text-blue-700 text-sm">Add admins, staff admins, and event leads.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-700 text-sm font-semibold shadow-sm">3</span>
              <div>
                <p className="font-semibold text-blue-900">Secure access</p>
                <p className="text-blue-700 text-sm">Role-based permissions and audit-ready actions.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100 flex flex-col justify-center">
          <div className="lg:hidden text-center mb-6">
            <Link to="/" className="inline-flex items-center justify-center gap-2 mb-3 text-blue-800">
              <Logo dark={false} />
            </Link>
            <h2 className="text-3xl font-bold text-blue-900">Admin Login</h2>
            <p className="text-blue-700 mt-1">Manage the platform and teams</p>
          </div>

          {error && (
            <div className="text-sm text-red-600 mb-4 p-3 bg-red-50 rounded border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin email"
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  disabled={loading}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 disabled:text-gray-300"
                  disabled={loading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7c1.1 0 2.152.19 3.125.542M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4l16 16" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5c-5 0-9 4-9 7s4 7 9 7 9-4 9-7-4-7-9-7z" />
                      <circle cx="12" cy="12" r="3" strokeWidth={2} />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
