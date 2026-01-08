import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import API from '../services/api'
import { getEventImage } from '../utils/images'
import Ticket from '../components/Ticket'
import { useAuth } from '../context/AuthContext'
import { useDarkMode } from '../context/DarkModeContext'
import formatINR from '../utils/currency'

export default function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeEventId, setActiveEventId] = useState(null)

  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const { isDarkMode } = useDarkMode()

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

        setBookings(res.data || [])
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
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#0B0F19] text-white' : 'bg-gray-50 text-gray-800'}`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-4 border-gray-700 mx-auto mb-4 ${isDarkMode ? 'border-red-400' : 'border-b-red-600'}`}></div>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-400'} text-base md:text-lg font-medium`}>Loading your bookings...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#0B0F19] text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="text-center max-w-md">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${isDarkMode ? 'bg-red-500/10 text-red-300' : 'bg-red-100 text-red-600'}`}>
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Error Loading Bookings</h2>
          <p className={`${isDarkMode ? 'text-red-400' : 'text-red-600'} mb-6`}>{error}</p>
          <button onClick={() => window.location.reload()} className={`px-6 py-2 rounded-lg transition ${isDarkMode ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (bookings.length === 0) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 ${isDarkMode ? 'bg-[#0B0F19] text-white' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-gray-900'}`}>
        <div className="text-center max-w-md">
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 ${isDarkMode ? 'bg-white/5 text-red-400' : 'bg-indigo-100 text-indigo-600'}`}>
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          <h2 className={`text-3xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>No Bookings Yet</h2>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-8 text-lg`}>You haven't booked any events yet. Discover amazing events and book your tickets now!</p>
          <Link
            to="/events"
            className={`inline-flex items-center gap-2 px-8 py-4 font-bold rounded-xl hover:shadow-xl transform hover:-translate-y-0.5 transition-all shadow-lg ${isDarkMode ? 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600' : 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white'}`}
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
    <div className={`min-h-screen py-12 px-4 ${isDarkMode ? 'bg-[#0B0F19] text-white' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-gray-900'}`}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className={`text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r whitespace-normal break-words mb-6 ${isDarkMode ? 'from-red-500 to-red-400' : 'from-indigo-600 to-purple-600'}`}>
            My Bookings
          </h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-400'} text-base md:text-lg font-medium whitespace-normal break-words`}>View and manage all your event tickets in one place</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className={`rounded-2xl shadow-lg p-6 ${isDarkMode ? 'bg-[#131826] border border-white/10' : 'bg-white border border-indigo-100'}`}>
            <div className="flex items-center gap-4">
              <div className={`${isDarkMode ? 'bg-white/10' : 'bg-red-600 bg-opacity-10'} rounded-xl p-3`}>
                <svg className={`w-8 h-8 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-400 font-medium'}`}>Total Events</div>
                <div className={`text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-white'}`}>{Object.keys(groupedByEvent).length}</div>
              </div>
            </div>
          </div>
          
          <div className={`rounded-2xl shadow-lg p-6 ${isDarkMode ? 'bg-[#131826] border border-white/10' : 'bg-white border border-purple-100'}`}>
            <div className="flex items-center gap-4">
              <div className={`${isDarkMode ? 'bg-white/10' : 'bg-purple-100'} rounded-xl p-3`}>
                <svg className={`w-8 h-8 ${isDarkMode ? 'text-pink-400' : 'text-purple-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Tickets</div>
                <div className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {Object.values(groupedByEvent).reduce((sum, g) => sum + g.totalTickets, 0)}
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl shadow-lg p-6 ${isDarkMode ? 'bg-[#131826] border border-white/10' : 'bg-white border border-blue-100'}`}>
            <div className="flex items-center gap-4">
              <div className={`${isDarkMode ? 'bg-white/10' : 'bg-red-600 bg-opacity-10'} rounded-xl p-3`}>
                <svg className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-400 font-medium'}`}>Total Spent</div>
                <div className={`text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-white'}`}>
                  {formatINR(Object.values(groupedByEvent).reduce((sum, g) => sum + g.totalAmount, 0))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-4 md:space-y-6">
          {Object.values(groupedByEvent).map(({ event, bookings, totalTickets, totalAmount, ticketTypes }) => {
            const isOpen = activeEventId === event._id
            const eventDate = new Date(event.date)
            const isPast = eventDate < new Date()

            return (
              <div
                key={event._id}
                className={`rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ${isDarkMode ? 'bg-[#111522] border border-white/10' : 'bg-white border border-gray-100'}`}
              >
                {/* EVENT SUMMARY */}
                <div
                  onClick={() => setActiveEventId(isOpen ? null : event._id)}
                  className={`cursor-pointer p-6 flex justify-between items-start transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-3">
                      {isPast ? (
                        <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${isDarkMode ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>Past Event</span>
                      ) : (
                        <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${isDarkMode ? 'bg-green-500/20 text-green-200' : 'bg-green-100 text-green-700'}`}>Upcoming</span>
                      )}
                    </div>
                    
                    <h3 className={`text-2xl font-bold mb-2 break-words ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {event.title}
                    </h3>

                    <div className="space-y-2 mb-4">
                      <div className={`flex items-center gap-2 break-words ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">
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
                      <div className={`flex items-center gap-2 break-words ${isDarkMode ? 'text-gray-400' : 'text-gray-400 text-sm md:text-base'}`}>
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate text-gray-300">{event.location}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 md:gap-6 text-xs md:text-sm">
                      <div className="flex items-center gap-2">
                        <svg className={`w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-600 flex-shrink-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                        <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>Tickets:</span>
                        <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-white'}`}>{totalTickets}</span>
                      </div>
                      {ticketTypes.size > 0 && (
                        <div className="flex items-center gap-2">
                          <svg className={`w-5 h-5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Types:</span>
                          <span className={`font-medium ${isDarkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>{Array.from(ticketTypes).join(', ')}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <svg className={`w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-600 flex-shrink-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>Total Paid:</span>
                        <span className={`font-bold ${isDarkMode ? 'text-red-400' : 'text-red-500'}`}>{formatINR(totalAmount)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className={`w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-600 flex-shrink-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>Bookings:</span>
                        <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-white'}`}>{bookings.length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 w-full sm:w-auto">
                    <img
                      src={getEventImage(event)}
                      alt={event.title}
                      className="w-24 h-20 sm:w-32 sm:h-24 object-cover rounded-xl shadow-md flex-shrink-0"
                    />
                    <button className={`${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-red-600'} transition p-1`}>
                      <svg className={`w-6 h-6 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* BOOKINGS LIST */}
                {isOpen && (
                  <div className={`border-t p-6 space-y-6 ${isDarkMode ? 'bg-[#0f1320] border-white/10' : 'bg-gradient-to-br from-gray-50 to-indigo-50'}`}>
                    <h4 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Booking Details</h4>
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
                          className={`rounded-xl p-6 shadow-md ${isDarkMode ? 'bg-[#131826] border border-white/10' : 'bg-white border border-gray-100'}`}
                        >
                          <div className="mb-4 flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm">
                            <div className="flex items-center gap-2">
                              <svg className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>Quantity:</span>
                              <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-white'}`}>{booking.quantity}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <svg className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status:</span>
                              <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase ${isDarkMode ? 'bg-green-500/20 text-green-200' : 'bg-green-100 text-green-700'}`}>{booking.status}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <svg className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>Amount:</span>
                              <span className={`font-bold ${isDarkMode ? 'text-red-400' : 'text-red-500'}`}>{formatINR(booking.totalAmount || 0)}</span>
                            </div>
                            {booking.scans && booking.scans.length > 0 && (
                              <div className="flex items-center gap-2">
                                <svg className={`w-4 h-4 text-green-500`} fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                </svg>
                                <span className={`text-xs font-bold uppercase ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>
                                  {Math.min(booking.scans.length, booking.quantity || 1)}/{booking.quantity || 1} Scanned
                                </span>
                              </div>
                            )}
                          </div>

                          <Ticket booking={ticketBooking} />
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
