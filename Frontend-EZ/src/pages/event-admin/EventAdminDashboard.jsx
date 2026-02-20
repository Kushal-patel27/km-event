import React, { useEffect, useState } from 'react'
import EventAdminLayout from '../../components/layout/EventAdminLayout'
import API from '../../services/api'
import formatINR from '../../utils/currency'
import { Link } from 'react-router-dom'

export default function EventAdminDashboard(){
  const [dashboard, setDashboard] = useState(null)
  const [revenueSummary, setRevenueSummary] = useState(null)
  const [loadingDashboard, setLoadingDashboard] = useState(true)
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)
  const [error, setError] = useState('')

  useEffect(()=>{
    const load = async () => {
      try {
        setError('')
        setLoadingDashboard(true)
        setLoadingAnalytics(true)

        const dashboardPromise = API.get('/event-admin/dashboard')
        const analyticsPromise = API.get('/subscriptions/analytics/event-admin')

        dashboardPromise
          .then((dashboardRes) => {
            setDashboard(dashboardRes.data)
          })
          .catch((err) => {
            setError(err.response?.data?.message || 'Failed to load dashboard')
          })
          .finally(() => {
            setLoadingDashboard(false)
          })

        analyticsPromise
          .then((analyticsRes) => {
            setRevenueSummary(analyticsRes.data?.data?.summary || null)
          })
          .catch(() => {
            // Keep dashboard usable even if analytics is slow or fails.
          })
          .finally(() => {
            setLoadingAnalytics(false)
          })
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard')
      }
    }
    load()
  }, [])

  if (loadingDashboard) {
    return (
      <EventAdminLayout title="Dashboard">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </EventAdminLayout>
    )
  }

  if (error) {
    return (
      <EventAdminLayout title="Dashboard">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </EventAdminLayout>
    )
  }

  const stats = dashboard?.stats || {};
  const ticketsSold = revenueSummary?.totalTickets ?? stats.totalBookings ?? 0;
  const upcomingEvents = dashboard?.upcomingEvents || [];
  const recentBookings = dashboard?.recentBookings || [];

  return (
    <EventAdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            label="My Events" 
            value={stats.totalEvents || 0} 
            icon="🎫"
            color="bg-gradient-to-br from-blue-400 to-blue-600 text-white"
          />
          <StatCard 
            label="Total Bookings" 
            value={stats.totalBookings || 0} 
            icon="📋"
            color="bg-gradient-to-br from-green-400 to-green-600 text-white"
          />
          <StatCard 
            label="Confirmed" 
            value={stats.confirmedBookings || 0} 
            icon="✅"
            color="bg-gradient-to-br from-purple-400 to-purple-600 text-white"
          />
          <StatCard 
            label="Revenue" 
            value={formatINR(stats.totalRevenue || 0)} 
            icon="💰"
            color="bg-gradient-to-br from-yellow-400 to-yellow-600 text-white"
          />
        </div>

        {/* Revenue Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-blue-200 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-semibold text-blue-600 uppercase">Total Revenue</div>
            <div className="text-2xl font-bold text-blue-900 mt-2">
              {formatINR(revenueSummary?.totalRevenue ?? stats.totalRevenue ?? 0)}
            </div>
            <div className="text-xs text-blue-700 mt-1">{ticketsSold} tickets sold</div>
            {loadingAnalytics && (
              <div className="text-[11px] text-blue-500 mt-2">Updating analytics...</div>
            )}
          </div>

          <div className="bg-white border border-red-200 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-semibold text-red-600 uppercase">Commission Deducted</div>
            <div className="text-2xl font-bold text-red-900 mt-2">
              {formatINR(revenueSummary?.totalCommissionDeducted ?? 0)}
            </div>
            <div className="text-xs text-red-700 mt-1">10% average</div>
            {loadingAnalytics && (
              <div className="text-[11px] text-red-500 mt-2">Updating analytics...</div>
            )}
          </div>

          <div className="bg-white border border-green-200 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-semibold text-green-600 uppercase">Your Payout</div>
            <div className="text-2xl font-bold text-green-900 mt-2">
              {formatINR(revenueSummary?.totalNetPayout ?? revenueSummary?.totalPayout ?? 0)}
            </div>
            <div className="text-xs text-green-700 mt-1">After commission</div>
            {loadingAnalytics && (
              <div className="text-[11px] text-green-500 mt-2">Updating analytics...</div>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Upcoming Events</h2>
            <Link 
              to="/event-admin/events" 
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View All →
            </Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-gray-500">No upcoming events</p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map(event => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Bookings */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Recent Bookings</h2>
            <Link 
              to="/event-admin/bookings" 
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View All →
            </Link>
          </div>
          {recentBookings.length === 0 ? (
            <p className="text-sm text-gray-500">No bookings yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
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
                  {recentBookings.map(booking => (
                    <tr key={booking._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{booking.user?.name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{booking.user?.email}</div>
                      </td>
                      <td className="px-4 py-3">{booking.event?.title || 'N/A'}</td>
                      <td className="px-4 py-3">{booking.quantity || 1}</td>
                      <td className="px-4 py-3">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={booking.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </EventAdminLayout>
  )
}

function StatCard({ label, value, icon, color }){
  const isRevenue = label === 'Revenue';
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3 gap-3">
        <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        <div className={`${color} w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-sm`}>
          {icon}
        </div>
      </div>
      <div className="min-w-0 w-full">
        <div className={`font-bold text-gray-900 leading-tight whitespace-nowrap tabular-nums tracking-tight ${
          isRevenue ? 'text-[clamp(0.55rem,1.4vw,1.2rem)]' : 'text-3xl'
        }`}>
          {value}
        </div>
      </div>
    </div>
  )
}

function EventCard({ event }) {
  return (
    <Link 
      to={`/event-admin/events`}
      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <div>
        <div className="font-medium">{event.title}</div>
        <div className="text-sm text-gray-500">
          {new Date(event.date).toLocaleDateString()} • {event.location}
        </div>
      </div>
      <div className="text-sm text-gray-600">
        {event.availableTickets}/{event.totalTickets} tickets
      </div>
    </Link>
  )
}

function StatusBadge({ status }) {
  const colors = {
    confirmed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  )
}
