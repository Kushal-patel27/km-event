import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import API from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function Messages() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const fetchMessages = async () => {
      try {
        setLoading(true)
        const token = user?.token || localStorage.getItem('token')
        const config = { headers: { Authorization: `Bearer ${token}` } }
        const response = await API.get('/contact/my', config)
        setMessages(response.data || [])
      } catch (err) {
        console.error('Error fetching messages:', err)
        setError('Failed to load your messages')
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [user, navigate])

  const badgeClass = (status) => {
    switch (status) {
      case 'replied':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'read':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      default:
        return 'bg-black border border-white/10 text-gray-400 dark:bg-black dark:text-gray-400'
    }
  }

  return (
    <div className="bg-black dark:bg-black min-h-screen py-16 px-4 sm:px-6 lg:px-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-gray-900 dark:text-white">
            Your <span className="text-red-600 dark:text-red-500">Messages</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Track your contact submissions and admin replies
          </p>
        </motion.div>

        {/* Loading */}
        {loading && <LoadingSpinner message="Loading your messages..." />}

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-xl text-red-700 dark:text-red-400"
          >
            {error}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !error && messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No messages yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your contact submissions will appear here
            </p>
            <a href="/contact" className="inline-block px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition">
              Send us a Message
            </a>
          </motion.div>
        )}

        {/* Messages List */}
        {!loading && !error && messages.length > 0 && (
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <motion.div
                key={msg._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-black dark:bg-black border border-white/10 dark:border-white/10 rounded-xl overflow-hidden hover:shadow-lg dark:hover:shadow-xl transition"
              >
                {/* Message Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {msg.subject || 'No subject'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
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
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Your Message:</p>
                    <div className="bg-black dark:bg-black border border-white/10 p-4 rounded-lg text-gray-300 dark:text-gray-300 whitespace-pre-wrap break-words">
                      {msg.message}
                    </div>
                  </div>

                  {/* Admin Reply */}
                  {msg.reply && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded-lg"
                    >
                      <p className="text-sm text-green-700 dark:text-green-400 font-semibold mb-3">
                        ✓ Admin Reply {msg.replyDate && `- ${new Date(msg.replyDate).toLocaleDateString()}`}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                        {msg.reply}
                      </p>
                    </motion.div>
                  )}

                  {!msg.reply && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                      <p className="text-sm text-yellow-700 dark:text-yellow-400">
                        ⏳ Waiting for admin reply...
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
