import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import formatINR from "../utils/currency";
import { getEventImage } from "../utils/images";
import { seatsAvailable } from "../utils/bookings";

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    let mounted = true;
    setFetching(true);
    API.get(`/events/${id}`)
      .then((res) => {
        if (!mounted) return;
        const e = res.data;
        const normalized = {
          ...e,
          id: e.id || e._id,
          capacity: e.capacity ?? e.totalTickets ?? 0,
          availableTickets: e.availableTickets ?? e.totalTickets ?? 0,
        };
        setEvent(normalized);
      })
      .catch(() => alert("Failed to load event"))
      .finally(() => mounted && setFetching(false));

    return () => (mounted = false);
  }, [id]);

  if (fetching) return <div className="text-center mt-10">Loading event...</div>;
  if (!event) return <div className="text-center mt-10">Event not found</div>;

  const eventId = event._id || event.id;
  const available = seatsAvailable(event);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-[#161A23]/80 backdrop-blur-xl rounded-2xl shadow-lg overflow-hidden border border-white/10">
          {/* Image */}
          <div className="relative w-full aspect-video overflow-hidden">
            <img
              src={event.image || getEventImage(event) || "/event-placeholder.jpg"}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            {event.category && (
              <div className="absolute top-4 left-4 bg-red-600 text-white text-sm font-semibold px-3 py-1.5 rounded-lg shadow-lg">
                {event.category}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-8">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">{event.title}</h1>

            {/* Date & Location */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center text-gray-300">
                <svg className="w-5 h-5 mr-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(event.date).toLocaleString('en-US', { 
                  weekday: 'short', 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              <div className="flex items-center text-gray-300">
                <svg className="w-5 h-5 mr-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {event.location}
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 mb-6 pb-6 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-400">Capacity:</span>
                <span className="text-sm text-white font-semibold">{event.capacity}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-400">Available:</span>
                <span className="text-sm text-red-500 font-semibold">{available === Infinity ? 'Open' : available}</span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-3">About this event</h2>
              <p className="text-gray-300 leading-relaxed">{event.description}</p>
            </div>

            {/* Price & Book Button */}
            <div className="flex items-center justify-between pt-6 border-t border-white/10">
              <div>
                <div className="text-sm text-gray-400 mb-1">Price per ticket</div>
                <div className="text-3xl font-bold text-red-500">{formatINR(event.price)}</div>
              </div>

              <button
                onClick={() => navigate(`/book/${eventId}`)}
                disabled={available === 0}
                className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {available === 0 ? "Sold Out" : "Book Tickets"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
