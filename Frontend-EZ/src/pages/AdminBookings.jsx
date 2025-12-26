import React, {useEffect, useRef, useState} from 'react'
import API from '../services/api'
import { getEventById, getEvents } from '../utils/eventsStore'
import formatINR from '../utils/currency'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AdminLayout from '../components/AdminLayout'

function exportCSV(rows, filename = 'bookings-summary.csv'){
  if(!rows || rows.length === 0) return
  const headers = Object.keys(rows[0])
  const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminBookings(){
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [summary, setSummary] = useState([])
  const [grouped, setGrouped] = useState({ all: [], live: [], upcoming: [], past: [] })
  const sectionRefs = {
    all: useRef(null),
    live: useRef(null),
    upcoming: useRef(null),
    past: useRef(null),
  }

  useEffect(()=>{
    const fetch = async () => {
      try {
        const token = user?.token || localStorage.getItem('token')
        const config = { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
        const res = await API.get('/bookings/all', config)
        const all = res.data
        setBookings(all)

        // Aggregate
        const map = {}
        all.forEach(b => {
          const eid = String(b.event?._id || b.event?.id || b.eventId || 'unknown')
          if(!map[eid]) map[eid] = { eventId: eid, title: b.event?.title || 'Unknown', tickets: 0, bookings: 0, revenue: 0 }
          map[eid].bookings += 1
          const qty = Number(b.quantity) || 1
          map[eid].tickets += qty
          const amt = Number(b.totalAmount || b.total || 0)
          map[eid].revenue += amt
        })
        setSummary(Object.values(map))

        // Group by event time
        const now = new Date()
        const groups = { all: all, live: [], upcoming: [], past: [] }
        all.forEach(b => {
          const d = b.event?.date ? new Date(b.event.date) : null
          if(!d || isNaN(d)) {
            groups.live.push(b)
            return
          }
          if(d.toDateString() === now.toDateString()) {
            groups.live.push(b)
          } else if(d > now) {
            groups.upcoming.push(b)
          } else {
            groups.past.push(b)
          }
        })
        setGrouped(groups)
      } catch (err) {
        console.error('Failed to load bookings', err)
      }
    }
    fetch()
  }, [user])

  async function handleDelete(id){
    if(!confirm('Delete this booking?')) return
    try {
      const token = user?.token || localStorage.getItem('token')
      const config = { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
      await API.delete(`/bookings/${id}`, config)
      setBookings(prev => prev.filter(b => String(b._id) !== String(id)))
      setSummary(prev => prev.map(s => ({ ...s, tickets: s.tickets, bookings: s.bookings })))
    } catch (err) {
      console.error('Delete failed', err)
      alert('Delete failed')
    }
  }

  const events = getEvents()

  return (
    <AdminLayout title="Bookings">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Bookings Summary</h2>
        <div className="flex items-center gap-2">
          <Link to="/admin/events" className="px-3 py-1 bg-indigo-600 text-white rounded">Manage / Create Events</Link>
          <button onClick={()=>exportCSV(summary)} className="px-3 py-1 border rounded">Export CSV</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {summary.map(s => (
          <div key={s.eventId} className="bg-white p-4 rounded border">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-lg">{s.title}</div>
                <div className="text-sm text-gray-500">Event ID: {s.eventId}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">{s.tickets} Tickets</div>
                <div className="text-sm text-gray-500">{s.bookings} Bookings</div>
              </div>
            </div>
            <div className="mt-3 text-right font-bold">Revenue: {formatINR(s.revenue)}</div>
            {/* Simple bar */}
            <div className="mt-3 h-16 flex items-end gap-2">
              <div style={{ height: Math.max(8, s.tickets) }} className="bg-indigo-500 w-6 rounded-t" title={`${s.tickets} tickets`} />
              <div className="flex-1 text-xs text-right text-gray-500">&nbsp;</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Bookings by Time</h3>
        <div className="flex flex-wrap gap-2 text-sm">
          {[
            { key: 'all', label: 'All' },
            { key: 'live', label: 'Live Today' },
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'past', label: 'Past' },
          ].map(btn => (
            <button
              key={btn.key}
              onClick={()=>sectionRefs[btn.key]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="px-3 py-1 border rounded hover:bg-gray-100"
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
      {[
        { key: 'all', label: 'All Bookings' },
        { key: 'live', label: 'Current Live Events' },
        { key: 'upcoming', label: 'Upcoming Events' },
        { key: 'past', label: 'Past Events' },
      ].map(section => (
        <div key={section.key} className="mb-6" ref={sectionRefs[section.key]}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-md font-semibold">{section.label}</h4>
            <div className="text-sm text-gray-500">{grouped[section.key]?.length || 0} bookings</div>
          </div>
          <div className="space-y-2">
            {(grouped[section.key] || []).map(b => (
              <div key={b._id} className="bg-white border rounded p-3 flex justify-between items-center">
                <div>
                  <div className="font-semibold">Event: {b.event?.title || events.find(ev=>String(ev.id)===String(b.eventId))?.title || b.eventId}</div>
                  <div className="text-sm text-gray-600">{b.quantity} × {formatINR((Number(b.totalAmount || b.total || 0) / Math.max(1, Number(b.quantity) || 1)) || 0)} — {b.user?.name} • {b.user?.email}</div>
                  {b.event?.date && <div className="text-xs text-gray-500">{new Date(b.event.date).toLocaleString()}</div>}
                  {b.seats && b.seats.length>0 && <div className="text-sm text-gray-600">Seats: {Array.isArray(b.seats) ? b.seats.join(', ') : String(b.seats)}</div>}
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <div className="font-bold">{formatINR(Number(b.totalAmount || b.total || 0))}</div>
                  <button onClick={()=>handleDelete(b._id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                </div>
              </div>
            ))}
            {(grouped[section.key] || []).length === 0 && (
              <div className="text-sm text-gray-500 border rounded p-3">No bookings in this section</div>
            )}
          </div>
        </div>
      ))}
    </AdminLayout>
  )
}
