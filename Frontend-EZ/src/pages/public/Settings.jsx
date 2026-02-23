import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import API from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useDarkMode } from '../../context/DarkModeContext'
import { applyUISettingsToDocument, storeUISettings } from '../../utils/uiSettings'
import AccountSettings from '../../components/settings/AccountSettings'
import SecuritySettings from '../../components/settings/SecuritySettings'
import NotificationsSettings from '../../components/settings/NotificationsSettings'
import EventPreferencesSettings from '../../components/settings/EventPreferencesSettings'
import PrivacySettings from '../../components/settings/PrivacySettings'
import LanguageRegionSettings from '../../components/settings/LanguageRegionSettings'
import UISettings from '../../components/settings/UISettings'
import AuditLogSettings from '../../components/settings/AuditLogSettings'

export default function Settings() {
  const { user, logout } = useAuth()
  const { setThemePreference } = useDarkMode()

  const [activeTab, setActiveTab] = useState('account')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const defaultSettings = {
    account: { name: '', email: '', phone: '', profileImage: '', loginMethod: 'email' },
    security: { loginAlerts: true, suspiciousActivityAlerts: true, activeSessions: 0 },
    notifications: { email: true, sms: false, push: true, weatherAlerts: true, eventReminders: true, promotionalNotifications: false, emailFrequency: 'instant', criticalAlertsOverride: true },
    eventPreferences: { preferredLocations: [], preferredCategories: [], autoWeatherNotify: true, autoCancelAlerts: true, refundNotifications: true, rescheduleNotifications: true },
    privacy: { dataVisibility: 'private', allowAnalytics: true, allowPersonalization: true, consentGiven: false },
    preferences: { language: 'en', timezone: 'UTC', currency: 'INR', dateFormat: 'DD/MM/YYYY', timeFormat: '12h' },
    uiSettings: { theme: 'system', fontSize: 'medium', highContrast: false, reduceAnimations: false, dashboardLayout: 'default' },
  }

  // Settings state
  const [settings, setSettings] = useState(defaultSettings)

  const [sessions, setSessions] = useState([])
  const [auditLogs, setAuditLogs] = useState([])

  const tokenHeader = () => {
    const token = user?.token || localStorage.getItem('token')
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
  }

  const showMessage = (msg, type = 'success') => {
    setMessage({ text: msg, type })
    setTimeout(() => setMessage(null), 4000)
  }

  useEffect(() => {
    loadSettings()
  }, [user])

  const loadSettings = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data } = await API.get('/settings', tokenHeader())
      const merged = {
        ...defaultSettings,
        ...data,
        account: { ...defaultSettings.account, ...data?.account },
        security: { ...defaultSettings.security, ...data?.security },
        notifications: { ...defaultSettings.notifications, ...data?.notifications },
        eventPreferences: { ...defaultSettings.eventPreferences, ...data?.eventPreferences },
        privacy: { ...defaultSettings.privacy, ...data?.privacy },
        preferences: { ...defaultSettings.preferences, ...data?.preferences },
        uiSettings: { ...defaultSettings.uiSettings, ...data?.uiSettings },
      }

      setSettings(merged)

      if (merged.uiSettings?.theme) {
        setThemePreference(merged.uiSettings.theme)
      }

      storeUISettings(merged.uiSettings)
      applyUISettingsToDocument(merged.uiSettings)
    } catch (error) {
      console.error('Failed to load settings:', error)
      showMessage('Failed to load settings', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadSessions = async () => {
    try {
      const { data } = await API.get('/settings/security/sessions', tokenHeader())
      setSessions(data.sessions || [])
    } catch (error) {
      console.error('Failed to load sessions:', error)
    }
  }

  const loadAuditLogs = async () => {
    try {
      const { data } = await API.get('/settings/audit-log', tokenHeader())
      setAuditLogs(data.logs || [])
    } catch (error) {
      console.error('Failed to load audit logs:', error)
    }
  }

  useEffect(() => {
    if (activeTab === 'security') loadSessions()
    if (activeTab === 'audit') loadAuditLogs()
  }, [activeTab])

  const tabs = [
    { id: 'account', name: 'Account', icon: '👤' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'events', name: 'Event Preferences', icon: '🎫' },
    { id: 'privacy', name: 'Privacy', icon: '🛡️' },
    { id: 'language', name: 'Language & Region', icon: '🌍' },
    { id: 'ui', name: 'Appearance', icon: '🎨' },
    { id: 'audit', name: 'Activity Log', icon: '📋' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-blue-300">
            Settings
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Manage your account, security, notifications, and preferences
          </p>
        </div>

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-6 p-4 rounded-lg backdrop-blur-md border ${
                message.type === 'error'
                  ? 'bg-red-50/80 dark:bg-red-900/30 border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-200'
                  : 'bg-emerald-50/80 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white/50 dark:bg-gray-700/40 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl shadow-lg p-4 sticky top-24">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-lg shadow-indigo-300/50'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-gray-600/30'
                    }`}
                  >
                    <span className="text-xl">{tab.icon}</span>
                    <span className="font-medium">{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="flex-1">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white/60 dark:bg-gray-700/40 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl shadow-lg p-8"
            >
              {activeTab === 'account' && <AccountSettings settings={settings} setSettings={setSettings} showMessage={showMessage} tokenHeader={tokenHeader} saving={saving} setSaving={setSaving} logout={logout} />}
              {activeTab === 'security' && <SecuritySettings settings={settings} setSettings={setSettings} showMessage={showMessage} tokenHeader={tokenHeader} sessions={sessions} setSessions={setSessions} logout={logout} />}
              {activeTab === 'notifications' && <NotificationsSettings settings={settings} setSettings={setSettings} showMessage={showMessage} tokenHeader={tokenHeader} />}
              {activeTab === 'events' && <EventPreferencesSettings settings={settings} setSettings={setSettings} showMessage={showMessage} tokenHeader={tokenHeader} />}
              {activeTab === 'privacy' && <PrivacySettings settings={settings} setSettings={setSettings} showMessage={showMessage} tokenHeader={tokenHeader} />}
              {activeTab === 'language' && <LanguageRegionSettings settings={settings} setSettings={setSettings} showMessage={showMessage} tokenHeader={tokenHeader} />}
              {activeTab === 'ui' && <UISettings settings={settings} setSettings={setSettings} showMessage={showMessage} tokenHeader={tokenHeader} />}
              {activeTab === 'audit' && <AuditLogSettings auditLogs={auditLogs} showMessage={showMessage} tokenHeader={tokenHeader} loadSettings={loadSettings} />}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
