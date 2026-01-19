import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import API from '../../services/api'
import Logo from '../../components/common/Logo'

export default function StaffAdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await API.post('/auth/admin/login', { email, password })
      if (res.data?.role !== 'staff_admin') {
        setError('Not a Staff Admin account')
        setLoading(false)
        return
      }
      login(res.data)
      navigate('/staff-admin')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
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
            <h1 className="text-3xl font-extrabold leading-tight text-blue-900">Staff Admin Portal</h1>
            <p className="text-blue-700 text-base">Manage scanner staff, assign gates, and keep entry lanes flowing smoothly.</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-700 text-sm font-semibold shadow-sm">1</span>
              <div>
                <p className="font-semibold text-blue-900">Gate readiness</p>
                <p className="text-blue-700 text-sm">Staff coverage and rotations at a glance.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-700 text-sm font-semibold shadow-sm">2</span>
              <div>
                <p className="font-semibold text-blue-900">Live performance</p>
                <p className="text-blue-700 text-sm">Monitor scan rates and resolve blockers.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-700 text-sm font-semibold shadow-sm">3</span>
              <div>
                <p className="font-semibold text-blue-900">Secure access</p>
                <p className="text-blue-700 text-sm">Role-based controls for staff operations.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100 flex flex-col justify-center">
          <div className="lg:hidden text-center mb-6">
            <Link to="/" className="inline-flex items-center justify-center gap-2 mb-3 text-blue-800">
              <Logo dark={false} />
            </Link>
            <h2 className="text-3xl font-bold text-blue-900">Staff Admin Login</h2>
            <p className="text-blue-700 mt-1">Gate/Team Manager access</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staffadmin@example.com"
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {loading ? 'Logging in...' : 'Login as Staff Admin'}
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
