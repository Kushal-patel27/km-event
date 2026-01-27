import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import API from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useDarkMode } from '../../context/DarkModeContext'

const statusColors = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', badge: 'bg-yellow-200', darkBg: 'dark:bg-yellow-900/30', darkText: 'dark:text-yellow-300' },
  APPROVED: { bg: 'bg-green-100', text: 'text-green-800', badge: 'bg-green-200', darkBg: 'dark:bg-green-900/30', darkText: 'dark:text-green-300' },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-800', badge: 'bg-red-200', darkBg: 'dark:bg-red-900/30', darkText: 'dark:text-red-300' }
}

const planPricing = {
  Basic: '₹999',
  Standard: '₹2,499',
  Professional: '₹4,999',
  Enterprise: 'Custom'
}

export default function MyEventRequests() {
  const { user } = useAuth()
  const { isDarkMode } = useDarkMode()
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchMyRequests()
  }, [user, navigate])

  const fetchMyRequests = async () => {
    try {
      setLoading(true)
      const { data } = await API.get('/event-requests/my-requests', {
        headers: { Authorization: `Bearer ${user?.token || localStorage.getItem('token')}` }
      })
      setRequests(data.requests || [])
    } catch (err) {
      console.error('Error fetching requests:', err)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredRequests = () => {
    if (filter === 'ALL') return requests
    return requests.filter(req => req.status === filter)
  }

  const filteredRequests = useMemo(() => getFilteredRequests(), [requests, filter])
  const pendingCount = useMemo(() => requests.filter(r => r.status === 'PENDING').length, [requests])
  const approvedCount = useMemo(() => requests.filter(r => r.status === 'APPROVED').length, [requests])
  const rejectedCount = useMemo(() => requests.filter(r => r.status === 'REJECTED').length, [requests])

  const formatDate = (date) => {
    if (!date) return 'N/A'
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return 'N/A'
    return parsed.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <div className={`animate-spin rounded-full h-12 w-12 border-4 border-gray-300 mx-auto mb-4 ${isDarkMode ? 'border-t-red-400' : 'border-t-red-600'}`}></div>
          <p>Loading your requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen py-8 px-4 transition-colors ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className={`text-4xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            My Event Requests
          </h1>
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Track the status of your event creation requests
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-lg p-4 ${isDarkMode ? 'bg-yellow-900/30 border border-yellow-700' : 'bg-yellow-50 border border-yellow-200'}`}
          >
            <div className={`text-sm font-semibold ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>Pending</div>
            <div className={`text-3xl font-bold ${isDarkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>{pendingCount}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className={`rounded-lg p-4 ${isDarkMode ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200'}`}
          >
            <div className={`text-sm font-semibold ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>Approved</div>
            <div className={`text-3xl font-bold ${isDarkMode ? 'text-green-200' : 'text-green-800'}`}>{approvedCount}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className={`rounded-lg p-4 ${isDarkMode ? 'bg-red-900/30 border border-red-700' : 'bg-red-50 border border-red-200'}`}
          >
            <div className={`text-sm font-semibold ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>Rejected</div>
            <div className={`text-3xl font-bold ${isDarkMode ? 'text-red-200' : 'text-red-800'}`}>{rejectedCount}</div>
          </motion.div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                filter === status
                  ? isDarkMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-600 text-white'
                  : isDarkMode
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-center py-12 rounded-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
          >
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              {requests.length === 0 
                ? 'You haven\'t submitted any event requests yet.'
                : `No ${filter === 'ALL' ? 'requests' : filter.toLowerCase()} found.`}
            </p>
            {requests.length === 0 && (
              <button
                onClick={() => navigate('/create-event')}
                className={`mt-4 px-6 py-2 rounded-lg font-semibold transition ${
                  isDarkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Create an Event
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request, index) => {
              const colors = statusColors[request.status]
              return (
                <motion.div
                  key={request._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                >
                  {/* Request Summary */}
                  <button
                    onClick={() => setExpandedId(expandedId === request._id ? null : request._id)}
                    className="w-full text-left p-6 hover:opacity-90 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {request.title}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                            📅 Submitted {formatDate(request.createdAt)}
                          </div>
                          <div className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                            📆 Event: {formatDate(request.date)}
                          </div>
                          <div className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                            📋 Plan: <span className="font-semibold">{request.planSelected}</span>
                          </div>
                          <div className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                            🎟️ {request.totalTickets || 0} tickets
                          </div>
                        </div>
                      </div>

                      <div className="ml-4">
                        <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${colors.bg} ${colors.text} ${isDarkMode ? colors.darkBg + ' ' + colors.darkText : ''}`}>
                          {request.status}
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {expandedId === request._id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`px-6 pb-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                    >
                      {/* Details Grid */}
                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Event Details
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className={`font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Date:</span>
                              <p className={isDarkMode ? 'text-gray-300' : 'text-gray-800'}>{formatDate(request.date)}</p>
                            </div>
                            <div>
                              <span className={`font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Location:</span>
                              <p className={isDarkMode ? 'text-gray-300' : 'text-gray-800'}>{request.location}</p>
                            </div>
                            <div>
                              <span className={`font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Category:</span>
                              <p className={isDarkMode ? 'text-gray-300' : 'text-gray-800'}>{request.category}</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Your Information
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className={`font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Company:</span>
                              <p className={isDarkMode ? 'text-gray-300' : 'text-gray-800'}>{request.organizerCompany || 'Not provided'}</p>
                            </div>
                            <div>
                              <span className={`font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Phone:</span>
                              <p className={isDarkMode ? 'text-gray-300' : 'text-gray-800'}>{request.organizerPhone || 'Not provided'}</p>
                            </div>
                            <div>
                              <span className={`font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Plan Price:</span>
                              <p className={isDarkMode ? 'text-gray-300' : 'text-gray-800'}>{planPricing[request.planSelected] || '—'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="mb-6">
                        <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Event Description
                        </h4>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {request.description}
                        </p>
                      </div>

                      {/* Rejection Reason */}
                      {request.status === 'REJECTED' && request.rejectReason && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`rounded-lg p-4 ${isDarkMode ? 'bg-red-900/30 border border-red-700' : 'bg-red-50 border border-red-200'}`}
                        >
                          <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                            Rejection Reason
                          </h4>
                          <p className={`text-sm ${isDarkMode ? 'text-red-200' : 'text-red-800'}`}>
                            {request.rejectReason}
                          </p>
                        </motion.div>
                      )}

                      {/* Approval Message */}
                      {request.status === 'APPROVED' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`rounded-lg p-4 ${isDarkMode ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200'}`}
                        >
                          <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                            🎉 Event Approved!
                          </h4>
                          <p className={`text-sm mb-3 ${isDarkMode ? 'text-green-200' : 'text-green-800'}`}>
                            Your event has been approved and is now live. You can now configure features and start managing your event.
                          </p>
                          <p className={`text-sm ${isDarkMode ? 'text-green-200' : 'text-green-800'}`}>
                            Check your email for details on managing the event.
                          </p>
                        </motion.div>
                      )}

                      {/* Pending Status */}
                      {request.status === 'PENDING' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`rounded-lg p-4 ${isDarkMode ? 'bg-yellow-900/30 border border-yellow-700' : 'bg-yellow-50 border border-yellow-200'}`}
                        >
                          <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                            ⏳ Under Review
                          </h4>
                          <p className={`text-sm ${isDarkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                            Your event request is being reviewed by our admin team. You'll receive an email notification once it's approved or rejected.
                          </p>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Create Event CTA */}
        {filteredRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-8 rounded-lg p-6 text-center ${isDarkMode ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}
          >
            <h3 className={`font-bold mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
              Want to create another event?
            </h3>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-blue-200' : 'text-blue-600'}`}>
              You can submit multiple event creation requests
            </p>
            <button
              onClick={() => navigate('/create-event')}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Create a New Event
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
