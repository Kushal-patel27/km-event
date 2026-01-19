import React, { useEffect, useRef, useState } from 'react'
import EventAdminLayout from '../../components/layout/EventAdminLayout'
import API from '../../services/api'
import formatINR from '../../utils/currency'

export default function EventAdminBookings(){
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(()=>{
    const load = async () => {
      try {
        setLoading(true)
        const res = await API.get('/event-admin/events')
        setEvents(res.data || [])
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load events')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (selectedEvent) {
      loadBookings(selectedEvent._id)
    }
  }, [selectedEvent])

  const loadBookings = async (eventId) => {
    try {
      const res = await API.get(`/event-admin/events/${eventId}/bookings`)
      setBookings(res.data.bookings || [])
    } catch (err) {
      setError('Failed to load bookings')
    }
  }

  if (loading) {
    return (
      <EventAdminLayout title="Bookings">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </EventAdminLayout>
    )
  }

  return (
    <EventAdminLayout title="Bookings">
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 mb-4">{error}</div>}

      {!selectedEvent ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Select an Event</h3>
          {events.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center text-gray-500">
              No events assigned to you yet.
            </div>
          ) : (
            events.map(event => (
              <div 
                key={event._id}
                onClick={() => setSelectedEvent(event)}
                className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold">{event.title}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(event.date).toLocaleDateString()} • {event.location}
                    </div>
                  </div>
                  <button className="text-indigo-600 hover:text-indigo-700 font-medium">
                    View Bookings →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div>
          <button 
            onClick={() => setSelectedEvent(null)}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            ← Back to Events
          </button>

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-bold">{selectedEvent.title}</h2>
            <div className="text-sm text-gray-600 mt-2">
              {new Date(selectedEvent.date).toLocaleDateString()} • {selectedEvent.location}
            </div>
          </div>

          {bookings.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center text-gray-500">
              No bookings for this event yet
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Customer</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Email</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Tickets</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Amount</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Date</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Scanned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(booking => (
                      <tr key={booking._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3">{booking.user?.name || 'N/A'}</td>
                        <td className="px-4 py-3">{booking.user?.email || 'N/A'}</td>
                        <td className="px-4 py-3">{booking.quantity || 1}</td>
                        <td className="px-4 py-3">{formatINR(booking.totalAmount || 0)}</td>
                        <td className="px-4 py-3">{new Date(booking.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {booking.lastScannedAt ? '✅ Yes' : '❌ No'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </EventAdminLayout>
  )
}
