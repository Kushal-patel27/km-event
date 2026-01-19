import React, {useState, useEffect} from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import API from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useDarkMode } from '../../context/DarkModeContext'
import { seatsAvailable, generateSeatLayout } from '../../utils/bookings'
import SeatPicker from '../../components/booking/SeatPicker'
import formatINR from '../../utils/currency'

export default function Booking(){
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const { isDarkMode } = useDarkMode()
  const storedToken = localStorage.getItem('token')
  const [event, setEvent] = useState(null)
  const [name, setName] = useState(authUser?.name || '')
  const [email, setEmail] = useState(authUser?.email || '')
  const [quantity, setQuantity] = useState(1)
  const [available, setAvailable] = useState(Infinity)
  const [error, setError] = useState('')
  const [selectedSeats, setSelectedSeats] = useState([])
  const [bookedSeatsFromDB, setBookedSeatsFromDB] = useState([]) // Seats from backend
  const [offer, setOffer] = useState(null)
  const [idVerified, setIdVerified] = useState(false)
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [selectedTicketType, setSelectedTicketType] = useState(null)

  const location = useLocation()

  // Require login to book
  useEffect(() => {
    if (!authUser && !storedToken) {
      navigate('/login', { state: { from: location.pathname } })
    }
  }, [authUser, storedToken, navigate, location])

  useEffect(()=>{
    setLoading(true)
    // Fetch event details
    API.get(`/events/${id}`)
      .then(res => {
        const e = res.data
        // normalize id
        e.id = e.id || e._id
        setEvent(e)
        setAvailable(seatsAvailable(e))
      })
      .catch(() => {
        setError("Failed to load event details.")
      })
      .finally(() => setLoading(false))

    // Fetch booked seats from backend
    API.get(`/bookings/event/${id}/seats`)
      .then(res => {
        if (res.data && Array.isArray(res.data.bookedSeats)) {
          setBookedSeatsFromDB(res.data.bookedSeats)
        }
      })
      .catch(err => {
        console.error("Failed to fetch booked seats:", err)
        // Continue with empty array if fetch fails
        setBookedSeatsFromDB([])
      })
  }, [id])

  // Update available tickets when ticket type is selected
  useEffect(() => {
    if (selectedTicketType) {
      setAvailable(selectedTicketType.available)
    } else if (event && !hasTicketTypes) {
      setAvailable(seatsAvailable(event))
    }
  }, [selectedTicketType, event])

  useEffect(()=>{
    // reset selected seats when quantity changes
    if(selectedSeats.length > quantity) setSelectedSeats(prev => prev.slice(0, quantity))
  }, [quantity])

  useEffect(() => {
    const storedOffer = sessionStorage.getItem('appliedOffer')
    if (storedOffer) {
      try {
        setOffer(JSON.parse(storedOffer))
      } catch (e) {
        console.error("Failed to parse offer", e)
      }
    }
  }, [])

  // Calculate discount
  const hasTicketTypes = event?.ticketTypes && event.ticketTypes.length > 0
  const currentPrice = selectedTicketType ? selectedTicketType.price : (event?.price || 0)
  const subTotal = currentPrice * quantity
  let discountAmount = 0
  let isOfferValid = true
  let offerMessage = ''

  if (offer) {
    if (offer.minQty && quantity < offer.minQty) {
      isOfferValid = false
      offerMessage = `Offer requires minimum ${offer.minQty} tickets`
    } else {
      discountAmount = subTotal * offer.discount
      offerMessage = `Code ${offer.code} applied`
    }
  }

  const finalTotal = subTotal - discountAmount

  if(loading) return <div className="text-center p-10">Loading...</div>
  if(!event) return <div className="text-center p-10">{error || 'Event not found'}</div>

  // Check sold out - all ticket types are sold out
  const isSoldOut = event.ticketTypes && event.ticketTypes.every(t => t.available === 0)

  if(isSoldOut) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 py-12 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`max-w-xl w-full rounded-2xl shadow-lg border transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`flex items-center gap-3 px-6 py-5 rounded-t-2xl ${isDarkMode ? 'bg-gradient-to-r from-red-700 to-red-600' : 'bg-gradient-to-r from-red-600 to-red-500'}`}>
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            </svg>
            <div className="text-white font-semibold">This event is sold out.</div>
          </div>
          <div className="px-6 py-5 text-sm">
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>All ticket types are currently unavailable. Please check back later or explore other events.</p>
            <div className="mt-4 flex justify-center">
              <Link to="/events" className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600 border border-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200'}`}>
                Browse Events
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const hasSeatLayout = event && isFinite(event.capacity) && event.capacity > 0

  async function handleSubmit(e){
    e.preventDefault()
    setError('')
    setBookingLoading(true)
    
    // Always require ticket type selection
    if(!selectedTicketType) {
      setBookingLoading(false)
      return setError('Please select a ticket type')
    }
    
    
    // Check if event has seat layout
    const hasSeatLayout = event && isFinite(event.capacity) && event.capacity > 0
    
    if(quantity < 1) {
      setBookingLoading(false)
      return setError('Quantity must be at least 1')
    }
    if(quantity > available) {
      setBookingLoading(false)
      return setError(`Only ${available} seats are available`)
    }
    
    
    // If event has seats, require seat selection
    if(hasSeatLayout){
      if(selectedSeats.length !== Number(quantity)) {
        setBookingLoading(false)
        return setError(`Please select ${quantity} seat(s)`)
      }
      
      // Re-fetch booked seats to ensure they're up to date before submission
      try {
        const seatCheckRes = await API.get(`/bookings/event/${id}/seats`)
        const currentBookedSeats = seatCheckRes.data.bookedSeats || []
        
        // Verify selected seats are still available
        for(const s of selectedSeats){
          if(currentBookedSeats.includes(Number(s))) {
            setBookingLoading(false)
            return setError(`Seat ${s} was just booked. Please choose another.`)
          }
        }
      } catch (err) {
        console.error("Failed to verify seat availability:", err)
        setBookingLoading(false)
        return setError("Could not verify seat availability. Please try again.")
      }
    }
    
    if (offer && offer.discount && offer.requiresId && !idVerified) {
      setBookingLoading(false)
      return setError('Please verify your ID eligibility for this offer.')
    }

    // If the user is authenticated and has a token, try to create booking on backend
    const token = (authUser && authUser.token) || storedToken
    if (token) {
      try {
        const payload = { 
          eventId: event.id, 
          quantity,
          ...(selectedTicketType && { ticketTypeId: selectedTicketType._id })
        }
        if (hasSeatLayout && selectedSeats.length > 0) payload.seats = selectedSeats.map(Number)
        const config = { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
        const res = await API.post('/bookings', payload, config)
        // backend returns booking in res.data with _id and qrCode; augment with event and user info
        const serverBooking = {
          ...res.data,
          event,
          user: { name, email, id: authUser?.email || email },
          date: event.date,
          originalPrice: subTotal,
          discount: discountAmount,
          total: finalTotal,
        }
        sessionStorage.removeItem('appliedOffer')
        navigate('/booking-success', { state: { booking: serverBooking } })
        return
      } catch (err) {
        console.error('Backend booking failed', err)
        const errorMsg = err.response?.data?.message || err.message
        setBookingLoading(false)
        // If auth error, clear invalid token and redirect to login
        if (err.response?.status === 401) {
          localStorage.removeItem('token')
          setError('Please log in to book tickets')
          setTimeout(() => navigate('/login', { state: { from: location.pathname } }), 2000)
          return
        }
        // For other errors, show message and don't fallback
        setError(`Booking failed: ${errorMsg}`)
        return
      }
    }

    // Local fallback for unauthenticated users or if backend fails
    const booking = { id: Date.now(), eventId: event.id, name, email, quantity, total: finalTotal, originalPrice: subTotal, discount: discountAmount, offerCode: (offer && offer.discount) ? offer.code : null, seats: hasSeatLayout && selectedSeats.length > 0 ? selectedSeats.map(Number) : undefined }
    const stored = JSON.parse(localStorage.getItem('bookings') || '[]')
    stored.push(booking)
    localStorage.setItem('bookings', JSON.stringify(stored))
    sessionStorage.removeItem('appliedOffer') // Clear offer after use

    // Navigate to success page with booking data for the ticket
    navigate('/booking-success', { 
      state: { 
        booking: {
          ...booking,
          event,
          user: { name, email, id: email },
          // seats is already in 'booking' (array or undefined), quantity is also there
          date: event.date
        } 
      } 
    })
  }

  return (
    <div className={`min-h-screen py-4 md:py-8 transition-colors ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className={`rounded-2xl shadow-xl overflow-hidden transition-colors ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {/* Event Header */}
          <div className={`text-white p-4 md:p-6 transition-colors ${
            isDarkMode 
              ? 'bg-gradient-to-r from-red-700 to-red-600' 
              : 'bg-gradient-to-r from-red-600 to-red-500'
          }`}>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">{event.title}</h2>
            <div className="flex flex-col sm:flex-row sm:gap-6 gap-3 text-sm opacity-95">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(event.date).toLocaleString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {event.location}
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className={`p-4 md:p-6 space-y-4 transition-colors ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {/* Personal Info */}
            <div className="space-y-3">
              <h3 className={`text-base font-semibold flex items-center gap-2 transition-colors ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                <svg className={`w-4 h-4 flex-shrink-0 transition-colors ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Your Information
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className={`block text-xs font-medium mb-1.5 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Full Name *</label>
                  <input 
                    required 
                    value={name} 
                    onChange={e=>setName(e.target.value)} 
                    className={`w-full px-3 py-2 border-2 rounded-lg text-sm focus:ring-2 focus:ring-offset-0 focus:outline-none transition ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-red-400 focus:border-red-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-600 focus:ring-red-400 focus:border-red-500'}`}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1.5 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email Address *</label>
                  <input 
                    required 
                    type="email" 
                    value={email} 
                    onChange={e=>setEmail(e.target.value)} 
                    className={`w-full px-3 py-2 border-2 rounded-lg text-sm focus:ring-2 focus:ring-offset-0 focus:outline-none transition ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-red-400 focus:border-red-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-600 focus:ring-red-400 focus:border-red-500'}`}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Ticket Type Selection (if available) - Compact Version */}
            {hasTicketTypes && (
              <div>
                <h3 className={`text-base font-semibold flex items-center gap-2 mb-3 transition-colors ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  <svg className={`w-4 h-4 flex-shrink-0 transition-colors ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.646 7.23a2 2 0 01-1.789 1.106H2a2 2 0 01-2-2V7a2 2 0 012-2h1.657a2 2 0 011.414.586l2.828 2.828a2 2 0 001.414.586h2.657a2 2 0 012 2v1z" />
                  </svg>
                  Ticket Type
                </h3>
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-2 transition-colors`}>
                  {event.ticketTypes.map((ticketType, idx) => (
                    <label 
                      key={idx} 
                      className={`flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedTicketType?.name === ticketType.name
                          ? isDarkMode 
                            ? 'bg-gray-700/80 border-blue-400 ring-2 ring-blue-300'
                            : 'bg-gray-50 border-blue-400 ring-2 ring-blue-200'
                          : isDarkMode 
                            ? 'bg-gray-800 border-gray-700 hover:border-gray-500'
                            : 'bg-white border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <input
                          type="radio"
                          name="ticketType"
                          checked={selectedTicketType?.name === ticketType.name}
                          onChange={() => setSelectedTicketType(ticketType)}
                          className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5"
                          required
                        />
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-bold transition-colors ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{ticketType.name}</div>
                          {ticketType.description && (
                            <div className={`text-xs transition-colors mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{ticketType.description}</div>
                          )}
                          <div className="flex items-baseline gap-2 mt-2">
                            <div className={`text-lg font-bold transition-colors ${isDarkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>{formatINR(ticketType.price)}</div>
                            <div className={`text-xs transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{ticketType.available} available</div>
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Ticket Quantity - Only show if ticket type selected or no types */}
            {(!hasTicketTypes || selectedTicketType) && (
            <div>
              <h3 className={`text-base font-semibold flex items-center gap-2 mb-3 transition-colors ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                <svg className={`w-4 h-4 flex-shrink-0 transition-colors ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                Select Tickets
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className={`block text-xs font-medium mb-1.5 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Number of Tickets *</label>
                  <input 
                    required 
                    type="number" 
                    min="1" 
                    max={available === Infinity ? undefined : available} 
                    value={quantity} 
                    onChange={e=>setQuantity(Number(e.target.value))} 
                    className={`w-full px-3 py-2 border-2 rounded-lg text-sm focus:ring-2 focus:ring-offset-0 focus:outline-none transition ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-red-400 focus:border-red-400' : 'border-gray-300 bg-white text-gray-900 focus:ring-red-400 focus:border-red-500'}`}
                  />
                </div>
                <div className={`flex items-center justify-center px-3 py-2 rounded-lg text-xs font-semibold min-w-[110px] h-full transition-colors ${isDarkMode ? 'bg-gray-800 text-gray-200 border border-gray-600' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                  {available === Infinity ? '∞ Available' : `${available} Left`}
                </div>
              </div>
            </div>
            )}

            {/* Total & Actions - Show after ticket selection */}
            {(!hasTicketTypes || selectedTicketType) && (
            <div className={`border-t pt-3 space-y-3 transition-colors ${isDarkMode ? 'border-gray-700' : ''}`}>
              <div className="space-y-2 text-sm">
                <div className="flex items-baseline justify-between">
                  <span className={`font-medium transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Subtotal</span>
                  <span className={`font-semibold transition-colors ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{formatINR(subTotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className={`flex items-baseline justify-between transition-colors ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    <span className="font-medium">Discount</span>
                    <span className="font-semibold">-{formatINR(discountAmount)}</span>
                  </div>
                )}
              </div>
              <div className={`flex items-baseline justify-between pt-2 px-3 py-3 rounded-lg border-2 transition-colors ${isDarkMode ? 'border-indigo-600 bg-indigo-900/20' : 'border-indigo-300 bg-indigo-50'}`}>
                <span className={`font-semibold transition-colors ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Total Amount</span>
                <span className={`font-bold text-lg transition-colors ${isDarkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>{formatINR(finalTotal)}</span>
              </div>
            </div>
            )}

            {/* Seat Selection - only show if event has seat layout */}
            {hasSeatLayout && (
              <div>
                <h3 className={`text-lg font-semibold flex items-center gap-2 mb-4 transition-colors ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  <svg className={`w-5 h-5 transition-colors ${isDarkMode ? 'text-red-500' : 'text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Choose Your Seats
                </h3>
                
                <div className={`p-8 rounded-lg border-4 transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                  <div className="mb-6">
                    <div className={`text-center font-bold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>🎬 SCREEN 🎬</div>
                    <div className="h-1 bg-gradient-to-r from-yellow-300 via-white to-yellow-300 rounded-full"></div>
                  </div>

                  <div className={`p-8 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
                    <div className={`text-sm font-medium mb-6 text-center transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Select {Number(quantity)} seat(s) • {selectedSeats.length} selected
                    </div>

                    {/* Seat Legend */}
                    <div className={`mb-6 p-4 rounded-lg border transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex flex-wrap justify-center gap-6 text-xs">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded border-2 ${isDarkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'}`}></div>
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded border-2 ${isDarkMode ? 'bg-red-500 border-red-400' : 'bg-red-600 border-red-500'}`}></div>
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Selected</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded border-2 ${isDarkMode ? 'bg-gray-500 border-gray-400' : 'bg-gray-300 border-gray-400'} cursor-not-allowed opacity-50`}></div>
                          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Booked</span>
                        </div>
                      </div>
                    </div>
                    
                    <SeatPicker 
                      layout={generateSeatLayout(event.capacity, 10)}
                      booked={bookedSeatsFromDB}
                      selected={selectedSeats}
                      maxSelectable={quantity}
                      onToggle={setSelectedSeats}
                      isDarkMode={isDarkMode}
                    />
                  </div>

                  <div className="mt-6">
                    <div className="h-1 bg-gradient-to-r from-yellow-300 via-white to-yellow-300 rounded-full mb-2"></div>
                    <div className="text-center text-white font-semibold text-sm opacity-90">Ground Level</div>
                  </div>
                </div>

                {/* Selected Seats Display */}
                {selectedSeats.length > 0 && (
                  <div style={isDarkMode ? {
                    backgroundColor: 'rgba(255, 50, 50, 0.15)',
                    borderColor: '#ff3333',
                    color: '#ffcccc'
                  } : {}} className={`mt-4 p-5 rounded-lg border-2 transition-colors ${isDarkMode ? 'border-red-500' : 'bg-red-50 border-red-300 text-red-900'}`}>
                    <p className={`text-sm font-bold mb-3 ${isDarkMode ? 'text-red-300' : 'text-red-900'}`}>
                      ✓ Your Selected Seats ({selectedSeats.length}/{quantity})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSeats.map(seat => (
                        <span 
                          key={seat} 
                          style={isDarkMode ? {
                            backgroundColor: '#ff3333',
                            color: 'white',
                            boxShadow: '0 0 12px rgba(255, 51, 51, 0.9)'
                          } : {}}
                          className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${isDarkMode ? '' : 'bg-red-600 text-white'}`}
                        >
                          {seat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Offer Display */}
            {offer && (
              <div className={`rounded-xl p-4 border-2 transition-colors ${
                offer.discount 
                  ? isDarkMode ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-300'
                  : isDarkMode ? 'bg-yellow-900 border-yellow-700' : 'bg-yellow-50 border-yellow-300'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className={`font-bold text-lg transition-colors ${
                      offer.discount 
                        ? isDarkMode ? 'text-green-100' : 'text-green-800'
                        : isDarkMode ? 'text-yellow-100' : 'text-yellow-800'
                    }`}>{offer.title}</div>
                    <div className={`text-sm mt-1 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{offer.discount ? `Code ${offer.code} applied` : 'Offer not applicable'}</div>
                  </div>
                  {offer.discount && <span className={`font-bold text-xl transition-colors ${isDarkMode ? 'text-green-100' : 'text-green-700'}`}>-{formatINR(discountAmount)}</span>}
                </div>
                
                {offer.discount && offer.requiresId && (
                  <label className={`flex items-center gap-3 mt-3 p-3 rounded-lg cursor-pointer border transition-colors ${isDarkMode ? 'bg-gray-700 border-green-600' : 'bg-white border-green-200'}`}>
                    <input 
                      type="checkbox" 
                      checked={idVerified} 
                      onChange={e => setIdVerified(e.target.checked)} 
                      className="w-4 h-4 rounded text-green-600" 
                    />
                    <span className={`text-sm font-medium transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>I confirm I have a valid Student ID</span>
                  </label>
                )}
                <button 
                  type="button" 
                  onClick={() => {setOffer(null); sessionStorage.removeItem('appliedOffer')}} 
                  className={`text-xs underline mt-3 transition-colors ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  Remove Offer
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className={`border px-4 py-3 rounded-lg text-sm transition-colors ${isDarkMode ? 'bg-red-900 border-red-700 text-red-100' : 'bg-red-50 border-red-200 text-red-700'}`}>
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Link 
                to={`/event/${event.id}`} 
                className={`flex-1 px-4 py-2 border-2 rounded-lg text-sm font-semibold transition text-center ${isDarkMode ? 'border-gray-500 text-gray-300 hover:bg-gray-700/50' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                ← Back to Event
              </Link>
              <button 
                type="submit"
                disabled={bookingLoading || (hasTicketTypes && !selectedTicketType)}
                className={`flex-1 px-4 py-2.5 text-white rounded-lg text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:shadow-lg disabled:hover:translate-y-0 ${isDarkMode ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600' : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600'}`}
              >
                {bookingLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  'Confirm Booking →'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
