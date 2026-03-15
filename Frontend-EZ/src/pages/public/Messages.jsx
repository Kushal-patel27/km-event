import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import API from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const USER_NOTIFICATION_TEMPLATES = [
  {
    id: 'event-reminder',
    name: 'Event Reminder',
    title: 'Your event starts soon',
    body: 'Your event begins in 1 hour. Please arrive 15 minutes early for smooth entry.',
    accent: 'from-[#8b1e3f] to-[#e11d48]'
  },
  {
    id: 'ticket-update',
    name: 'Ticket Update',
    title: 'Booking status updated',
    body: 'Your booking has been confirmed successfully. Open My Bookings to view your ticket.',
    accent: 'from-[#1f3a8a] to-[#0ea5e9]'
  },
  {
    id: 'admin-reply',
    name: 'Admin Reply',
    title: 'You received a new reply',
    body: 'Our support team has replied to your message. Open Messages to continue the conversation.',
    accent: 'from-[#065f46] to-[#10b981]'
  },
]

function FloatingUserPopup({ popup, onClose }) {
  if (!popup?.show) return null
  const isError = popup.type === 'error'
  const container = isError
    ? 'from-red-700 to-red-600 border-red-300/40'
    : 'from-[#131419] via-[#24152a] to-[#5e1330] border-rose-300/30'

  return (
    <div className="fixed top-5 right-5 z-[9999] w-[92vw] max-w-md">
      <div className={`rounded-2xl border bg-gradient-to-br ${container} text-white shadow-2xl px-4 py-4`}>
        <div className="flex items-start gap-3">
          <span className="text-xl mt-0.5">{isError ? '⚠️' : '🔔'}</span>
          <div className="flex-1">
            <p className="font-semibold">{popup.title}</p>
            <p className="text-sm text-white/90 mt-1">{popup.message}</p>
          </div>
          <button type="button" onClick={onClose} className="text-white/80 hover:text-white text-lg leading-none">×</button>
        </div>
      </div>
    </div>
  )
}

export default function Messages() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedTemplate, setSelectedTemplate] = useState(USER_NOTIFICATION_TEMPLATES[0])
  const [popup, setPopup] = useState({ show: false, type: 'success', title: '', message: '' })

  const repliedCount = useMemo(() => messages.filter((m) => !!m.reply).length, [messages])

  const notify = useCallback((type, title, message) => {
    setPopup({ show: true, type, title, message })
  }, [])

  useEffect(() => {
    if (!popup.show) return undefined
    const timer = setTimeout(() => setPopup((prev) => ({ ...prev, show: false })), 4000)
    return () => clearTimeout(timer)
  }, [popup.show])

  const fetchMessages = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true)
      const token = user?.token || localStorage.getItem('token')
      const config = { headers: { Authorization: `Bearer ${token}` } }
      const response = await API.get('/contact/my', config)
      const list = response.data || []

      setMessages((prev) => {
        if (silent) {
          const prevReplies = prev.filter((m) => !!m.reply).length
          const nextReplies = list.filter((m) => !!m.reply).length
          if (list.length > prev.length) {
            notify('success', 'New Notification', `${list.length - prev.length} new message notification(s) received.`)
          } else if (nextReplies > prevReplies) {
            notify('success', 'New Reply', `${nextReplies - prevReplies} admin reply notification(s) arrived.`)
          }
        }
        return list
      })

      setError(null)
    } catch (err) {
      console.error('Error fetching messages:', err)
      setError('Failed to load your messages')
      if (silent) notify('error', 'Refresh Failed', 'Could not refresh notifications. Retrying automatically...')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [notify, user])

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    fetchMessages()
    const interval = setInterval(() => fetchMessages({ silent: true }), 30000)
    return () => clearInterval(interval)
  }, [user, navigate, fetchMessages])

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
    <div className="bg-[radial-gradient(circle_at_top,#220812_0%,#08090c_45%,#050507_100%)] min-h-screen py-16 px-4 sm:px-6 lg:px-12">
      <FloatingUserPopup popup={popup} onClose={() => setPopup((prev) => ({ ...prev, show: false }))} />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white">
            Your <span className="text-rose-400">Notifications</span>
          </h1>
          <p className="text-lg text-rose-100/80">
            Premium inbox for support updates, replies, and personalized event alerts.
          </p>
        </motion.div>

        {/* Premium Preview + Templates */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <div className={`rounded-2xl border border-white/10 bg-gradient-to-br ${selectedTemplate.accent} p-5 shadow-xl`}>
            <p className="text-xs uppercase tracking-[0.16em] text-white/80">Preview</p>
            <h3 className="text-lg font-bold text-white mt-2">{selectedTemplate.title}</h3>
            <p className="text-sm text-white/90 mt-2">{selectedTemplate.body}</p>
            <p className="text-xs text-white/70 mt-4">Styled as user-side premium colored notification popup.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-4">
            <p className="text-sm font-semibold text-white mb-3">New Colored Templates</p>
            <div className="space-y-2">
              {USER_NOTIFICATION_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    setSelectedTemplate(tpl)
                    notify('success', `Preview: ${tpl.name}`, tpl.title)
                  }}
                  className={`w-full text-left rounded-xl border px-3 py-2 transition ${
                    selectedTemplate.id === tpl.id
                      ? 'border-rose-300/70 bg-rose-500/10'
                      : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07]'
                  }`}
                >
                  <p className="text-sm font-semibold text-white">{tpl.name}</p>
                  <p className="text-xs text-rose-100/80 truncate">{tpl.title}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/35 p-4 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-white">
            <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3">
              <p className="text-xs text-rose-200 uppercase tracking-wide">Total</p>
              <p className="text-2xl font-bold">{messages.length}</p>
            </div>
            <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3">
              <p className="text-xs text-rose-200 uppercase tracking-wide">Replies</p>
              <p className="text-2xl font-bold">{repliedCount}</p>
            </div>
            <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3">
              <p className="text-xs text-rose-200 uppercase tracking-wide">Waiting</p>
              <p className="text-2xl font-bold">{Math.max(0, messages.length - repliedCount)}</p>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && <LoadingSpinner message="Loading your messages..." />}

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-950/40 border border-red-400/30 p-6 rounded-xl text-red-200"
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
            <h3 className="text-2xl font-bold text-white mb-2">No notifications yet</h3>
            <p className="text-rose-100/80 mb-6">
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
                className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden hover:shadow-xl hover:border-rose-300/30 transition backdrop-blur"
              >
                {/* Message Header */}
                <div className="p-6 border-b border-white/10">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {msg.subject || 'No subject'}
                      </h3>
                      <p className="text-sm text-rose-100/75">
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
                    <p className="text-sm text-rose-100/80 font-medium mb-2">Your Message:</p>
                    <div className="bg-black/35 border border-white/10 p-4 rounded-xl text-gray-200 whitespace-pre-wrap break-words">
                      {msg.message}
                    </div>
                  </div>

                  {/* Admin Reply */}
                  {msg.reply && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-emerald-900/30 to-emerald-700/20 border-l-4 border-emerald-400 p-4 rounded-lg"
                    >
                      <p className="text-sm text-emerald-300 font-semibold mb-3">
                        ✓ Admin Reply {msg.replyDate && `- ${new Date(msg.replyDate).toLocaleDateString()}`}
                      </p>
                      <p className="text-emerald-100 whitespace-pre-wrap break-words">
                        {msg.reply}
                      </p>
                    </motion.div>
                  )}

                  {!msg.reply && (
                    <div className="bg-amber-900/20 border border-amber-500/30 p-4 rounded-lg">
                      <p className="text-sm text-amber-300">
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
