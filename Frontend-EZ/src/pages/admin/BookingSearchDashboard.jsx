import React, { useState } from 'react'
import API from '../../services/api'
import formatINR from '../../utils/currency'
import AdminLayout from '../../components/layout/AdminLayout'

export default function BookingSearchDashboard() {
  const [searchType, setSearchType] = useState('bookingId') // 'bookingId', 'ticketId', or 'email'
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [booking, setBooking] = useState(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedQRIndex, setSelectedQRIndex] = useState(0)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchTerm.trim()) {
      setError('Search term required')
      return
    }

    try {
      setLoading(true)
      setError('')
      setBooking(null)

      let res
      if (searchType === 'bookingId') {
        res = await API.get(`/bookings/admin/search-booking?bookingId=${encodeURIComponent(searchTerm)}`)
        setBooking(res.data.booking)
      } else if (searchType === 'ticketId') {
        res = await API.get(`/bookings/admin/search-ticket?ticketId=${encodeURIComponent(searchTerm)}`)
        setBooking(res.data.booking)
      } else {
        res = await API.get(`/bookings/admin/search-user?search=${encodeURIComponent(searchTerm)}&page=1&limit=1`)
        if (res.data.bookings.length > 0) {
          // Fetch full details for the first result
          const fullRes = await API.get(`/bookings/admin/search-booking?bookingId=${encodeURIComponent(res.data.bookings[0].bookingId)}`)
          setBooking(fullRes.data.booking)
        } else {
          setError('No bookings found')
        }
      }
    } catch (err) {
      console.error('Search error:', err)
      setError(err.response?.data?.message || 'Search failed')
      setBooking(null)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus) => {
    if (!booking) return

    try {
      setLoading(true)
      setError('')
      await API.put(`/admin/bookings/${booking._id}/status`, { status: newStatus })
      setBooking(prev => ({ ...prev, status: newStatus }))
      alert('Booking status updated successfully!')
    } catch (err) {
      console.error('Status update error:', err)
      setError(err.response?.data?.message || 'Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout title="Booking Search Dashboard">
      <div className="max-w-6xl mx-auto">
        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Search Booking Details</h2>
          
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Search By</label>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                >
                  <option value="bookingId">Booking ID (BK-YYYYMMDD-XXXXX)</option>
                  <option value="ticketId">Ticket ID (8-char code)</option>
                  <option value="email">Customer Email</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Search Term</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={
                    searchType === 'bookingId' 
                      ? 'e.g., BK-20260223-A1B2C'
                      : searchType === 'ticketId'
                      ? 'e.g., A1B2C3D4'
                      : 'e.g., customer@example.com'
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 font-bold text-lg transition"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          </form>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Booking Details View */}
        {booking && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-8 text-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-blue-100 text-sm font-semibold mb-1">Booking ID</p>
                  <p className="text-2xl font-bold font-mono">{booking.bookingId || booking._id?.substring(0, 12) || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm font-semibold mb-1">Event</p>
                  <p className="text-xl font-bold">{booking.eventTitle || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm font-semibold mb-1">Total Amount</p>
                  <p className="text-2xl font-bold">{formatINR(booking.totalAmount || 0)}</p>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Booking Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Customer Information */}
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 font-semibold mb-1">Full Name</p>
                      <p className="text-lg font-semibold text-gray-900">{booking.userName || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 font-semibold mb-1">Email</p>
                      <p className="text-sm font-mono text-gray-900 break-all">{booking.userEmail || 'N/A'}</p>
                    </div>
                    {booking.userPhone && booking.userPhone !== '-' && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs text-gray-600 font-semibold mb-1">Phone</p>
                        <p className="text-lg font-semibold text-gray-900">{booking.userPhone}</p>
                      </div>
                    )}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 font-semibold mb-1">Booking Date</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {booking.createdAt ? new Date(booking.createdAt).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Event Information */}
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000-2H2a2 2 0 00-2 2v14a2 2 0 002 2h16a2 2 0 002-2V5a2 2 0 00-2-2h-2a1 1 0 000 2h2v14H2V5z" clipRule="evenodd" />
                    </svg>
                    Event Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 font-semibold mb-1">Event Name</p>
                      <p className="text-lg font-semibold text-gray-900">{booking.event?.title || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 font-semibold mb-1">Event Date</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {booking.event?.date ? new Date(booking.event.date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    {booking.event?.location && (
                      <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                        <p className="text-xs text-gray-600 font-semibold mb-1">Location</p>
                        <p className="text-lg font-semibold text-gray-900">{booking.event.location}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ticket Information */}
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm3 2a1 1 0 000 2h6a1 1 0 000-2H5zm0 4a1 1 0 000 2h6a1 1 0 000-2H5z" />
                    </svg>
                    Ticket Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-xs text-gray-600 font-semibold mb-1">Quantity</p>
                      <p className="text-3xl font-bold text-blue-600">{booking.quantity || 0}</p>
                    </div>
                    {booking.ticketType?.name && (
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <p className="text-xs text-gray-600 font-semibold mb-1">Ticket Type</p>
                        <p className="text-lg font-bold text-purple-600">{booking.ticketType.name}</p>
                      </div>
                    )}
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-xs text-gray-600 font-semibold mb-1">Amount/Ticket</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatINR((booking.totalAmount || 0) / (booking.quantity || 1))}
                      </p>
                    </div>
                  </div>

                  {/* Ticket IDs */}
                  {booking.ticketIds && booking.ticketIds.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-bold text-gray-700 mb-3">Ticket IDs ({booking.ticketIds.length})</p>
                      <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {booking.ticketIds.map((id, idx) => (
                            <div key={idx} className="bg-white border border-gray-300 rounded-lg p-3 text-center hover:shadow-lg transition">
                              <p className="text-xs text-gray-500 font-semibold mb-1">Ticket {idx + 1}</p>
                              <p className="text-sm font-mono font-bold text-gray-900">{id}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Seats */}
                  {booking.seats && booking.seats.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-bold text-gray-700 mb-2">Assigned Seats</p>
                      <p className="text-base font-semibold text-gray-900 bg-amber-50 p-3 rounded-lg border border-amber-200">
                        {booking.seats.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Status & QR */}
              <div className="space-y-6">
                {/* Status Section */}
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Status Management</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Booking Status</label>
                      <select
                        value={booking.status || 'pending'}
                        onChange={(e) => handleStatusUpdate(e.target.value)}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 font-medium"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Payment Status</p>
                      <div className="px-4 py-3 bg-green-50 rounded-lg border border-green-200 text-center">
                        <p className="font-bold text-green-700 text-lg">
                          {(booking.paymentStatus || 'COMPLETED').toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                      <p className="text-xs text-blue-600 font-semibold mb-1">Current Status</p>
                      <p className={`text-lg font-bold ${
                        booking.status === 'confirmed' ? 'text-green-600' :
                        booking.status === 'pending' ? 'text-yellow-600' :
                        booking.status === 'cancelled' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {booking.status || 'PENDING'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* QR Codes Section */}
                {booking.qrCodes && booking.qrCodes.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">QR Codes</h3>
                    <p className="text-sm text-gray-600 mb-3">{booking.qrCodes.length} QR code(s) available</p>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {booking.qrCodes.slice(0, 4).map((qr, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedQRIndex(idx)
                            setShowQRModal(true)
                          }}
                          className="group relative overflow-hidden rounded-lg border-2 border-gray-300 hover:border-blue-500 transition cursor-pointer bg-gray-50"
                        >
                          {qr.image && (
                            <img src={qr.image} alt={`QR ${idx + 1}`} className="w-full h-auto p-1" />
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition flex items-center justify-center">
                            <span className="text-xs font-bold text-white group-hover:opacity-100 opacity-0 transition">
                              Ticket {idx + 1}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {booking.qrCodes.length > 4 && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        +{booking.qrCodes.length - 4} more QR codes
                      </p>
                    )}
                  </div>
                )}

                {/* Legacy QR */}
                {booking.qrCode && (!booking.qrCodes || booking.qrCodes.length === 0) && (
                  <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">QR Code</h3>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-center">
                      <img src={booking.qrCode} alt="Booking QR" className="w-40 h-40 rounded" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!booking && !loading && !error && (
          <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-gray-600 text-lg font-semibold">Search for a booking to view details</p>
            <p className="text-gray-500 text-sm mt-2">Enter a booking ID, ticket ID, or customer email above</p>
          </div>
        )}

        {/* QR Modal */}
        {showQRModal && booking?.qrCodes && booking.qrCodes[selectedQRIndex] && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">QR Code #{selectedQRIndex + 1}</h3>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-light"
                >
                  ×
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-center mb-4">
                <img
                  src={booking.qrCodes[selectedQRIndex].image}
                  alt={`QR Code ${selectedQRIndex + 1}`}
                  className="w-full h-auto rounded"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ticket ID</label>
                <p className="font-mono text-base font-bold text-gray-900 bg-blue-50 p-3 rounded border border-blue-200">
                  {booking.ticketIds[selectedQRIndex] || booking.qrCodes[selectedQRIndex].id || 'N/A'}
                </p>
              </div>

              <button
                onClick={() => setShowQRModal(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
