import React, { useState } from 'react'
import events from '../data/events'
import Slider from '../components/Slider'
import { Link, useNavigate } from 'react-router-dom'

export default function Home(){
  const navigate = useNavigate()
  const [showProcess, setShowProcess] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [selectedMapEvent, setSelectedMapEvent] = useState(null)
  const featured = events.slice(0, 4)

  const offers = [
    {id: 'o1', title: 'Early Bird 20% Off', desc: 'Book early and save 20% on select events.', badge: '20% OFF', color: 'bg-green-100 text-green-800', code: 'EARLY20', discount: 0.2},
    {id: 'o2', title: 'Student 30% Discount', desc: 'Students get 30% off with a valid ID.', badge: '30% OFF', color: 'bg-blue-100 text-blue-800', code: 'STUDENT30', discount: 0.3, requiresId: true},
    {id: 'o3', title: 'Group Save 15%', desc: 'Groups of 5+ receive 15% off total.', badge: '15% OFF', color: 'bg-purple-100 text-purple-800', code: 'GROUP15', discount: 0.15, minQty: 5},
  ]

  function handleUseOffer(offer){
    sessionStorage.setItem('appliedOffer', JSON.stringify(offer))
    navigate('/events')
  }

  function handleGetLocation(){
    if(!navigator.geolocation){
      setLocationError('Geolocation is not supported by your browser')
      return
    }
    setLocationError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        if(events.length > 0) setSelectedMapEvent(events[0])
      },
      (error) => {
        console.error(error)
        setLocationError('Unable to retrieve your location. Please enable location services.')
      }
    )
  }

  return (
    <div className="font-sans text-gray-800">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="container mx-auto px-6 py-24 flex flex-col md:flex-row items-center gap-12 relative z-10">
          <div className="md:w-1/2 space-y-6">
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
              Discover. <span className="text-blue-200">Book.</span> Enjoy.
            </h1>
            <p className="text-lg md:text-xl text-blue-100 max-w-lg leading-relaxed">
              Your gateway to local experiences. Find events, reserve seats instantly with QR tickets, and make memories.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link to="/events" className="bg-white text-indigo-600 px-8 py-3 rounded-full shadow-lg font-bold hover:bg-blue-50 transition transform hover:-translate-y-1">
                Browse Events
              </Link>
              <Link to="/signup" className="border-2 border-white/30 text-white px-8 py-3 rounded-full font-medium hover:bg-white/10 transition">
                Create Account
              </Link>
            </div>
          </div>

          <div className="md:w-1/2 w-full">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 shadow-2xl border border-white/20 transform rotate-1 hover:rotate-0 transition duration-500">
              <Slider slides={featured} />
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Offers */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900">Exclusive Offers</h3>
          <p className="text-gray-500 mt-2">Grab the best deals before they run out</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {offers.map(o => (
            <div key={o.id} className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col justify-between group">
              <div>
                <div className={`inline-block ${o.color} text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide`}>{o.badge}</div>
                <h4 className="mt-4 font-bold text-xl text-gray-800 group-hover:text-indigo-600 transition-colors">{o.title}</h4>
                <p className="mt-3 text-gray-600 leading-relaxed">{o.desc}</p>
              </div>
              <div className="mt-6">
                <button onClick={() => handleUseOffer(o)} className="inline-flex items-center text-indigo-600 font-semibold hover:text-indigo-800 transition">
                  Use Offer <span className="ml-2 text-lg">→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900">Why Choose K&M Events?</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div onClick={() => setShowProcess(true)} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition text-center cursor-pointer hover:-translate-y-1 transform duration-300">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
                🎟️
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Easy Booking</h3>
              <p className="text-gray-600 leading-relaxed">Reserve seats in seconds and receive QR tickets instantly via email.</p>
            </div>

            <div onClick={() => setShowLocationModal(true)} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition text-center cursor-pointer hover:-translate-y-1 transform duration-300">
              <div className="w-16 h-16 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
                📍
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Local Events</h3>
              <p className="text-gray-600 leading-relaxed">Discover events near you — concerts, conferences, markets and more.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
                🔒
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Secure Payments</h3>
              <p className="text-gray-600 leading-relaxed">Payments and tickets handled securely with QR-based check-in.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Process Modal */}
      {showProcess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowProcess(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowProcess(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">🎟️</div>
              <h3 className="text-2xl font-bold text-gray-900">How to Book</h3>
              <p className="text-gray-500">Get your tickets in 4 simple steps</p>
            </div>

            <div className="space-y-6">
              {[
                { step: 1, title: 'Find an Event', desc: 'Browse our collection of local concerts, workshops, and shows.' },
                { step: 2, title: 'Choose Seats', desc: 'Select your preferred seats or quantity for the event.' },
                { step: 3, title: 'Enter Details', desc: 'Provide your name and email to receive your tickets.' },
                { step: 4, title: 'Get QR Ticket', desc: 'Receive an instant QR code ticket to scan at the venue.' }
              ].map((s, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                    {s.step}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg leading-none mb-1">{s.title}</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <button onClick={() => setShowProcess(false)} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location/Map Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowLocationModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full p-6 relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowLocationModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">📍</div>
              <h3 className="text-2xl font-bold text-gray-900">Local Events Map</h3>
              <p className="text-gray-500">Find events and get the best route from your location.</p>
            </div>

            {!userLocation ? (
              <div className="text-center py-10">
                <p className="text-lg text-gray-700 mb-6">To show you the best routes to events, we need to know your location.</p>
                {locationError && <div className="text-red-600 mb-4 bg-red-50 p-3 rounded inline-block">{locationError}</div>}
                <button onClick={handleGetLocation} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 flex items-center gap-2 mx-auto">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Enable Location
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[60vh]">
                {/* Event List */}
                <div className="lg:col-span-1 overflow-y-auto pr-2 space-y-3">
                  {events.map(event => (
                    <div 
                      key={event.id} 
                      onClick={() => setSelectedMapEvent(event)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedMapEvent?.id === event.id ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'}`}
                    >
                      <h4 className="font-bold text-gray-900">{event.title}</h4>
                      <p className="text-sm text-gray-500 mb-3">{event.location}</p>
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${encodeURIComponent(event.location)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-xs font-bold text-white bg-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-700 transition"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.553-.894L15 7m0 13V7" /></svg>
                        Get Route
                      </a>
                    </div>
                  ))}
                </div>

                {/* Map Preview */}
                <div className="lg:col-span-2 bg-gray-100 rounded-2xl overflow-hidden relative border border-gray-200">
                  {selectedMapEvent ? (
                    <iframe 
                      title="Event Location"
                      width="100%" 
                      height="100%" 
                      frameBorder="0" 
                      style={{border:0}} 
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedMapEvent.location)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">Select an event to view map</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CTA strip */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl p-10 md:p-16 text-center text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="relative z-10">
              <h4 className="text-3xl md:text-4xl font-bold mb-4">Ready to join an event?</h4>
              <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">Explore upcoming events, grab your tickets, and get ready for an unforgettable experience.</p>
              <Link to="/events" className="inline-block bg-white text-indigo-600 px-8 py-4 rounded-full font-bold shadow-lg hover:bg-gray-100 transition transform hover:-translate-y-1">
                Browse Events Now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
