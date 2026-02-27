import React, { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import API from '../../services/api'
import { getEventImage } from '../../utils/images'
import Ticket from '../../components/booking/Ticket'
import { useAuth } from '../../context/AuthContext'
import { useDarkMode } from '../../context/DarkModeContext'
import formatINR from '../../utils/currency'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function MyBookings() {
  const backendURL = import.meta.env.VITE_API_URL || ""
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeEventId, setActiveEventId] = useState(null)
  const ticketRefs = useRef({})

  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const { isDarkMode } = useDarkMode()

  const downloadTicket = async (bookingId) => {
    try {
      const booking = bookings.find(b => b._id === bookingId);
      if (!booking) return;

      const token = localStorage.getItem('token');
      
      // Download each ticket PDF
      for (let i = 0; i < booking.quantity; i++) {
        const response = await fetch(`${backendURL}/api/bookings/${bookingId}/ticket/${i}/pdf`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to download ticket');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Ticket_${booking.ticketIds?.[i] || i + 1}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        // Small delay between downloads to prevent browser blocking
        if (i < booking.quantity - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download ticket. Please try again.');
    }
  }

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          navigate('/login')
          return
        }

        const res = await API.get('/bookings/my', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        // Sort bookings by creation date (most recent first)
        const sortedBookings = (res.data || []).sort((a, b) => {
          const dateA = new Date(a.createdAt || a.date)
          const dateB = new Date(b.createdAt || b.date)
          return dateB - dateA // Descending order (newest first)
        })

        setBookings(sortedBookings)
      } catch (err) {
        console.error(err)
        setError('Failed to load bookings.')
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [navigate])

  // Group bookings by event
  const groupedByEvent = bookings.reduce((acc, booking) => {
    const event = booking.event
    if (!event || !event._id) return acc

    if (!acc[event._id]) {
      acc[event._id] = {
        event,
        bookings: [],
        totalTickets: 0,
        totalAmount: 0,
        ticketTypes: new Set()
      }
    }

    acc[event._id].bookings.push(booking)
    acc[event._id].totalTickets += booking.quantity
    acc[event._id].totalAmount += booking.totalAmount || booking.total || 0
    if (booking.ticketType?.name) {
      acc[event._id].ticketTypes.add(booking.ticketType.name)
    }

    return acc
  }, {})

  if (loading) {
    return (
      <div className={`min-h-screen py-6 sm:py-8 lg:py-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden ${isDarkMode ? 'bg-black text-white' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-gray-900'}`}>
        <div className="max-w-5xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-6">
            <div className={`h-8 sm:h-10 w-48 sm:w-64 rounded-lg mb-2 relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-r from-gray-700/50 to-gray-800/50' : 'bg-gradient-to-r from-gray-200 to-gray-300'}`}>
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            <div className={`h-4 sm:h-5 w-64 sm:w-80 rounded-lg relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-r from-gray-700/50 to-gray-800/50' : 'bg-gradient-to-r from-gray-100 to-gray-200'}`}>
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`rounded-lg shadow p-3 ${isDarkMode ? 'bg-black border border-white/10' : 'bg-white border border-gray-100'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-gray-700/50 to-gray-800/50' : 'bg-gradient-to-br from-gray-200 to-gray-300'}`}>
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>
                  <div className="flex-1">
                    <div className={`h-3 w-20 rounded mb-2 relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-r from-gray-700/50 to-gray-800/50' : 'bg-gradient-to-r from-gray-100 to-gray-200'}`}>
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    </div>
                    <div className={`h-6 w-16 rounded relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-r from-gray-700/50 to-gray-800/50' : 'bg-gradient-to-r from-gray-200 to-gray-300'}`}>
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Booking Cards Skeleton */}
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`rounded-lg shadow p-3 sm:p-4 ${isDarkMode ? 'bg-black border border-white/10' : 'bg-white border border-gray-100'}`}>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className={`h-4 w-16 rounded relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-r from-gray-700/50 to-gray-800/50' : 'bg-gradient-to-r from-gray-200 to-gray-300'}`}>
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    </div>
                    <div className={`h-6 w-3/4 rounded-lg relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-r from-gray-700/50 to-gray-800/50' : 'bg-gradient-to-r from-gray-200 to-gray-300'}`}>
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    </div>
                    <div className="space-y-2">
                      <div className={`h-4 w-2/3 rounded relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-r from-gray-700/50 to-gray-800/50' : 'bg-gradient-to-r from-gray-100 to-gray-200'}`}>
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      </div>
                      <div className={`h-4 w-1/2 rounded relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-r from-gray-700/50 to-gray-800/50' : 'bg-gradient-to-r from-gray-100 to-gray-200'}`}>
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className={`h-4 w-20 rounded relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-r from-gray-700/50 to-gray-800/50' : 'bg-gradient-to-r from-gray-200 to-gray-300'}`}>
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      </div>
                      <div className={`h-4 w-24 rounded relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-r from-gray-700/50 to-gray-800/50' : 'bg-gradient-to-r from-gray-200 to-gray-300'}`}>
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      </div>
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2">
                    <div className={`h-9 w-24 rounded-lg relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-r from-red-900/30 to-red-800/30' : 'bg-gradient-to-r from-indigo-200 to-indigo-300'}`}>
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    </div>
                    <div className={`h-9 w-9 rounded-lg relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-gray-700/50 to-gray-800/50' : 'bg-gradient-to-br from-gray-200 to-gray-300'}`}>
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center overflow-x-hidden ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="text-center max-w-md px-4">
          {/* // MOBILE OPTIMIZED */}
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${isDarkMode ? 'bg-red-500/10 text-red-300' : 'bg-red-100 text-red-600'}`}>
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className={`text-2xl sm:text-3xl md:text-4xl leading-tight font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Error Loading Bookings</h2>
          <p className={`${isDarkMode ? 'text-red-400' : 'text-red-600'} mb-6 text-sm sm:text-base md:text-lg`}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className={`w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-lg transition active:scale-95 ${isDarkMode ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (bookings.length === 0) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 overflow-x-hidden ${isDarkMode ? 'bg-black text-white' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-gray-900'}`}>
        <div className="text-center max-w-md">
          {/* // MOBILE OPTIMIZED */}
          <div className={`inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full mb-6 ${isDarkMode ? 'bg-white/5 text-red-400' : 'bg-indigo-100 text-indigo-600'}`}>
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          <h2 className={`text-2xl sm:text-3xl md:text-4xl leading-tight font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>No Bookings Yet</h2>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-8 text-sm sm:text-base md:text-lg`}>You haven't booked any events yet. Discover amazing events and book your tickets now!</p>
          <Link
            to="/events"
            className={`w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-8 py-4 font-bold rounded-xl hover:shadow-xl transform hover:-translate-y-0.5 transition-all shadow-lg active:scale-95 ${isDarkMode ? 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600' : 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Browse Events
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen py-6 sm:py-8 lg:py-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden ${isDarkMode ? 'bg-black text-white' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-gray-900'}`}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          {/* // MOBILE OPTIMIZED */}
          <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 leading-tight ${isDarkMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-400' : 'text-indigo-600'}`}>
            My Bookings
          </h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm sm:text-base leading-relaxed`}>View and manage all your event tickets in one place</p>
        </div>

        {/* Stats Cards */}
        {/* // MOBILE OPTIMIZED */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          <div className={`rounded-lg shadow p-3 ${isDarkMode ? 'bg-black border border-white/10' : 'bg-white border border-indigo-100'}`}>
            <div className="flex items-center gap-3">
              <div className={`${isDarkMode ? 'bg-white/10' : 'bg-red-600 bg-opacity-10'} rounded-lg p-2`}>
                <svg className={`w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Events</div>
                <div className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{Object.keys(groupedByEvent).length}</div>
              </div>
            </div>
          </div>
          
          <div className={`rounded-lg shadow p-3 ${isDarkMode ? 'bg-black border border-white/10' : 'bg-white border border-purple-100'}`}>
            <div className="flex items-center gap-3">
              <div className={`${isDarkMode ? 'bg-white/10' : 'bg-purple-100'} rounded-lg p-2`}>
                <svg className={`w-5 h-5 ${isDarkMode ? 'text-pink-400' : 'text-purple-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <div>
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Tickets</div>
                <div className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {Object.values(groupedByEvent).reduce((sum, g) => sum + g.totalTickets, 0)}
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-lg shadow p-3 ${isDarkMode ? 'bg-black border border-white/10' : 'bg-white border border-blue-100'}`}>
            <div className="flex items-center gap-3">
              <div className={`${isDarkMode ? 'bg-white/10' : 'bg-red-600 bg-opacity-10'} rounded-lg p-2`}>
                <svg className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Spent</div>
                <div className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatINR(Object.values(groupedByEvent).reduce((sum, g) => sum + g.totalAmount, 0))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-3">
          {Object.values(groupedByEvent).map(({ event, bookings, totalTickets, totalAmount, ticketTypes }) => {
            const isOpen = activeEventId === event._id
            const eventDate = new Date(event.date)
            const isPast = eventDate < new Date()

            return (
              <div
                key={event._id}
                className={`rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-300 ${isDarkMode ? 'bg-black border border-white/10' : 'bg-white border border-gray-100'}`}
              >
                {/* EVENT SUMMARY */}
                <div
                  onClick={() => setActiveEventId(isOpen ? null : event._id)}
                  className={`cursor-pointer p-3 sm:p-4 flex flex-col gap-3 transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-start gap-1.5 mb-1.5">
                        {isPast ? (
                          <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded ${isDarkMode ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>Past</span>
                        ) : (
                          <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded ${isDarkMode ? 'bg-green-500/20 text-green-200' : 'bg-green-100 text-green-700'}`}>Upcoming</span>
                        )}
                      </div>
                      
                      <h3 className={`text-base sm:text-lg font-bold mb-1.5 break-words leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {event.title}
                      </h3>
                    </div>

                    {/* Image and Toggle Button - Mobile Right aligned */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <img
                        src={getEventImage(event)}
                        alt={event.title}
                        className="w-16 h-14 sm:w-20 sm:h-16 object-cover rounded-lg shadow-md"
                      />
                      <button className={`${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} transition p-1.5`}>
                        <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Event Details Section */}
                  <div className="space-y-2">
                    <div className="space-y-1 mb-2">
                      <div className={`flex items-start gap-2 text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="break-words">
                          {eventDate.toLocaleString('en-US', { 
                            weekday: 'short',
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className={`flex items-start gap-1.5 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="break-words line-clamp-2">{event.location}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1.5 sm:gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <svg className={`w-3.5 h-3.5 flex-shrink-0 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                        <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Tickets:</span>
                        <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{totalTickets}</span>
                      </div>
                      {ticketTypes.size > 0 && (
                        <div className="flex items-center gap-1 sm:gap-2">
                          <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Types:</span>
                          <span className={`font-medium ${isDarkMode ? 'text-indigo-300' : 'text-indigo-600'} line-clamp-1`}>{Array.from(ticketTypes).join(', ')}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <svg className={`w-3.5 h-3.5 flex-shrink-0 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total:</span>
                        <span className={`font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{formatINR(totalAmount)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className={`w-3.5 h-3.5 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Bookings:</span>
                        <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{bookings.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOOKINGS LIST */}
                {isOpen && (
                  <div className={`border-t p-3 sm:p-4 space-y-3 ${isDarkMode ? 'bg-[#0f1320] border-white/10' : 'bg-gradient-to-br from-gray-50 to-indigo-50'}`}>
                    <h4 className={`text-sm sm:text-base font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Booking Details</h4>
                    {bookings.map(booking => {
                      const ticketBooking = {
                        ...booking,
                        event,
                        date: event.date,
                        user:
                          booking.user && typeof booking.user === 'object'
                            ? booking.user
                            : authUser,
                        id: booking._id
                      }

                      return (
                        <div
                          key={booking._id}
                          className={`rounded-lg p-3 shadow ${isDarkMode ? 'bg-[#131826] border border-white/10' : 'bg-white border border-gray-100'}`}
                        >
                          {/* // MOBILE OPTIMIZED */}
                          <div className="mb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 text-xs">
                              <div className="flex items-center gap-1.5">
                                <svg className={`w-3.5 h-3.5 flex-shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Quantity:</span>
                                <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{booking.quantity}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <svg className={`w-3.5 h-3.5 flex-shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status:</span>
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${isDarkMode ? 'bg-green-500/20 text-green-200' : 'bg-green-100 text-green-700'}`}>{booking.status}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <svg className={`w-3.5 h-3.5 flex-shrink-0 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Amount:</span>
                                <span className={`font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{formatINR(booking.totalAmount || 0)}</span>
                              </div>
                              {booking.scans && booking.scans.length > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <svg className={`w-3.5 h-3.5 flex-shrink-0 text-green-500`} fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                  </svg>
                                  <span className={`text-xs font-bold ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>
                                  {Math.min(booking.scans.length, booking.quantity || 1)}/{booking.quantity || 1} Scanned
                                </span>
                                </div>
                              )}
                            </div>
                            
                            {/* Download Button */}
                            <button
                              onClick={() => downloadTicket(booking._id)}
                              className={`w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                                isDarkMode 
                                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              Download PDF{booking.quantity > 1 ? 's' : ''}
                            </button>
                          </div>

                          <div ref={el => ticketRefs.current[booking._id] = el}>
                            <Ticket booking={ticketBooking} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
