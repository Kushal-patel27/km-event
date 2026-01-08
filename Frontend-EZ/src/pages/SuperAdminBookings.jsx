import React, { useState, useEffect } from 'react'
import API from '../services/api'
import SuperAdminLayout from '../components/SuperAdminLayout'
import formatCurrency from '../utils/currency'

export default function SuperAdminBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filterStatus, setFilterStatus] = useState('')
  const [limit] = useState(20)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [refundReason, setRefundReason] = useState('')

  const statuses = ['confirmed', 'pending', 'cancelled', 'refunded']

  useEffect(() => {
    fetchBookings()
  }, [page, filterStatus])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams({
        page,
        limit,
        ...(filterStatus && { status: filterStatus }),
      })
      const res = await API.get(`/super-admin/bookings?${params}`)
      setBookings(res.data.bookings)
      setTotal(res.data.pagination.total)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await API.put(`/super-admin/bookings/${bookingId}/status`, {
        status: newStatus,
      })
      setBookings(
        bookings.map((b) => (b._id === bookingId ? { ...b, status: newStatus } : b))
      )
      setSelectedBooking(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update booking')
    }
  }

  const handleRefund = async () => {
    if (!refundReason.trim()) {
      setError('Please provide a refund reason')
      return
    }

    try {
      await API.post(`/super-admin/bookings/${selectedBooking._id}/refund`, {
        reason: refundReason,
      })
      setBookings(
        bookings.map((b) => (b._id === selectedBooking._id ? { ...b, status: 'refunded' } : b))
      )
      setShowRefundModal(false)
      setRefundReason('')
      setSelectedBooking(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to refund booking')
    }
  }

  const getAmount = (booking) => {
    return booking.totalAmount ?? booking.totalPrice ?? 0
  }

  const getStatusColor = (status) => {
    const colors = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <SuperAdminLayout title="Booking Management" subtitle="View and manage all platform bookings and payments">

      {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <>
            {/* Bookings Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">User</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Event</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        No bookings found
                      </td>
                    </tr>
                  ) : (
                    bookings.map((booking) => (
                      <tr key={booking._id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{booking.user?.name}</p>
                            <p className="text-sm text-gray-600">{booking.user?.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {booking.event?.title}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {formatCurrency(getAmount(booking))}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => setSelectedBooking(booking)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
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

            {/* Pagination */}
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
        </>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">Booking Details</h3>
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-gray-600 text-sm">User</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.user?.name}</p>
                    <p className="text-sm text-gray-600">{selectedBooking.user?.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Event</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.event?.title}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-600 text-sm">Amount</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(getAmount(selectedBooking))}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Booking Date</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(selectedBooking.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-gray-600 text-sm mb-2">Change Status</p>
                  <div className="grid grid-cols-2 gap-2">
                    {statuses.map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(selectedBooking._id, status)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                          selectedBooking.status === status
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedBooking.status !== 'refunded' && (
                  <button
                    onClick={() => setShowRefundModal(true)}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium mb-3"
                  >
                    Refund Booking
                  </button>
                )}

                <button
                  onClick={() => setSelectedBooking(null)}
                  className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Refund Booking</h3>
                  <p className="text-gray-600 mb-4">
                  Refund {formatCurrency(getAmount(selectedBooking))} to {selectedBooking.user?.name}?
                </p>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Refund reason..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                  rows="3"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowRefundModal(false)
                      setRefundReason('')
                    }}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRefund}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Confirm Refund
                  </button>
                </div>
              </div>
            </div>
          </div>
      )}
    </SuperAdminLayout>
  )
}
