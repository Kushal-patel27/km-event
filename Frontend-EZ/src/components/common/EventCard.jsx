import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { seatsAvailable } from '../../utils/bookings'
import { getEventImage } from '../../utils/images'
import formatINR from '../../utils/currency'
import { useDarkMode } from '../../context/DarkModeContext'

export default function EventCard({event}){
  const available = seatsAvailable(event)
  const eventId = event._id || event.id
  const { isDarkMode } = useDarkMode()
  const location = useLocation()
  const isHomePage = location.pathname === '/'
  
  // Force dark mode on home page for event cards
  const forceDark = isHomePage ? true : isDarkMode

  return (
    <div className={`backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden transform transition hover:-translate-y-2 border flex flex-col h-full ${
      forceDark
        ? 'bg-[#1a1f2e]/90 hover:shadow-2xl hover:shadow-red-500/30 border-white/15'
        : 'bg-white hover:shadow-2xl hover:shadow-indigo-200/50 border-gray-200'
    }`}>
      <div className="relative w-full aspect-video overflow-hidden group">
        <img src={getEventImage(event)} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        <div className={`absolute inset-0 bg-gradient-to-t ${forceDark ? 'from-black/60' : 'from-black/40'} via-transparent to-transparent`} />
        <div className={`absolute top-3 left-3 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full ${
          forceDark ? 'bg-red-600/95 shadow-lg shadow-red-600/30' : 'bg-indigo-600/95 shadow-lg shadow-indigo-600/30'
        }`}>{event.category || 'Event'}</div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <h3 className={`text-lg font-bold mb-3 line-clamp-2 ${forceDark ? 'text-white' : 'text-gray-900'}`}>{event.title}</h3>
        
        <div className="space-y-2 mb-4">
          <div className={`flex items-center text-sm ${forceDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <svg className={`w-4 h-4 mr-2 ${forceDark ? 'text-red-500' : 'text-indigo-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date(event.date).toDateString()}
          </div>
          <div className={`flex items-center text-sm ${forceDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <svg className={`w-4 h-4 mr-2 ${forceDark ? 'text-red-500' : 'text-indigo-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        <div className={`flex items-center justify-between gap-3 pt-4 border-t mt-auto ${forceDark ? 'border-white/15' : 'border-gray-200'}`}>
          <div>
            <div className={`font-bold text-xl ${forceDark ? 'text-red-500' : 'text-indigo-600'}`}>{formatINR(event.price)}</div>
            <Link to={`/event/${eventId}`} className={`text-xs ${forceDark ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-indigo-600'} hover:underline transition`}>View details →</Link>
          </div>
          <Link to={`/book/${eventId}`} className={`inline-flex items-center justify-center text-xs px-4 py-2 rounded-md font-semibold transition-all ${
            available > 0 
              ? forceDark
                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:shadow-md hover:shadow-red-500/40 hover:scale-[1.02]'
                : 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white hover:shadow-md hover:shadow-indigo-400/40 hover:scale-[1.02]'
              : forceDark
              ? 'bg-gray-400 text-gray-600 pointer-events-none'
              : 'bg-gray-300 text-gray-500 pointer-events-none'
          }`}>
            {available > 0 ? 'Book Now' : 'Sold Out'}
          </Link>
        </div>
      </div>
    </div>
  )
}
