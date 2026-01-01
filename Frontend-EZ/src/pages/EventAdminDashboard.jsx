import React, { useEffect, useMemo, useState } from 'react'
import EventAdminLayout from '../components/EventAdminLayout'
import API from '../services/api'
import formatINR from '../utils/currency'

export default function EventAdminDashboard(){
  const [events, setEvents] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(()=>{
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const [evRes, bkRes] = await Promise.all([
          API.get('/events/my'),
          API.get('/bookings/all')
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
        setError(err.response?.data?.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const metrics = useMemo(()=>{
    const totalEvents = events.length
    const totalBookings = bookings.length
    let ticketsSold = 0
    let revenue = 0
    bookings.forEach(b => {
      const qty = Number(b.quantity) || 1
      const amt = Number(b.totalAmount || b.total || 0)
      ticketsSold += qty
      revenue += amt
    })
    const upcoming = events.filter(e => {
      const d = new Date(e.date)
      return !isNaN(d) && d >= new Date()
    }).length
    return { totalEvents, totalBookings, ticketsSold, revenue, upcoming }
  }, [events, bookings])

  return (
    <EventAdminLayout title="Dashboard">
      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card label="My Events" value={metrics.totalEvents} />
          <Card label="Bookings" value={metrics.totalBookings} />
          <Card label="Tickets Sold" value={metrics.ticketsSold} />
          <Card label="Revenue" value={formatINR(metrics.revenue)} />
        </div>
      )}
    </EventAdminLayout>
  )
}

function Card({ label, value }){
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  )
}
