import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import { getEventImage } from '../../utils/images';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../context/DarkModeContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function Waitlist() {
  const [waitlistEntries, setWaitlistEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('waiting');
  const [removingId, setRemovingId] = useState(null);

  const { user } = useAuth();
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    fetchWaitlist();
  }, [filter]);

  const fetchWaitlist = async () => {
    try {
      setLoading(true);
      setError('');
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await API.get('/waitlist/my-waitlist', { params });
      
      // Filter out entries with null/undefined events (deleted events)
      const validEntries = (response.data.waitlist || []).filter(entry => entry.event && entry.event._id);
      setWaitlistEntries(validEntries);
    } catch (err) {
      console.error('Error fetching waitlist:', err);
      setError(err.response?.data?.message || 'Failed to load waitlist entries');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveWaitlist = async (waitlistId) => {
    if (!window.confirm('Are you sure you want to leave this waitlist?')) {
      return;
    }

    try {
      setRemovingId(waitlistId);
      await API.delete(`/waitlist/${waitlistId}`);
      setWaitlistEntries(prev => prev.filter(entry => entry._id !== waitlistId));
    } catch (err) {
      console.error('Error leaving waitlist:', err);
      alert('Failed to leave waitlist. Please try again.');
    } finally {
      setRemovingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      waiting: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      notified: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      converted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    };
    return badges[status] || badges.waiting;
  };

  const getStatusText = (status) => {
    const text = {
      waiting: 'Waiting',
      notified: 'Notified - Book Now!',
      expired: 'Expired',
      converted: 'Booked'
    };
    return text[status] || status;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in to view your waitlist</h2>
          <Link to="/login" className="text-indigo-600 hover:text-indigo-700">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className={`text-2xl sm:text-2.5xl md:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            🎤 My Waitlist
          </h1>
          <p className={`mt-1.5 sm:mt-2 text-sm sm:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Track your position in line for sold-out events
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 -mx-3 sm:mx-0">
          <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} overflow-x-auto scrollbar-hide`}>
            <nav className="-mb-px flex space-x-3 sm:space-x-6 md:space-x-8 px-3 sm:px-0">
              {[
                { key: 'waiting', label: 'Waiting', icon: '⏳' },
                { key: 'notified', label: 'Notified', icon: '🔔' },
                { key: 'converted', label: 'Booked', icon: '✅' },
                { key: 'expired', label: 'Expired', icon: '⏰' },
                { key: 'all', label: 'All', icon: '📋' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`
                    whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5
                    ${filter === tab.key
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : `border-transparent ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} hover:border-gray-300`
                    }
                  `}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Loading State */}
        {loading && <LoadingSpinner message="Loading waitlist..." />}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Waitlist Entries */}
        {!loading && !error && (
          <>
            {waitlistEntries.length === 0 ? (
              <div className={`text-center py-12 sm:py-16 px-4 sm:px-6 ${isDarkMode ? 'bg-black border border-white/10' : 'bg-white'} rounded-lg shadow`}>
                <div className="text-4xl sm:text-6xl mb-4">🎫</div>
                <h3 className={`text-lg sm:text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  No waitlist entries
                </h3>
                <p className={`mb-6 text-sm sm:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Join a waitlist when events are sold out
                </p>
                <Link
                  to="/events"
                  className="inline-block bg-indigo-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-indigo-700 text-sm sm:text-base font-medium"
                >
                  Browse Events
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {waitlistEntries.map(entry => (
                  <div
                    key={entry._id}
                    className={`
                      ${isDarkMode ? 'bg-black border border-white/10' : 'bg-white'}
                      rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow
                    `}
                  >
                    {/* Event Image */}
                    <div className="relative h-40 sm:h-48">
                      <img
                        src={getEventImage(entry.event)}
                        alt={entry.event?.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(entry.status)}`}>
                          {getStatusText(entry.status)}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-3 sm:p-4 md:p-5">
                      <h3 className={`text-base sm:text-lg font-bold mb-2 line-clamp-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {entry.event?.title}
                      </h3>

                      <div className={`space-y-1.5 sm:space-y-2 text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <div className="flex items-center">
                          <span className="mr-2">📅</span>
                          <span className="truncate">{formatDate(entry.event?.date)}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="mr-2">📍</span>
                          <span className="truncate">{entry.event?.location}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="mr-2">🎫</span>
                          <span>{entry.ticketType} × {entry.quantity}</span>
                        </div>
                        
                        {/* Position Info */}
                        {entry.status === 'waiting' && entry.currentPosition && (
                          <div className="flex items-center">
                            <span className="mr-2">📊</span>
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                              Position #{entry.currentPosition}
                            </span>
                          </div>
                        )}

                        {/* Notification Time */}
                        {entry.status === 'notified' && entry.notifiedAt && (
                          <div className="flex items-center">
                            <span className="mr-2">🔔</span>
                            <span className="truncate">Notified: {formatDate(entry.notifiedAt)}</span>
                          </div>
                        )}

                        {/* Expiry Warning */}
                        {entry.status === 'notified' && entry.expiresAt && (
                          <div className={`border rounded p-2 mt-2 sm:mt-3 ${isDarkMode ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'}`}>
                            <p className={`text-xs font-semibold ${isDarkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                              ⏰ Book by: {formatDate(entry.expiresAt)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2">
                        {entry.status === 'notified' && (
                          <Link
                            to={`/events/${entry.event?._id}`}
                            className="flex-1 bg-indigo-600 text-white text-center py-2 rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-xs sm:text-sm"
                          >
                            Book Now
                          </Link>
                        )}
                        
                        {entry.status === 'waiting' && entry.event?._id && (
                          <Link
                            to={`/event/${entry.event._id}`}
                            className={`flex-1 text-center py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium ${
                              isDarkMode
                                ? 'bg-black border border-white/10 text-gray-300 hover:bg-black/80 hover:border-red-500/40'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            View Event
                          </Link>
                        )}

                        {(entry.status === 'waiting' || entry.status === 'notified') && (
                          <button
                            onClick={() => handleLeaveWaitlist(entry._id)}
                            disabled={removingId === entry._id}
                            className={`
                              px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium
                              ${isDarkMode
                                ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                              }
                              disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                          >
                            {removingId === entry._id ? '...' : 'Leave'}
                          </button>
                        )}

                        {entry.status === 'converted' && (
                          <Link
                            to="/my-bookings"
                            className="flex-1 bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-xs sm:text-sm"
                          >
                            View Booking
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Info Box */}
        <div className={`mt-8 ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'} border ${isDarkMode ? 'border-blue-800' : 'border-blue-200'} rounded-lg p-4 sm:p-6`}>
          <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>
            How Waitlist Works
          </h3>
          <ul className={`space-y-2 sm:space-y-3 ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>
            <li className="flex items-start gap-2 text-sm sm:text-base">
              <span className="flex-shrink-0">1️⃣</span>
              <span>Join the waitlist when an event is sold out</span>
            </li>
            <li className="flex items-start gap-2 text-sm sm:text-base">
              <span className="flex-shrink-0">2️⃣</span>
              <span>We'll notify you via email when tickets become available</span>
            </li>
            <li className="flex items-start gap-2 text-sm sm:text-base">
              <span className="flex-shrink-0">3️⃣</span>
              <span>You have 48 hours to complete your booking after notification</span>
            </li>
            <li className="flex items-start gap-2 text-sm sm:text-base">
              <span className="flex-shrink-0">4️⃣</span>
              <span>If you don't book in time, the next person gets the opportunity</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
