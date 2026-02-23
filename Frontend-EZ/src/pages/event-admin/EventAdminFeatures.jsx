import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import API from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useDarkMode } from '../../context/DarkModeContext'

const allFeatures = [
  { key: 'ticketing', label: 'Ticketing', description: 'Allow ticket sales and management' },
  { key: 'qrCheckIn', label: 'QR Check-in', description: 'QR code generation for check-in' },
  { key: 'scannerApp', label: 'Scanner App', description: 'Mobile scanner app for entry verification' },
  { key: 'analytics', label: 'Analytics', description: 'Event analytics and reporting' },
  { key: 'emailSms', label: 'Email/SMS', description: 'Email and SMS notifications' },
  { key: 'payments', label: 'Payments', description: 'Payment processing and wallet integration' },
  { key: 'weatherAlerts', label: 'Weather Alerts', description: 'Weather alerts and notifications' },
  { key: 'subAdmins', label: 'Sub-Admins', description: 'Add and manage sub-administrators' },
  { key: 'reports', label: 'Reports', description: 'Generate detailed event reports' }
]

export default function EventAdminFeatures() {
  const { eventId } = useParams()
  const { user } = useAuth()
  const { isDarkMode } = useDarkMode()
  const [enabledFeatures, setEnabledFeatures] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchEnabledFeatures()
  }, [eventId])

  const fetchEnabledFeatures = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await API.get(`/event-requests/${eventId}/enabled-features`, {
        headers: { Authorization: `Bearer ${user?.token || localStorage.getItem('token')}` }
      })
      setEnabledFeatures(data.enabledFeatures || {})
    } catch (err) {
      console.error('Error fetching features:', err)
      setError(err.response?.data?.message || 'Failed to load features')
    } finally {
      setLoading(false)
    }
  }

  const enabledFeaturesList = allFeatures.filter(f => enabledFeatures[f.key]?.enabled)

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <div className={`animate-spin rounded-full h-12 w-12 border-4 border-gray-300 mx-auto mb-4 ${isDarkMode ? 'border-t-blue-400' : 'border-t-blue-600'}`}></div>
          <p>Loading features...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`text-center max-w-md ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
          <p className="text-lg font-semibold mb-2">Error Loading Features</p>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen py-12 px-4 transition-colors ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className={`text-4xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Enabled Features
          </h1>
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Features available for your event
          </p>
        </motion.div>

        {enabledFeaturesList.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-center py-12 rounded-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
          >
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              No features have been enabled for your event yet. Contact admin to enable features.
            </p>
          </motion.div>
        ) : (
          <div className={`rounded-2xl shadow-lg p-8 transition-colors ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="space-y-4">
              {enabledFeaturesList.map((feature, index) => (
                <motion.div
                  key={feature.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                    isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex-1">
                    <h3 className={`font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {feature.label}
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Summary */}
            <div className={`mt-8 rounded-lg p-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
              <h3 className={`font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Feature Summary</h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                You have access to <span className="font-semibold text-green-600">{enabledFeaturesList.length}</span> feature{enabledFeaturesList.length !== 1 ? 's' : ''}.
              </p>
              <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                For additional features, contact the administrator.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
