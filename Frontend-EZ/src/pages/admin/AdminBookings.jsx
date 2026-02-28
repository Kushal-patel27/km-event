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
  const [searchTerm, setSearchTerm] = useState('')
  const [searchMode, setSearchMode] = useState('list') // 'list' or 'search'
  const [searchType, setSearchType] = useState('bookingId') // 'bookingId', 'ticketId', or 'user'
  const [events, setEvents] = useState([])
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)

  useEffect(() => {
    if (searchMode === 'list') {
      fetchBookings()
    }
    fetchEvents()
  }, [page, statusFilter, eventFilter, searchMode])

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
      const res = await API.get(`/bookings/admin/all-bookings?${params}`)
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

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Search term required')
      return
    }

    try {
      setLoading(true)
      setError('')

      if (searchType === 'bookingId') {
        const res = await API.get(`/bookings/admin/search-booking?bookingId=${encodeURIComponent(searchTerm)}`)
        setBookings([res.data.booking])
        setTotal(1)
      } else if (searchType === 'ticketId') {
        const res = await API.get(`/bookings/admin/search-ticket?ticketId=${encodeURIComponent(searchTerm)}`)
        setBookings([res.data.booking])
        setTotal(1)
      } else {
        const res = await API.get(`/bookings/admin/search-user?search=${encodeURIComponent(searchTerm)}&page=1&limit=${limit}`)
        setBookings(res.data.bookings)
        setTotal(res.data.pagination.total)
      }
      setSearchMode('search')
    } catch (err) {
      console.error('Search error:', err)
      setError(err.response?.data?.message || 'Search failed')
      setBookings([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    setSearchMode('list')
    setPage(1)
    fetchBookings()
  }

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      setUpdatingStatus(true)
      setError('')
      const res = await API.put(`/admin/bookings/${bookingId}/status`, { status: newStatus })
      console.log('Status updated successfully:', res.data)
      
      // Refetch bookings to reflect updated seat counts, revenue, and commission
      if (searchMode === 'search' && searchTerm) {
        await handleSearch()
      } else {
        await fetchBookings()
      }
      
      setSelectedBooking(null)
    } catch (err) {
      console.error('Status update error:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update booking status'
      setError(errorMsg)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleViewDetails = async (booking) => {
    try {
      setSelectedBooking(booking) // Show loading state with list data first
      setError('')
      
      // Fetch full booking details
      const res = await API.get(`/bookings/admin/search-booking?bookingId=${encodeURIComponent(booking.bookingId || '')}`)
      if (res.data && res.data.booking) {
        setSelectedBooking(res.data.booking)
      }
    } catch (err) {
      console.error('Failed to load full booking details:', err)
      // Keep the list data visible as fallback
      setSelectedBooking(booking)
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

      <div className="flex items-center justify-end mb-6">
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

      {/* Search Section */}
      {searchMode === 'list' && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Bookings</h3>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Type</label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="bookingId">By Booking ID</option>
                <option value="ticketId">By Ticket ID</option>
                <option value="user">By Email / Name</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Term</label>
              <input
                type="text"
                placeholder={searchType === 'bookingId' ? 'e.g., BK-20260223-A1B2C' : searchType === 'ticketId' ? 'e.g., A1B2C3D4' : 'e.g., john@example.com'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleSearch}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      {searchMode === 'search' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <span className="text-blue-800 font-medium">
            Showing search results for: <strong>{searchTerm}</strong>
          </span>
          <button
            onClick={handleClearSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            Back to List
          </button>
        </div>
      )}

      {/* Filters - only show in list mode */}
      {searchMode === 'list' && (
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
      )}

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
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Booking ID</th>
                    <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Ticket IDs</th>
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
                      <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                        No bookings found.
                      </td>
                    </tr>
                  ) : (
                    bookings.map(b => (
                      <tr key={b._id} className="hover:bg-gray-50 transition">
                        <td className="px-3 sm:px-5 py-4">
                          <p className="font-mono text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {b.bookingId || '—'}
                          </p>
                        </td>
                        <td className="px-3 sm:px-5 py-4">
                          {b.ticketIds && b.ticketIds.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {b.ticketIds.slice(0, 2).map((id, idx) => (
                                <span key={idx} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-mono font-semibold">
                                  {id}
                                </span>
                              ))}
                              {b.ticketIds.length > 2 && (
                                <span className="text-xs text-gray-600 font-semibold">
                                  +{b.ticketIds.length - 2} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-3 sm:px-5 py-4">
                          <p className="font-semibold text-gray-900 text-sm">{b.eventTitle || '—'}</p>
                          {b.ticketType?.name && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">
                              {b.ticketType.name}
                            </span>
                          )}
                        </td>
                        <td className="px-3 sm:px-5 py-4">
                          <p className="font-semibold text-gray-900 text-sm">{b.userName || '—'}</p>
                          <p className="text-xs text-gray-600">{b.userEmail || '—'}</p>
                          {b.userPhone && b.userPhone !== '-' && (
                            <p className="text-xs text-gray-600">{b.userPhone}</p>
                          )}
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
                          {b.date ? new Date(b.date).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-3 sm:px-5 py-4 text-sm">
                          <button
                            onClick={() => handleViewDetails(b)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition text-xs font-medium"
                          >
                            Details
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full shadow-xl my-8">
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

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                    {error}
                  </div>
                )}

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
                    <p className="text-gray-800 text-sm font-bold mb-2">Customer Information</p>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Name</p>
                        <p className="font-semibold text-gray-900">{selectedBooking.userName || selectedBooking.user?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Email</p>
                        <p className="font-semibold text-gray-900">{selectedBooking.userEmail || selectedBooking.user?.email || 'N/A'}</p>
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
                    <p className="font-semibold text-gray-900 text-base">
                      {selectedBooking.eventTitle || selectedBooking.event?.title || 'N/A'}
                    </p>
                    {selectedBooking.event?.date && (
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(selectedBooking.event.date).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Location */}
                  {selectedBooking.event?.location && (
                    <div>
                      <p className="text-gray-800 text-sm font-bold mb-2">Location</p>
                      <p className="font-semibold text-gray-900">{selectedBooking.event.location}</p>
                    </div>
                  )}

                  {/* Booking Info */}
                  <div>
                    <p className="text-gray-800 text-sm font-bold mb-3">Booking Information</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 font-medium">Quantity</p>
                        <p className="text-2xl font-bold text-blue-600">{selectedBooking.quantity || 0}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 font-medium">Total Amount</p>
                        <p className="text-lg font-bold text-green-600">{formatINR(selectedBooking.totalAmount || 0)}</p>
                      </div>
                      {selectedBooking.ticketType?.name && (
                        <div className="bg-purple-50 p-3 rounded-lg col-span-2">
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
                          <p className="text-xs text-gray-600 font-medium">Organizer Gets</p>
                          <p className="font-bold text-green-600">{formatINR(selectedBooking.commission.organizerAmount || 0)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ticket IDs */}
                  {selectedBooking.ticketIds && selectedBooking.ticketIds.length > 0 && (
                    <div className="border-t pt-4">
                      <p className="text-gray-800 text-sm font-bold mb-3">Ticket IDs ({selectedBooking.ticketIds.length})</p>
                      <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-2">
                          {selectedBooking.ticketIds.map((id, idx) => (
                            <div key={idx} className="text-xs bg-white p-2 rounded border border-gray-200">
                              <span className="text-gray-600">#{idx + 1}</span>
                              <div className="font-mono font-semibold text-gray-900">{id}</div>
                            </div>
                          ))}
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

                  {/* Status & Payment */}
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600 text-sm font-medium mb-2">Booking Status</p>
                        <select
                          value={selectedBooking.status || 'pending'}
                          onChange={(e) => handleStatusUpdate(selectedBooking._id, e.target.value)}
                          disabled={updatingStatus}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 font-medium"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm font-medium mb-2">Payment Status</p>
                        <div className="px-3 py-2 bg-green-50 rounded-lg border border-green-200 text-center">
                          <p className="font-bold text-green-700">
                            {(selectedBooking.paymentStatus || 'COMPLETED').toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booked On */}
                  <div className="border-t pt-4">
                    <p className="text-gray-600 text-sm font-medium mb-1">Booking Date & Time</p>
                    <p className="font-semibold text-gray-900 text-base">
                      {selectedBooking.createdAt 
                        ? new Date(selectedBooking.createdAt).toLocaleString() 
                        : selectedBooking.date 
                        ? new Date(selectedBooking.date).toLocaleString() 
                        : 'N/A'}
                    </p>
                  </div>

                  {/* QR Codes */}
                  {selectedBooking.qrCodes && selectedBooking.qrCodes.length > 0 && (
                    <div className="border-t pt-4">
                      <p className="text-gray-800 text-sm font-bold mb-3">QR Codes ({selectedBooking.qrCodes.length})</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedBooking.qrCodes.map((qr, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex flex-col items-center">
                            {qr.image && (
                              <>
                                <img 
                                  src={qr.image} 
                                  alt={`QR Code ${idx + 1}`}
                                  className="w-full h-auto rounded mb-2"
                                />
                                <p className="text-xs text-gray-600 text-center mt-1">
                                  Ticket #{idx + 1}
                                </p>
                                {qr.id && (
                                  <p className="text-xs font-mono text-gray-700 text-center mt-1">
                                    {qr.id}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Legacy QR Code */}
                  {selectedBooking.qrCode && (!selectedBooking.qrCodes || selectedBooking.qrCodes.length === 0) && (
                    <div className="border-t pt-4">
                      <p className="text-gray-800 text-sm font-bold mb-3">QR Code</p>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex justify-center">
                        <img 
                          src={selectedBooking.qrCode} 
                          alt="Booking QR Code"
                          className="w-48 h-48 rounded"
                        />
                      </div>
                    </div>
                  )}
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
