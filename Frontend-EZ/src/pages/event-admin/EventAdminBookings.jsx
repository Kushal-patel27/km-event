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
  const [selectedBooking, setSelectedBooking] = useState(null)

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
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(booking => (
                      <tr key={booking._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3">{booking.userName || booking.user?.name || 'N/A'}</td>
                        <td className="px-4 py-3">{booking.userEmail || booking.user?.email || 'N/A'}</td>
                        <td className="px-4 py-3">{booking.quantity || 1}</td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-semibold">{formatINR(booking.totalAmount || 0)}</div>
                            {booking.coupon && booking.coupon.code && (
                              <div className="text-xs text-amber-600 font-medium">
                                🎫 {booking.coupon.code}
                              </div>
                            )}
                          </div>
                        </td>
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
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedBooking(booking)}
                            className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition"
                          >
                            View Details
                          </button>
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

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full my-8 shadow-xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6 border-b pb-4">
                  <h3 className="text-2xl font-bold text-gray-900">Booking Details</h3>
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="text-gray-400 hover:text-gray-600 text-3xl font-light leading-none"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-6 mb-6">
                  {/* Booking ID */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-gray-600 text-sm mb-1 font-medium">Booking ID</p>
                    <p className="font-mono text-lg font-bold text-blue-600">
                      {selectedBooking.bookingId || selectedBooking._id?.substring(0, 12) || 'N/A'}
                    </p>
                  </div>

                  {/* Customer Info */}
                  <div>
                    <p className="text-gray-800 text-sm font-bold mb-3">Customer Information</p>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-600 font-medium">Name</p>
                          <p className="font-semibold text-gray-900">{selectedBooking.userName || selectedBooking.user?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-medium">Email</p>
                          <p className="font-semibold text-gray-900">{selectedBooking.userEmail || selectedBooking.user?.email || 'N/A'}</p>
                        </div>
                      </div>
                      {selectedBooking.userPhone && selectedBooking.userPhone !== '-' && (
                        <div>
                          <p className="text-xs text-gray-600 font-medium">Phone</p>
                          <p className="font-semibold text-gray-900">{selectedBooking.userPhone}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Event Info */}
                  <div>
                    <p className="text-gray-800 text-sm font-bold mb-2">Event</p>
                    <p className="font-semibold text-gray-900 text-base">{selectedEvent?.title || 'N/A'}</p>
                  </div>

                  {/* Booking & Pricing Info */}
                  <div>
                    <p className="text-gray-800 text-sm font-bold mb-3">Booking Information</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 font-medium">Quantity</p>
                        <p className="text-2xl font-bold text-blue-600">{selectedBooking.quantity || 0}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 font-medium">Total Amount</p>
                        <p className="text-lg font-bold text-green-600">{formatINR(selectedBooking.totalAmount || 0)}</p>
                      </div>
                      {selectedBooking.ticketType?.name && (
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 font-medium">Ticket Type</p>
                          <p className="font-bold text-purple-600">{selectedBooking.ticketType.name}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Coupon Information */}
                  {selectedBooking.coupon && selectedBooking.coupon.code && (
                    <div className="border-t pt-4 bg-amber-50 rounded-lg p-4 border border-amber-200">
                      <p className="text-gray-800 text-sm font-bold mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                        </svg>
                        Coupon Applied
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="bg-white p-2 rounded">
                          <p className="text-xs text-gray-600 font-medium">Code</p>
                          <p className="font-bold text-amber-700">{selectedBooking.coupon.code}</p>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <p className="text-xs text-gray-600 font-medium">Discount Type</p>
                          <p className="font-semibold text-gray-900 capitalize">{selectedBooking.coupon.discountType}</p>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <p className="text-xs text-gray-600 font-medium">Discount Value</p>
                          <p className="font-semibold text-gray-900">{selectedBooking.coupon.discountValue}{selectedBooking.coupon.discountType === 'percentage' ? '%' : '₹'}</p>
                        </div>
                        {selectedBooking.coupon.discountAmount > 0 && (
                          <div className="bg-white p-2 rounded col-span-2 md:col-span-1">
                            <p className="text-xs text-gray-600 font-medium">Amount Off</p>
                            <p className="font-bold text-red-600">-{formatINR(selectedBooking.coupon.discountAmount)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Discount Summary */}
                  {selectedBooking.discountAmount > 0 && (
                    <div className="border-t pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 font-medium">Original Amount</p>
                          <p className="text-lg font-bold text-gray-900">{formatINR(selectedBooking.originalAmount || selectedBooking.totalAmount)}</p>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 font-medium">Discount</p>
                          <p className="text-lg font-bold text-red-600">-{formatINR(selectedBooking.discountAmount)}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 font-medium">Final Amount</p>
                          <p className="text-lg font-bold text-green-600">{formatINR(selectedBooking.finalAmount || selectedBooking.totalAmount)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Commission Information */}
                  {selectedBooking.commission && selectedBooking.commission.commissionAmount > 0 && (
                    <div className="border-t pt-4 bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                      <p className="text-gray-800 text-sm font-bold mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8.433 7.418c.155.03.299.076.438.114a.75.75 0 00.212-1.488 16.561 16.561 0 00-.63-.165.75.75 0 00-.188 1.485c.218.032.42.068.615.108a.75.75 0 00.216-1.486zM14.707 2.793a.75.75 0 00-1.06 1.06L15.939 6.97a.75.75 0 001.06-1.06L14.708 2.793zM18.22 7.713a.75.75 0 00-1.06-1.06l-3.154 3.154a.75.75 0 001.06 1.06l3.154-3.154zM9.06 12.533a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                        </svg>
                        Commission Breakdown
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="bg-white p-2 rounded">
                          <p className="text-xs text-gray-600 font-medium">Commission %</p>
                          <p className="font-bold text-indigo-700">{selectedBooking.commission.commissionPercentage || 0}%</p>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <p className="text-xs text-gray-600 font-medium">Commission Amount</p>
                          <p className="font-semibold text-gray-900">{formatINR(selectedBooking.commission.commissionAmount || 0)}</p>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <p className="text-xs text-gray-600 font-medium">You Receive</p>
                          <p className="font-bold text-green-600">{formatINR(selectedBooking.commission.organizerAmount || 0)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Seats if available */}
                  {selectedBooking.seats && selectedBooking.seats.length > 0 && (
                    <div className="border-t pt-4">
                      <p className="text-gray-800 text-sm font-bold mb-2">Assigned Seats</p>
                      <p className="font-semibold text-gray-900 bg-amber-50 p-3 rounded">
                        {selectedBooking.seats.join(', ')}
                      </p>
                    </div>
                  )}

                  {/* Booking Date */}
                  <div className="border-t pt-4">
                    <p className="text-gray-600 text-sm font-medium mb-1">Booking Date & Time</p>
                    <p className="font-semibold text-gray-900 text-base">
                      {selectedBooking.createdAt 
                        ? new Date(selectedBooking.createdAt).toLocaleString() 
                        : 'N/A'}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="border-t pt-4">
                    <p className="text-gray-600 text-sm font-medium mb-1">Booking Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      selectedBooking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      selectedBooking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {selectedBooking.status}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 border-t pt-4">
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-bold transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
