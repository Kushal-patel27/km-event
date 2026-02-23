import React, { useEffect, useState } from 'react'
import API from '../../services/api'
import { Button, InputField, SettingToggle } from './SettingsComponents'

export default function EventPreferencesSettings({ settings, setSettings, showMessage, tokenHeader }) {
  const [locationsInput, setLocationsInput] = useState('')
  const [categoriesInput, setCategoriesInput] = useState('')

  useEffect(() => {
    setLocationsInput((settings.eventPreferences.preferredLocations || []).join(', '))
    setCategoriesInput((settings.eventPreferences.preferredCategories || []).join(', '))
  }, [settings.eventPreferences.preferredLocations, settings.eventPreferences.preferredCategories])
  
  const updateEventPreferences = async (updates) => {
    try {
      await API.put('/settings/event-preferences', updates, tokenHeader())
      setSettings(prev => ({ ...prev, eventPreferences: { ...prev.eventPreferences, ...updates } }))
      showMessage('Event preferences updated')
    } catch (error) {
      showMessage('Failed to update event preferences', 'error')
    }
  }

  const parseList = (value) => value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-300 bg-clip-text text-transparent\">Event & Booking Preferences</h2>

      <div className="space-y-4">
        <div className="p-4 bg-white/40 dark:bg-gray-700/30 border border-white/20 dark:border-white/10 rounded-lg space-y-3\">
          <InputField
            label="Preferred Locations"
            value={locationsInput}
            onChange={(e) => setLocationsInput(e.target.value)}
            placeholder="e.g. Delhi, Mumbai, Bengaluru"
          />
          <Button
            onClick={() => updateEventPreferences({ preferredLocations: parseList(locationsInput) })}
            variant="secondary"
            fullWidth
          >
            Save Preferred Locations
          </Button>
        </div>

        <div className="p-4 bg-white/40 dark:bg-gray-700/30 border border-white/20 dark:border-white/10 rounded-lg space-y-3\">
          <InputField
            label="Preferred Categories"
            value={categoriesInput}
            onChange={(e) => setCategoriesInput(e.target.value)}
            placeholder="e.g. Music, Tech, Sports"
          />
          <Button
            onClick={() => updateEventPreferences({ preferredCategories: parseList(categoriesInput) })}
            variant="secondary"
            fullWidth
          >
            Save Preferred Categories
          </Button>
        </div>

        <SettingToggle
          label="Auto Weather Notifications"
          description="Automatically notify me about weather issues"
          enabled={settings.eventPreferences.autoWeatherNotify}
          onChange={(val) => updateEventPreferences({ autoWeatherNotify: val })}
        />
        <SettingToggle
          label="Cancellation Alerts"
          description="Get instant alerts if an event is cancelled"
          enabled={settings.eventPreferences.autoCancelAlerts}
          onChange={(val) => updateEventPreferences({ autoCancelAlerts: val })}
        />
        <SettingToggle
          label="Refund Notifications"
          description="Receive updates about refund status"
          enabled={settings.eventPreferences.refundNotifications}
          onChange={(val) => updateEventPreferences({ refundNotifications: val })}
        />
        <SettingToggle
          label="Reschedule Notifications"
          description="Get notified when events are rescheduled"
          enabled={settings.eventPreferences.rescheduleNotifications}
          onChange={(val) => updateEventPreferences({ rescheduleNotifications: val })}
        />
      </div>
    </div>
  )
}
