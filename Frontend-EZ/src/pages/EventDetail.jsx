import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import formatINR from "../utils/currency";
import { getEventImage } from "../utils/images";
import { seatsAvailable } from "../utils/bookings";
import { useDarkMode } from "../context/DarkModeContext";

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();

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

  if (fetching) return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-900 dark:text-white">Loading event...</div>;
  if (!event) return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-900 dark:text-white">Event not found</div>;

  const eventId = event._id || event.id;
  const available = seatsAvailable(event);

  return (
    <div className={`min-h-screen py-12 ${isDarkMode ? 'bg-[#0B0F19] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto px-6">
        <div className={`rounded-2xl shadow-lg overflow-hidden border ${isDarkMode ? 'bg-[#1a1f2e] border-white/10' : 'bg-white border-gray-200'}`}>
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
            <h1 className={`text-4xl md:text-5xl font-extrabold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{event.title}</h1>

            {/* Date & Location */}
            <div className="space-y-2 mb-6">
              <div className={`flex items-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
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
              <div className={`flex items-start ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="flex-1">
                  <div>{event.location}</div>
                  {event.locationDetails && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{event.locationDetails}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className={`mb-6 pb-6 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="flex flex-wrap gap-6">
                {event.ticketTypes && event.ticketTypes.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Capacity:</span>
                      <span className="text-sm text-gray-900 dark:text-white font-semibold">{event.ticketTypes.reduce((sum, t) => sum + Number(t.quantity), 0)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Available:</span>
                      <span className="text-sm text-red-600 dark:text-red-500 font-semibold">{available === Infinity ? 'Open' : available}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Capacity:</span>
                      <span className="text-sm text-gray-900 dark:text-white font-semibold">{event.capacity}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Available:</span>
                      <span className="text-sm text-red-600 dark:text-red-500 font-semibold">{available === Infinity ? 'Open' : available}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>About this event</h2>
              <p className={`leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{event.description}</p>
            </div>

            {/* Ticket Types */}
            {event.ticketTypes && event.ticketTypes.length > 0 && (
              <div className="mb-8">
                <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Available Ticket Types</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {event.ticketTypes.map((ticket, idx) => (
                    <div key={idx} className={`p-4 border rounded-lg hover:shadow-md transition ${isDarkMode ? 'bg-[#131826] border-white/10' : 'border-gray-200'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{ticket.name}</h3>
                          {ticket.description && (
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{ticket.description}</p>
                          )}
                        </div>
                      </div>
                      <div className={`flex items-center justify-between pt-3 border-t ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                        <span className={`text-2xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{formatINR(ticket.price)}</span>
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{ticket.available ?? ticket.quantity} available</span>
                      </div>
                    </div>
                  ))}
                </div>
                {event.ticketTypes.length > 0 && (
                  <div className={`mt-4 p-4 rounded-lg border ${isDarkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                      Price Range: {formatINR(Math.min(...event.ticketTypes.map(t => t.price)))} - {formatINR(Math.max(...event.ticketTypes.map(t => t.price)))}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Price & Book Button */}
            <div className={`flex items-center justify-between pt-6 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
              <div>
                {event.ticketTypes && event.ticketTypes.length > 0 ? (
                  <>
                    <div className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Price range</div>
                    <div className={`text-3xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                      {formatINR(Math.min(...event.ticketTypes.map(t => t.price)))} - {formatINR(Math.max(...event.ticketTypes.map(t => t.price)))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Price per ticket</div>
                    <div className={`text-3xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{formatINR(event.price)}</div>
                  </>
                )}
              </div>

              <button
                onClick={() => navigate(`/book/${eventId}`)}
                disabled={available === 0}
                className={`px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-white ${
                  isDarkMode
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
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
