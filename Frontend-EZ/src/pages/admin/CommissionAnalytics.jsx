import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AdminLayout from '../../components/layout/AdminLayout'
import API from '../../services/api'
import formatCurrency from '../../utils/currency'

export default function CommissionAnalytics() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [view, setView] = useState('all') // all, organizers, events
  const [authError, setAuthError] = useState(false)

  useEffect(() => {
    if (!user || !user.token) {
      setAuthError(true)
      setLoading(false)
      return
    }
    setAuthError(false)
    fetchAnalytics()
  }, [user?.token, fromDate, toDate, view])

  const fetchAnalytics = async () => {
    // Guard: Don't fetch if no user token
    if (!user || !user.token) {
      console.log('Skipping fetch - no auth token')
      return
    }
    
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (fromDate) params.append('fromDate', fromDate)
      if (toDate) params.append('toDate', toDate)

      let endpoint = '/subscriptions/all-commissions?'
      if (view === 'organizers') {
        endpoint = '/subscriptions/analytics/compare-organizers?'
      }

      const response = await API.get(endpoint + params.toString())
      setData(response.data)
      setError('')
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError('Failed to load commission analytics')
    } finally {
      setLoading(false)
    }
  }

  const eventRows = useMemo(() => {
    if (!Array.isArray(data?.data)) return []

    const map = new Map()
    data.data.forEach((commission) => {
      const eventId = commission.event?._id || commission.event || 'unknown'
      const existing = map.get(eventId) || {
        eventId,
        title: commission.event?.title || 'Unknown Event',
        date: commission.event?.date || null,
        revenue: 0,
        commission: 0,
        organizerPayout: 0,
        tickets: 0,
        bookings: 0
      }

      existing.revenue += commission.subtotal || 0
      existing.commission += commission.commissionAmount || 0
      existing.organizerPayout += commission.organizerAmount || 0
      existing.tickets += commission.quantity || 0
      existing.bookings += 1
      map.set(eventId, existing)
    })

    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)
  }, [data?.data])

  return (
    <AdminLayout title="Commission Analytics" subtitle="Track commissions and organizer performance">
      {authError && (
        <div className="mb-4 p-6 bg-yellow-100 border-2 border-yellow-400 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-yellow-800 mb-2">🔒 Authentication Required</h3>
              <p className="text-yellow-700">You must be logged in as an admin to view commission analytics.</p>
            </div>
            <button
              onClick={() => navigate('/admin/login')}
              className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-semibold"
            >
              Sign In
            </button>
          </div>
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">View</label>
            <select
              value={view}
              onChange={(e) => setView(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Commissions</option>
              <option value="organizers">Organizer Comparison</option>
              <option value="events">Event Details</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchAnalytics}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <>
          {/* Summary Cards */}
          {data?.summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow">
                <div className="text-gray-600 text-sm font-semibold">Total Revenue</div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(data.summary.totalRevenue)}
                </div>
                <div className="text-xs text-gray-500 mt-1">{data.summary.totalTickets || 0} tickets sold</div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow">
                <div className="text-gray-600 text-sm font-semibold">Platform Commission</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.summary.totalCommission)}
                </div>
                <div className="text-xs text-gray-500 mt-1">Commission earned</div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow">
                <div className="text-gray-600 text-sm font-semibold">Organizer Payouts</div>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(data.summary.totalOrganizerAmount)}
                </div>
                <div className="text-xs text-gray-500 mt-1">Net organizer payout</div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow">
                <div className="text-gray-600 text-sm font-semibold">Total Bookings</div>
                <div className="text-2xl font-bold text-orange-600">
                  {data.summary.totalBookings || 0}
                </div>
                <div className="text-xs text-gray-500 mt-1">Total transactions</div>
              </div>
            </div>
          )}

          {/* Detailed Data Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              {view === 'all' && (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Organizer</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Ticket Price</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Qty</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Total</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Commission %</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Commission Amt</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Organizer Amt</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.data?.length > 0 ? (
                      data.data.map(commission => (
                        <tr key={commission._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm">{commission.organizer?.name}</td>
                          <td className="px-6 py-4 text-sm">{formatCurrency(commission.ticketPrice)}</td>
                          <td className="px-6 py-4 text-sm">{commission.quantity}</td>
                          <td className="px-6 py-4 text-sm font-semibold">{formatCurrency(commission.subtotal)}</td>
                          <td className="px-6 py-4 text-sm">{commission.commissionPercentage}%</td>
                          <td className="px-6 py-4 text-sm text-green-600 font-semibold">
                            {formatCurrency(commission.commissionAmount)}
                          </td>
                          <td className="px-6 py-4 text-sm text-blue-600 font-semibold">
                            {formatCurrency(commission.organizerAmount)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded font-semibold ${
                              commission.status === 'paid' ? 'bg-green-100 text-green-700'
                                : commission.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {commission.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                          No commissions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {view === 'organizers' && (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Organizer</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Plan</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Revenue</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Commission Earned</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Tickets Sold</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Bookings</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Avg Ticket</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.data?.length > 0 ? (
                      data.data.map(org => (
                        <tr key={org._id?.organizerId} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-semibold">{org._id?.organizerName}</td>
                          <td className="px-6 py-4 text-sm">{org._id?.planName || 'Free'}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                            {formatCurrency(org.totalRevenue)}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-green-600">
                            {formatCurrency(org.totalCommission)}
                          </td>
                          <td className="px-6 py-4 text-sm">{org.ticketsSold}</td>
                          <td className="px-6 py-4 text-sm">{org.bookings}</td>
                          <td className="px-6 py-4 text-sm">{formatCurrency(org.avgTicketPrice)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                          No data found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {view === 'events' && (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Event</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Revenue</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Commission</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Organizer Payout</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Tickets</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Bookings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventRows.length > 0 ? (
                      eventRows.map((row) => (
                        <tr key={row.eventId} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-semibold">{row.title}</td>
                          <td className="px-6 py-4 text-sm">
                            {row.date ? new Date(row.date).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                            {formatCurrency(row.revenue)}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-green-600">
                            {formatCurrency(row.commission)}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-purple-600">
                            {formatCurrency(row.organizerPayout)}
                          </td>
                          <td className="px-6 py-4 text-sm">{row.tickets}</td>
                          <td className="px-6 py-4 text-sm">{row.bookings}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                          No events found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
