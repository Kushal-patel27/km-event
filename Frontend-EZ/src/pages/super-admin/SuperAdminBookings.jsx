import React, { useState, useEffect } from 'react'
import API from '../../services/api'
import SuperAdminLayout from '../../components/layout/SuperAdminLayout'
import formatCurrency from '../../utils/currency'

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

  const statuses = ['confirmed', 'pending', 'cancelled']

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
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-sm font-semibold text-gray-900">User</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-sm font-semibold text-gray-900">Event</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
            <div className="min-h-screen flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full my-8">
                <div className="p-6">
                <div className="flex items-center justify-between mb-4 border-b pb-4">
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

                  {/* User Info */}
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
                    <p className="font-semibold text-gray-900 text-base">{selectedBooking.event?.title || 'N/A'}</p>
                  </div>

                  {/* Booking & Pricing Info */}
                  <div>
                    <p className="text-gray-800 text-sm font-bold mb-3">Booking Information</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 font-medium">Quantity</p>
                        <p className="text-2xl font-bold text-blue-600">{selectedBooking.quantity || 0}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 font-medium">Total Amount</p>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(getAmount(selectedBooking))}</p>
                      </div>
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
                            <p className="font-bold text-red-600">-{formatCurrency(selectedBooking.coupon.discountAmount)}</p>
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
                          <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedBooking.originalAmount || getAmount(selectedBooking))}</p>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 font-medium">Discount</p>
                          <p className="text-lg font-bold text-red-600">-{formatCurrency(selectedBooking.discountAmount)}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 font-medium">Final Amount</p>
                          <p className="text-lg font-bold text-green-600">{formatCurrency(selectedBooking.finalAmount || getAmount(selectedBooking))}</p>
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
                          <p className="font-semibold text-gray-900">{formatCurrency(selectedBooking.commission.commissionAmount || 0)}</p>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <p className="text-xs text-gray-600 font-medium">Organizer Gets</p>
                          <p className="font-bold text-green-600">{formatCurrency(selectedBooking.commission.organizerAmount || 0)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Booking Date */}
                  <div className="border-t pt-4">
                    <p className="text-gray-600 text-sm font-medium mb-1">Booking Date & Time</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedBooking.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-gray-600 text-sm mb-2 font-medium">Change Status</p>
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

                <div className="flex gap-3 border-t pt-4">
                  {selectedBooking.status !== 'refunded' && (
                    <button
                      onClick={() => setShowRefundModal(true)}
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition"
                    >
                      Refund Booking
                    </button>
                  )}

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

      {/* Refund Modal */}
      {showRefundModal && selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
            <div className="min-h-screen flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-md w-full my-8">
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
        </div>
      )}
    </SuperAdminLayout>
  )
}
