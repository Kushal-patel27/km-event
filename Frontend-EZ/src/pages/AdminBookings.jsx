import React, {useEffect, useState} from 'react'
import { getAllBookings } from '../utils/bookings'
import formatINR from '../utils/currency'

export default function AdminBookings(){
  const [bookings, setBookings] = useState([])

  useEffect(()=>{
    setBookings(getAllBookings())
  }, [])

  function handleDelete(id){
    if(!confirm('Delete this booking?')) return
    const stored = JSON.parse(localStorage.getItem('bookings') || '[]').filter(b => String(b.id) !== String(id))
    localStorage.setItem('bookings', JSON.stringify(stored))
    setBookings(stored)
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">All Bookings</h2>
      <div className="space-y-2">
        {bookings.map(b => (
          <div key={b.id} className="bg-white border rounded p-3 flex justify-between items-center">
            <div>
              <div className="font-semibold">Event: {b.eventId}</div>
              <div className="text-sm text-gray-600">{b.quantity} × {formatINR(b.total / Math.max(1,b.quantity))} — {b.name} • {b.email}</div>
              {b.seats && b.seats.length>0 && <div className="text-sm text-gray-600">Seats: {b.seats.join(', ')}</div>}
            </div>
            <div className="flex flex-col gap-2">
              <div className="font-bold">{formatINR(b.total)}</div>
              <button onClick={()=>handleDelete(b.id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
