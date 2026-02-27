import React, { useState, useEffect } from 'react'
import API from '../../services/api'
import SuperAdminLayout from '../../components/layout/SuperAdminLayout'

export default function SuperAdminConfig() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [localConfig, setLocalConfig] = useState(null)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await API.get('/super-admin/config')
      setConfig(res.data)
      setLocalConfig(JSON.parse(JSON.stringify(res.data)))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConfig = async () => {
    try {
      setError('')
      setSuccess('')
      
      // Log what we're sending to verify it's correct
      console.log('[CONFIG SAVE] Sending to backend:', localConfig);
      
      // Send complete config object
      const response = await API.put('/super-admin/config', localConfig)
      
      console.log('[CONFIG SAVE] Response from backend:', response.data.config);
      
      // Update local state with response from server (the actual DB state)
      setConfig(response.data.config)
      setLocalConfig(JSON.parse(JSON.stringify(response.data.config)))
      setSuccess('Configuration updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save configuration')
    }
  }

  const updateNestedConfig = (path, value) => {
    const keys = path.split('.')
    const newConfig = JSON.parse(JSON.stringify(localConfig))
    let current = newConfig
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]]
    }
    current[keys[keys.length - 1]] = value
    setLocalConfig(newConfig)
  }

  const ConfigSection = ({ title, description, children }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <div className="space-y-4">{children}</div>
    </div>
  )

  const ConfigInput = ({ label, value, onChange, type = 'text', help, min, max }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
      {help && <p className="text-xs text-gray-500 mt-1">{help}</p>}
    </div>
  )

  const ConfigToggle = ({ label, checked, onChange, help }) => (
    <div className="flex items-center justify-between">
      <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {help && <p className="text-xs text-gray-500 mt-1">{help}</p>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
      </label>
    </div>
  )

  return (
    <SuperAdminLayout title="System Configuration" subtitle="Configure QR rules, ticket limits, security, and notifications">

      {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

      {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : localConfig ? (
        <>
            {/* QR Code Rules */}
            <ConfigSection
              title="🔲 QR Code Rules"
              description="Configure how QR codes are generated and validated"
            >
              <ConfigToggle
                label="Enable QR Codes"
                checked={localConfig.qrCodeRules?.enabled ?? true}
                onChange={(e) =>
                  updateNestedConfig('qrCodeRules.enabled', e.target.checked)
                }
                help="Toggle QR code generation for tickets"
              />
              <ConfigToggle
                label="Allow Multiple Scans"
                checked={localConfig.qrCodeRules?.allowMultipleScan ?? false}
                onChange={(e) =>
                  updateNestedConfig('qrCodeRules.allowMultipleScan', e.target.checked)
                }
                help="Allow the same QR code to be scanned multiple times"
              />
            </ConfigSection>

            {/* Ticket Limits */}
            <ConfigSection
              title="🎫 Ticket Limits"
              description="Set maximum ticket quantities and per-user limits"
            >
              <ConfigInput
                label="Max Tickets Per Event"
                type="number"
                value={localConfig.ticketLimits.maxPerEvent}
                onChange={(e) =>
                  updateNestedConfig('ticketLimits.maxPerEvent', parseInt(e.target.value))
                }
                help="Maximum number of tickets available per event"
              />
              <ConfigInput
                label="Max Tickets Per User"
                type="number"
                value={localConfig.ticketLimits.maxPerUser}
                onChange={(e) =>
                  updateNestedConfig('ticketLimits.maxPerUser', parseInt(e.target.value))
                }
                help="Maximum tickets a single user can purchase per event"
              />
            </ConfigSection>

            {/* Security Settings */}
            <ConfigSection
              title="🔐 Security Settings"
              description="Configure password policies and session management"
            >
              <ConfigToggle
                label="Enable Two-Factor Authentication"
                checked={localConfig.security.enableTwoFactor}
                onChange={(e) =>
                  updateNestedConfig('security.enableTwoFactor', e.target.checked)
                }
                help="Require 2FA for admin accounts"
              />
              <ConfigInput
                label="Minimum Password Length"
                type="number"
                value={localConfig.security.passwordMinLength}
                onChange={(e) =>
                  updateNestedConfig('security.passwordMinLength', parseInt(e.target.value))
                }
                min={4}
                max={32}
                help="Minimum characters required for passwords (4-32)"
              />
              <ConfigInput
                label="Session Timeout (seconds)"
                type="number"
                value={localConfig.security.sessionTimeout}
                onChange={(e) =>
                  updateNestedConfig('security.sessionTimeout', parseInt(e.target.value))
                }
                help="How long before inactive sessions expire"
              />
            </ConfigSection>

            {/* Email Notifications */}
            <ConfigSection
              title="📧 Email Notifications"
              description="Configure automated email settings"
            >
              <ConfigToggle
                label="Enable Email Notifications"
                checked={localConfig.emailNotifications.enabled}
                onChange={(e) =>
                  updateNestedConfig('emailNotifications.enabled', e.target.checked)
                }
                help="Send automated emails to users"
              />
              <ConfigToggle
                label="Booking Confirmation Emails"
                checked={localConfig.emailNotifications.confirmationEmail}
                onChange={(e) =>
                  updateNestedConfig('emailNotifications.confirmationEmail', e.target.checked)
                }
                help="Send confirmation when booking is made"
              />
              <ConfigToggle
                label="Event Reminder Emails"
                checked={localConfig.emailNotifications.reminderEmail}
                onChange={(e) =>
                  updateNestedConfig('emailNotifications.reminderEmail', e.target.checked)
                }
                help="Send reminders before event dates"
              />
            </ConfigSection>

            {/* Action Buttons */}
            <div className="flex gap-4 pb-8">
              <button
                onClick={handleSaveConfig}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition"
              >
                💾 Save Configuration
              </button>
              <button
                onClick={fetchConfig}
                className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold transition"
              >
                ↺ Reset Changes
              </button>
            </div>
        </>
      ) : null}
    </SuperAdminLayout>
  )
}
