import React, { useEffect, useState } from 'react'
import API from '../services/api'
import { motion } from 'framer-motion'

export default function About() {
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
        <div className="bg-gradient-to-br from-[#0B0F19] to-[#1a1f2e] text-white min-h-screen flex items-center justify-center">
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
        <div className="bg-gradient-to-br from-[#0B0F19] to-[#1a1f2e] text-white min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 text-lg mb-4">{error}</p>
            <a href="/" className="text-red-600 hover:text-red-500">Go back home</a>
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
    <div className="bg-gradient-to-br from-[#0B0F19] to-[#1a1f2e] text-white min-h-screen py-16 px-4 sm:px-6 lg:px-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto mb-16"
      >
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-center">
          About <span className="text-red-500">K&M Events</span>
        </h1>
        <p className="text-xl text-gray-300 text-center">
          Your gateway to unforgettable live experiences
        </p>
      </motion.div>

      {/* Mission Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="max-w-4xl mx-auto mb-20"
      >
        <div className="bg-gradient-to-br from-red-600/20 to-red-500/10 p-8 md:p-12 rounded-2xl border border-red-500/30">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Mission</h2>
          <p className="text-lg text-gray-300 leading-relaxed mb-4">
            {aboutData?.mission || 'At K&M Events, we believe that live experiences bring people together.'}
          </p>
          <p className="text-lg text-gray-300 leading-relaxed">
            {aboutData?.description || 'We connect passionate event organizers with enthusiastic attendees.'}
          </p>
        </div>
      </motion.section>

      {/* What We Offer */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="max-w-4xl mx-auto mb-20"
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">What We Offer</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white/5 p-8 rounded-xl border border-white/10 backdrop-blur-sm hover:border-red-500/50 transition"
          >
            <div className="text-4xl mb-4">🎟️</div>
            <h3 className="text-xl font-bold mb-4">QR Tickets</h3>
            <p className="text-gray-400">
              Digital tickets with QR codes for instant verification. No printing needed, fully eco-friendly.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white/5 p-8 rounded-xl border border-white/10 backdrop-blur-sm hover:border-red-500/50 transition"
          >
            <div className="text-4xl mb-4">💺</div>
            <h3 className="text-xl font-bold mb-4">Seat Selection</h3>
            <p className="text-gray-400">
              Real-time interactive seat maps so you can choose your perfect spot before booking.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white/5 p-8 rounded-xl border border-white/10 backdrop-blur-sm hover:border-red-500/50 transition"
          >
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold mb-4">Secure Booking</h3>
            <p className="text-gray-400">
              Safe and secure payment processing with full protection for your personal information.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Why Choose Us */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="max-w-4xl mx-auto mb-20"
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Why Choose K&M Events?</h2>
        <div className="space-y-6">
          {[
            { icon: '⚡', title: 'Instant Booking', desc: 'Book your tickets in seconds with our intuitive interface' },
            { icon: '🌍', title: 'Wide Selection', desc: 'Access concerts, comedy shows, festivals, and more' },
            { icon: '📱', title: 'Mobile Friendly', desc: 'Manage your bookings on the go with our responsive design' },
            { icon: '🎯', title: 'Real-time Updates', desc: 'Get instant notifications about event changes and new releases' },
            { icon: '💰', title: 'Best Prices', desc: 'Fair pricing with no hidden fees or surprise charges' },
            { icon: '🤝', title: 'Customer Support', desc: 'Dedicated support team ready to help you anytime' },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ x: 10 }}
              className="flex gap-6 p-6 bg-white/5 rounded-lg border border-white/10 hover:border-red-500/50 transition"
            >
              <div className="text-4xl flex-shrink-0">{item.icon}</div>
              <div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Stats */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="max-w-4xl mx-auto mb-20"
      >
        <div className="grid md:grid-cols-4 gap-6 text-center">
          {[
            { number: `${(stats.activeUsers / 1000).toFixed(0)}K+`, label: 'Active Users' },
            { number: `${stats.eventsListed}+`, label: 'Events Listed' },
            { number: `${(stats.ticketsSold / 1000).toFixed(0)}K+`, label: 'Tickets Sold' },
            { number: `${stats.satisfactionRate}%`, label: 'Satisfaction Rate' },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-red-600/20 to-red-500/10 p-8 rounded-xl border border-red-500/30"
            >
              <div className="text-4xl md:text-5xl font-extrabold text-red-500 mb-3">
                {stat.number}
              </div>
              <p className="text-gray-300">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Contact CTA */}
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-gradient-to-r from-red-600 to-red-500 p-12 rounded-2xl text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Experience Live Events?</h2>
          <p className="text-lg text-white/80 mb-8">
            Join thousands of happy customers booking their favorite events today.
          </p>
          <button className="px-12 py-4 bg-black text-white rounded-xl text-lg font-bold hover:scale-105 transition">
            Start Exploring Events
          </button>
        </div>
      </motion.section>
    </div>
  )
}
