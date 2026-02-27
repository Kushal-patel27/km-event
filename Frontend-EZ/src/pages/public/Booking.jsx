import React, {useState, useEffect} from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import API from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useDarkMode } from '../../context/DarkModeContext'
import { seatsAvailable, generateSeatLayout } from '../../utils/bookings'
import SeatPicker from '../../components/booking/SeatPicker'
import formatINR from '../../utils/currency'
import LoadingSpinner from '../../components/common/LoadingSpinner'

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
  const [features, setFeatures] = useState(null)
  const [loadingFeatures, setLoadingFeatures] = useState(true)
  const [maxPerUser, setMaxPerUser] = useState(null)

  const location = useLocation()

  // Require login to book
  useEffect(() => {
    if (!authUser && !storedToken) {
      navigate('/login', { state: { from: location.pathname } })
    }
  }, [authUser, storedToken, navigate, location])

  // ...existing hooks and logic...

  // Fetch event features
  useEffect(() => {
    if (!id) return;
    const fetchFeatures = async () => {
      try {
        setLoadingFeatures(true);
        // Try to fetch enabled features (requires auth but works for authorized users)
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const res = await API.get(`/event-requests/${id}/enabled-features`, { headers });
        const enabledFeatures = res.data.enabledFeatures || {};
        
        // Build features object with all features set to disabled except enabled ones
        const allFeatures = {
          ticketing: enabledFeatures.ticketing ? { ...enabledFeatures.ticketing } : { enabled: false },
          qrCheckIn: enabledFeatures.qrCheckIn ? { ...enabledFeatures.qrCheckIn } : { enabled: false },
          scannerApp: enabledFeatures.scannerApp ? { ...enabledFeatures.scannerApp } : { enabled: false },
          analytics: enabledFeatures.analytics ? { ...enabledFeatures.analytics } : { enabled: false },
          emailSms: enabledFeatures.emailSms ? { ...enabledFeatures.emailSms } : { enabled: false },
          payments: enabledFeatures.payments ? { ...enabledFeatures.payments } : { enabled: false },
          weatherAlerts: enabledFeatures.weatherAlerts ? { ...enabledFeatures.weatherAlerts } : { enabled: false },
          subAdmins: enabledFeatures.subAdmins ? { ...enabledFeatures.subAdmins } : { enabled: false },
          reports: enabledFeatures.reports ? { ...enabledFeatures.reports } : { enabled: false }
        };
        
        setFeatures(allFeatures);
        
        // If ticketing is disabled, show error message
        if (allFeatures?.ticketing?.enabled === false) {
          setError('Ticketing is not available for this event');
        }
      } catch (err) {
        console.error('Failed to fetch features:', err);
        // If fetch fails (no auth/401), check at submission time
        // Default to enabled if fetch fails (graceful degradation)
        setFeatures({ ticketing: { enabled: true } });
      } finally {
        setLoadingFeatures(false);
      }
    };
    fetchFeatures();
  }, [id, navigate]);

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

    API.get('/config/public')
      .then(res => {
        const limit = Number(res.data?.ticketLimits?.maxPerUser)
        setMaxPerUser(Number.isFinite(limit) ? limit : null)
      })
      .catch(() => {
        setMaxPerUser(null)
      })

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

  if(loading) return <LoadingSpinner message="Loading booking details..." />
  if(!event) return <div className="text-center p-10">{error || 'Event not found'}</div>

  // Check if ticketing feature is disabled
  if (features?.ticketing?.enabled === false) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 py-12 ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
        <div className={`max-w-xl w-full rounded-2xl shadow-lg border transition-colors ${isDarkMode ? 'bg-black border-white/10' : 'bg-white border-gray-200'}`}>
          <div className={`flex items-center gap-3 px-6 py-5 rounded-t-2xl ${isDarkMode ? 'bg-yellow-700' : 'bg-yellow-600'}`}>
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-white font-semibold">Ticketing Not Available</div>
          </div>
          <div className="px-6 py-5 text-sm">
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Ticket sales are currently disabled for this event. Please contact the organizer for more information.</p>
            <div className="mt-4 flex justify-center">
              <Link to={`/event/${id}`} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600 border border-gray-600' : 'bg-indigo-600 text-white hover:bg-indigo-500 border border-indigo-600'}`}>
                Back to Event
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Check sold out - all ticket types are sold out (but not if array is empty)
  const isSoldOut = event.ticketTypes && event.ticketTypes.length > 0 && event.ticketTypes.every(t => (t.available ?? 0) === 0)

  if(isSoldOut) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 py-12 ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
        <div className={`max-w-xl w-full rounded-2xl shadow-lg border transition-colors ${isDarkMode ? 'bg-black border-white/10' : 'bg-white border-gray-200'}`}>
          <div className={`flex items-center gap-3 px-6 py-5 rounded-t-2xl ${isDarkMode ? 'bg-red-700' : 'bg-blue-600'}`}>
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            </svg>
            <div className="text-white font-semibold">This event is sold out.</div>
          </div>
          <div className="px-6 py-5 text-sm">
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>All ticket types are currently unavailable. Please check back later or explore other events.</p>
            <div className="mt-4 flex justify-center">
              <Link to="/events" className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600 border border-gray-600' : 'bg-indigo-600 text-white hover:bg-indigo-500 border border-indigo-600'}`}>
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
    
    // Only require ticket type selection if event has ticket types
    if(hasTicketTypes && !selectedTicketType) {
      setBookingLoading(false)
      return setError('Please select a ticket type')
    }
    
    
    // Check if event has seat layout
    const hasSeatLayout = event && isFinite(event.capacity) && event.capacity > 0
    
    if(quantity < 1) {
      setBookingLoading(false)
      return setError('Quantity must be at least 1')
    }
    if(maxPerUser && quantity > maxPerUser) {
      setBookingLoading(false)
      return setError(`Maximum ${maxPerUser} tickets per user for this event`)
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
        // Validate required fields before sending
        if (!event.id) {
          console.error('[BOOKING] Invalid event ID:', event.id)
          setError('Error: Invalid event ID. Please reload the page.')
          setBookingLoading(false)
          return
        }
        
        if (typeof quantity !== 'number' || quantity < 1) {
          console.error('[BOOKING] Invalid quantity:', quantity, typeof quantity)
          setError('Error: Invalid quantity. Please check your selection.')
          setBookingLoading(false)
          return
        }
        
        const payload = { 
          eventId: event.id, 
          quantity: Number(quantity),
          ...(selectedTicketType && { ticketTypeId: selectedTicketType._id })
        }
        if (hasSeatLayout && selectedSeats.length > 0) payload.seats = selectedSeats.map(Number)
        
        // Log payload for debugging
        console.log('[BOOKING] Sending payload:', payload)
        console.log('[BOOKING] Event has ticket types:', hasTicketTypes)
        console.log('[BOOKING] Selected ticket type:', selectedTicketType)
        
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
        console.error('Response status:', err.response?.status)
        console.error('Response data:', err.response?.data)
        
        const errorMsg = err.response?.data?.message || err.message
        const feature = err.response?.data?.feature
        setBookingLoading(false)
        
        // If auth error, clear invalid token and redirect to login
        if (err.response?.status === 401) {
          localStorage.removeItem('token')
          setError('Please log in to book tickets')
          setTimeout(() => navigate('/login', { state: { from: location.pathname } }), 2000)
          return
        }
        
        // If ticketing feature is disabled
        if (err.response?.status === 403 && feature === 'ticketing') {
          setError('Ticketing is currently disabled for this event')
          setTimeout(() => navigate(`/event/${id}`), 2000)
          return
        }
        
        // For 400 errors, provide helpful feedback
        if (err.response?.status === 400) {
          setError(`${errorMsg || 'Invalid booking data. Please check that you have selected all required fields.'}`)
          return
        }
        
        // For other errors, show message
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


    <div className={`min-h-screen py-4 sm:py-8 px-2 sm:px-0 font-[Inter,Poppins,sans-serif] ${isDarkMode ? 'bg-black' : 'bg-gray-50'} animate-fadein`}> 
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* 1️⃣ Event Header Section */}
        <div className={`rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${isDarkMode ? 'bg-gradient-to-r from-red-700 to-red-600' : 'bg-gradient-to-r from-indigo-600 to-blue-500'}`}> 
          <div className="p-6 sm:p-8 flex flex-col gap-2 sm:gap-4">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 sm:mb-2 text-white">{event.title}</h2>
            <div className="flex flex-wrap gap-4 text-sm sm:text-base">
              <div className="flex items-center gap-2 text-white/90">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {new Date(event.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {event.location}
              </div>
            </div>
          </div>
        </div>

        {/* 2️⃣ Main Card: User Info, Ticket, Quantity, Summary, Buttons */}
        <form onSubmit={handleSubmit} className={`w-full rounded-xl shadow-sm ${isDarkMode ? 'bg-black' : 'bg-white'} p-4 sm:p-8 flex flex-col gap-6 transition-all duration-300 animate-fadein border ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}> 
          {/* 2️⃣ User Information Section */}
          <div className="flex flex-col gap-4">
            <h3 className={`text-base font-semibold ${isDarkMode ? 'text-red-400' : 'text-indigo-600'} mb-1`}>Your Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Floating label input */}
              <div className="relative group">
                <input required value={name} onChange={e=>setName(e.target.value)} id="name" className={`peer w-full px-4 pt-6 pb-2 rounded-lg text-base font-medium transition-all duration-300 outline-none focus:ring-2 ${isDarkMode ? 'bg-black border border-zinc-700 text-white placeholder-transparent focus:ring-red-500 focus:border-red-500' : 'bg-white border border-gray-300 text-gray-900 placeholder-transparent focus:ring-indigo-500 focus:border-indigo-500'} `} placeholder=" " autoComplete="off" />
                <label htmlFor="name" className={`absolute left-4 top-2 text-sm font-medium pointer-events-none transition-all duration-300 origin-left peer-placeholder-shown:top-5 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-sm ${isDarkMode ? 'text-zinc-400 peer-focus:text-red-400' : 'text-gray-400 peer-focus:text-indigo-400'}`}>Full Name *</label>
              </div>
              <div className="relative group">
                <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} id="email" className={`peer w-full px-4 pt-6 pb-2 rounded-lg text-base font-medium transition-all duration-300 outline-none focus:ring-2 ${isDarkMode ? 'bg-black border border-zinc-700 text-white placeholder-transparent focus:ring-red-500 focus:border-red-500' : 'bg-white border border-gray-300 text-gray-900 placeholder-transparent focus:ring-indigo-500 focus:border-indigo-500'} `} placeholder=" " autoComplete="off" />
                <label htmlFor="email" className={`absolute left-4 top-2 text-sm font-medium pointer-events-none transition-all duration-300 origin-left peer-placeholder-shown:top-5 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-sm ${isDarkMode ? 'text-zinc-400 peer-focus:text-red-400' : 'text-gray-400 peer-focus:text-indigo-400'}`}>Email Address *</label>
              </div>
            </div>
          </div>

          {/* 3️⃣ Ticket Selection */}
          {hasTicketTypes && (
            <div className="flex flex-col gap-2">
              <h3 className={`text-base font-semibold ${isDarkMode ? 'text-red-400' : 'text-indigo-600'} mb-1`}>Ticket Type</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {event.ticketTypes.map((ticketType, idx) => (
                  <label key={idx} className={`relative flex flex-col gap-2 p-4 rounded-lg cursor-pointer transition-all duration-200 ${isDarkMode ? 'bg-black border border-white/10' : 'bg-gray-50 border border-gray-300'} ${selectedTicketType?.name === ticketType.name ? (isDarkMode ? 'ring-2 ring-red-600 border-red-600 bg-black' : 'ring-2 ring-indigo-500 border-indigo-500 shadow-md bg-indigo-50') : (isDarkMode ? 'hover:border-red-400 hover:bg-black' : 'hover:shadow-sm hover:border-indigo-400')}`}> 
                    <input type="radio" name="ticketType" checked={selectedTicketType?.name === ticketType.name} onChange={() => setSelectedTicketType(ticketType)} className={`absolute top-3 right-3 w-5 h-5 ${isDarkMode ? 'accent-red-600' : 'accent-indigo-600'}`} required />
                    <div className="flex flex-col gap-1">
                      <span className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{ticketType.name}</span>
                      {ticketType.description && (<span className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>{ticketType.description}</span>)}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatINR(ticketType.price)}</span>
                      <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${isDarkMode ? 'bg-zinc-700 text-zinc-300' : 'bg-indigo-100 text-indigo-700'}`}>{ticketType.available} left</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 4️⃣ Quantity Selector */}
          {(!hasTicketTypes || selectedTicketType) && (
            <div className="flex flex-col gap-2">
              <h3 className={`text-base font-semibold ${isDarkMode ? 'text-red-400' : 'text-indigo-600'} mb-1`}>Select Tickets</h3>
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 ${isDarkMode ? 'bg-black' : 'bg-gray-100'} rounded-lg px-3 py-2 border ${isDarkMode ? 'border-zinc-700' : 'border-gray-300'}`}>
                  <button type="button" aria-label="Decrease" onClick={()=>setQuantity(q=>Math.max(1, q-1))} disabled={quantity<=1} className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-lg transition-all duration-200 focus:outline-none ${quantity<=1 ? 'opacity-40 cursor-not-allowed' : isDarkMode ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}>-</button>
                  <span className="w-8 text-center text-lg font-semibold select-none">{quantity}</span>
                  <button type="button" aria-label="Increase" onClick={()=>setQuantity(q=>{const maxLimit=Number.isFinite(maxPerUser)&&maxPerUser>0?maxPerUser:null;const maxSelectable=available===Infinity?(maxLimit||Infinity):(maxLimit?Math.min(available,maxLimit):available);return Math.min(q+1,maxSelectable)})} disabled={(() => {const maxLimit=Number.isFinite(maxPerUser)&&maxPerUser>0?maxPerUser:null;const maxSelectable=available===Infinity?(maxLimit||Infinity):(maxLimit?Math.min(available,maxLimit):available);return quantity>=maxSelectable})()} className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-lg transition-all duration-200 focus:outline-none ${(() => {const maxLimit=Number.isFinite(maxPerUser)&&maxPerUser>0?maxPerUser:null;const maxSelectable=available===Infinity?(maxLimit||Infinity):(maxLimit?Math.min(available,maxLimit):available);return quantity>=maxSelectable})() ? 'opacity-40 cursor-not-allowed' : isDarkMode ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}>+</button>
                </div>
                <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${isDarkMode ? 'bg-red-900/50 text-red-300' : 'bg-indigo-100 text-indigo-700'}`}>{available===Infinity?'∞':available} Tickets Left</span>
              </div>
              {Number.isFinite(maxPerUser)&&maxPerUser>0 && (<span className={`text-xs mt-1 ${isDarkMode?'text-zinc-400':'text-gray-500'}`}>Max per user: {maxPerUser}</span>)}
            </div>
          )}

          {/* 5️⃣ Price Summary Card */}
          {(!hasTicketTypes || selectedTicketType) && (
            <div className={`rounded-lg p-5 mt-2 ${isDarkMode ? 'bg-black' : 'bg-gray-100'} flex flex-col gap-3 transition-all duration-300 border ${isDarkMode ? 'border-zinc-700' : 'border-gray-300'}`}> 
              <div className="flex items-center justify-between text-base font-medium">
                <span className={isDarkMode?'text-gray-400':'text-gray-600'}>Subtotal</span>
                <span className={isDarkMode?'text-white':'text-gray-900'}>{formatINR(subTotal)}</span>
              </div>
              {discountAmount>0 && (<div className="flex items-center justify-between text-base font-medium"><span className={isDarkMode?'text-green-400':'text-green-700'}>Discount</span><span className={isDarkMode?'text-green-200':'text-green-700'}>-{formatINR(discountAmount)}</span></div>)}
              <div className={`border-t ${isDarkMode ? 'border-zinc-700' : 'border-gray-300'} my-2`}></div>
              <div className="flex items-center justify-between text-lg font-bold">
                <span className={isDarkMode?'text-white':'text-gray-900'}>Total</span>
                <span className={isDarkMode?'text-white':'text-gray-900'}>{formatINR(finalTotal)}</span>
              </div>
            </div>
          )}

          {/* 6️⃣ Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Link to={`/event/${event.id}`} className={`flex-1 px-4 py-3 rounded-lg font-medium text-center transition-all duration-200 outline-none ${isDarkMode ? 'bg-zinc-700 text-white hover:bg-zinc-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>← Back to Event</Link>
            <button type="submit" disabled={bookingLoading||loadingFeatures||(hasTicketTypes&&!selectedTicketType)||features?.ticketing?.enabled===false} className={`flex-1 px-4 py-3 rounded-lg font-semibold text-white shadow-lg transition-all duration-200 outline-none flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${isDarkMode ? 'bg-red-600 hover:bg-red-500 shadow-red-500/30' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-400/40'}`}>
              {bookingLoading||loadingFeatures ? (<><svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>Processing...</>) : 'Confirm Booking →'}
            </button>
          </div>
        </form>

        {/* 7️⃣ Seat Selection (if any) */}
        {hasSeatLayout && (
          <div className={`rounded-xl shadow-lg overflow-hidden ${isDarkMode ? 'bg-black' : 'bg-white'} p-4 sm:p-8 mt-4 border ${isDarkMode ? 'border-red-900' : 'border-gray-200'} animate-fadein`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-red-400' : 'text-indigo-700'}`}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>Choose Your Seats</h3>
            <div className="mb-4">
              <div className={`text-center font-bold text-base sm:text-lg mb-2 ${isDarkMode ? 'text-red-300' : 'text-indigo-900'}`}>🎬 SCREEN 🎬</div>
              <div className={`h-1 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-400'} rounded-full`}></div>
            </div>
            <div className={`p-4 rounded-xl transition-colors ${isDarkMode ? 'bg-black' : 'bg-gray-50'} border ${isDarkMode ? 'border-zinc-700' : 'border-gray-300'}`}>
              <div className={`text-xs sm:text-sm font-medium mb-4 text-center transition-colors ${isDarkMode ? 'text-red-300' : 'text-indigo-700'}`}>Select {Number(quantity)} seat(s) • {selectedSeats.length} selected</div>
              {/* Seat Legend */}
              <div className={`mb-4 p-3 rounded-lg border transition-colors flex flex-wrap justify-center gap-4 ${isDarkMode ? 'bg-black border-white/10' : 'bg-white border-gray-300'}`}>
                <div className="flex items-center gap-2"><div className={`w-6 h-6 rounded border-2 ${isDarkMode ? 'bg-zinc-700 border-zinc-500' : 'bg-white border-gray-400'}`}></div><span className={isDarkMode ? 'text-zinc-300' : 'text-gray-700'}>Available</span></div>
                <div className="flex items-center gap-2"><div className={`w-6 h-6 rounded border-2 ${isDarkMode ? 'bg-red-600 border-red-500' : 'bg-indigo-500 border-indigo-400'}`}></div><span className={isDarkMode ? 'text-zinc-300' : 'text-gray-700'}>Selected</span></div>
                <div className="flex items-center gap-2"><div className={`w-6 h-6 rounded border-2 ${isDarkMode ? 'bg-black/40 border-zinc-600' : 'bg-gray-300 border-gray-400'} cursor-not-allowed opacity-50`}></div><span className={isDarkMode ? 'text-zinc-500' : 'text-gray-600'}>Booked</span></div>
              </div>
              <SeatPicker layout={generateSeatLayout(event.capacity, 10)} booked={bookedSeatsFromDB} selected={selectedSeats} maxSelectable={quantity} onToggle={setSelectedSeats} isDarkMode={isDarkMode} />
            </div>
            <div className="mt-4">
              <div className={`h-1 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-400'} rounded-full mb-2`}></div>
              <div className={`text-center font-medium text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Ground Level</div>
            </div>
            {/* Selected Seats Display */}
            {selectedSeats.length > 0 && (
              <div className={`mt-4 p-4 rounded-lg ${isDarkMode ? 'bg-red-900/30 text-red-200' : 'bg-indigo-50 text-indigo-900'}`}>
                <p className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-red-300' : 'text-indigo-700'}`}>✓ Your Selected Seats ({selectedSeats.length}/{quantity})</p>
                <div className="flex flex-wrap gap-2">
                  {selectedSeats.map(seat => (<span key={seat} className={`px-4 py-2 rounded-lg text-sm font-semibold ${isDarkMode ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white'}`}>{seat}</span>))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


