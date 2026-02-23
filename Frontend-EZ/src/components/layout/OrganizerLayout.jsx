import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import API from '../../services/api'
import formatCurrency from '../../utils/currency'
import Logo from '../common/Logo'
import NavigationButtons from '../common/NavigationButtons'

export default function OrganizerLayout({ title = 'Event Admin', children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Determine if user is event admin
  const isEventAdmin = user?.role === 'event_admin'
  const headerLabel = 'Event Admin'

  // Use event-admin route prefix
  const routePrefix = '/event-admin'

  const nav = [
    { to: `${routePrefix}/dashboard`, label: '📊 Dashboard', exact: true },
    { to: `${routePrefix}/revenue`, label: '📈 Revenue' },
    { to: `${routePrefix}/payout`, label: '🏦 Payout' },
  ]

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 15000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const [analyticsRes, pendingRes] = await Promise.all([
        API.get('/subscriptions/analytics/event-admin'),
        API.get('/subscriptions/payouts/event-admin/pending/amount')
      ])
      setStats({
        analytics: analyticsRes.data?.data,
        pending: pendingRes.data?.data
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout(){
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2">
                <Logo dark={false} />
              </Link>
              <div className="border-l border-gray-200 h-6" />
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">{headerLabel}</h1>
                {isEventAdmin && (
                  <span className="inline-block px-2 py-1 text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-lg">Admin</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NavigationButtons
                homeTo={`${routePrefix}/dashboard`}
                homeLabel="Dashboard"
                showLabels={false}
                size="sm"
              />
              <div className="hidden sm:flex flex-col items-end">
                <div className="text-sm font-medium">{user?.name}</div>
                <div className="text-xs text-gray-500">Event Admin</div>
              </div>
              <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Mobile Navigation */}
        <div className="md:hidden mt-4 bg-white border border-gray-200 rounded-xl p-2">
          <nav className="flex gap-2 overflow-x-auto">
            {nav.map(item => {
              const isActive = item.exact 
                ? location.pathname === item.to 
                : location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 mt-6">
          {/* Sidebar */}
          <aside className="hidden md:block space-y-4">
            {/* Navigation */}
            <div className="bg-white border border-gray-200 rounded-xl p-3">
              <nav className="flex md:flex-col gap-1">
                {nav.map(item => {
                  const isActive = item.exact 
                    ? location.pathname === item.to 
                    : location.pathname.startsWith(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive 
                          ? 'bg-indigo-600 text-white' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Stats Cards */}
            {!loading && stats?.analytics && (
              <div className="space-y-3">
                {/* Total Revenue */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                  <div className="text-xs font-semibold text-blue-600 uppercase">Total Revenue</div>
                  <div className="text-2xl font-bold text-blue-900 mt-2">
                    {formatCurrency(stats.analytics.summary?.totalRevenue || 0)}
                  </div>
                  <div className="text-xs text-blue-700 mt-1">{stats.analytics.summary?.totalTickets || 0} tickets sold</div>
                </div>

                {/* Commission */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-4">
                  <div className="text-xs font-semibold text-red-600 uppercase">Commission Deducted</div>
                  <div className="text-2xl font-bold text-red-900 mt-2">
                    {formatCurrency(stats.analytics.summary?.totalCommissionDeducted || 0)}
                  </div>
                  <div className="text-xs text-red-700 mt-1">10% average</div>
                </div>

                {/* Net Payout */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
                  <div className="text-xs font-semibold text-green-600 uppercase">Your Payout</div>
                  <div className="text-2xl font-bold text-green-900 mt-2">
                    {formatCurrency(stats.analytics.summary?.totalNetPayout || 0)}
                  </div>
                  <div className="text-xs text-green-700 mt-1">After commission</div>
                </div>

                {/* Pending Balance */}
                {stats.pending && (
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
                    <div className="text-xs font-semibold text-purple-600 uppercase">Pending Balance</div>
                    <div className="text-2xl font-bold text-purple-900 mt-2">
                      {formatCurrency(stats.pending.pendingAmount || 0)}
                    </div>
                    <div className="text-xs text-purple-700 mt-1">
                      Min: {formatCurrency(stats.pending.minPayoutAmount || 0)}
                    </div>
                    {stats.pending.pendingAmount >= stats.pending.minPayoutAmount && (
                      <Link 
                        to={`${routePrefix}/payout`}
                        className="mt-3 block w-full px-3 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg text-center hover:bg-purple-700 transition"
                      >
                        Request Payout
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}
          </aside>

          {/* Main Content */}
          <main>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
            </div>
            <div className="space-y-6 pb-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
