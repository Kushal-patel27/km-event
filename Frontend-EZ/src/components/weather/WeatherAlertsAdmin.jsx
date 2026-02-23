import React, { useState, useEffect } from 'react'
import { useDarkMode } from '../../context/DarkModeContext'

export default function WeatherAlertsAdmin({ eventId }) {
  const { isDarkMode } = useDarkMode()
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [logs, setLogs] = useState([])
  const [showLogs, setShowLogs] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [eventId])

  const fetchConfig = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/weather-alerts/config/${eventId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch config')
      const data = await res.json()
      setConfig(data.config)
      setLogs(data.logs || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateConfig = async (updates) => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/weather-alerts/config/${eventId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Failed to update config')
      const data = await res.json()
      setConfig(data.config)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className={`p-6 rounded-lg animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />
  }

  if (!config) return null

  return (
    <div className={`rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-100 bg-gray-50'}`}>
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Weather Alerts Configuration
        </h3>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className={`p-4 rounded-lg border-l-4 ${isDarkMode ? 'bg-red-900/20 border-red-500 text-red-200' : 'bg-red-50 border-red-500 text-red-700'}`}>
            {error}
          </div>
        )}

        {/* Enable/Disable Toggle */}
        <div className={`flex items-center justify-between p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div>
            <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Weather Alerts Enabled
            </p>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Enable or disable weather alerts for this event
            </p>
          </div>
          <button
            onClick={() => updateConfig({ enabled: !config.enabled })}
            disabled={saving}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              config.enabled
                ? isDarkMode
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-green-500 text-white hover:bg-green-600'
                : isDarkMode
                ? 'bg-gray-600 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            } disabled:opacity-50`}
          >
            {config.enabled ? '✓ Enabled' : '○ Disabled'}
          </button>
        </div>

        {/* Notification Timing */}
        <div>
          <label className={`block font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Send Notifications Before Event
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[6, 12, 24].map((hours) => (
              <button
                key={hours}
                onClick={() => updateConfig({ notificationTiming: hours })}
                disabled={saving}
                className={`px-4 py-3 rounded-lg font-semibold transition ${
                  config.notificationTiming === hours
                    ? isDarkMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } disabled:opacity-50`}
              >
                {hours}h before
              </button>
            ))}
          </div>
        </div>

        {/* Email Recipients */}
        <div>
          <label className={`block font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Email Recipients
          </label>
          <div className="space-y-2">
            {['superAdmin', 'eventAdmin', 'staff', 'attendees'].map((role) => (
              <label key={role} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.notifications?.email?.recipients?.[role] || false}
                  onChange={(e) =>
                    updateConfig({
                      notifications: {
                        ...config.notifications,
                        email: {
                          ...config.notifications?.email,
                          recipients: {
                            ...config.notifications?.email?.recipients,
                            [role]: e.target.checked,
                          },
                        },
                      },
                    })
                  }
                  disabled={saving}
                  className="w-4 h-4 rounded"
                />
                <span className={`capitalize ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {role === 'superAdmin' ? 'Super Admin' : role === 'eventAdmin' ? 'Event Admin' : role === 'attendees' ? 'Event Attendees' : 'Staff'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Alert Conditions */}
        <div>
          <label className={`block font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Alert Conditions to Monitor
          </label>
          <div className="grid grid-cols-2 gap-3">
            {['thunderstorm', 'heavyRain', 'extremeHeat', 'snow', 'fog', 'tornado'].map((condition) => (
              <label key={condition} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.alertConditions?.[condition] || false}
                  onChange={(e) =>
                    updateConfig({
                      alertConditions: {
                        ...config.alertConditions,
                        [condition]: e.target.checked,
                      },
                    })
                  }
                  disabled={saving}
                  className="w-4 h-4 rounded"
                />
                <span className={`capitalize ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {condition.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Alert Logs */}
        <div>
          <button
            onClick={() => setShowLogs(!showLogs)}
            className={`w-full px-4 py-3 rounded-lg font-semibold transition flex items-center justify-between ${
              isDarkMode
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            }`}
          >
            <span>Alert Logs ({logs.length})</span>
            <span>{showLogs ? '▼' : '▶'}</span>
          </button>

          {showLogs && (
            <div className={`mt-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 max-h-96 overflow-y-auto`}>
              {logs.length === 0 ? (
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No alerts sent yet
                </p>
              ) : (
                <div className="space-y-3">
                  {logs.map((log, idx) => (
                    <div key={idx} className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} text-sm`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-semibold ${
                          log.alertType === 'warning' ? 'text-red-500' : 'text-orange-500'
                        }`}>
                          {log.weatherCondition}
                        </span>
                        <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                        {log.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={fetchConfig}
          disabled={saving}
          className={`w-full px-4 py-3 rounded-lg font-semibold transition ${
            isDarkMode
              ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
              : 'bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50'
          }`}
        >
          {saving ? 'Saving...' : 'Refresh'}
        </button>
      </div>
    </div>
  )
}
