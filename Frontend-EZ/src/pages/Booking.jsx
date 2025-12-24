import React, {useState, useEffect} from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import events from '../data/events'
import { seatsAvailable, getBookedSeatsForEvent, generateSeatLayout } from '../utils/bookings'
import SeatPicker from '../components/SeatPicker'
import formatINR from '../utils/currency'

export default function Booking(){
  const { id } = useParams()
  const navigate = useNavigate()
  const event = events.find(e => e.id === id)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [available, setAvailable] = useState(Infinity)
  const [error, setError] = useState('')
  const [selectSeats, setSelectSeats] = useState(false)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [offer, setOffer] = useState(null)
  const [idVerified, setIdVerified] = useState(false)

  const location = useLocation()

  useEffect(()=>{
    setAvailable(seatsAvailable(event))
  }, [event])

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
  const subTotal = event ? event.price * quantity : 0
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

  if(!event) return <div>Event not found</div>

  if(available === 0) return <div className="max-w-xl mx-auto bg-white p-6 rounded shadow text-center">This event is sold out.</div>

  function handleSubmit(e){
    e.preventDefault()
    setError('')
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
    <div className="max-w-xl mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold">Book: {event.title}</h2>
      <p className="text-sm text-gray-500">{event.date} • {event.location}</p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input required value={name} onChange={e=>setName(e.target.value)} className="mt-1 p-2 border rounded w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 p-2 border rounded w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Quantity</label>
          <input required type="number" min="1" max={available === Infinity ? undefined : available} value={quantity} onChange={e=>setQuantity(Number(e.target.value))} className="mt-1 p-2 border rounded w-24" />
          <div className="text-sm text-gray-500 mt-1">{available === Infinity ? 'Available' : `${available} seats available`}</div>
        </div>

        <div className="pt-2">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={selectSeats} onChange={e=>setSelectSeats(e.target.checked)} />
            <span className="text-sm">Select specific seats</span>
          </label>
        </div>

        {selectSeats && (
          <div className="pt-4">
            <div className="text-sm text-gray-600 mb-2">Choose {quantity} seat(s)</div>
            <SeatPicker layout={generateSeatLayout(event.capacity, 10)} booked={getBookedSeatsForEvent(event.id)} selected={selectedSeats} onToggle={setSelectedSeats} maxSelectable={Number(quantity)} />
          </div>
        )}

        {offer && (
          <div className={`p-3 rounded border ${isOfferValid ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex justify-between items-center">
              <span className={`font-bold ${isOfferValid ? 'text-green-800' : 'text-yellow-800'}`}>{offer.title}</span>
              {isOfferValid && <span className="text-green-700 font-bold">-{formatINR(discountAmount)}</span>}
            </div>
            <div className="text-sm mt-1 text-gray-600">{offerMessage}</div>
            
            {isOfferValid && offer.requiresId && (
              <div className="mt-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={idVerified} onChange={e => setIdVerified(e.target.checked)} className="rounded text-indigo-600" />
                  I confirm I have a valid Student ID
                </label>
              </div>
            )}
            <button type="button" onClick={() => {setOffer(null); sessionStorage.removeItem('appliedOffer')}} className="text-xs text-gray-500 underline mt-2 hover:text-gray-800">Remove Offer</button>
          </div>
        )}

        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="flex items-center justify-between mt-4">
          <div className="text-lg font-bold">Total: {formatINR(finalTotal)}
            {discountAmount > 0 && <span className="text-sm font-normal text-gray-400 line-through ml-2">{formatINR(subTotal)}</span>}
          </div>
          <div className="space-x-2">
            <Link to={`/event/${event.id}`} className="text-gray-600">Back</Link>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded">Confirm Booking</button>
          </div>
        </div>
      </form>
    </div>
  )
}
