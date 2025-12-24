import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon issues in React-Leaflet
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Mock data for events - In a real app, fetch this from your API
const EVENTS = [
  { id: 1, title: "Sunburn Festival", lat: 15.4909, lng: 73.8278, location: "Goa", date: "2024-12-28" },
  { id: 2, title: "Tech Summit 2024", lat: 12.9716, lng: 77.5946, location: "Bangalore", date: "2024-03-15" },
  { id: 3, title: "Jaipur Literature Festival", lat: 26.9124, lng: 75.7873, location: "Jaipur", date: "2024-01-20" },
  { id: 4, title: "Hornbill Festival", lat: 25.6701, lng: 94.1077, location: "Nagaland", date: "2024-12-01" },
  { id: 5, title: "Auto Expo", lat: 28.4595, lng: 77.0266, location: "Greater Noida", date: "2024-02-08" },
  { id: 6, title: "Kala Ghoda Arts Festival", lat: 18.9220, lng: 72.8347, location: "Mumbai", date: "2024-02-04" },
];

// Component to handle "Fly To" animation
const MapController = ({ selectedLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedLocation) {
      map.flyTo([selectedLocation.lat, selectedLocation.lng], 13, {
        duration: 2
      });
    }
  }, [selectedLocation, map]);

  return null;
};

const MapPage = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Default center (India)
  const defaultCenter = [20.5937, 78.9629];

  const handleGetDirections = (lat, lng) => {
    // Open Google Maps Directions
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-6 h-[calc(100vh-80px)] flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Event Map</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {EVENTS.length} events found
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 relative z-0">
        <MapContainer 
          center={defaultCenter} 
          zoom={5} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController selectedLocation={selectedEvent} />

          {EVENTS.map(event => (
            <Marker 
              key={event.id} 
              position={[event.lat, event.lng]}
              eventHandlers={{
                click: () => setSelectedEvent(event),
              }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <h3 className="font-bold text-gray-900 text-base mb-1">{event.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Location:</span> {event.location}<br/>
                    <span className="font-medium">Date:</span> {event.date}
                  </p>
                  <button 
                    onClick={() => handleGetDirections(event.lat, event.lng)}
                    className="w-full bg-indigo-600 text-white text-sm py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Get Directions
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapPage;