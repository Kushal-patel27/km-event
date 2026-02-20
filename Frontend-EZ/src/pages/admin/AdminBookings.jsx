import React, { useEffect, useState } from 'react'
import API from '../../services/api'
import formatINR from '../../utils/currency'
import AdminLayout from '../../components/layout/AdminLayout'
import ExportDataModal from '../../components/admin/ExportDataModal'

export default function AdminBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit] = useState(20)
  const [statusFilter, setStatusFilter] = useState('')
  const [eventFilter, setEventFilter] = useState('')
  const [events, setEvents] = useState([])
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)

  useEffect(() => {
    fetchBookings()
    fetchEvents()
  }, [page, statusFilter, eventFilter])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams({
        page,
        limit,
        ...(statusFilter && { status: statusFilter }),
        ...(eventFilter && { eventId: eventFilter }),
      })
      const res = await API.get(`/admin/bookings?${params}`)
      setBookings(res.data.bookings)
      setTotal(res.data.pagination.total)
    } catch (err) {
      console.error('Failed to load bookings', err)
      setError(err.response?.data?.message || 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const fetchEvents = async () => {
    try {
      const res = await API.get('/admin/events?limit=100')
      setEvents(res.data.events)
    } catch (err) {
      console.error('Failed to load events', err)
    }
  }

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      setUpdatingStatus(true)
      setError('')
      const res = await API.put(`/admin/bookings/${bookingId}/status`, { status: newStatus })
      console.log('Status updated successfully:', res.data)
      setBookings(prev =>
        prev.map(b => b._id === bookingId ? { ...b, status: newStatus } : b)
      )
      setSelectedBooking(null)
    } catch (err) {
      console.error('Status update error:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update booking status'
      setError(errorMsg)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleExport = async (format, filters) => {
    try {
      setError('')
      
      // Build query params
      const params = new URLSearchParams({ format })
      
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.status) params.append('status', filters.status)
      if (filters.eventId) params.append('eventId', filters.eventId)
      if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus)
      
      // Call export API
      const response = await API.get(`/admin/export/bookings?${params.toString()}`, {
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
        { value: 'refunded', label: 'Refunded' },
      ]
    },
    {
      key: 'eventId',
      label: 'Event',
      type: 'select',
      options: events.map(e => ({ value: e._id, label: e.title }))
    },
    {
      key: 'paymentStatus',
      label: 'Payment Status',
      type: 'select',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'completed', label: 'Completed' },
        { value: 'failed', label: 'Failed' },
      ]
    }
  ]

  return (
    <AdminLayout title="Bookings">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Booking Management</h2>
        <button
          onClick={() => setShowExportModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Data
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Event</label>
            <select
              value={eventFilter}
              onChange={(e) => {
                setEventFilter(e.target.value)
                setPage(1)
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Events</option>
              {events.map(e => (
                <option key={e._id} value={e._id}>
                  {e.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div className="flex-1 flex items-end">
            <button
              onClick={() => {
                setStatusFilter('')
                setEventFilter('')
                setPage(1)
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition border border-gray-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Total Bookings</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{total}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Page</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{page} of {Math.ceil(total / limit)}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Bookings Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 mb-6">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Event</th>
                    <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Customer</th>
                    <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Qty</th>
                    <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Amount</th>
                    <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                    <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Date</th>
                    <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        No bookings found.
                      </td>
                    </tr>
                  ) : (
                    bookings.map(b => (
                      <tr key={b._id} className="hover:bg-gray-50 transition">
                        <td className="px-3 sm:px-5 py-4">
                          <p className="font-semibold text-gray-900 text-sm">{b.event?.title || '—'}</p>
                          {b.ticketType?.name && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">
                              {b.ticketType.name}
                            </span>
                          )}
                        </td>
                        <td className="px-3 sm:px-5 py-4">
                          <p className="font-semibold text-gray-900 text-sm">{b.user?.name || '—'}</p>
                          <p className="text-xs text-gray-600">{b.user?.email || '—'}</p>
                        </td>
                        <td className="px-3 sm:px-5 py-4 text-sm text-gray-600">
                          {b.quantity || 1}
                        </td>
                        <td className="px-3 sm:px-5 py-4 text-sm font-semibold text-gray-900">
                          {formatINR(b.totalAmount || 0)}
                        </td>
                        <td className="px-3 sm:px-5 py-4">
                          <span
                            className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                              b.status === 'confirmed'
                                ? 'bg-green-100 text-green-800'
                                : b.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : b.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {b.status || 'pending'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-5 py-4 text-sm text-gray-600">
                          {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-3 sm:px-5 py-4 text-sm space-x-2 whitespace-nowrap">
                          <select
                            value={b.status || 'pending'}
                            onChange={(e) => handleStatusUpdate(b._id, e.target.value)}
                            disabled={updatingStatus}
                            className="px-2 sm:px-3 py-1 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 cursor-pointer"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="refunded">Refunded</option>
                        </select>
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="text-gray-600 hover:text-gray-900 font-medium text-xs ml-2"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {bookings.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
                {Math.min(page * limit, total)} of {total} bookings
              </p>
              <div className="space-x-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={page * limit >= total}
                  onClick={() => setPage(page + 1)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full my-8">
              <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Booking Details</h3>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-gray-600 text-sm">Event</p>
                  <p className="font-semibold text-gray-900">{selectedBooking.event?.title || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Customer</p>
                  <p className="font-semibold text-gray-900">{selectedBooking.user?.name || '—'}</p>
                  <p className="text-xs text-gray-600">{selectedBooking.user?.email || '—'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 text-sm">Quantity</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.quantity || 1}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Amount</p>
                    <p className="font-semibold text-gray-900">{formatINR(selectedBooking.totalAmount || 0)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-2">Status</p>
                  <select
                    value={selectedBooking.status || 'pending'}
                    onChange={(e) => handleStatusUpdate(selectedBooking._id, e.target.value)}
                    disabled={updatingStatus}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Booked On</p>
                  <p className="font-semibold text-gray-900">
                    {selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleString() : '—'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      <ExportDataModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title="Export Bookings Data"
        filters={exportFilters}
      />
    </AdminLayout>
  )
}
