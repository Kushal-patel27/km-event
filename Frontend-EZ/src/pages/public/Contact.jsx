import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import API from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useDarkMode } from '../../context/DarkModeContext'

export default function Contact() {
  const { user } = useAuth()
  const { isDarkMode } = useDarkMode()
  const [activeTab, setActiveTab] = useState('form')
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    subject: '',
    message: ''
  })

  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messagesError, setMessagesError] = useState(null)

  // Fetch messages when user is logged in
  const fetchMessages = async () => {
    if (!user) return
    try {
      setMessagesLoading(true)
      const token = user?.token || localStorage.getItem('token')
      const config = { headers: { Authorization: `Bearer ${token}` } }
      const response = await API.get('/contact/my', config)
      setMessages(response.data || [])
      setMessagesError(null)
    } catch (err) {
      console.error('Error fetching messages:', err)
      setMessagesError('Failed to load your messages')
    } finally {
      setMessagesLoading(false)
    }
  }

  // Fetch messages when switching to messages tab
  useEffect(() => {
    if (activeTab === 'messages' && user) {
      fetchMessages()
    }
  }, [activeTab, user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const token = user?.token || localStorage.getItem('token')
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      await API.post('/contact', formData, config)
      setLoading(false)
      setSubmitted(true)
      setFormData({ name: user?.name || '', email: user?.email || '', subject: '', message: '' })
      setTimeout(() => setSubmitted(false), 5000)
      // Refresh messages if user is logged in
      if (user) {
        setTimeout(() => fetchMessages(), 1000)
      }
    } catch (err) {
      setLoading(false)
      setError(err.response?.data?.error || 'Failed to submit contact form. Please try again.')
      console.error('Error submitting contact:', err)
    }
  }

  const badgeClass = (status) => {
    switch (status) {
      case 'replied':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'read':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
    }
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
              Get In <span className="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">Touch</span>
            </h1>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-xl md:text-2xl text-gray-200 drop-shadow-md max-w-3xl mx-auto"
            >
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ================= CONTACT CONTENT ================= */}
      <section className="py-24 px-4 sm:px-6 lg:px-12 bg-gradient-to-b from-[#0d1221] to-[#0B0F19]">
        <div className="max-w-6xl mx-auto">
          {/* Tab Navigation - Only show for logged in users */}
        {user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex gap-4 mb-12 border-b border-white/10 pb-4"
          >
            <button
              onClick={() => setActiveTab('form')}
              className={`px-6 py-3 font-bold transition-all relative text-lg ${
                activeTab === 'form'
                  ? 'text-red-500'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Send Message
              {activeTab === 'form' && (
                <motion.div
                  layoutId="underline"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-red-600"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`px-6 py-3 font-bold transition-all relative flex items-center gap-3 text-lg ${
                activeTab === 'messages'
                  ? 'text-red-500'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              My Messages
              {messages.length > 0 && (
                <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold bg-red-500 text-white rounded-full">
                  {messages.length}
                </span>
              )}
              {activeTab === 'messages' && (
                <motion.div
                  layoutId="underline"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-red-500"
                />
              )}
            </button>
          </motion.div>
        )}

        {/* Form Tab */}
        {activeTab === 'form' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="grid md:grid-cols-2 gap-12 items-start"
          >
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="p-8 md:p-10 rounded-2xl bg-gradient-to-br from-white/8 to-white/3 border border-white/15 backdrop-blur-sm hover:from-white/12 hover:to-white/8 hover:border-red-500/40 transition-all duration-300">
                <h2 className="text-3xl font-extrabold mb-8 text-white drop-shadow-lg">Contact Information</h2>
                
                <div className="space-y-8">
                  {/* Email */}
                  <motion.div 
                    whileHover={{ x: 5 }}
                    className="flex gap-5 p-5 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-all group"
                  >
                    <div className="text-4xl group-hover:scale-110 transition-transform">📧</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2 text-white group-hover:text-red-400 transition-colors">Email</h3>
                      <p className="text-gray-300">support@kmevents.com</p>
                      <p className="text-gray-300">info@kmevents.com</p>
                    </div>
                  </motion.div>

                  {/* Phone */}
                  <motion.div 
                    whileHover={{ x: 5 }}
                    className="flex gap-5 p-5 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-all group"
                  >
                    <div className="text-4xl group-hover:scale-110 transition-transform">📱</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2 text-white group-hover:text-red-400 transition-colors">Phone</h3>
                      <p className="text-gray-300">+1 (555) 123-4567</p>
                      <p className="text-gray-300">+1 (555) 987-6543</p>
                    </div>
                  </motion.div>

                  {/* Address */}
                  <motion.div 
                    whileHover={{ x: 5 }}
                    className="flex gap-5 p-5 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-all group"
                  >
                    <div className="text-4xl group-hover:scale-110 transition-transform">📍</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2 text-white group-hover:text-red-400 transition-colors">Office Address</h3>
                      <p className="text-gray-300">123 Event Street</p>
                      <p className="text-gray-300">New York, NY 10001</p>
                    </div>
                  </motion.div>

                  {/* Hours */}
                  <motion.div 
                    whileHover={{ x: 5 }}
                    className="flex gap-5 p-5 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-all group"
                  >
                    <div className="text-4xl group-hover:scale-110 transition-transform">🕐</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2 text-white group-hover:text-red-400 transition-colors">Business Hours</h3>
                      <p className="text-gray-300">Monday - Friday: 9:00 AM - 6:00 PM</p>
                      <p className="text-gray-300">Saturday: 10:00 AM - 4:00 PM</p>
                      <p className="text-gray-300">Sunday: Closed</p>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Social Media */}
              <div className="p-8 md:p-10 rounded-2xl bg-gradient-to-br from-white/8 to-white/3 border border-white/15 backdrop-blur-sm hover:from-white/12 hover:to-white/8 hover:border-red-500/40 transition-all duration-300">
                <h3 className="text-2xl font-extrabold mb-8 text-white drop-shadow-lg">Follow Us</h3>
                <div className="flex gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    className="w-14 h-14 bg-gradient-to-br from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 rounded-lg flex items-center justify-center transition text-xl font-bold shadow-lg hover:shadow-red-500/50"
                  >
                    f
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    className="w-14 h-14 bg-gradient-to-br from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 rounded-lg flex items-center justify-center transition text-xl font-bold shadow-lg hover:shadow-red-500/50"
                  >
                    𝕏
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    className="w-14 h-14 bg-gradient-to-br from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 rounded-lg flex items-center justify-center transition text-xl font-bold shadow-lg hover:shadow-red-500/50"
                  >
                    📷
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    className="w-14 h-14 bg-gradient-to-br from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 rounded-lg flex items-center justify-center transition text-xl font-bold shadow-lg hover:shadow-red-500/50"
                  >
                    in
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white/5 p-8 md:p-10 rounded-xl border border-white/10 backdrop-blur-sm"
            >
              <h2 className="text-2xl font-bold mb-8">Send us a Message</h2>
              
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-center"
                >
                  ✗ {error}
                </motion.div>
              )}

              {submitted && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 text-center"
                >
                  ✓ Thank you! We've received your message and will get back to you soon.
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-bold mb-3">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white placeholder-gray-500 transition"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-bold mb-3">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white placeholder-gray-500 transition"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-bold mb-3">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="How can we help?"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white placeholder-gray-500 transition"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-bold mb-3 text-white">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    placeholder="Tell us more about your inquiry..."
                    className="w-full px-4 py-3 bg-white/8 border border-white/20 rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/50 text-white placeholder-gray-400 transition resize-none"
                  />
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-500 rounded-lg text-lg font-bold transition flex items-center justify-center gap-2 shadow-lg hover:shadow-red-500/50"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <span>→</span>
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && user && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Loading */}
            {messagesLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-4 text-red-600 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-gray-400">Loading your messages...</p>
                </div>
              </div>
            )}

            {/* Error */}
            {messagesError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-500/20 border border-red-500/50 p-6 rounded-xl text-red-300"
              >
                {messagesError}
              </motion.div>
            )}

            {/* Empty State */}
            {!messagesLoading && !messagesError && messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-2xl font-bold mb-2">No messages yet</h3>
                <p className="text-gray-400 mb-6">
                  Your contact submissions will appear here once you send a message
                </p>
                <button
                  onClick={() => setActiveTab('form')}
                  className="inline-block px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
                >
                  Send us a Message
                </button>
              </motion.div>
            )}

            {/* Messages List */}
            {!messagesLoading && !messagesError && messages.length > 0 && (
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <motion.div
                    key={msg._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-red-500/50 transition"
                  >
                    {/* Message Header */}
                    <div className="p-6 border-b border-white/10">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold mb-2">
                            {msg.subject || 'No subject'}
                          </h3>
                          <p className="text-sm text-gray-400">
                            Sent on {new Date(msg.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${badgeClass(msg.status)}`}>
                          {msg.status === 'replied' ? '✓ Replied' : msg.status === 'read' ? '👁 Viewed' : 'New'}
                        </span>
                      </div>
                    </div>

                    {/* Message Content */}
                    <div className="p-6">
                      <div className="mb-6">
                        <p className="text-sm text-gray-400 font-medium mb-2">Your Message:</p>
                        <div className="bg-white/5 p-4 rounded-lg text-gray-300 whitespace-pre-wrap break-words">
                          {msg.message}
                        </div>
                      </div>

                      {/* Admin Reply */}
                      {msg.reply && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-green-500/10 border-l-4 border-green-500 p-4 rounded-lg"
                        >
                          <p className="text-sm text-green-400 font-semibold mb-3">
                            ✓ Admin Reply {msg.replyDate && `- ${new Date(msg.replyDate).toLocaleDateString()}`}
                          </p>
                          <p className="text-gray-300 whitespace-pre-wrap break-words">
                            {msg.reply}
                          </p>
                        </motion.div>
                      )}

                      {!msg.reply && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
                          <p className="text-sm text-yellow-400">
                            ⏳ Waiting for admin reply...
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Guest Prompt if not logged in */}
        {!user && activeTab === 'form' && (
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="bg-white/5 p-8 rounded-xl border border-white/10 backdrop-blur-sm">
                <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
                
                <div className="space-y-6">
                  {/* Email */}
                  <div className="flex gap-4">
                    <div className="text-3xl">📧</div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">Email</h3>
                      <p className="text-gray-400">support@kmevents.com</p>
                      <p className="text-gray-400">info@kmevents.com</p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex gap-4">
                    <div className="text-3xl">📱</div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">Phone</h3>
                      <p className="text-gray-400">+1 (555) 123-4567</p>
                      <p className="text-gray-400">+1 (555) 987-6543</p>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex gap-4">
                    <div className="text-3xl">📍</div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">Office Address</h3>
                      <p className="text-gray-400">123 Event Street</p>
                      <p className="text-gray-400">New York, NY 10001</p>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="flex gap-4">
                    <div className="text-3xl">🕐</div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">Business Hours</h3>
                      <p className="text-gray-400">Monday - Friday: 9:00 AM - 6:00 PM</p>
                      <p className="text-gray-400">Saturday: 10:00 AM - 4:00 PM</p>
                      <p className="text-gray-400">Sunday: Closed</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="bg-white/5 p-8 rounded-xl border border-white/10 backdrop-blur-sm">
                <h3 className="text-2xl font-bold mb-6">Follow Us</h3>
                <div className="flex gap-4">
                  <button className="w-12 h-12 bg-red-600 hover:bg-red-700 rounded-lg flex items-center justify-center transition text-xl">
                    f
                  </button>
                  <button className="w-12 h-12 bg-red-600 hover:bg-red-700 rounded-lg flex items-center justify-center transition text-xl">
                    𝕏
                  </button>
                  <button className="w-12 h-12 bg-red-600 hover:bg-red-700 rounded-lg flex items-center justify-center transition text-xl">
                    📷
                  </button>
                  <button className="w-12 h-12 bg-red-600 hover:bg-red-700 rounded-lg flex items-center justify-center transition text-xl">
                    in
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white/5 p-8 md:p-10 rounded-xl border border-white/10 backdrop-blur-sm"
            >
              <h2 className="text-2xl font-bold mb-8">Send us a Message</h2>
              
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-center"
                >
                  ✗ {error}
                </motion.div>
              )}

              {submitted && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 text-center"
                >
                  ✓ Thank you! We've received your message and will get back to you soon.
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-bold mb-3">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white placeholder-gray-500 transition"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-bold mb-3">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white placeholder-gray-500 transition"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-bold mb-3">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="How can we help?"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white placeholder-gray-500 transition"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-bold mb-3">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    placeholder="Tell us more about your inquiry..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white placeholder-gray-500 transition resize-none"
                  />
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-500 rounded-lg text-lg font-bold transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <span>→</span>
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
        </div>
      </section>

      {/* FAQ Section */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="py-24 px-4 sm:px-6 lg:px-12 bg-gradient-to-b from-[#0B0F19] to-[#0d1221]"
        >
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-white drop-shadow-lg">Frequently Asked Questions</h2>
              <p className="text-gray-300 text-lg">Find answers to common questions</p>
            </div>
            
            <div className="space-y-4">
              {[
                {
                  q: "What is your response time?",
                  a: "We typically respond to all inquiries within 24 hours during business days."
                },
                {
                  q: "How can I report a technical issue?",
                  a: "Please email us at support@kmevents.com with details of the issue and we'll help you resolve it quickly."
                },
                {
                  q: "Can I cancel or modify my booking?",
                  a: "Yes! You can manage your bookings from your account dashboard. Cancellation policies may vary by event."
                },
                {
                  q: "Is there a mobile app available?",
                  a: "Our web app is fully responsive and works great on mobile devices. Native apps are coming soon!"
                }
              ].map((faq, idx) => (
                <motion.details
                  key={idx}
                  whileHover={{ borderColor: 'rgba(239, 68, 68, 0.5)' }}
                  className="group p-6 rounded-2xl bg-gradient-to-br from-white/8 to-white/3 border border-white/15 backdrop-blur-sm hover:border-red-500/40 cursor-pointer transition-all duration-300 overflow-hidden"
                >
                  <summary className="font-bold text-lg flex items-center justify-between text-white cursor-pointer group-open:text-red-400 transition-colors">
                    {faq.q}
                    <span className="text-red-500 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="px-0 py-4 text-gray-300 text-base">
                    {faq.a}
                  </div>
                </motion.details>
              ))}
            </div>
          </div>
        </motion.section>
    </div>
  )
}
