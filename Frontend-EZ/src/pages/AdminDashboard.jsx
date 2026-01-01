import React, { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import API from '../services/api'
import { useAuth } from '../context/AuthContext'
import formatINR from '../utils/currency'

export default function AdminDashboard(){
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(()=>{
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const token = user?.token || localStorage.getItem('token')
        const config = { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
        const isSuper = user?.role === 'super_admin' || user?.role === 'admin'
        const eventsUrl = isSuper ? '/events' : '/events/my'

        const [evRes, bkRes] = await Promise.all([
          API.get(eventsUrl, config),
          API.get('/bookings/all', config)
        ])
        const evs = (evRes.data || []).map(e => ({
          ...e,
          id: e.id || e._id,
          capacity: e.capacity ?? e.totalTickets ?? 0,
          availableTickets: e.availableTickets ?? e.capacity ?? e.totalTickets ?? 0,
        }))
        setEvents(evs)
        setBookings(bkRes.data || [])
      } catch (err) {
        console.error('Dashboard load failed', err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const metrics = useMemo(()=>{
    const totalEvents = events.length
    const totalBookings = bookings.length
    let ticketsSold = 0
    let revenue = 0
    const perEvent = {}

    bookings.forEach(b => {
      const qty = Number(b.quantity) || 1
      const amt = Number(b.totalAmount || b.total || 0)
      ticketsSold += qty
      revenue += amt
      const eid = String(b.event?._id || b.event?.id || b.eventId || 'unknown')
      if(!perEvent[eid]) perEvent[eid] = { id: eid, title: b.event?.title || 'Unknown', tickets: 0, revenue: 0 }
      perEvent[eid].tickets += qty
      perEvent[eid].revenue += amt
    })

    const upcoming = events.filter(e => {
      const d = new Date(e.date)
      return !isNaN(d) && d >= new Date()
    }).length

    // Build chart dataset sorted by revenue desc
    const chart = Object.values(perEvent).sort((a,b)=>b.revenue - a.revenue)

    return { totalEvents, totalBookings, ticketsSold, revenue, upcoming, chart }
  }, [events, bookings])

  return (
    <AdminLayout title="Dashboard">
      {loading && (
        <div className="text-sm text-gray-500">Loading metrics…</div>
      )}
      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      {!loading && !error && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Events</div>
              <div className="text-2xl font-bold mt-1">{metrics.totalEvents}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Bookings</div>
              <div className="text-2xl font-bold mt-1">{metrics.totalBookings}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Tickets Sold</div>
              <div className="text-2xl font-bold mt-1">{metrics.ticketsSold}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Revenue</div>
              <div className="text-2xl font-bold mt-1">{formatINR(metrics.revenue)}</div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <a href="/admin/bookings" className="px-3 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-800">View All Bookings</a>
            <a href="/admin/bookings#live" className="px-3 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-800">Live Today</a>
            <a href="/admin/bookings#upcoming" className="px-3 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-800">Upcoming</a>
            <a href="/admin/bookings#past" className="px-3 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-800">Past</a>
            <a href="/admin/events" className="px-3 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-800">Manage Events</a>
          </div>

          {/* Secondary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Upcoming Events</div>
              <div className="text-2xl font-bold mt-1">{metrics.upcoming}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Available Tickets</div>
              <div className="text-2xl font-bold mt-1">{events.reduce((sum,e)=>sum + (Number(e.availableTickets)||0), 0)}</div>
            </div>
          </div>

          {/* Revenue by Event chart */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Revenue by Event</h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">Top performing events</div>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
              {metrics.chart.length === 0 ? (
                <div className="text-sm text-gray-500">No booking data yet</div>
              ) : (
                <div className="space-y-3">
                  {metrics.chart.map(item => (
                    <div key={item.id} className="grid grid-cols-12 items-center gap-2">
                      <div className="col-span-3 truncate text-sm">{item.title}</div>
                      <div className="col-span-7">
                        <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded">
                          <div
                            className="h-6 bg-indigo-600 dark:bg-indigo-500 rounded"
                            style={{ width: `${Math.min(100, (item.revenue / Math.max(1, metrics.chart[0]?.revenue)) * 100)}%` }}
                            title={`${formatINR(item.revenue)}`}
                          />
                        </div>
                      </div>
                      <div className="col-span-2 text-right font-medium">{formatINR(item.revenue)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent bookings list */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-2">Recent Bookings</h2>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl divide-y divide-gray-200 dark:divide-gray-800">
              {bookings.slice(0, 8).map(b => (
                <div key={b._id} className="p-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{b.event?.title || 'Event'}</div>
                    <div className="text-sm text-gray-500 truncate">{b.user?.name} • {b.user?.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{b.quantity} tickets</div>
                    <div className="font-semibold">{formatINR(Number(b.totalAmount || b.total || 0))}</div>
                  </div>
                </div>
              ))}
              {bookings.length === 0 && (
                <div className="p-3 text-sm text-gray-500">No bookings yet</div>
              )}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
