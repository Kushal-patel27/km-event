import React from 'react'
import { Link } from 'react-router-dom'
import { seatsAvailable } from '../utils/bookings'
import { getEventImage } from '../utils/images'
import formatINR from '../utils/currency'

export default function EventCard({event}){
  const available = seatsAvailable(event)
  const eventId = event._id || event.id

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden transform transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative">
        <img src={getEventImage(event)} alt={event.title} className="h-48 w-full object-cover" />
        <div className="absolute top-3 left-3 bg-indigo-600 text-white text-xs font-semibold px-2 py-1 rounded-md">{event.category || 'Event'}</div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800">{event.title}</h3>
            <p className="text-sm text-gray-500">{new Date(event.date).toDateString()} • {event.location}</p>
            <p className="mt-2 text-sm text-gray-700 line-clamp-2">{event.description}</p>
          </div>
          <div className="text-right">
            <div className="text-indigo-600 font-bold text-lg">{formatINR(event.price)}</div>
            <div className="text-sm text-gray-500">{available === Infinity ? 'Available' : available > 0 ? `${available} left` : 'Sold out'}</div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
            <Link to={`/event/${eventId}`} className="text-sm text-gray-600 hover:underline">Details</Link>
          <Link to={`/book/${eventId}`} className={`inline-block text-sm px-4 py-2 rounded-md ${available>0? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white' : 'bg-gray-200 text-gray-500 pointer-events-none'}`}>Book</Link>
        </div>
      </div>
    </div>
  )
}
