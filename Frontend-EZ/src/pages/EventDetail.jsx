import React from 'react'
import { useParams, Link } from 'react-router-dom'
import events from '../data/events'
import { seatsAvailable } from '../utils/bookings'
import { getEventImage } from '../utils/images'
import formatINR from '../utils/currency'

export default function EventDetail(){
  const { id } = useParams()
  const event = events.find(e => e.id === id)
  if(!event) return <div>Event not found</div>

  return (
    <div className="max-w-3xl mx-auto">
      <img src={getEventImage(event)} alt={event.title} className="w-full h-64 object-cover rounded mb-4" />
      <h1 className="text-2xl font-bold">{event.title}</h1>
      <p className="text-sm text-gray-500">{event.date} • {event.location}</p>
      <div className="mt-2">
        <span className="text-sm font-medium">Capacity:</span> <span className="text-sm text-gray-600">{event.capacity}</span>
        <span className="ml-4 text-sm font-medium">Available:</span> <span className="text-sm text-indigo-600">{seatsAvailable(event)}</span>
      </div>
      <p className="mt-4">{event.description}</p>
      <div className="mt-6 flex items-center justify-between">
        <div className="text-lg font-bold">{formatINR(event.price)}</div>
        <Link to={`/book/${event.id}`} className="bg-indigo-600 text-white px-4 py-2 rounded">Book Tickets</Link>
      </div>
    </div>
  )
}
