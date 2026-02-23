import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../../services/api'
import formatCurrency from '../../utils/currency'
import EventAdminLayout from '../../components/layout/EventAdminLayout'
import ExportDataModal from '../../components/admin/ExportDataModal'

export default function OrganizerDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [data, setData] = useState({
    subscription: null,
    analytics: null,
    pendingPayout: null,
    payouts: [],
    dashboard: null
  })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [showExportModal, setShowExportModal] = useState(false)

  useEffect(() => {
    fetchDashboardData()

    const intervalId = setInterval(() => {
      fetchDashboardData({ silent: true })
    }, 15000)

    return () => clearInterval(intervalId)
  }, [])

  const fetchDashboardData = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true)
      }
      const [subRes, analyticsRes, pendingRes, payoutsRes, dashboardRes] = await Promise.all([
        API.get('/subscriptions/my-subscription'),
        API.get('/subscriptions/analytics/event-admin'),
        API.get('/subscriptions/payouts/event-admin/pending/amount'),
        API.get('/subscriptions/my-payouts'),
        API.get('/event-admin/dashboard')
      ])

      setData({
        subscription: subRes.data?.data,
        analytics: analyticsRes.data?.data,
        pendingPayout: pendingRes.data,
        payouts: payoutsRes.data?.data || [],
        dashboard: dashboardRes.data || null
      })
    } catch (error) {
      if (!silent) {
        setMessage({ type: 'error', text: 'Failed to load dashboard data' })
      }
      console.error('Error:', error)
    }
    if (!silent) {
      setLoading(false)
    }
  }

  const isInitialLoad = loading && !data.subscription && !data.analytics && !data.pendingPayout && !data.dashboard

  const subscription = data.subscription
  const analytics = data.analytics
  const pendingPayout = data.pendingPayout
  const dashboard = data.dashboard
  const stats = dashboard?.stats || {}
  const upcomingEvents = dashboard?.upcomingEvents || []
  const recentBookings = dashboard?.recentBookings || []

  const totalRevenue = analytics?.summary?.totalRevenue ?? stats.totalRevenue ?? 0
  const totalTickets = analytics?.summary?.totalTickets ?? stats.totalBookings ?? 0
  const totalBookings = analytics?.summary?.totalBookings ?? stats.totalBookings ?? 0
  const totalCommission = analytics?.summary?.totalCommissionDeducted ?? 0
  const totalPayout = analytics?.summary?.totalPayout ?? 0

  const formatSubscribedDate = (value) => {
    if (!value) return 'N/A'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return 'N/A'
    return parsed.toLocaleDateString()
  }

  const handleExport = async (format, filters) => {
    try {
      setMessage({ type: '', text: '' })
      
      // Build query params - export analytics for organizer
      const params = new URLSearchParams({ format })
      
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.eventId) params.append('eventId', filters.eventId)
      
      // Call export API - use event-admin endpoint for organizer analytics
      const response = await API.get(`/event-admin/export/bookings?${params.toString()}`, {
        responseType: 'blob'
      })
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      
      // Determine file extension
      const ext = format === 'csv' ? 'csv' : format === 'xlsx' ? 'xlsx' : 'pdf'
      link.setAttribute('download', `analytics-export-${Date.now()}.${ext}`)
      
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      setMessage({ type: 'success', text: 'Data exported successfully!' })
    } catch (err) {
      console.error('Export error:', err)
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to export data' })
    }
  }

  // Filter configuration for export modal
  const exportFilters = [
    {
      key: 'startDate',
      label: 'Start Date',
      type: 'date',
    },
    {
      key: 'endDate',
      label: 'End Date',
      type: 'date',
    },
    {
      key: 'eventId',
      label: 'Event',
      type: 'text',
    },
  ]

  return (
    <EventAdminLayout title="Event Admin Dashboard">
      {isInitialLoad && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      )}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {!isInitialLoad && subscription && (
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 mb-8 text-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm opacity-90">Current Subscription</div>
              <div className="text-3xl font-bold mt-2">{subscription.plan?.name || 'Free'} Plan</div>
              <div className="text-sm opacity-90 mt-2">{subscription.plan?.description}</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="opacity-90">Commission Rate:</span>
                <span className="text-xl font-bold">{subscription.currentCommissionPercentage}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-90">Status:</span>
                <span className="font-semibold bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">{subscription.status}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-90">Subscribed Since:</span>
                <span className="font-medium">{formatSubscribedDate(subscription.subscribedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isInitialLoad && (
        <div className="flex items-center justify-between gap-2 mb-6 border-b border-gray-200 pb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 font-medium border-b-2 transition ${activeTab === 'overview' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab('revenue')}
              className={`px-4 py-2 font-medium border-b-2 transition ${activeTab === 'revenue' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
            >
              💰 Revenue
            </button>
            <button
              onClick={() => setActiveTab('payouts')}
              className={`px-4 py-2 font-medium border-b-2 transition ${activeTab === 'payouts' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
            >
              🏦 Payouts
            </button>
          </div>
          <button
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          >
            📥 Export Analytics
          </button>
        </div>
      )}

      {!isInitialLoad && activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-sm text-gray-600 font-medium">Total Revenue</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(totalRevenue)}</div>
              <div className="text-xs text-gray-500 mt-2">{totalTickets} tickets sold</div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-sm text-gray-600 font-medium">Commission Deducted</div>
              <div className="text-3xl font-bold text-red-600 mt-2">{formatCurrency(totalCommission)}</div>
              <div className="text-xs text-gray-500 mt-2">{subscription?.currentCommissionPercentage}% of revenue</div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-sm text-gray-600 font-medium">Your Net Payout</div>
              <div className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(totalPayout)}</div>
              <div className="text-xs text-gray-500 mt-2">After commission</div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-sm text-gray-600 font-medium">Total Bookings</div>
              <div className="text-3xl font-bold text-blue-600 mt-2">{totalBookings}</div>
              <div className="text-xs text-gray-500 mt-2">Confirmed bookings</div>
            </div>
          </div>

          {pendingPayout && pendingPayout.pendingAmount > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Ready to Request Payout! 🎉</h3>
                  <p className="text-blue-700 mt-1">You have {formatCurrency(pendingPayout.pendingAmount || 0)} ready to withdraw</p>
                  <p className="text-sm text-blue-600 mt-2">
                    Minimum payout required: {formatCurrency(pendingPayout.minPayoutAmount || 0)} ✓
                  </p>
                </div>
                <button
                  onClick={() => navigate('/event-admin/payout')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold whitespace-nowrap ml-4"
                >
                  Request Payout →
                </button>
              </div>
            </div>
          )}

          {pendingPayout && pendingPayout.pendingAmount === 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-lg text-gray-900 font-semibold">No Pending Balance</div>
              <p className="text-gray-600 mt-1">All your earnings have been paid out. Keep organizing great events! 🎊</p>
            </div>
          )}

          {subscription?.plan?.features && subscription.plan.features.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Plan Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {subscription.plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-gray-700">
                    <span className="text-green-600">✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => navigate('/create-event')}
                className="p-4 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg hover:border-green-400 transition text-left"
              >
                <div className="text-lg font-semibold text-green-800">Create New Event</div>
                <div className="text-sm text-green-700">Submit a new event request</div>
              </button>
              <button
                onClick={() => navigate('/event-admin/events')}
                className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg hover:border-blue-400 transition text-left"
              >
                <div className="text-lg font-semibold text-blue-800">Manage Events</div>
                <div className="text-sm text-blue-700">View and edit events</div>
              </button>
              <button
                onClick={() => navigate('/event-admin/revenue')}
                className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg hover:border-purple-400 transition text-left"
              >
                <div className="text-lg font-semibold text-purple-800">Revenue Dashboard</div>
                <div className="text-sm text-purple-700">Track your earnings</div>
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
              <button
                onClick={() => navigate('/event-admin/events')}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                View all →
              </button>
            </div>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-gray-600">No upcoming events.</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div
                    key={event._id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
                  >
                    <div>
                      <div className="font-semibold text-gray-900">{event.title}</div>
                      <div className="text-xs text-gray-600">
                        {new Date(event.date).toLocaleDateString()} • {event.location}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">
                      {event.availableTickets}/{event.totalTickets} tickets
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
              <button
                onClick={() => navigate('/event-admin/bookings')}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                View all →
              </button>
            </div>
            {recentBookings.length === 0 ? (
              <p className="text-sm text-gray-600">No bookings yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[700px] w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Customer</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Event</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Tickets</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Date</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((booking) => (
                      <tr key={booking._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{booking.user?.name || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{booking.user?.email}</div>
                        </td>
                        <td className="px-4 py-3">{booking.event?.title || 'N/A'}</td>
                        <td className="px-4 py-3">{booking.quantity || 1}</td>
                        <td className="px-4 py-3">{new Date(booking.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'confirmed'
                              ? 'bg-green-100 text-green-700'
                              : booking.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {!isInitialLoad && activeTab === 'revenue' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
            <button
              onClick={() => navigate('/event-admin/revenue')}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              View full revenue details →
            </button>
          </div>
          <p className="text-sm text-gray-600">Open the revenue dashboard to view detailed analytics by event.</p>
        </div>
      )}

      {!isInitialLoad && activeTab === 'payouts' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Payout History</h3>
            <button
              onClick={() => navigate('/event-admin/payout')}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Request payout →
            </button>
          </div>
          {data.payouts.length === 0 ? (
            <p className="text-sm text-gray-600">No payouts yet. Once you request a payout, it will appear here.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-sm text-gray-600">
                    <th className="py-2">Requested</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Method</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payouts.map((payout) => (
                    <tr key={payout._id} className="border-b border-gray-100 text-sm">
                      <td className="py-2">{new Date(payout.requestedAt).toLocaleDateString()}</td>
                      <td className="py-2 font-semibold">{formatCurrency(payout.totalAmount)}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          payout.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : payout.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}>
                          {payout.status}
                        </span>
                      </td>
                      <td className="py-2 capitalize">{payout.paymentMethod?.replace('_', ' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <ExportDataModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title="Export Analytics"
        filters={exportFilters}
      />
    </EventAdminLayout>
  )
}
