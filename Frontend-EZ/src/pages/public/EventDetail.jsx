import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../../services/api";
import formatINR from "../../utils/currency";
import { getEventImage } from "../../utils/images";
import { seatsAvailable } from "../../utils/bookings";
import { useDarkMode } from "../../context/DarkModeContext";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [features, setFeatures] = useState(null);
  const [loadingFeatures, setLoadingFeatures] = useState(true);
  const [waitlistStatus, setWaitlistStatus] = useState(null);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);

  const getMapUrl = (eventData) => {
    if (eventData?.mapLink && eventData.mapLink.trim()) {
      return eventData.mapLink.trim();
    }
    const query = [eventData?.location, eventData?.locationDetails].filter(Boolean).join(' ');
    if (!query) return '';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

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

  // Fetch event features
  useEffect(() => {
    if (!id) return;
    const fetchFeatures = async () => {
      try {
        setLoadingFeatures(true);
        const res = await API.get(`/event-requests/${id}/enabled-features`);
        setFeatures(res.data.features || {});
      } catch (err) {
        console.error('Failed to fetch features:', err);
        // Default to all enabled if fetch fails
        setFeatures({ ticketing: { enabled: true } });
      } finally {
        setLoadingFeatures(false);
      }
    };
    fetchFeatures();
  }, [id]);

  // Check waitlist status
  useEffect(() => {
    if (!id || !user) return;
    const checkWaitlistStatus = async () => {
      try {
        const res = await API.get('/waitlist/my-waitlist');
        const onWaitlist = res.data.waitlist.find(
          w => w.event._id === id && (w.status === 'waiting' || w.status === 'notified')
        );
        setWaitlistStatus(onWaitlist || null);
      } catch (err) {
        console.error('Failed to check waitlist:', err);
      }
    };
    checkWaitlistStatus();
  }, [id, user]);

  const handleJoinWaitlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!event || !event.ticketTypes || event.ticketTypes.length === 0) {
      alert('Cannot join waitlist: Event ticket information is not available.');
      return;
    }

    try {
      setJoiningWaitlist(true);
      
      // Get first available ticket type
      const ticketType = event.ticketTypes[0]?.name;
      
      if (!ticketType) {
        alert('Cannot join waitlist: No valid ticket type found.');
        return;
      }

      console.log('Joining waitlist with:', { eventId: id, ticketType, quantity: 1 });
      
      const response = await API.post('/waitlist/join', {
        eventId: id,
        ticketType: ticketType,
        quantity: 1
      });

      alert('Successfully joined waitlist! We\'ll notify you when tickets become available.');
      
      // Refresh waitlist status
      const res = await API.get('/waitlist/my-waitlist');
      const onWaitlist = res.data.waitlist.find(
        w => w.event && w.event._id === id && (w.status === 'waiting' || w.status === 'notified')
      );
      setWaitlistStatus(onWaitlist || null);
    } catch (err) {
      console.error('Failed to join waitlist:', err);
      console.error('Error response:', err.response?.data);
      alert(err.response?.data?.message || 'Failed to join waitlist. Please try again.');
    } finally {
      setJoiningWaitlist(false);
    }
  };

  if (fetching) return <LoadingSpinner message="Loading event..." />;
  if (!event) return <div className="min-h-screen bg-black dark:bg-black flex items-center justify-center text-gray-900 dark:text-white">Event not found</div>;

  // Check if event has passed
  const eventDate = event.date ? new Date(event.date) : null;
  const hasEventPassed = eventDate && eventDate < new Date();

  if (hasEventPassed) {
    return (
      <div className={`min-h-screen py-12 ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="max-w-4xl mx-auto px-6">
          <div className={`rounded-2xl shadow-lg overflow-hidden border p-12 text-center ${isDarkMode ? 'bg-black border-white/10' : 'bg-white border-gray-200'}`}>
            <div className="text-6xl mb-4">📅</div>
            <h2 className="text-3xl font-bold mb-4">Event Has Ended</h2>
            <p className={`text-lg mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              This event took place on {eventDate.toLocaleDateString()}
            </p>
            <Link
              to="/events"
              className="inline-block px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
            >
              Browse Upcoming Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const eventId = event._id || event.id;
  const available = seatsAvailable(event);

  return (
    <div className={`min-h-screen py-6 sm:py-12 ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto px-3 sm:px-6">
        <div className={`rounded-2xl shadow-lg overflow-hidden border ${isDarkMode ? 'bg-black border-white/10' : 'bg-white border-gray-200'}`}>
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
          <div className="p-4 sm:p-6 md:p-8">
            <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-4 leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{event.title}</h1>

            {/* Date & Location */}
            <div className="space-y-2 mb-4 sm:mb-6">
              <div className={`flex items-center text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              <div className={`flex items-start text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 mt-0.5 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="flex-1">
                  <div className="flex items-start gap-2">
                    {getMapUrl(event) ? (
                      <a
                        href={getMapUrl(event)}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Open location in maps"
                        title="Open location in maps"
                        className={`text-xs sm:text-sm font-semibold underline underline-offset-4 transition ${isDarkMode ? 'text-white/90 hover:text-white' : 'text-gray-800 hover:text-gray-900'}`}
                      >
                        {event.location}
                      </a>
                    ) : (
                      <span className="flex-1">{event.location}</span>
                    )}
                  </div>
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
            <div className="mb-6 sm:mb-8">
              <h2 className={`text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>About this event</h2>
              <p className={`text-sm sm:text-base leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{event.description}</p>
            </div>

            {/* Ticket Types */}
            {event.ticketTypes && event.ticketTypes.length > 0 && (
              <div className="mb-6 sm:mb-8">
                <h2 className={`text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Available Ticket Types</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {event.ticketTypes.map((ticket, idx) => (
                    <div key={idx} className={`p-3 sm:p-4 border rounded-lg hover:shadow-md transition ${isDarkMode ? 'bg-black border-white/10' : 'border-gray-200'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className={`text-sm sm:text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{ticket.name}</h3>
                          {ticket.description && (
                            <p className={`text-xs sm:text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{ticket.description}</p>
                          )}
                        </div>
                      </div>
                      <div className={`flex items-center justify-between pt-2 sm:pt-3 border-t ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                        <span className={`text-lg sm:text-xl md:text-2xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{formatINR(ticket.price)}</span>
                        <span className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{ticket.available ?? ticket.quantity} available</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price & Book Button */}
            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 sm:pt-6 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
              <div>
                {event.ticketTypes && event.ticketTypes.length > 0 ? (
                  event.ticketTypes.length === 1 ? (
                    <>
                      <div className={`text-xs sm:text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Price per ticket</div>
                      <div className={`text-xl sm:text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{formatINR(event.ticketTypes[0].price)}</div>
                    </>
                  ) : (
                    <>
                      <div className={`text-xs sm:text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Price range</div>
                      <div className={`text-xl sm:text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                        {formatINR(Math.min(...event.ticketTypes.map(t => t.price)))} - {formatINR(Math.max(...event.ticketTypes.map(t => t.price)))}
                      </div>
                    </>
                  )
                ) : (
                  <>
                    <div className={`text-xs sm:text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Price per ticket</div>
                    <div className={`text-xl sm:text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{formatINR(event.price)}</div>
                  </>
                )}
              </div>

              {/* Check if ticketing feature is enabled */}
              {loadingFeatures ? (
                <div className={`px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold w-full sm:w-auto text-center ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
                  Loading...
                </div>
              ) : features?.ticketing?.enabled === false ? (
                <div className="flex flex-col items-end gap-2">
                  <div className={`px-6 py-3 rounded-lg border ${isDarkMode ? 'bg-yellow-900/20 border-yellow-800 text-yellow-300' : 'bg-yellow-50 border-yellow-300 text-yellow-900'}`}>
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="font-medium">Ticketing Not Available</span>
                    </div>
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-yellow-400/80' : 'text-yellow-800'}`}>
                      Ticket sales are currently disabled for this event
                    </p>
                  </div>
                  <Link
                    to="/for-organizers"
                    className="text-sm font-medium px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    Contact Event Organizer
                  </Link>
                </div>
              ) : available === 0 ? (
                <div className="flex flex-col gap-3 items-start w-full sm:w-auto">
                  <div className="px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold bg-gray-400 text-white cursor-not-allowed w-full sm:w-auto text-center">
                    Sold Out
                  </div>
                  {waitlistStatus ? (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      isDarkMode ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      <span>⏳</span>
                      <span className="text-sm">
                        {waitlistStatus.status === 'notified' ? (
                          <>You've been notified! Book now before it expires</>
                        ) : (
                          <>On Waitlist - Position #{waitlistStatus.currentPosition || '?'}</>
                        )}
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={handleJoinWaitlist}
                      disabled={joiningWaitlist || !event || !event.ticketTypes || event.ticketTypes.length === 0}
                      className={`px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto ${
                        isDarkMode
                          ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                          : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                      }`}
                    >
                      {joiningWaitlist ? 'Joining...' : '🎤 Join Waitlist'}
                    </button>
                  )}
                  {waitlistStatus && waitlistStatus.status === 'notified' && (
                    <button
                      onClick={() => navigate(`/book/${eventId}`)}
                      className="px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto">
                    >
                      Book Now
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => navigate(`/book/${eventId}`)}
                  className={`px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition text-white w-full sm:w-auto ${
                    isDarkMode
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  Book Tickets
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
