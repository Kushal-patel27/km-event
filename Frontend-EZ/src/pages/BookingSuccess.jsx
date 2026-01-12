import React, { useEffect, useRef, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useDarkMode } from '../context/DarkModeContext'
import { motion } from 'framer-motion'
import Ticket from '../components/Ticket'
import formatINR from '../utils/currency'
import API from '../services/api'
import html2canvas from 'html2canvas'

export default function BookingSuccess() {
  const location = useLocation()
  const { isDarkMode } = useDarkMode()
  const [showToast, setShowToast] = useState(false)
  const [booking, setBooking] = useState(() => location.state?.booking || null)
  const [loading, setLoading] = useState(!booking)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const ticketRef = useRef(null)

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

  const handleDownloadPdf = async () => {
    if (!booking) return
    setDownloading(true)
    try {
      const token = localStorage.getItem('token')
      const bookingId = booking._id || booking.id
      const quantity = booking.quantity || 1
      
      // Download each ticket PDF from backend
      for (let i = 0; i < quantity; i++) {
        const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}/ticket/${i}/pdf`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to download ticket')
        }

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `Ticket_${booking.ticketIds?.[i] || i + 1}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        // Small delay between downloads
        if (i < quantity - 1) {
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }
    } catch (err) {
      console.error(err)
      setError('Could not download PDF. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen py-12 px-4 flex items-center justify-center ${
        isDarkMode 
          ? 'bg-gradient-to-b from-[#0B0F19] via-[#0d1221] to-[#0B0F19]'
          : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'
      }`}>
        <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }}>
          <p className={`text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading booking details...</p>
        </motion.div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className={`min-h-screen py-12 px-4 flex items-center justify-center ${
        isDarkMode
          ? 'bg-gradient-to-b from-[#0B0F19] via-[#0d1221] to-[#0B0F19]'
          : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'
      }`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {error || 'No booking found'}
          </div>
          <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            It looks like you haven't booked any tickets yet.
          </p>
          <Link 
            to="/events" 
            className={`inline-block px-6 py-3 rounded-xl font-bold transition-all ${
              isDarkMode
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            Browse Events
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen py-12 px-4 transition-colors duration-300 ${
      isDarkMode
        ? 'bg-[#0B0F19]'
        : 'bg-gray-50'
    }`}>
      {/* Success Toast */}
      {showToast && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 bg-green-600 text-white`}
        >
          <div className="bg-white/20 rounded-full p-1">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <div className="font-bold">Booking Confirmed!</div>
            <div className="text-sm opacity-90">Your tickets are ready</div>
          </div>
        </motion.div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 shadow-2xl bg-green-600 text-white`}
          >
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </motion.div>

          <h1 className={`text-4xl md:text-5xl font-extrabold mb-4 ${
            isDarkMode
              ? 'text-blue-400'
              : 'text-blue-600'
          }`}>
            Booking Confirmed!
          </h1>

          <p className={`text-lg max-w-2xl mx-auto ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Your tickets have been successfully generated. Check your email for booking details and get ready for an amazing experience!
          </p>
        </motion.div>

        {/* Ticket Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <Ticket ref={ticketRef} booking={booking} />
        </motion.div>

        {/* Payment Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`max-w-2xl mx-auto rounded-3xl shadow-2xl overflow-hidden mb-10 border ${
            isDarkMode
              ? 'bg-[#1a1f2e] border-white/10'
              : 'bg-white border-blue-100'
          }`}
        >
          {/* Header */}
          <div className={`px-6 py-5 flex justify-between items-center ${
            isDarkMode
              ? 'bg-blue-600'
              : 'bg-blue-600'
          }`}>
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
              <h3 className="font-bold text-white text-lg">Payment Summary</h3>
            </div>
            <span className={`px-4 py-1.5 text-xs font-bold uppercase rounded-full tracking-wide shadow-lg bg-green-500 text-white`}>
              ✓ Paid
            </span>
          </div>

          {/* Content */}
          <div className={`p-8 space-y-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {/* Tickets */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm4 2a1 1 0 011 1v4a1 1 0 11-2 0V9a1 1 0 011-1zm6 0a1 1 0 011 1v4a1 1 0 11-2 0V9a1 1 0 011-1z" />
                </svg>
                <span className="font-medium">Tickets ({booking.quantity || 1})</span>
              </div>
              <span className="font-semibold">{formatINR(booking.originalPrice || booking.total || 0)}</span>
            </div>

            {/* Discount */}
            {booking.discount > 0 && (
              <div className={`flex justify-between items-center px-4 py-3 -mx-4 rounded-xl ${
                isDarkMode
                  ? 'bg-green-600/20 text-green-300'
                  : 'bg-green-50 text-green-600'
              }`}>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c4.76-4.76 12.484-4.76 17.244 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9.88 9.88a1 1 0 011.414 0 1 1 0 010 1.414 1 1 0 01-1.414-1.414z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Discount {booking.offerCode ? `(${booking.offerCode})` : ''}</span>
                </div>
                <span className="font-bold">-{formatINR(booking.discount)}</span>
              </div>
            )}

            {/* Total */}
            <div className={`border-t-2 border-dashed pt-4 mt-4 ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center">
                <span className={`font-bold text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Total Paid</span>
                <span className={`font-extrabold text-3xl ${
                  isDarkMode
                    ? 'text-blue-400'
                    : 'text-blue-600'
                }`}>
                  {formatINR(booking.total || 0)}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Event Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`max-w-2xl mx-auto rounded-3xl shadow-lg overflow-hidden mb-10 border ${
            isDarkMode
              ? 'bg-[#1a1f2e] border-white/10'
              : 'bg-white border-blue-100'
          }`}
        >
          <div className="p-8">
            <h3 className={`font-bold text-lg mb-6 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <svg className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0zM15 7a1 1 0 11-2 0 1 1 0 012 0zm2 2a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
              </svg>
              Event Details
            </h3>
            <div className="space-y-4">
              {/* Date */}
              <motion.div whileHover={{ x: 4 }} className="flex items-start gap-4">
                <svg className={`w-5 h-5 mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v2h16V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V7z" clipRule="evenodd" />
                </svg>
                <div>
                  <div className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date & Time</div>
                  <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
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
              </motion.div>

              {/* Location */}
              <motion.div whileHover={{ x: 4 }} className="flex items-start gap-4">
                <svg className={`w-5 h-5 mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <div>
                  <div className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Location</div>
                  <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{booking.event?.location || 'N/A'}</div>
                </div>
              </motion.div>

              {/* Seats */}
              {booking.seats && booking.seats.length > 0 && (
                <motion.div whileHover={{ x: 4 }} className="flex items-start gap-4">
                  <svg className={`w-5 h-5 mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 00-6 0V9h6z" />
                  </svg>
                  <div>
                    <div className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Seat Numbers</div>
                    <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{booking.seats.join(', ')}</div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownloadPdf}
            className={`w-full sm:w-auto px-8 py-4 font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-white ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={downloading}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {downloading ? 'Preparing PDF...' : 'Download Tickets (PDF)'}
          </motion.button>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto"
          >
            <Link
              to="/"
              className={`w-full sm:w-auto px-8 py-4 font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-white ${
                isDarkMode
                  ? 'bg-gray-600 hover:bg-gray-700'
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Back to Home
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
