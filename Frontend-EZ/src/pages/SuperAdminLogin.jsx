import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../services/api'
import Logo from '../components/Logo'

export default function SuperAdminLogin() {
  const [email, setEmail] = useState('admin@local')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await API.post('/auth/admin/login', {
        email,
        password,
      })

      // Verify it's a super admin
      if (res.data.role !== 'super_admin') {
        setError('Only Super Admins can access this portal')
        return
      }

      login(res.data)
      navigate('/super-admin')
    } catch (err) {
      console.error('Super Admin login error:', err)
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
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12 text-slate-900">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <div className="hidden lg:flex flex-col justify-between rounded-2xl p-8 bg-slate-900 text-slate-100 border border-slate-800 shadow-md lg:ml-4 xl:ml-6">
          <div className="space-y-4">
            <Link to="/" className="inline-flex w-full items-center justify-center mb-4 text-slate-100">
              <Logo dark={false} />
            </Link>
            <h1 className="text-3xl font-extrabold leading-tight text-white">Super Admin Portal</h1>
            <p className="text-slate-200 text-base">Platform owner access for configuration, exports, and global oversight.</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-white text-sm font-semibold shadow-sm">1</span>
              <div>
                <p className="font-semibold text-white">System controls</p>
                <p className="text-slate-200 text-sm">Manage configs, backups, and exports.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-white text-sm font-semibold shadow-sm">2</span>
              <div>
                <p className="font-semibold text-white">Security first</p>
                <p className="text-slate-200 text-sm">Strict role validation and audit visibility.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-white text-sm font-semibold shadow-sm">3</span>
              <div>
                <p className="font-semibold text-white">Operational clarity</p>
                <p className="text-slate-200 text-sm">Cross-event metrics and logs in one place.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200 flex flex-col justify-center">
          <div className="lg:hidden text-center mb-6">
            <Link to="/" className="inline-flex items-center justify-center gap-2 mb-3 text-slate-800">
              <Logo dark={false} />
            </Link>
            <h2 className="text-3xl font-bold text-slate-900 mb-1">
              Super Admin Login
            </h2>
            <p className="text-slate-700 text-sm">Platform System Owner</p>
          </div>

          {error && (
            <div className="text-sm text-red-600 mb-4 p-3 bg-red-50 rounded border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 focus:border-transparent"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 focus:border-transparent"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 inset-y-0 px-3 text-gray-500 hover:text-gray-700"
                  disabled={loading}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-slate-700 focus:ring-offset-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-slate-100 rounded-lg border border-slate-200 text-sm text-slate-800">
            <p className="font-semibold">Restricted Access</p>
            <p className="mt-1">Only Super Admins with system owner credentials can access this portal.</p>
          </div>

          <div className="mt-6 text-center">
            <nav className="flex flex-wrap justify-center items-center gap-x-3 gap-y-2 text-sm text-slate-700">
              <Link to="/" className="text-indigo-600 hover:text-indigo-700 font-medium">Go to Home</Link>
              <span className="text-slate-400">•</span>
              <Link to="/login?mode=admin" className="text-indigo-600 hover:text-indigo-700 font-medium">Login as Admin</Link>
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
}
