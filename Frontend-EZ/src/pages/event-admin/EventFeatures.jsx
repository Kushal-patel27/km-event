import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import API from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useDarkMode } from '../../context/DarkModeContext'

const featureIcons = {
  ticketing: '🎫',
  qrCheckIn: '📱',
  scannerApp: '🔍',
  analytics: '📊',
  emailSms: '💬',
  payments: '💳',
  weatherAlerts: '🌦️',
  subAdmins: '👥',
  reports: '📈'
}

const featureDescriptions = {
  ticketing: 'Sell and manage event tickets',
  qrCheckIn: 'Generate QR codes for attendee check-in',
  scannerApp: 'Mobile app for scanning entry tickets',
  analytics: 'Track event metrics and attendance',
  emailSms: 'Send notifications to attendees',
  payments: 'Process payments and manage wallet',
  weatherAlerts: 'Get weather updates for outdoor events',
  subAdmins: 'Add team members to manage events',
  reports: 'Generate detailed event reports'
}

export default function EventAdminDashboard() {
  const { user } = useAuth()
  const { isDarkMode } = useDarkMode()
  const [enabledFeatures, setEnabledFeatures] = useState({})
  const [allFeatures, setAllFeatures] = useState({})
  const [loading, setLoading] = useState(true)
  const [eventId, setEventId] = useState(null)

  useEffect(() => {
    // Get eventId from user or localStorage
    const userEventId = user?.eventId || localStorage.getItem('eventId')
    if (userEventId) {
      setEventId(userEventId)
      fetchEnabledFeatures(userEventId)
    }
  }, [user])

  const fetchEnabledFeatures = async (eid) => {
    try {
      setLoading(true)
      const { data } = await API.get(`/event-requests/${eid}/enabled-features`, {
        headers: { Authorization: `Bearer ${user?.token || localStorage.getItem('token')}` }
      })
      setEnabledFeatures(data.enabledFeatures)
      
      // Also fetch all features for reference
      const allData = await API.get(`/event-requests/${eid}/features`, {
        headers: { Authorization: `Bearer ${user?.token || localStorage.getItem('token')}` }
      })
      setAllFeatures(allData.data.features)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Loading your features...
        </div>
      </div>
    )
  }

  const enabledFeatureKeys = Object.keys(enabledFeatures)
  const disabledFeatureKeys = Object.keys(allFeatures).filter(key => !allFeatures[key]?.enabled)

  return (
    <div className={`min-h-screen py-12 px-4 transition-colors ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className={`text-4xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Event Features</h1>
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage your event with enabled features</p>
        </motion.div>

        {/* Enabled Features */}
        {enabledFeatureKeys.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-12"
          >
            <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              ✓ Available Features ({enabledFeatureKeys.length})
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enabledFeatureKeys.map((featureKey) => (
                <motion.div
                  key={featureKey}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  className={`rounded-xl p-6 border-2 cursor-pointer transition ${
                    isDarkMode
                      ? 'bg-gradient-to-br from-gray-800 to-gray-750 border-green-700 hover:border-green-600'
                      : 'bg-gradient-to-br from-green-50 to-white border-green-300 hover:border-green-400'
                  }`}
                >
                  <div className="text-4xl mb-3">{featureIcons[featureKey]}</div>
                  <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {enabledFeatures[featureKey]?.description || featureKey}
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {featureDescriptions[featureKey]}
                  </p>
                  
                  <div className="mt-4 pt-4 border-t border-gray-600">
                    <button className={`text-sm font-semibold py-2 px-4 rounded-lg transition ${
                      isDarkMode
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}>
                      Configure →
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Disabled Features */}
        {disabledFeatureKeys.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Upgrade for More Features ({disabledFeatureKeys.length})
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {disabledFeatureKeys.map((featureKey) => (
                <motion.div
                  key={featureKey}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`rounded-xl p-6 border-2 relative cursor-pointer hover:border-indigo-500 hover:shadow-lg transition-all group ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                      : 'bg-gray-100 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="text-4xl mb-3">{featureIcons[featureKey]}</div>
                  <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {allFeatures[featureKey]?.description || featureKey}
                  </h3>
                  <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                    {featureDescriptions[featureKey]}
                  </p>
                  <div className="space-y-3">
                    <div className={`text-xs font-semibold px-3 py-1.5 rounded-lg inline-block ${
                      isDarkMode
                        ? 'bg-red-600/20 text-red-400'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      🔒 Not Available
                    </div>
                    <div className={`text-xs p-2 rounded border ${
                      isDarkMode
                        ? 'bg-yellow-600/10 border-yellow-600/30 text-yellow-300'
                        : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                    }`}>
                      💡 Upgrade your plan to unlock this feature
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Upgrade CTA */}
            <div className={`mt-8 p-6 rounded-xl border-2 ${
              isDarkMode
                ? 'bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border-indigo-600/50'
                : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300'
            }`}>
              <h3 className={`text-xl font-bold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-900'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Ready to upgrade?
              </h3>
              <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                View available subscription plans and unlock all premium features for your event.
              </p>
              <Link
                to="/event-admin/events"
                className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                View Plans & Upgrade
              </Link>
            </div>

            <div className={`mt-8 p-6 rounded-xl border-2 ${
              isDarkMode
                ? 'bg-blue-900/20 border-blue-700'
                : 'bg-blue-50 border-blue-200'
            }`}>
              <h3 className={`font-bold mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>Want more features?</h3>
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-blue-200' : 'text-blue-600'}`}>
                Contact your administrator or upgrade your plan to unlock additional features.
              </p>
              <Link
                to="/support"
                className={`inline-block px-4 py-2 rounded-lg font-semibold transition ${
                  isDarkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Request Feature Upgrade
              </Link>
            </div>
          </motion.div>
        )}

        {enabledFeatureKeys.length === 0 && disabledFeatureKeys.length === 0 && (
          <div className={`text-center py-12 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No features configured for your event yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
