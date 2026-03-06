import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import formatINR from '../../utils/currency';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function PublicEvent() {
  const params = useParams();
  const { slug, shortCode } = params;
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [slug, shortCode]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      let res;
      
      // If slug is provided, fetch by slug or try as _id for backwards compatibility
      if (slug) {
        try {
          res = await axios.get(`${API_URL}/api/events/public/${slug}`);
        } catch {
          // If not found as slug, try as _id for backwards compatibility
          try {
            res = await axios.get(`${API_URL}/api/events/${slug}`);
          } catch {
            throw new Error('Event not found');
          }
        }
      }
      // If shortCode is provided, fetch by short code
      else if (shortCode) {
        res = await axios.get(`${API_URL}/api/events/code/${shortCode}`);
      } else {
        throw new Error('No event identifier provided');
      }
      
      setEvent(res.data.data || res.data);
      setError('');
    } catch (err) {
      console.error('Fetch public event error:', err);
      setError(err.response?.data?.message || 'Event not found or not publicly available');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyShareLink = async () => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Copy failed:', err);
    } finally {
      setCopying(false);
    }
  };

  const handleBookTicket = () => {
    const eventId = event?._id || event?.id;
    if (!eventId) return;
    navigate(`/book/${eventId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <svg
              className="w-16 h-16 text-red-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const primaryColor = event.customBranding?.primaryColor || '#FF0000';
  const bannerImage = event.customBranding?.customBanner || event.image;

  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{event.title} | K&M Events</title>
        <meta name="description" content={event.description?.substring(0, 160)} />
        <meta property="og:title" content={event.title} />
        <meta property="og:description" content={event.description?.substring(0, 160)} />
        <meta property="og:image" content={bannerImage} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={event.title} />
        <meta name="twitter:description" content={event.description?.substring(0, 160)} />
        <meta name="twitter:image" content={bannerImage} />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section with Banner */}
        <div className="relative h-[70vh] min-h-[500px] overflow-hidden">
          {/* Background Image */}
          {bannerImage ? (
            <img
              src={bannerImage}
              alt={event.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div 
              className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-700"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`
              }}
            />
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

          {/* Content */}
          <div className="relative h-full flex items-end">
            <div className="container mx-auto px-4 md:px-6 lg:px-8 pb-12">
              <div className="max-w-4xl">
                {/* Category Badge */}
                {event.category && (
                  <span className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-full mb-4">
                    {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                  </span>
                )}

                {/* Event Title */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                  {event.title}
                </h1>

                {/* Quick Info */}
                <div className="flex flex-wrap gap-6 text-white/90 mb-6">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">{formatDate(event.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium">{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="font-medium">{event.views || 0} views</span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={handleBookTicket}
                    className="px-8 py-4 bg-white text-gray-900 rounded-lg hover:bg-gray-100 font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
                  >
                    Book Tickets Now
                  </button>
                  <button
                    onClick={copyShareLink}
                    disabled={copying}
                    className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 font-bold text-lg shadow-xl transition-all flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    {copying ? 'Copied!' : 'Share Event'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Event Details - Left Column */}
              <div className="lg:col-span-2 space-y-8">
                {/* About Section */}
                <div className="bg-white rounded-lg shadow-md p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Event</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {event.description}
                  </p>
                </div>

                {/* Location Details */}
                {event.locationDetails && (
                  <div className="bg-white rounded-lg shadow-md p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Venue Details</h2>
                    <p className="text-gray-700 mb-4">{event.locationDetails}</p>
                    {event.mapLink && (
                      <a
                        href={event.mapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        View on Map
                      </a>
                    )}
                  </div>
                )}

                {/* Organizer Info */}
                {event.organizer && (
                  <div className="bg-white rounded-lg shadow-md p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Organized By</h2>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 font-bold text-xl">
                          {event.organizer.name?.charAt(0) || 'O'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{event.organizer.name}</p>
                        <p className="text-sm text-gray-600">{event.organizer.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Ticket Pricing - Right Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Ticket Options</h3>
                  
                  <div className="space-y-4">
                    {event.ticketTypes && event.ticketTypes.length > 0 ? (
                      event.ticketTypes.map((ticket, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-red-300 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-900">{ticket.name}</h4>
                            <span className="text-xl font-bold text-red-600">
                              {formatINR(ticket.price)}
                            </span>
                          </div>
                          {ticket.description && (
                            <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                          )}
                          <p className="text-sm text-gray-500">
                            {ticket.available > 0 
                              ? `${ticket.available} tickets available`
                              : 'Sold out'
                            }
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-600">
                        No ticket information available
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleBookTicket}
                    style={{ backgroundColor: primaryColor }}
                    className="w-full mt-6 px-6 py-4 text-white rounded-lg hover:opacity-90 font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    Get Tickets
                  </button>

                  {event.shortCode && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">Event Code</p>
                      <p className="font-mono font-bold text-gray-900 text-lg">{event.shortCode}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8 mt-12">
          <div className="container mx-auto px-4 md:px-6 lg:px-8 text-center">
            <p className="text-gray-400">
              Powered by <span className="font-semibold text-red-500">K&M Events</span>
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Explore More Events →
            </button>
          </div>
        </footer>
      </div>
    </>
  );
}
