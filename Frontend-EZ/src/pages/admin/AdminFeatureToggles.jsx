import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import API from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useDarkMode } from '../../context/DarkModeContext'
import AdminLayout from '../../components/layout/AdminLayout'

const featuresList = [
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

export default function AdminFeatureToggles() {
  const { eventId } = useParams()
  const { user } = useAuth()
  const { isDarkMode } = useDarkMode()
  const [features, setFeatures] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [eventTitle, setEventTitle] = useState('')

  useEffect(() => {
    fetchFeatures()
  }, [eventId])

  const fetchFeatures = async () => {
    try {
      setLoading(true)
      const { data } = await API.get(`/event-requests/${eventId}/features`, {
        headers: { Authorization: `Bearer ${user?.token || localStorage.getItem('token')}` }
      })
      if (data.features) {
        setFeatures(data.features)
      } else {
        setMessage({ type: 'info', text: 'No features configured yet' })
      }
      if (data.eventTitle) {
        setEventTitle(data.eventTitle)
      }
    } catch (err) {
      console.error('Error fetching features:', err)
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to load features. Event may not exist.' })
    } finally {
      setLoading(false)
    }
  }

  const toggleFeature = (featureKey) => {
    setFeatures(prev => {
      const updated = { ...prev }
      if (!updated[featureKey]) {
        updated[featureKey] = { enabled: true, description: '' }
      } else {
        updated[featureKey] = {
          ...updated[featureKey],
          enabled: !updated[featureKey].enabled
        }
      }
      return updated
    })
  }

  const saveChanges = async () => {
    try {
      setSaving(true)
      setMessage(null)
      
      const { data } = await API.put(`/event-requests/${eventId}/features`, { features }, {
        headers: { Authorization: `Bearer ${user?.token || localStorage.getItem('token')}` }
      })
      
      if (data.success || data.message) {
        setMessage({ type: 'success', text: 'Features updated successfully!' })
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setMessage(null)
        }, 3000)
      }
    } catch (err) {
      console.error('Save error:', err)
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || err.message || 'Failed to save features' 
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Feature Management" subtitle="Loading event details...">
        <div className="min-h-[40vh] flex items-center justify-center text-gray-600 dark:text-gray-400">Loading features...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout 
      title="Feature Management" 
      subtitle={eventTitle ? `Configure features for: ${eventTitle}` : 'Enable or disable features for this event'}
    >
      <div className="max-w-4xl mx-auto pb-10">
        {message && (
          <div className={`mb-6 p-4 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700'
              : message.type === 'error'
              ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700'
              : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="rounded-2xl shadow-lg p-8 transition-colors bg-white dark:bg-gray-800">
          <div className="space-y-4">
            {featuresList.map((feature) => (
              <motion.div
                key={feature.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition ${
                  features[feature.key]?.enabled
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                }`}
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{feature.label}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={() => toggleFeature(feature.key)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ml-4 flex-shrink-0 ${
                    features[feature.key]?.enabled
                      ? 'bg-green-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      features[feature.key]?.enabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={saveChanges}
              disabled={saving}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold text-white transition ${
                saving
                  ? 'opacity-60 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={fetchFeatures}
              className="px-6 py-3 rounded-lg font-semibold border-2 transition border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-8 rounded-lg p-6 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700">
          <h3 className="font-bold mb-3 text-gray-900 dark:text-white">Enabled Features Summary</h3>
          <div className="flex flex-wrap gap-2">
            {featuresList.map((feature) =>
              features[feature.key]?.enabled && (
                <span
                  key={feature.key}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700"
                >
                  {feature.label}
                </span>
              )
            )}
          </div>
          <p className="mt-3 text-xs text-gray-600 dark:text-gray-500">
            Total enabled: {Object.values(features).filter(f => f?.enabled).length} / {featuresList.length}
          </p>
        </div>
      </div>
    </AdminLayout>
  )
}
