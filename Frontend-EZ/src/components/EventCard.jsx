import React from 'react'
import { Link } from 'react-router-dom'
import { seatsAvailable } from '../utils/bookings'
import { getEventImage } from '../utils/images'
import formatINR from '../utils/currency'

export default function EventCard({event}){
  const available = seatsAvailable(event)
  const eventId = event._id || event.id

  return (
    <div className="bg-[#161A23]/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden transform transition hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-500/20 border border-white/10">
      <div className="relative w-full aspect-video overflow-hidden group">
        <img src={getEventImage(event)} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 bg-red-600/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">{event.category || 'Event'}</div>
      </div>

      <div className="p-5">
        <h3 className="text-lg font-bold text-white mb-3 line-clamp-2">{event.title}</h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-400">
            <svg className="w-4 h-4 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date(event.date).toDateString()}
          </div>
          <div className="flex items-center text-sm text-gray-400">
            <svg className="w-4 h-4 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div>
            <div className="text-red-500 font-bold text-xl">{formatINR(event.price)}</div>
            <Link to={`/event/${eventId}`} className="text-xs text-gray-500 hover:text-red-400 hover:underline transition">View details →</Link>
          </div>
          <Link to={`/book/${eventId}`} className={`inline-block text-sm px-5 py-2.5 rounded-lg font-semibold transition-all ${available>0? 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:shadow-lg hover:shadow-red-500/40 hover:scale-105' : 'bg-gray-700 text-gray-400 pointer-events-none'}`}>
            {available > 0 ? 'Book Now' : 'Sold Out'}
          </Link>
        </div>
      </div>
    </div>
  )
}
