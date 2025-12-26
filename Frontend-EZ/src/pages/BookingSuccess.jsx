import React, { useEffect, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import Ticket from '../components/Ticket'
import formatINR from '../utils/currency'
import API from '../services/api'

export default function BookingSuccess() {
  const location = useLocation()
  const [showToast, setShowToast] = useState(false)
  const [booking, setBooking] = useState(() => location.state?.booking || null)
  const [loading, setLoading] = useState(!booking)
  const [error, setError] = useState('')

  useEffect(() => {
    // Fallback to localStorage and API if booking is not in location state
    if (!booking) {
      setLoading(true)
      try {
        const stored = JSON.parse(localStorage.getItem('bookings') || '[]')
        if (stored.length > 0) {
          const lastBooking = stored[stored.length - 1]
          API.get(`/events/${lastBooking.eventId}`)
            .then(res => {
              const event = res.data
              event.id = event.id || event._id
              setBooking({
                ...lastBooking,
                event,
                user: { name: lastBooking.name, email: lastBooking.email, id: lastBooking.email },
                date: event.date
              })
            })
            .catch(() => setError('Could not load booking details.'))
            .finally(() => setLoading(false))
        } else {
          setLoading(false)
        }
      } catch (err) {
        console.error(err)
        setError('An error occurred.')
        setLoading(false)
      }
    }
  }, [booking])

  useEffect(() => {
    if (booking) {
      setShowToast(true)
      const timer = setTimeout(() => setShowToast(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [booking])

  if (loading) return <div className="text-center p-10">Loading booking details...</div>

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">{error || 'No booking found'}</h2>
          <p className="text-gray-600 mt-2">It looks like you haven't booked any tickets yet.</p>
          <Link to="/events" className="inline-block mt-6 bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700">
            Browse Events
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      {/* Success Popup */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 transition-all duration-500 transform animate-slide-in-right">
          <div className="bg-white/20 rounded-full p-1">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-lg">Booking Confirmed!</div>
            <div className="text-sm opacity-90">Your tickets are ready</div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 text-white rounded-full mb-6 shadow-xl animate-bounce-slow">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4">
            Booking Confirmed!
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Your tickets have been successfully generated. Check your email for booking details and get ready for an amazing experience!
          </p>
        </div>

        {/* Ticket Display */}
        <div className="mb-10">
          <Ticket booking={booking} />
        </div>

        {/* Payment Summary Card */}
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-10">
          <div className="px-6 py-5 bg-gradient-to-r from-indigo-600 to-blue-500 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="font-bold text-white text-lg">Payment Summary</h3>
            </div>
            <span className="px-4 py-1.5 bg-green-500 text-white text-xs font-bold uppercase rounded-full tracking-wide shadow-lg">
              ✓ Paid
            </span>
          </div>
          
          <div className="p-8 space-y-4">
            <div className="flex justify-between items-center text-gray-700">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                <span className="font-medium">Tickets ({booking.quantity || 1})</span>
              </div>
              <span className="font-semibold">{formatINR(booking.originalPrice || booking.total || 0)}</span>
            </div>
            
            {booking.discount > 0 && (
              <div className="flex justify-between items-center text-green-600 bg-green-50 -mx-8 px-8 py-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="font-medium">Discount {booking.offerCode ? `(${booking.offerCode})` : ''}</span>
                </div>
                <span className="font-bold">-{formatINR(booking.discount)}</span>
              </div>
            )}
            
            <div className="border-t-2 border-dashed border-gray-200 pt-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-900 font-bold text-xl">Total Paid</span>
                <span className="text-indigo-600 font-extrabold text-3xl">{formatINR(booking.total || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Event Details Card */}
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-10">
          <div className="p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Event Details
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <div className="text-sm text-gray-500">Date & Time</div>
                  <div className="font-semibold text-gray-900">
                    {booking.event?.date ? new Date(booking.event.date).toLocaleString('en-US', { 
                      weekday: 'long',
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'N/A'}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <div className="text-sm text-gray-500">Location</div>
                  <div className="font-semibold text-gray-900">{booking.event?.location || 'N/A'}</div>
                </div>
              </div>
              {booking.seats && booking.seats.length > 0 && (
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <div className="text-sm text-gray-500">Seat Numbers</div>
                    <div className="font-semibold text-gray-900">{booking.seats.join(', ')}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => window.print()} 
            className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3 group"
          >
            <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-900 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Ticket
          </button>
          <Link 
            to="/" 
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-bold rounded-xl hover:shadow-xl transform hover:-translate-y-0.5 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}