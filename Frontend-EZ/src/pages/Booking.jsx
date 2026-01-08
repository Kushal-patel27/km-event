import React, {useState, useEffect} from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import API from '../services/api'
import { useAuth } from '../context/AuthContext'
import { seatsAvailable, getBookedSeatsForEvent, generateSeatLayout } from '../utils/bookings'
import SeatPicker from '../components/SeatPicker'
import formatINR from '../utils/currency'

export default function Booking(){
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const storedToken = localStorage.getItem('token')
  const [event, setEvent] = useState(null)
  const [name, setName] = useState(authUser?.name || '')
  const [email, setEmail] = useState(authUser?.email || '')
  const [quantity, setQuantity] = useState(1)
  const [available, setAvailable] = useState(Infinity)
  const [error, setError] = useState('')
  const [selectSeats, setSelectSeats] = useState(false)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [offer, setOffer] = useState(null)
  const [idVerified, setIdVerified] = useState(false)
  const [loading, setLoading] = useState(true)
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
    return <div className="max-w-xl mx-auto bg-white p-6 rounded shadow text-center">This event is sold out.</div>
  }

  const hasSeatLayout = event && isFinite(event.capacity) && event.capacity > 0

  async function handleSubmit(e){
    e.preventDefault()
    setError('')
    
    // Always require ticket type selection
    if(!selectedTicketType) {
      return setError('Please select a ticket type')
    }
    
    if(quantity < 1) return setError('Quantity must be at least 1')
    if(quantity > available) return setError(`Only ${available} seats are available`)
    
    if(selectSeats){
      if(selectedSeats.length !== Number(quantity)) return setError(`Please select ${quantity} seat(s)`) 
      // verify seats still free
      const bookedNow = getBookedSeatsForEvent(event.id)
      for(const s of selectedSeats){
        if(bookedNow.includes(Number(s))) return setError(`Seat ${s} was just taken. Please choose another.`)
      }
    }
    
    if (offer && isOfferValid && offer.requiresId && !idVerified) {
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
        if (selectSeats) payload.seats = selectedSeats.map(Number)
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
        // If auth error, clear invalid token and redirect to login
        if (err.response?.status === 401) {
          localStorage.removeItem('token')
          setError('Please log in to book tickets')
          setTimeout(() => navigate('/login', { state: { from: location.pathname } }), 2000)
          return
        }
        // For other errors, show message but allow fallback
        setError(`Booking failed: ${errorMsg}`)
        return // Don't fall back to local booking if backend fails with specific error
      }
    }

    // Local fallback for unauthenticated users or if backend fails
    const booking = { id: Date.now(), eventId: event.id, name, email, quantity, total: finalTotal, originalPrice: subTotal, discount: discountAmount, offerCode: (offer && isOfferValid) ? offer.code : null, seats: selectSeats ? selectedSeats.map(Number) : undefined }
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Event Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white p-6">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">{event.title}</h2>
            <div className="flex flex-wrap gap-4 text-sm opacity-90">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {event.location}
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            {/* Personal Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Your Information
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <input 
                    required 
                    value={name} 
                    onChange={e=>setName(e.target.value)} 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" 
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <input 
                    required 
                    type="email" 
                    value={email} 
                    onChange={e=>setEmail(e.target.value)} 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" 
                    placeholder="john@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Ticket Type Selection (if available) - Compact Version */}
            {hasTicketTypes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ticket Type *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {event.ticketTypes.map((ticketType, idx) => (
                    <label 
                      key={idx} 
                      className={`flex flex-col items-start p-2 cursor-pointer transition-all ${
                        selectedTicketType?.name === ticketType.name
                          ? 'bg-gray-50'
                          : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="radio"
                          name="ticketType"
                          checked={selectedTicketType?.name === ticketType.name}
                          onChange={() => setSelectedTicketType(ticketType)}
                          className="w-4 h-4 text-gray-600 flex-shrink-0"
                          required
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">{ticketType.name}</div>
                        </div>
                      </div>
                      {ticketType.description && (
                        <div className="text-xs text-gray-600 mt-1 ml-6">{ticketType.description}</div>
                      )}
                      <div className="mt-1 ml-6">
                        <div className="text-sm font-bold text-gray-900">{formatINR(ticketType.price)}</div>
                        <div className="text-xs text-gray-500">{ticketType.available} left</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Ticket Quantity - Only show if ticket type selected or no types */}
            {(!hasTicketTypes || selectedTicketType) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                Tickets
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Number of Tickets</label>
                  <input 
                    required 
                    type="number" 
                    min="1" 
                    max={available === Infinity ? undefined : available} 
                    value={quantity} 
                    onChange={e=>setQuantity(Number(e.target.value))} 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" 
                  />
                </div>
                <div className="flex-1 text-right pt-6">
                  <span className="inline-flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium">
                    {available === Infinity ? '∞ Available' : `${available} Left`}
                  </span>
                </div>
              </div>
            </div>
            )}

            {/* Seat Selection */}
            {hasSeatLayout && (
              <div className="border-t pt-6">
                <label className="inline-flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={selectSeats} 
                    onChange={e=>setSelectSeats(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 transition"
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition">Select specific seats</span>
                </label>
              </div>
            )}

            {selectSeats && (
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="text-sm text-gray-600 mb-4 font-medium">Choose {quantity} seat(s)</div>
                <SeatPicker 
                  layout={generateSeatLayout(event.capacity, 10)} 
                  booked={getBookedSeatsForEvent(event.id)} 
                  selected={selectedSeats} 
                  onToggle={setSelectedSeats} 
                  maxSelectable={Number(quantity)} 
                />
              </div>
            )}

            {/* Offer Display */}
            {offer && (
              <div className={`rounded-xl p-4 border-2 ${isOfferValid ? 'bg-green-50 border-green-300' : 'bg-yellow-50 border-yellow-300'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className={`font-bold text-lg ${isOfferValid ? 'text-green-800' : 'text-yellow-800'}`}>{offer.title}</div>
                    <div className="text-sm text-gray-600 mt-1">{offerMessage}</div>
                  </div>
                  {isOfferValid && <span className="text-green-700 font-bold text-xl">-{formatINR(discountAmount)}</span>}
                </div>
                
                {isOfferValid && offer.requiresId && (
                  <label className="flex items-center gap-3 mt-3 p-3 bg-white rounded-lg cursor-pointer border border-green-200">
                    <input 
                      type="checkbox" 
                      checked={idVerified} 
                      onChange={e => setIdVerified(e.target.checked)} 
                      className="w-4 h-4 rounded text-green-600" 
                    />
                    <span className="text-sm text-gray-700 font-medium">I confirm I have a valid Student ID</span>
                  </label>
                )}
                <button 
                  type="button" 
                  onClick={() => {setOffer(null); sessionStorage.removeItem('appliedOffer')}} 
                  className="text-xs text-gray-500 underline mt-3 hover:text-gray-800 transition"
                >
                  Remove Offer
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Total & Actions */}
            <div className="border-t pt-6 space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-gray-600 font-medium">Subtotal</span>
                <span className="text-gray-900 font-semibold">{formatINR(subTotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-baseline justify-between text-green-600">
                  <span className="font-medium">Discount</span>
                  <span className="font-semibold">-{formatINR(discountAmount)}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between text-2xl pt-3 border-t">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-indigo-600">{formatINR(finalTotal)}</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Link 
                to={`/event/${event.id}`} 
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition text-center"
              >
                ← Back to Event
              </Link>
              <button 
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition"
              >
                Confirm Booking →
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
