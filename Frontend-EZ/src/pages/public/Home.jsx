import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import API from '../../services/api'
import Slider from '../../components/common/Slider'
import EventCard from '../../components/common/EventCard'
import SkeletonCard from '../../components/common/SkeletonCard'
import { useAuth } from '../../context/AuthContext'
import { DarkModeProvider } from '../../context/DarkModeContext'

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

  const collections = [
    {
      title: 'Weekend Headliners',
      desc: 'Stadium tours, arena shows, and the biggest acts hitting your city this weekend.',
      tag: 'Curated picks',
      color: 'from-red-600 to-red-400',
    },
    {
      title: 'Under Rs 499 Plans',
      desc: 'Budget-friendly comedy nights, meetups, and workshops with instant entry.',
      tag: 'Easy on the wallet',
      color: 'from-emerald-500 to-teal-400',
    },
    {
      title: 'Family & Kids',
      desc: 'Science shows, theatre, maker sessions, and outdoor fun with kid-friendly timings.',
      tag: 'Family time',
      color: 'from-orange-500 to-amber-400',
    },
    {
      title: 'Late-Night Sets',
      desc: 'After-hours DJ lineups, indie gigs, and techno nights across top venues.',
      tag: 'Nightlife',
      color: 'from-indigo-500 to-purple-500',
    },
  ]

  const assurance = [
    {
      title: 'Live Seat Maps',
      desc: 'Pick seats on live maps that update in real time so you never grab a stale spot.',
    },
    {
      title: 'Instant Fixes',
      desc: 'Date change, attendee name tweak, or refund on cancellations—handled in minutes.',
    },
    {
      title: 'Secure Payments',
      desc: 'PCI-compliant checkout with cards, UPI, wallets, and receipts in your inbox.',
    },
    {
      title: 'Human Support',
      desc: 'Chat with a real person 24/7 for bookings, access, or organizer escalations.',
    },
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

  // Force entire Home page to stay dark
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
        const mapped = (res.data || [])
          .filter(e => {
            // Filter out past events
            const eventDate = e.date ? new Date(e.date) : null
            return !eventDate || eventDate >= new Date()
          })
          .map(e => ({
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
    <div className="bg-gradient-to-b from-[#0B0F19] via-[#0d1221] to-[#0B0F19] text-white overflow-x-hidden min-h-screen">

      {/* ================= HERO / CINEMATIC CAROUSEL ================= */}
      <section className="relative min-h-[95vh] overflow-hidden bg-[#0B0F19]">
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
                className="min-w-full bg-cover bg-center bg-no-repeat relative"
                style={{ backgroundImage: `url(${e.image})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-transparent" />
              </div>
            ))}
          </motion.div>
        )}

        {/* Hero Content */}
        <div className="relative z-10 min-h-[95vh] flex items-end pb-16 sm:pb-20 md:pb-24 w-full">
          <div className="px-4 sm:px-6 lg:px-12 w-full">
            <div className="max-w-4xl">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-extrabold leading-tight mb-4 sm:mb-6 text-white drop-shadow-lg"
              >
                Book Your Next <br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">Live Experience</span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-base sm:text-lg md:text-xl text-gray-200 mb-6 sm:mb-10 drop-shadow-md"
              >
                <span className="hidden sm:inline">Concerts, comedy shows & festivals — book instantly with secure QR tickets.</span>
                <span className="sm:hidden">Book events with instant QR tickets.</span>
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4"
              >
                <Link
                  to="/events"
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 rounded-xl text-base sm:text-lg font-bold shadow-lg hover:shadow-red-500/50 text-center sm:text-left transform hover:scale-105 transition-all duration-300"
                >
                  Explore Events
                </Link>

                {!user && (
                  <Link
                    to="/signup"
                    className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-white/40 rounded-xl text-base sm:text-lg font-semibold hover:bg-white/10 hover:border-white/60 text-center sm:text-left backdrop-blur-sm transition-all duration-300"
                  >
                    Create Account
                  </Link>
                )}
              </motion.div>
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
        className="py-16 border-t border-white/10 bg-gradient-to-b from-[#0d1221] to-[#0B0F19]"
      >
        <div className="px-6 lg:px-12 max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
          {[{ label: 'Tickets issued', value: '1.2M+' }, { label: 'Cities covered', value: '30+' }, { label: 'Events live', value: '850+' }, { label: 'Avg. rating', value: '4.8/5' }].map((item, idx) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="group p-5 md:p-6 rounded-2xl bg-gradient-to-br from-white/8 to-white/3 border border-white/15 hover:border-red-500/50 hover:from-white/12 hover:to-white/6 backdrop-blur-sm transition-all duration-300"
            >
              <div className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 group-hover:from-red-400 group-hover:to-white transition-all">{item.value}</div>
              <div className="mt-2 text-xs md:text-sm text-gray-300 font-medium">{item.label}</div>
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
        className="py-20 bg-gradient-to-b from-[#0B0F19] to-[#0d1221]"
      >
        <div className="px-6 lg:px-12 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white drop-shadow-lg">Why people book with us</h2>
            <Link to="/events" className="text-red-400 font-semibold hover:text-red-300 transition-colors duration-200">Browse events →</Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map((card, idx) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="group p-6 rounded-2xl bg-gradient-to-br from-white/8 to-white/3 border border-white/15 backdrop-blur-sm hover:from-white/15 hover:to-white/8 hover:border-red-500/40 transition-all duration-300 cursor-pointer hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500/30 to-red-600/10 flex items-center justify-center text-red-300 mb-4 group-hover:text-red-200 transition-colors">
                  {card.icon}
                </div>
                <h3 className="text-lg font-semibold mb-3 text-white group-hover:text-red-400 transition-colors">{card.title}</h3>
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
        className="py-20 bg-gradient-to-b from-[#0d1221] to-[#0B0F19]"
      >
        <div className="px-6 lg:px-12 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg">Top categories</h2>
            <Link to="/events" className="text-sm text-red-400 hover:text-red-300 font-semibold transition-colors">See all →</Link>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
            {categories.map((cat, idx) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.08 }}
                className={`group p-6 md:p-7 rounded-2xl bg-gradient-to-r ${cat.color} text-white font-bold text-lg shadow-lg border border-white/20 hover:border-white/40 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 cursor-pointer relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10">{cat.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ================= PEACE OF MIND ================= */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="py-20 bg-gradient-to-b from-[#0d1221] to-[#0B0F19]"
      >
        <div className="px-6 lg:px-12 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-10 items-center">
            <div className="lg:col-span-1 space-y-4">
              <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-red-400 font-semibold">Peace of mind</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg">Everything stays reliable</h2>
              <p className="text-gray-300 text-base md:text-lg">Transparency, fast fixes, and dependable support so you can book without overthinking it.</p>
            </div>
            <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
              {assurance.map((item, idx) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-red-500/40 transition-colors duration-300"
                >
                  <div className="flex items-center gap-3 mb-3 text-sm font-semibold text-red-200">
                    <span className="w-2 h-2 rounded-full bg-red-400"></span>
                    {item.title}
                  </div>
                  <p className="text-gray-200 text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ================= HOW IT WORKS ================= */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="py-24 bg-gradient-to-b from-[#0B0F19] to-[#0d1221]"
      >
        <div className="px-6 lg:px-12 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-xs md:text-sm uppercase tracking-[0.3em] text-red-400 font-semibold mb-3"
            >
              Simple steps
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-5xl font-extrabold mb-4 text-white drop-shadow-lg"
            >
              Book in under a minute
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-gray-300 max-w-2xl mx-auto text-base md:text-lg"
            >
              Search, pick seats, pay, and get instant QR tickets on your phone.
            </motion.p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Find the event', desc: 'Use search or browse curated picks by city and category.' },
              { title: 'Choose seats', desc: 'See live availability and lock your seats instantly.' },
              { title: 'Scan & enter', desc: 'Show the QR at the gate—no printouts, no hassle.' },
            ].map((step, idx) => (
              <motion.div
                key={step.title}
                viewport={{ once: true }}
                {...(idx === 1
                  ? {}
                  : {
                      initial: { opacity: 0, y: 20 },
                      whileInView: { opacity: 1, y: 0 },
                      transition: { duration: 0.6, delay: idx * 0.15 },
                    })}
                className="group relative p-10 md:p-12 rounded-3xl backdrop-blur-sm transition-all duration-300 overflow-hidden bg-gradient-to-br from-white/8 to-white/3 border border-white/15 hover:-translate-y-1 hover:from-white/15 hover:to-white/8 hover:border-red-500/40"
              >
                <div className={`relative z-10 flex flex-col ${idx === 1 ? 'items-center text-center' : 'items-start'}`}>
                  {/* Step Number Badge */}
                  <div
                    className={`relative mb-8 ${idx === 1 ? 'w-28 h-28 md:w-32 md:h-32' : 'w-16 h-16 md:w-20 md:h-20'}`}
                  >
                    <div className={`relative w-full h-full rounded-full bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center font-bold transition-all ${
                      idx === 1
                        ? 'text-5xl md:text-6xl shadow-2xl shadow-red-500/40'
                        : 'text-2xl md:text-3xl shadow-lg group-hover:shadow-xl group-hover:shadow-red-500/50'
                    }`}>
                      <span className="text-white">{idx + 1}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className={`font-bold mb-5 transition-colors ${
                    idx === 1 
                      ? 'text-3xl md:text-4xl text-white' 
                      : 'text-xl md:text-2xl text-white group-hover:text-red-400'
                  }`}>
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className={`leading-relaxed ${
                    idx === 1 
                      ? 'text-gray-300 text-base md:text-lg max-w-xs' 
                      : 'text-gray-300 text-sm'
                  }`}>
                    {step.desc}
                  </p>
                </div>
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
        className="py-24 bg-gradient-to-b from-[#0d1221] to-[#0B0F19]"
      >
        <div className="px-6 lg:px-12 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-14">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-xs md:text-sm uppercase tracking-[0.25em] text-red-400 font-semibold mb-2">What people say</p>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg">Loved by event-goers</h2>
            </motion.div>
            <Link to="/events" className="text-red-400 font-semibold hover:text-red-300 transition-colors whitespace-nowrap">Discover events →</Link>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((card, idx) => (
              <motion.div
                key={card.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="group p-7 md:p-8 rounded-2xl bg-gradient-to-br from-white/8 to-white/3 border border-white/15 shadow-lg backdrop-blur-sm hover:from-white/15 hover:to-white/8 hover:border-red-500/40 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-400 group-hover:text-yellow-300 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-base md:text-lg leading-relaxed text-gray-100 mb-5 italic">"{card.quote}"</p>
                <p className="text-sm font-semibold text-gray-300 group-hover:text-red-300 transition-colors">— {card.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ================= EVENTS ================= */}
      {/* This section always stays DARK - Light mode does not apply here */}
      <div className="dark">
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="py-28 bg-gradient-to-b from-[#0B0F19] to-[#0d1221] text-white"
        >
          <div className="px-6 lg:px-12 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-red-400 font-semibold mb-3">Trending now</p>
                <h2 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg">Popular Events</h2>
              </motion.div>
              <Link
                to="/events"
                className="text-red-400 font-semibold hover:text-red-300 transition-colors whitespace-nowrap"
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
                  {events.slice(0, 6).map((ev, idx) => (
                    <motion.div
                      key={ev.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: idx * 0.1 }}
                      className="transform hover:-translate-y-2 transition-transform duration-300"
                    >
                      <EventCard event={ev} />
                    </motion.div>
                  ))}
                </div>
              </DarkModeProvider>
            )}
          </div>
        </motion.section>
      </div>

      {/* ================= CTA FOR ORGANIZERS ================= */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="py-24 bg-gradient-to-b from-[#0B0F19] to-[#0d1221] relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-blue-600 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 px-6 lg:px-12 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-blue-400 font-semibold mb-4">For Organizers</p>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-6">
                Ready to Host Your <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Next Event?</span>
              </h2>
              
              <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                Launch your event on K&M Events and reach thousands of enthusiasts. We handle ticketing, QR codes, payments, and support—so you can focus on creating amazing experiences.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  '🎟️ Instant ticket sales with no upfront fees',
                  '📊 Real-time analytics and attendance tracking',
                  '💳 Flexible payment options (cards, UPI, wallets)',
                  '📱 QR-based entry & scanner app included',
                ].map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className="flex items-center gap-3 text-gray-200"
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0"></div>
                    <span>{feature}</span>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link
                  to="/create-event"
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl text-lg font-bold text-white shadow-lg hover:shadow-blue-500/50 transform hover:scale-105 transition-all duration-300 text-center"
                >
                  Submit Your Event
                </Link>
                <Link
                  to="/for-organizers"
                  className="px-8 py-4 border-2 border-blue-400/50 rounded-xl text-lg font-semibold text-blue-300 hover:bg-blue-500/10 hover:border-blue-400 text-center backdrop-blur-sm transition-all duration-300"
                >
                  Learn More
                </Link>
              </motion.div>
            </motion.div>

            {/* Right: Visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden border border-blue-500/30 bg-gradient-to-br from-blue-900/20 to-indigo-900/20 p-8 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-indigo-600/10"></div>
                
                <div className="relative z-10 space-y-6">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="p-6 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-400/30"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">🎯</span>
                      <h3 className="font-bold text-white">4 Plans to Choose From</h3>
                    </div>
                    <p className="text-sm text-gray-300">Basic • Standard • Professional • Enterprise</p>
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                    className="p-6 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-400/30"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">⚡</span>
                      <h3 className="font-bold text-white">Go Live in Minutes</h3>
                    </div>
                    <p className="text-sm text-gray-300">Submit once, get approved by our team</p>
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                    className="p-6 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">🎁</span>
                      <h3 className="font-bold text-white">Feature-Rich Platform</h3>
                    </div>
                    <p className="text-sm text-gray-300">Ticketing, analytics, email notifications & more</p>
                  </motion.div>
                </div>
              </div>

              {/* Floating badge */}
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-4 -right-4 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full font-bold text-black text-sm shadow-lg"
              >
                ✨ New Feature
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ================= CTA ================= */}
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="py-32 bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-red-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-700 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 text-white drop-shadow-lg"
          >
            Don't Miss Out 🎟️
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-white/90 text-lg md:text-xl mb-12 max-w-3xl mx-auto drop-shadow-md"
          >
            Thousands are booking events daily. Secure your spot for unforgettable experiences.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link
              to="/events"
              className="inline-block px-12 py-5 bg-black hover:bg-gray-900 text-white rounded-xl text-lg font-bold shadow-2xl hover:scale-110 hover:shadow-2xl transition-all duration-300"
            >
              Book Now
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </div>
  )
}
