import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import API from '../services/api'
import Slider from '../components/Slider'
import EventCard from '../components/EventCard'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const featured = events.slice(0, 5)
  const heroImage =
    events[0]?.image ||
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1920&q=80'

  useEffect(() => {
    let mounted = true
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
        if (mounted) setLoading(false)
      }
    }
    loadEvents()
    return () => (mounted = false)
  }, [])

  return (
    <div className="bg-[#0B0F19] text-white overflow-x-hidden">

      {/* ================= HERO / CINEMATIC CAROUSEL ================= */}
      <section className="relative min-h-[95vh] overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 bg-[#111827] animate-pulse" />
        ) : (
          <motion.div
            className="absolute inset-0 flex"
            animate={{ x: ['0%', '-100%', '-200%', '0%'] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            {featured.map((e, i) => (
              <div
                key={i}
                className="min-w-full bg-cover bg-center relative"
                style={{ backgroundImage: `url(${e.image})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30" />
              </div>
            ))}
          </motion.div>
        )}

        {/* Hero Content */}
        <div className="relative z-10 min-h-[95vh] flex items-center px-6 lg:px-12">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl xl:text-7xl font-extrabold leading-tight mb-6">
              Book Your Next <br />
              <span className="text-rose-500">Live Experience</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-300 mb-10">
              Concerts, comedy shows & festivals — book instantly with QR tickets.
            </p>

            <div className="flex gap-4">
              <Link
                to="/events"
                className="px-8 py-4 bg-rose-600 hover:bg-rose-700 rounded-xl text-lg font-bold shadow-lg"
              >
                Explore Events
              </Link>

              {!user && (
                <Link
                  to="/signup"
                  className="px-8 py-4 border border-white/30 rounded-xl text-lg hover:bg-white/10"
                >
                  Create Account
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ================= EVENTS ================= */}
      <section className="px-4 lg:px-12 py-24">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-4xl md:text-5xl font-extrabold">
              Popular Events
            </h2>
            <Link
              to="/events"
              className="text-rose-400 font-bold hover:underline"
            >
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-80 rounded-2xl bg-[#161A23] animate-pulse border border-white/5"
                />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.slice(0, 6).map(ev => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ================= CTA ================= */}
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="py-28 bg-gradient-to-br from-rose-600 to-pink-600 text-center"
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