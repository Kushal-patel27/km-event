import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import API from '../services/api'
import EventCard from '../components/EventCard'

export default function Events(){
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Update query from URL params
    const urlSearch = searchParams.get('search')
    if (urlSearch) {
      setQuery(urlSearch)
    }
  }, [searchParams])

  useEffect(() => {
    let mounted = true
    API.get('/events')
      .then(res => {
        if (!mounted) return
        // normalize id for frontend components
        const data = res.data.map(e => ({ ...e, id: e.id || e._id, availableTickets: e.availableTickets }))
        setEvents(data)
      })
      .catch(() => {
        // fallback: keep empty list
      })
      .finally(() => mounted && setLoading(false))

    return () => (mounted = false)
  }, [])

  // Extract unique categories from events
  const categories = ['All', ...new Set(events.map(e => e.category).filter(Boolean))]

  const filtered = events.filter(e => {
    const q = query.toLowerCase().trim()
    const matchesSearch = !q || 
      e.title.toLowerCase().includes(q) ||
      (e.location || '').toLowerCase().includes(q) ||
      (e.description || '').toLowerCase().includes(q)
    
    const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-gray-50 py-12 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl"></div>
        <div className="absolute top-[20%] right-[-5%] w-80 h-80 bg-purple-200/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-72 h-72 bg-blue-200/40 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight mb-2">Explore Events</h1>
          <p className="text-gray-500 text-lg">Find your next unforgettable experience.</p>
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-8">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={()=>setSelectedCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === cat 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 transform scale-105' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Results Info */}
        <div className="mb-8 flex items-center justify-between">
          <div className="text-gray-600 font-medium">
            Showing <span className="text-indigo-600 font-bold">{filtered.length}</span> {filtered.length === 1 ? 'event' : 'events'}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-20">Loading events...</div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(e => (
              <EventCard key={e.id || e._id} event={e} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">No events found</h3>
            <p className="text-gray-500 mt-1">Try adjusting your search terms.</p>
            <button onClick={()=>setQuery('')} className="mt-4 text-indigo-600 font-semibold hover:text-indigo-800">Clear Search</button>
          </div>
        )}
      </div>
    </div>
  )
}
