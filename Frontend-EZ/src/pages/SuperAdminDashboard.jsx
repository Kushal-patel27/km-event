import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import API from '../services/api'
import SuperAdminLayout from '../components/SuperAdminLayout'
import formatCurrency from '../utils/currency'

export default function SuperAdminDashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateRange, setDateRange] = useState('all')

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await API.get('/super-admin/analytics/platform')
      setAnalytics(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, subtitle, icon, color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      orange: 'bg-orange-50 text-orange-700 border-orange-200',
      red: 'bg-red-50 text-red-700 border-red-200',
    }

    return (
      <div className={`${colorClasses[color]} p-6 rounded-lg border`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold opacity-75">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {subtitle && <p className="text-xs opacity-75 mt-1">{subtitle}</p>}
          </div>
          <div className="text-4xl">{icon}</div>
        </div>
      </div>
    )
  }

  return (
    <SuperAdminLayout title="Super Admin Dashboard" subtitle="Platform-wide control">
      {/* Header */}
      <div className="mb-6">
        <p className="text-gray-600">Platform-wide system management and analytics</p>
      </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center gap-4">
          <label className="font-semibold text-gray-700">Date Range:</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Time</option>
            <option value="30days">Last 30 Days</option>
            <option value="7days">Last 7 Days</option>
            <option value="today">Today</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : analytics ? (
        <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <StatCard
                title="Total Users"
                value={analytics.summary.totalUsers}
                subtitle={`${analytics.summary.activeUsers} active`}
                icon="👥"
                color="blue"
              />
              <StatCard
                title="Active Users"
                value={analytics.summary.activeUsers}
                subtitle={`${analytics.summary.inactiveUsers} inactive`}
                icon="✅"
                color="green"
              />
              <StatCard
                title="Total Events"
                value={analytics.summary.totalEvents}
                icon="📅"
                color="purple"
              />
              <StatCard
                title="Total Bookings"
                value={analytics.summary.totalBookings}
                icon="🎫"
                color="orange"
              />
              <Link to="/super-admin/staff" className="block">
                <StatCard
                  title="Scanner Staff"
                  value={analytics.summary.staffCount || 0}
                  subtitle="Click to manage"
                  icon="🎫📱"
                  color="blue"
                />
              </Link>
            </div>

            {/* Revenue */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-700 mb-1">Total Platform Revenue</p>
                    <p className="text-4xl font-bold text-green-900">
                      {formatCurrency(analytics.summary.totalRevenue)}
                  </p>
                </div>
                <div className="text-5xl">💰</div>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bookings by Status */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Bookings by Status</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.bookingsByStatus || {}).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-full bg-purple-500"></span>
                        <span className="capitalize font-medium text-gray-700">{status}</span>
                      </div>
                      <span className="font-bold text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Events by Status */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Events by Status</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.eventsByStatus || {}).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
                        <span className="capitalize font-medium text-gray-700">{status}</span>
                      </div>
                      <span className="font-bold text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Management Sections */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">System Management</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    title: 'User Management',
                    description: 'Create, edit, delete, and manage all users & roles',
                    icon: '👥',
                    to: '/super-admin/users',
                    color: 'bg-blue-50 border-blue-200',
                  },
                  {
                    title: 'Event Management',
                    description: 'Create, update, delete any event',
                    icon: '📅',
                    to: '/super-admin/events',
                    color: 'bg-purple-50 border-purple-200',
                  },
                  {
                    title: 'Booking Management',
                    description: 'View and manage all bookings & payments',
                    icon: '🎫',
                    to: '/super-admin/bookings',
                    color: 'bg-orange-50 border-orange-200',
                  },
                  {
                    title: 'System Configuration',
                    description: 'Configure QR rules, ticket limits, security',
                    icon: '⚙️',
                    to: '/super-admin/config',
                    color: 'bg-green-50 border-green-200',
                  },
                  {
                    title: 'System Logs',
                    description: 'View platform activity and audit logs',
                    icon: '📋',
                    to: '/super-admin/logs',
                    color: 'bg-red-50 border-red-200',
                  },
                  {
                    title: 'Data Export',
                    description: 'Export users, events, bookings data',
                    icon: '📥',
                    to: '/super-admin/export',
                    color: 'bg-indigo-50 border-indigo-200',
                  },
                ].map((section) => (
                  <Link
                    key={section.to}
                    to={section.to}
                    className={`${section.color} border rounded-lg p-6 hover:shadow-lg transition duration-200`}
                  >
                    <div className="text-3xl mb-3">{section.icon}</div>
                    <h3 className="font-bold text-gray-900 mb-2">{section.title}</h3>
                    <p className="text-sm text-gray-600">{section.description}</p>
                  </Link>
                ))}
              </div>
            </div>
        </>
      ) : null}
    </SuperAdminLayout>
  )
}
