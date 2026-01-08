import React, { useEffect, useState } from 'react'
import API from '../services/api'
import { useDarkMode } from '../context/DarkModeContext'
import { motion } from 'framer-motion'

export default function About() {
    const { isDarkMode } = useDarkMode()
    const [aboutData, setAboutData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
      const fetchAbout = async () => {
        try {
          const response = await API.get('/about')
          setAboutData(response.data)
          setLoading(false)
        } catch (err) {
          console.error('Error fetching about data:', err)
          setError('Failed to load about page')
          setLoading(false)
        }
      }
      fetchAbout()
    }, [])

    if (loading) {
      return (
        <div className={`min-h-screen flex items-center justify-center transition-colors ${
          isDarkMode 
            ? 'bg-gradient-to-b from-[#0B0F19] via-[#0d1221] to-[#0B0F19] text-white' 
            : 'bg-gray-50 text-gray-900'
        }`}>
          <div className="text-center">
            <img 
              src="/assets/logo.png" 
              alt="K&M Events" 
              className="w-40 h-40 mx-auto object-contain animate-pulse drop-shadow-2xl"
            />
            <p className="mt-6 text-gray-400 text-sm md:text-base animate-pulse">Loading about page...</p>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className={`min-h-screen flex items-center justify-center transition-colors ${
          isDarkMode 
            ? 'bg-gradient-to-b from-[#0B0F19] via-[#0d1221] to-[#0B0F19] text-white' 
            : 'bg-gray-50 text-gray-900'
        }`}>
          <div className="text-center">
            <p className="text-red-500 text-lg mb-4">{error}</p>
            <a href="/" className="text-red-400 hover:text-red-300 transition-colors">Go back home</a>
          </div>
        </div>
      )
    }

    const stats = aboutData?.stats || {
      activeUsers: 10000,
      eventsListed: 500,
      ticketsSold: 50000,
      satisfactionRate: 98
    }
  return (
    <div className={`min-h-screen transition-colors ${
      isDarkMode 
        ? 'bg-gradient-to-b from-[#0B0F19] via-[#0d1221] to-[#0B0F19] text-white' 
        : 'bg-white text-gray-900'
    }`}>
      {/* ================= HERO SECTION ================= */}
      <section className="relative py-24 md:py-32 px-4 sm:px-6 lg:px-12 bg-gradient-to-b from-[#0B0F19] to-[#0d1221]">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 text-white drop-shadow-lg">
              About <span className="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">K&M Events</span>
            </h1>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-xl md:text-2xl text-gray-200 drop-shadow-md"
            >
              Your gateway to unforgettable live experiences
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ================= MISSION SECTION ================= */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="py-24 px-4 sm:px-6 lg:px-12 bg-gradient-to-b from-[#0d1221] to-[#0B0F19]"
      >
        <div className="max-w-4xl mx-auto">
          <div className="p-8 md:p-12 rounded-2xl bg-gradient-to-br from-white/8 to-white/3 border border-white/15 backdrop-blur-sm hover:from-white/12 hover:to-white/8 hover:border-red-500/40 transition-all duration-300">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-white drop-shadow-lg">Our Mission</h2>
            <p className="text-lg text-gray-200 leading-relaxed mb-5">
              {aboutData?.mission || 'At K&M Events, we believe that live experiences bring people together and create unforgettable memories.'}
            </p>
            <p className="text-lg text-gray-300 leading-relaxed">
              {aboutData?.description || 'We connect passionate event organizers with enthusiastic attendees through a seamless, secure, and innovative ticketing platform that celebrates the magic of live entertainment.'}
            </p>
          </div>
        </div>
      </motion.section>

      {/* ================= WHAT WE OFFER ================= */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="py-24 px-4 sm:px-6 lg:px-12 bg-gradient-to-b from-[#0B0F19] to-[#0d1221]"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-white drop-shadow-lg">What We Offer</h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Industry-leading features designed to make your event experience seamless and enjoyable
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0 }}
              className="group p-8 rounded-2xl bg-gradient-to-br from-white/8 to-white/3 border border-white/15 backdrop-blur-sm hover:from-white/12 hover:to-white/8 hover:border-red-500/40 transition-all duration-300 hover:-translate-y-2"
            >
              <div className="text-5xl mb-5 group-hover:scale-110 transition-transform">🎟️</div>
              <h3 className="text-xl font-bold mb-4 text-white group-hover:text-red-400 transition-colors">QR Tickets</h3>
              <p className="text-gray-300 leading-relaxed">
                Digital tickets with QR codes for instant verification. No printing needed, fully eco-friendly and secure.
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="group p-8 rounded-2xl bg-gradient-to-br from-white/8 to-white/3 border border-white/15 backdrop-blur-sm hover:from-white/12 hover:to-white/8 hover:border-red-500/40 transition-all duration-300 hover:-translate-y-2"
            >
              <div className="text-5xl mb-5 group-hover:scale-110 transition-transform">💺</div>
              <h3 className="text-xl font-bold mb-4 text-white group-hover:text-red-400 transition-colors">Seat Selection</h3>
              <p className="text-gray-300 leading-relaxed">
                Real-time interactive seat maps so you can choose your perfect spot before booking.
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="group p-8 rounded-2xl bg-gradient-to-br from-white/8 to-white/3 border border-white/15 backdrop-blur-sm hover:from-white/12 hover:to-white/8 hover:border-red-500/40 transition-all duration-300 hover:-translate-y-2"
            >
              <div className="text-5xl mb-5 group-hover:scale-110 transition-transform">🔒</div>
              <h3 className="text-xl font-bold mb-4 text-white group-hover:text-red-400 transition-colors">Secure Booking</h3>
              <p className="text-gray-300 leading-relaxed">
                Safe and secure payment processing with full protection for your personal information.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ================= WHY CHOOSE US ================= */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="py-24 px-4 sm:px-6 lg:px-12 bg-gradient-to-b from-[#0d1221] to-[#0B0F19]"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-white drop-shadow-lg">Why Choose K&M Events?</h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              We're committed to providing the best event booking experience
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: '⚡', title: 'Instant Booking', desc: 'Book your tickets in seconds with our intuitive interface' },
              { icon: '🌍', title: 'Wide Selection', desc: 'Access concerts, comedy shows, festivals, workshops, and more' },
              { icon: '📱', title: 'Mobile Friendly', desc: 'Manage your bookings on the go with our responsive design' },
              { icon: '🎯', title: 'Real-time Updates', desc: 'Get instant notifications about event changes and new releases' },
              { icon: '💰', title: 'Best Prices', desc: 'Fair pricing with no hidden fees or surprise charges' },
              { icon: '🤝', title: 'Customer Support', desc: 'Dedicated support team ready to help you anytime' },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.08 }}
                className="group flex gap-6 p-7 rounded-2xl bg-gradient-to-r from-white/8 to-white/3 border border-white/15 backdrop-blur-sm hover:from-white/12 hover:to-white/8 hover:border-red-500/40 transition-all duration-300 hover:-translate-x-1"
              >
                <div className="text-4xl flex-shrink-0 group-hover:scale-125 transition-transform">{item.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2 text-white group-hover:text-red-400 transition-colors">{item.title}</h3>
                  <p className="text-gray-300 text-sm">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ================= STATS SECTION ================= */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="py-24 px-4 sm:px-6 lg:px-12 bg-gradient-to-b from-[#0B0F19] to-[#0d1221]"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-white drop-shadow-lg">Our Impact</h2>
            <p className="text-gray-300 text-lg">Join millions of happy customers worldwide</p>
          </div>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { number: `${(stats.activeUsers / 1000).toFixed(0)}K+`, label: 'Active Users' },
              { number: `${stats.eventsListed}+`, label: 'Events Listed' },
              { number: `${(stats.ticketsSold / 1000).toFixed(0)}K+`, label: 'Tickets Sold' },
              { number: `${stats.satisfactionRate}%`, label: 'Satisfaction Rate' },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="group p-8 rounded-2xl bg-gradient-to-br from-white/8 to-white/3 border border-white/15 backdrop-blur-sm hover:from-white/12 hover:to-white/8 hover:border-red-500/50 transition-all duration-300 text-center hover:-translate-y-2"
              >
                <div className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-400 mb-3 group-hover:from-red-400 group-hover:to-red-300">
                  {stat.number}
                </div>
                <p className="text-gray-300 font-semibold">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ================= CONTACT CTA ================= */}
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="py-28 px-4 sm:px-6 lg:px-12 bg-gradient-to-r from-red-600 via-red-500 to-red-600 relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-red-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-700 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 text-white drop-shadow-lg"
          >
            Ready to Experience Live Events?
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-white/90 text-lg md:text-xl mb-10 drop-shadow-md"
          >
            Join thousands of happy customers booking their favorite events today.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <a 
              href="/events"
              className="inline-block px-12 py-5 bg-black hover:bg-gray-900 text-white rounded-xl text-lg font-bold shadow-2xl hover:scale-110 hover:shadow-2xl transition-all duration-300"
            >
              Start Exploring Events
            </a>
          </motion.div>
        </div>
      </motion.section>
    </div>
  )
}