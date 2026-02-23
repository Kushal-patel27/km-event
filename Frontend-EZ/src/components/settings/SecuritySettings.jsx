import React from 'react'
import API from '../../services/api'
import { Button, ToggleSwitch } from './SettingsComponents'

export default function SecuritySettings({ settings, setSettings, showMessage, tokenHeader, sessions, setSessions, logout }) {
  const updateSecurityPreferences = async (updates) => {
    try {
      await API.put('/settings/security/preferences', updates, tokenHeader())
      setSettings(prev => ({ ...prev, security: { ...prev.security, ...updates } }))
      showMessage('Security preferences updated')
    } catch (error) {
      showMessage('Failed to update security preferences', 'error')
    }
  }

  const terminateSession = async (sessionId) => {
    try {
      await API.delete(`/settings/security/sessions/${sessionId}`, tokenHeader())
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      showMessage('Session terminated')
    } catch (error) {
      showMessage('Failed to terminate session', 'error')
    }
  }

  const logoutAllDevices = async () => {
    if (!window.confirm('Are you sure you want to logout from all devices?')) return
    try {
      await API.post('/settings/security/logout-all', {}, tokenHeader())
      showMessage('Logged out from all devices')
      logout()
    } catch (error) {
      showMessage('Failed to logout from all devices', 'error')
    }
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-300 bg-clip-text text-transparent">Security Settings</h2>

      {/* Active Sessions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-300 bg-clip-text text-transparent">Active Sessions ({sessions.length})</h3>
          <Button onClick={logoutAllDevices} variant="danger">
            Logout All
          </Button>
        </div>
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No active sessions</p>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 bg-white/40 dark:bg-gray-700/30 border border-white/20 dark:border-white/10 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/40 transition">
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">{session.userAgent || 'Unknown Device'}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">IP: {session.ip || 'Unknown'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Last seen: {new Date(session.lastSeenAt).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => terminateSession(session.id)}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
                >
                  Terminate
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Login Alerts */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-300 bg-clip-text text-transparent">Alert Preferences</h3>
        <div className="flex items-center justify-between p-4 bg-white/40 dark:bg-gray-700/30 border border-white/20 dark:border-white/10 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/40 transition">
          <div>
            <p className="font-medium text-gray-800 dark:text-white">Login Alerts</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Get notified when someone logs into your account</p>
          </div>
          <ToggleSwitch enabled={settings.security.loginAlerts} onChange={(val) => updateSecurityPreferences({ loginAlerts: val })} />
        </div>
        <div className="flex items-center justify-between p-4 bg-white/40 dark:bg-gray-700/30 border border-white/20 dark:border-white/10 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/40 transition">
          <div>
            <p className="font-medium text-gray-800 dark:text-white">Suspicious Activity Alerts</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Get alerts for unusual or risky activity</p>
          </div>
          <ToggleSwitch enabled={settings.security.suspiciousActivityAlerts} onChange={(val) => updateSecurityPreferences({ suspiciousActivityAlerts: val })} />
        </div>
      </div>
    </div>
  )
}
