import React, { useEffect, useRef, useState } from 'react'
import EventAdminLayout from '../components/EventAdminLayout'
import API from '../services/api'
import formatINR from '../utils/currency'

export default function EventAdminBookings(){
  const [bookings, setBookings] = useState([])
  const [grouped, setGrouped] = useState({ all: [], live: [], upcoming: [], past: [] })
  const [error, setError] = useState('')
  const sectionRefs = {
    all: useRef(null), live: useRef(null), upcoming: useRef(null), past: useRef(null)
  }

  useEffect(()=>{
    const load = async () => {
      try {
        const res = await API.get('/bookings/all')
        const all = res.data || []
        setBookings(all)
        const now = new Date()
        const groups = { all, live: [], upcoming: [], past: [] }
        all.forEach(b => {
          const d = b.event?.date ? new Date(b.event.date) : null
          if(!d || isNaN(d)) groups.live.push(b)
          else if(d.toDateString() === now.toDateString()) groups.live.push(b)
          else if(d > now) groups.upcoming.push(b)
          else groups.past.push(b)
        })
        setGrouped(groups)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load bookings')
      }
    }
    load()
  }, [])

  return (
    <EventAdminLayout title="My Bookings">
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}

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

      {[{ key: 'all', label: 'All Bookings' }, { key: 'live', label: 'Current Live Events' }, { key: 'upcoming', label: 'Upcoming Events' }, { key: 'past', label: 'Past Events' }].map(section => (
        <div key={section.key} className="mb-6" ref={sectionRefs[section.key]}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-md font-semibold">{section.label}</h4>
            <div className="text-sm text-gray-500">{grouped[section.key]?.length || 0} bookings</div>
          </div>
          <div className="space-y-2">
            {(grouped[section.key] || []).map(b => (
              <div key={b._id} className="bg-white border rounded p-3 flex justify-between items-center">
                <div>
                  <div className="font-semibold">Event: {b.event?.title || b.eventId}</div>
                  <div className="text-sm text-gray-600">{b.quantity} × {formatINR((Number(b.totalAmount || b.total || 0) / Math.max(1, Number(b.quantity) || 1)) || 0)} — {b.user?.name} • {b.user?.email}</div>
                  {b.event?.date && <div className="text-xs text-gray-500">{new Date(b.event.date).toLocaleString()}</div>}
                  {b.seats && b.seats.length>0 && <div className="text-sm text-gray-600">Seats: {Array.isArray(b.seats) ? b.seats.join(', ') : String(b.seats)}</div>}
                </div>
                <div className="text-right font-bold">{formatINR(Number(b.totalAmount || b.total || 0))}</div>
              </div>
            ))}
            {(grouped[section.key] || []).length === 0 && (
              <div className="text-sm text-gray-500 border rounded p-3">No bookings in this section</div>
            )}
          </div>
        </div>
      ))}
    </EventAdminLayout>
  )
}
