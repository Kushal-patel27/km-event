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
      <div className="relative w-full aspect-video overflow-hidden">
        <img src={getEventImage(event)} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute top-3 left-3 bg-indigo-600 text-white text-xs font-semibold px-2 py-1 rounded-md">{event.category || 'Event'}</div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{event.title}</h3>
        
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date(event.date).toDateString()}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {event.location}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <div>
            <div className="text-indigo-600 font-bold text-xl">{formatINR(event.price)}</div>
            <Link to={`/event/${eventId}`} className="text-xs text-gray-600 hover:text-indigo-600 hover:underline">More details →</Link>
          </div>
          <Link to={`/book/${eventId}`} className={`inline-block text-sm px-4 py-2 rounded-md ${available>0? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white hover:shadow-md' : 'bg-gray-200 text-gray-500 pointer-events-none'}`}>
            {available > 0 ? 'Book Now' : 'Sold Out'}
          </Link>
        </div>
      </div>
    </div>
  )
}
