export function getAllBookings(){
  return JSON.parse(localStorage.getItem('bookings') || '[]')
}

export function getBookingsForEvent(eventId){
  const all = getAllBookings()
  return all.filter(b => String(b.eventId) === String(eventId))
}

export function totalBookedForEvent(eventId){
  return getBookingsForEvent(eventId).reduce((s, b) => s + (Number(b.quantity) || 0), 0)
}

export function seatsAvailable(event){
  if(!event) return Infinity
  // If ticket types exist, sum their available counts as source of truth
  if (Array.isArray(event.ticketTypes) && event.ticketTypes.length > 0) {
    const typeAvail = event.ticketTypes.reduce((sum, t) => sum + (Number(t.available) || 0), 0)
    return Math.max(0, typeAvail)
  }

  const avail = Number(event.availableTickets)
  if(!Number.isNaN(avail)) return avail
  const cap = Number(event.capacity)
  if(!Number.isNaN(cap)){
    const booked = totalBookedForEvent(event.id)
    return Math.max(0, cap - booked)
  }
  return Infinity
}

export function getBookedSeatsForEvent(eventId){
  const bookings = getBookingsForEvent(eventId)
  const seats = []
  bookings.forEach(b => {
    if(Array.isArray(b.seats)) seats.push(...b.seats.map(s => Number(s)))
  })
  return seats
}

export function isSeatTaken(eventId, seatNumber){
  const seats = getBookedSeatsForEvent(eventId)
  return seats.includes(Number(seatNumber))
}

export function generateSeatLayout(capacity, columns = 10){
  const rows = Math.ceil(capacity / columns)
  const layout = []
  let seat = 1
  for(let r=0;r<rows;r++){
    const row = []
    for(let c=0;c<columns;c++){
      if(seat > capacity) break
      row.push(seat)
      seat++
    }
    layout.push(row)
  }
  return layout
}
