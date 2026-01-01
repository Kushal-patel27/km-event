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

  const highlights = [
    {
      title: 'Instant QR Tickets',
      desc: 'Skip the queue with secure QR-based entry for every booking.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h10v10H7z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 3h6v6M3 15h6v6" />
        </svg>
      ),
    },
    {
      title: 'Verified Events',
      desc: 'We work directly with organizers to ensure details are accurate.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
        </svg>
      ),
    },
    {
      title: 'Flexible Payments',
      desc: 'Pay securely with cards, UPI, or wallets; get instant receipts.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7h16M4 12h16M4 17h16" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7v10" />
        </svg>
      ),
    },
    {
      title: '24/7 Support',
      desc: 'Chat with a human whenever you need help with your booking.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h8M8 14h5" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ]

  const categories = [
    { name: 'Concerts', color: 'from-red-500 to-orange-500' },
    { name: 'Comedy', color: 'from-indigo-500 to-blue-500' },
    { name: 'Workshops', color: 'from-emerald-500 to-teal-500' },
    { name: 'Theatre', color: 'from-yellow-500 to-amber-500' },
    { name: 'Sports', color: 'from-sky-500 to-cyan-500' },
    { name: 'Festivals', color: 'from-pink-500 to-fuchsia-500' },
  ]

  const testimonials = [
    {
      quote: 'Smoothest booking experience. The QR tickets just work.',
      name: 'Anika, Bengaluru',
    },
    {
      quote: 'Loved the curated picks—found a jazz night I would have missed.',
      name: 'Rohan, Mumbai',
    },
    {
      quote: 'Support resolved a date issue in minutes. Superb.',
      name: 'Priya, Delhi',
    },
  ]

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

      {/* ================= FAST STATS ================= */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="py-16 border-t border-white/10 bg-[#0d1221]"
      >
        <div className="px-6 lg:px-12 max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[{ label: 'Tickets issued', value: '1.2M+' }, { label: 'Cities covered', value: '30+' }, { label: 'Events live', value: '850+' }, { label: 'Avg. rating', value: '4.8/5' }].map((item, idx) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="text-3xl md:text-4xl font-extrabold text-white">{item.value}</div>
              <div className="mt-2 text-sm text-gray-300">{item.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ================= HIGHLIGHTS ================= */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="py-20"
      >
        <div className="px-6 lg:px-12 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-4xl md:text-5xl font-extrabold">Why people book with us</h2>
            <Link to="/events" className="text-red-400 font-semibold hover:underline">Browse events →</Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map((card, idx) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur hover:bg-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-red-200 mb-4">
                  {card.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ================= CATEGORIES ================= */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="py-16 bg-[#0d1221]"
      >
        <div className="px-6 lg:px-12 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl md:text-4xl font-bold">Top categories</h2>
            <Link to="/events" className="text-sm text-red-300 hover:underline">See all</Link>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((cat, idx) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.08 }}
                className={`p-6 rounded-2xl bg-gradient-to-r ${cat.color} text-white font-semibold shadow-lg border border-white/10 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 cursor-pointer`}
              >
                {cat.name}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ================= HOW IT WORKS ================= */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="py-20"
      >
        <div className="px-6 lg:px-12 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-sm uppercase tracking-[0.3em] text-red-300 mb-3"
            >
              Simple steps
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-5xl font-extrabold mb-3"
            >
              Book in under a minute
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-gray-300 max-w-2xl mx-auto"
            >
              Search, pick seats, pay, and get instant QR tickets on your phone.
            </motion.p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Find the event', desc: 'Use search or browse curated picks by city and category.' },
              { title: 'Choose seats', desc: 'See live availability and lock your seats instantly.' },
              { title: 'Scan & enter', desc: 'Show the QR at the gate—no printouts, no hassle.' },
            ].map((step, idx) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur hover:bg-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center font-bold mb-4">
                  {idx + 1}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-300 leading-relaxed text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ================= TESTIMONIALS ================= */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="py-20 bg-[#0d1221]"
      >
        <div className="px-6 lg:px-12 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-red-300">What people say</p>
                <h2 className="text-4xl md:text-5xl font-extrabold">Loved by event-goers</h2>
              </div>
            </motion.div>
            <Link to="/events" className="text-red-300 font-semibold hover:underline">Discover events →</Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((card, idx) => (
              <motion.div
                key={card.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 shadow-lg hover:bg-white/10 hover:border-white/20 transition-all duration-300"
              >
                <p className="text-lg leading-relaxed text-gray-100">"{card.quote}"</p>
                <p className="mt-4 text-sm text-gray-400 font-semibold">{card.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

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