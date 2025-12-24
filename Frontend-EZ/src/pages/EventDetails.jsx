import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  // Initialize with mock data directly to ensure it always renders
  const [event, setEvent] = useState({
    id: id || '1',
    title: "Grand Music Festival 2024",
    date: "2024-12-25",
    time: "18:00",
    location: "City Arena, New York",
    description: "Experience the biggest music festival of the year with top artists from around the globe. Food, drinks, and amazing vibes await! This is a placeholder description for the event details page.",
    price: 120,
    image: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    availableSeats: 45
  });
  const [loading, setLoading] = useState(false);

  const handleBook = () => {
    if (!user) {
      // If user is not logged in, redirect to login page
      navigate('/login');
      return;
    }
    
    // Logic to handle booking (e.g., API call to create booking)
    // For now, we simulate a success message
    alert(`Successfully booked tickets for ${event.title}!`);
    navigate('/my-bookings');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!event) {
    return <div className="text-center py-10 text-xl">Event not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Event Image & Price Badge */}
        <div className="relative h-64 md:h-96">
          <img 
            src={event.image} 
            alt={event.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4 bg-white dark:bg-gray-900 px-4 py-2 rounded-full shadow-lg font-bold text-indigo-600">
            ${event.price}
          </div>
        </div>

        {/* Event Content */}
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 md:mb-0">
              {event.title}
            </h1>
            <button
              onClick={handleBook}
              className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-md"
            >
              Book Now
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <span className="text-2xl mr-3">📅</span>
              <div>
                <p className="font-semibold">Date</p>
                <p>{event.date}</p>
              </div>
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <span className="text-2xl mr-3">⏰</span>
              <div>
                <p className="font-semibold">Time</p>
                <p>{event.time}</p>
              </div>
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <span className="text-2xl mr-3">📍</span>
              <div>
                <p className="font-semibold">Location</p>
                <p>{event.location}</p>
              </div>
            </div>
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">About Event</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {event.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;