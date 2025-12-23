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
  if(!event || typeof event.capacity !== 'number') return Infinity
  const booked = totalBookedForEvent(event.id)
  return Math.max(0, event.capacity - booked)
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
