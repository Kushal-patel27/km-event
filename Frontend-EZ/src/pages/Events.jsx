import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import API from '../services/api'
import SkeletonCard from '../components/SkeletonCard'
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
    let timeoutId
    const MIN_LOAD_MS = 2000
    const start = Date.now()

    API.get('/events')
      .then(res => {
        if (!mounted) return
        const data = res.data.map(e => ({ ...e, id: e.id || e._id, availableTickets: e.availableTickets }))
        setEvents(data)
      })
      .catch(() => {
        // fallback: keep empty list
      })
      .finally(() => {
        const elapsed = Date.now() - start
        const remaining = Math.max(0, MIN_LOAD_MS - elapsed)
        timeoutId = setTimeout(() => {
          if (mounted) setLoading(false)
        }, remaining)
      })

    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
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
    <div className="min-h-screen bg-[#0B0F19] text-white py-12 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-rose-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-[20%] right-[-5%] w-80 h-80 bg-pink-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500 tracking-tight mb-2">Explore Events</h1>
          <p className="text-gray-400 text-lg">Find your next unforgettable experience.</p>
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-8">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={()=>setSelectedCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 backdrop-blur-lg ${
                  selectedCategory === cat 
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/30 transform scale-105' 
                    : 'bg-white/10 text-gray-300 border border-white/20 hover:border-rose-400 hover:bg-white/20'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Results Info */}
        <div className="mb-8 flex items-center justify-between">
          <div className="text-gray-400 font-medium">
            Showing <span className="text-rose-500 font-bold">{filtered.length}</span> {filtered.length === 1 ? 'event' : 'events'}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(e => (
              <EventCard key={e.id || e._id} event={e} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-lg mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white">No events found</h3>
            <p className="text-gray-400 mt-1">Try adjusting your search terms.</p>
            <button onClick={()=>setQuery('')} className="mt-4 text-rose-500 font-semibold hover:text-rose-400">Clear Search</button>
          </div>
        )}
      </div>
    </div>
  )
}
