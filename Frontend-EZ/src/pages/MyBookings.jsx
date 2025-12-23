import React, {useEffect, useState} from 'react'
import events from '../data/events'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import formatINR from '../utils/currency'
import Ticket from '../components/Ticket'

export default function MyBookings(){
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [viewTicket, setViewTicket] = useState(null)

  useEffect(()=>{
    const stored = JSON.parse(localStorage.getItem('bookings') || '[]')
    if(user && user.email){
      const mine = stored.filter(b => String(b.email).toLowerCase() === String(user.email).toLowerCase())
      setBookings(mine)
    } else {
      setBookings([])
    }
  },[user])

  if(!user) return (
    <div className="max-w-2xl mx-auto text-center">
      Please <Link to="/login" className="text-indigo-600">log in</Link> to view your bookings.
    </div>
  )

  if(bookings.length === 0) return <div className="max-w-2xl mx-auto text-center">You have no bookings yet. <Link to="/events" className="text-indigo-600">Browse events</Link></div>

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Bookings</h1>
      <div className="space-y-4">
        {bookings.map(b => {
          const event = events.find(e => e.id === b.eventId) || {title: 'Unknown event', price: 0}
          const isViewing = viewTicket === b.id

          return (
            <div key={b.id} className="bg-white border p-4 rounded shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-lg">{event.title}</div>
                  <div className="text-sm text-gray-500">{b.quantity} × {formatINR(event.price ?? event.price)} — {b.name}</div>
                  {b.seats && b.seats.length>0 && (
                    <div className="text-sm text-gray-600 mt-1">Seats: {b.seats.join(', ')}</div>
                  )}
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <div className="font-bold text-indigo-600">{formatINR(b.total)}</div>
                  <button 
                    onClick={() => setViewTicket(isViewing ? null : b.id)}
                    className="text-sm px-3 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition font-medium"
                  >
                    {isViewing ? 'Hide Ticket' : 'View Ticket'}
                  </button>
                </div>
              </div>
              
              {isViewing && (
                <div className="mt-6 border-t pt-6">
                  <Ticket booking={{
                    id: b.id,
                    event,
                    user: { name: b.name, email: b.email, id: b.email },
                    seats: b.seats, // Pass the array if it exists
                    quantity: b.quantity, // Pass quantity as fallback
                    date: event.date
                  }} />
                  <div className="text-center mt-4">
                    <button onClick={() => window.print()} className="text-sm text-gray-500 hover:text-gray-900 underline">
                      Print Ticket
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
