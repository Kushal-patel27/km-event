import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import API from '../services/api'
import Slider from '../components/Slider'
import EventCard from '../components/EventCard'
import SkeletonCard from '../components/SkeletonCard'
import { useAuth } from '../context/AuthContext'
import { DarkModeProvider } from '../context/DarkModeContext'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Force dark mode on home page
  useEffect(() => {
    const htmlElement = document.documentElement
    const wasDark = htmlElement.classList.contains('dark')
    
    // Add dark class if not present
    if (!wasDark) {
      htmlElement.classList.add('dark')
    }

    // Clean up: restore original state when leaving home page
    return () => {
      if (!wasDark) {
        htmlElement.classList.remove('dark')
      }
    }
  }, [])

  const featured = events.slice(0, 5)
  const heroImage =
    events[0]?.image ||
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1920&q=80'

  useEffect(() => {
    let mounted = true
    let timeoutId
    const MIN_LOAD_MS = 1500
    const start = Date.now()

    async function loadEvents() {
      try {
        const res = await API.get('/events')
        const mapped = (res.data || []).map(e => ({
          id: e._id || e.id,
          title: e.title,
          date: e.date ? new Date(e.date).toLocaleString() : '',
          location: e.location || '',
          price: e.price ?? 0,
          image:
            e.image ||
            'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80',
          capacity: e.totalTickets ?? e.capacity ?? 0,
          availableTickets: e.availableTickets,
        }))
        if (mounted) setEvents(mapped)
      } catch (err) {
        if (mounted) setError('Unable to load events')
      } finally {
        const elapsed = Date.now() - start
        const remaining = Math.max(0, MIN_LOAD_MS - elapsed)
        timeoutId = setTimeout(() => {
          if (mounted) setLoading(false)
        }, remaining)
      }
    }

    loadEvents()
    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  return (
    <div className="bg-[#0B0F19] text-white overflow-x-hidden">

      {/* ================= HERO / CINEMATIC CAROUSEL ================= */}
      <section className="relative min-h-[95vh] overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0B0F19] via-[#111827] to-[#1a1f2e] flex items-center justify-center">
            <div className="text-center">
              <img 
                src="/assets/logo.png" 
                alt="K&M Events" 
                className="w-40 h-40 md:w-48 md:h-48 mx-auto object-contain animate-pulse drop-shadow-2xl"
              />
               <p className="mt-6 text-gray-400 text-sm md:text-base animate-pulse">Loading events...</p> 
            </div>
          </div>
        ) : (
          <motion.div
            className="absolute inset-0 flex"
            animate={{ x: ['0%', `-${featured.length * 100}%`] }}
            transition={{ duration: featured.length * 4, repeat: Infinity, ease: 'linear' }}
          >
            {[...featured, ...featured].map((e, i) => (
              <div
                key={i}
                className="min-w-full bg-contain bg-center bg-no-repeat relative"
                style={{ backgroundImage: `url(${e.image})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30" />
              </div>
            ))}
          </motion.div>
        )}

        {/* Hero Content */}
        <div className="relative z-10 min-h-[95vh] flex items-end pb-16 sm:pb-20 md:pb-24 w-full">
          <div className="px-4 sm:px-6 lg:px-12 w-full">
            <div className="max-w-3xl">
              <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-extrabold leading-tight mb-4 sm:mb-6">
                Book Your Next <br className="hidden sm:block" />
                <span className="text-red-500">Live Experience</span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-10">
                <span className="hidden sm:inline">Concerts, comedy shows & festivals — book instantly with QR tickets.</span>
                <span className="sm:hidden">Book events instantly with QR tickets.</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link
                  to="/events"
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-red-600 hover:bg-red-700 rounded-xl text-base sm:text-lg font-bold shadow-lg text-center sm:text-left"
                >
                  Explore Events
                </Link>

                {!user && (
                  <Link
                    to="/signup"
                    className="px-6 sm:px-8 py-3 sm:py-4 border border-white/30 rounded-xl text-base sm:text-lg hover:bg-white/10 text-center sm:text-left"
                  >
                    Create Account
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= EVENTS ================= */}
      <section className="py-24">
        <div className="px-6 lg:px-12">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-4xl md:text-5xl font-extrabold">
              Popular Events
            </h2>
            <Link
              to="/events"
              className="text-red-400 font-bold hover:underline"
            >
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <DarkModeProvider forceDark={true}>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {events.slice(0, 6).map(ev => (
                  <EventCard key={ev.id} event={ev} />
                ))}
              </div>
            </DarkModeProvider>
          )}
        </div>
      </section>

      {/* ================= CTA ================= */}
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="py-28 bg-gradient-to-br from-red-600 to-red-500 text-center"
      >
        <h2 className="text-5xl md:text-6xl font-extrabold mb-6">
          Don’t Miss Out 🎟️
        </h2>
        <p className="text-white/80 text-xl mb-12 max-w-3xl mx-auto">
          Thousands are booking events daily. Be one of them.
        </p>
        <Link
          to="/events"
          className="px-12 py-5 bg-black text-white rounded-xl text-xl font-bold hover:scale-105 transition"
        >
          Book Now
        </Link>
      </motion.section>
    </div>
  )
}