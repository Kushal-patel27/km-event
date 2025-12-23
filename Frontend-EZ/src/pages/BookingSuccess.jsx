import React, { useEffect, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import Ticket from '../components/Ticket'
import formatINR from '../utils/currency'
import events from '../data/events'

export default function BookingSuccess() {
  const location = useLocation()
  const [showToast, setShowToast] = useState(false)

  // Initialize booking state: prefer location state, fallback to localStorage
  const [booking] = useState(() => {
    if (location.state?.booking) return location.state.booking
    try {
      const stored = JSON.parse(localStorage.getItem('bookings') || '[]')
      if (stored.length > 0) {
        const lastBooking = stored[stored.length - 1]
        const event = events.find(e => e.id === lastBooking.eventId)
        if (event) {
          return {
            ...lastBooking,
            event,
            user: { name: lastBooking.name, email: lastBooking.email, id: lastBooking.email },
            date: event.date
          }
        }
      }
    } catch (err) {
      console.error(err)
    }
    return null
  })

  useEffect(() => {
    if (booking) {
      setShowToast(true)
      const timer = setTimeout(() => setShowToast(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [booking])

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">No booking found</h2>
          <p className="text-gray-600 mt-2">It looks like you haven't booked any tickets yet.</p>
          <Link to="/events" className="inline-block mt-6 bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700">
            Browse Events
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      {/* Success Popup */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 transition-all duration-500 transform translate-y-0 animate-bounce">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-bold text-lg">Your ticket is booked!</span>
        </div>
      )}
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 text-green-600 rounded-full mb-6 shadow-sm">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Booking Confirmed!</h1>
        <p className="text-gray-600 mb-10 text-lg">Your tickets have been generated. Get ready for an amazing experience.</p>

        <div className="mb-10 transform hover:scale-[1.01] transition-transform duration-300">
          <Ticket booking={booking} />
        </div>

        {/* Order Summary */}
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-10 text-left">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Payment Summary</h3>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase rounded-full tracking-wide">Paid</span>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal ({booking.quantity || 1} tickets)</span>
              <span>{formatINR(booking.originalPrice || booking.total || 0)}</span>
            </div>
            {booking.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount {booking.offerCode ? `(${booking.offerCode})` : ''}</span>
                <span>-{formatINR(booking.discount)}</span>
              </div>
            )}
            <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between items-center font-bold text-xl text-gray-900">
              <span>Total Paid</span>
              <span>{formatINR(booking.total || 0)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={() => window.print()} className="px-8 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition shadow-sm flex items-center gap-2">
            Download Ticket
          </button>
          <Link to="/" className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}