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
  const heroImage = (events[0]?.image) || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1920&q=80'

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

  const offers = [
    { id: 1, title: 'Early Bird', off: '20% OFF', color: 'from-green-500 to-emerald-600' },
    { id: 2, title: 'Student Pass', off: '30% OFF', color: 'from-blue-500 to-indigo-600' },
    { id: 3, title: 'Group Deal', off: '15% OFF', color: 'from-purple-500 to-pink-600' }
  ]

  return (
    <div className="bg-gradient-to-br from-gray-50 via-white to-indigo-50 text-gray-900 overflow-x-hidden">

      {/* ================= HERO ================= */}
      <section className="relative min-h-[95vh] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900" />
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

        <div className="relative z-10 w-full max-w-none mx-auto px-4 lg:px-8 grid lg:grid-cols-2 gap-16 items-center">

          {/* LEFT */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-white"
          >
            <h1 className="text-5xl md:text-6xl xl:text-7xl font-extrabold leading-tight mb-6">
              Discover & Book <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400">
                Amazing Events
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-300 max-w-xl">
              Concerts, workshops & festivals near you with instant QR tickets.
            </p>

            <div className="mt-10 flex gap-4">
              <Link
                to="/events"
                className="px-8 py-4 bg-gradient-to-r from-pink-500 to-indigo-500 rounded-xl text-lg font-bold hover:scale-105 transition"
              >
                Explore Events
              </Link>

              {!user && (
                <Link
                  to="/signup"
                  className="px-8 py-4 border-2 border-white/30 rounded-xl text-lg hover:bg-white/10 transition"
                >
                  Create Account
                </Link>
              )}
            </div>

            {/* Mobile Featured Image */}
            <motion.div className="block lg:hidden mt-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                initial={{ y: 0 }}
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 6, repeat: Infinity, repeatType: 'mirror' }}
                className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20"
              >
                <motion.img
                  src={heroImage}
                  alt="Featured event"
                  className="w-full h-full object-cover"
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: 'spring', stiffness: 120 }}
                />
                <div className="absolute bottom-4 left-4 bg-white/85 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-semibold text-gray-900 shadow-md">
                  Featured event
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* RIGHT */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="hidden lg:block"
          >
            <motion.div
              initial={{ y: 0 }}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 8, repeat: Infinity, repeatType: 'mirror' }}
              className="rounded-3xl overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.7)]"
            >
              {loading ? (
                <div className="h-[480px] bg-gray-800 animate-pulse" />
              ) : (
                <Slider slides={featured} />
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ================= OFFERS ================= */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-24 px-4 lg:px-8"
      >
        <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-16">
          Trending Offers 🔥
        </h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-screen-2xl mx-auto">
          {offers.map(o => (
            <motion.div
              key={o.id}
              whileHover={{ y: -10, scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className={`bg-gradient-to-br ${o.color} rounded-3xl p-8 text-white shadow-2xl`}
            >
              <h3 className="text-2xl font-bold mb-3">{o.title}</h3>
              <p className="text-4xl font-extrabold mb-6">{o.off}</p>
              <button
                onClick={() => navigate('/events')}
                className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl font-semibold transition"
              >
                Grab Deal →
              </button>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ================= EVENTS ================= */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="px-4 lg:px-8 py-24 bg-white"
      >
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-4xl md:text-5xl font-extrabold">Popular Events</h2>
            <Link to="/events" className="text-indigo-600 font-bold hover:underline">
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-200 rounded-2xl animate-pulse" />
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
      </motion.section>

      {/* ================= CTA ================= */}
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="py-28 bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 text-white text-center"
      >
        <h2 className="text-5xl md:text-6xl font-extrabold mb-6">
          Don’t Miss Out 🎉
        </h2>
        <p className="text-gray-300 text-xl mb-12 max-w-3xl mx-auto">
          Join thousands of people booking amazing events every day.
        </p>
        <Link
          to="/events"
          className="px-12 py-5 bg-gradient-to-r from-pink-500 to-indigo-500 rounded-xl text-xl font-bold hover:scale-105 transition"
        >
          Book Now
        </Link>
      </motion.section>
    </div>
  )
}
