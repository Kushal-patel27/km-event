import React, { useEffect, useRef, useState } from 'react'
import EventAdminLayout from '../../components/layout/EventAdminLayout'
import ExportDataModal from '../../components/admin/ExportDataModal'
import API from '../../services/api'
import formatINR from '../../utils/currency'

export default function EventAdminBookings(){
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showExportModal, setShowExportModal] = useState(false)

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

  const handleExport = async (format, filters) => {
    try {
      setError('')
      
      // Build query params - export bookings for selected event
      const params = new URLSearchParams({ format })
      
      if (selectedEvent) params.append('eventId', selectedEvent._id)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.status) params.append('status', filters.status)
      if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus)
      
      // Call export API - use event-admin specific endpoint
      const response = await API.get(`/event-admin/export/bookings?${params.toString()}`, {
        responseType: 'blob'
      })
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      
      // Determine file extension
      const ext = format === 'csv' ? 'csv' : format === 'xlsx' ? 'xlsx' : 'pdf'
      link.setAttribute('download', `bookings-export-${Date.now()}.${ext}`)
      
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
      setError(err.response?.data?.message || 'Failed to export data')
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
      key: 'status',
      label: 'Booking Status',
      type: 'select',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
    },
    {
      key: 'paymentStatus',
      label: 'Payment Status',
      type: 'select',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'completed', label: 'Completed' },
        { value: 'failed', label: 'Failed' },
      ],
    },
  ]

  const isInitialLoad = loading && events.length === 0

  return (
    <EventAdminLayout title="Bookings">
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 mb-4">{error}</div>}

      {isInitialLoad && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {!isInitialLoad && !selectedEvent ? (
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
      ) : !isInitialLoad ? (
        <div>
          <button 
            onClick={() => setSelectedEvent(null)}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            ← Back to Events
          </button>

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold">{selectedEvent.title}</h2>
                <div className="text-sm text-gray-600 mt-2">
                  {new Date(selectedEvent.date).toLocaleDateString()} • {selectedEvent.location}
                </div>
              </div>
              {bookings.length > 0 && (
                <button
                  onClick={() => setShowExportModal(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  📥 Export Bookings
                </button>
              )}
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
      ) : null}

      <ExportDataModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title="Export Bookings"
        filters={exportFilters}
      />
    </EventAdminLayout>
  )
}
