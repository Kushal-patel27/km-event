import React from 'react'
import API from '../../services/api'
import { Button, SettingToggle, SelectField } from './SettingsComponents'

export default function NotificationsSettings({ settings, setSettings, showMessage, tokenHeader }) {
  
  const updateNotifications = async (updates) => {
    try {
      await API.put('/settings/notifications', updates, tokenHeader())
      setSettings(prev => ({ ...prev, notifications: { ...prev.notifications, ...updates } }))
      showMessage('Notification preferences updated')
    } catch (error) {
      showMessage('Failed to update notifications', 'error')
    }
  }

  const enableAllNotifications = async () => {
    const updates = {
      email: true,
      sms: true,
      push: true,
      weatherAlerts: true,
      eventReminders: true,
      promotionalNotifications: true,
      emailFrequency: settings.notifications.emailFrequency || 'instant',
      criticalAlertsOverride: true,
    }
    await updateNotifications(updates)
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-300 bg-clip-text text-transparent\">Notification Settings</h2>

      <div className="flex flex-wrap gap-3">
        <Button onClick={enableAllNotifications} variant="secondary">
          Enable All Notifications
        </Button>
      </div>

      <div className="space-y-4">
        <SettingToggle
          label="Email Notifications"
          description="Receive notifications via email"
          enabled={settings.notifications.email}
          onChange={(val) => updateNotifications({ email: val })}
        />
        <SettingToggle
          label="SMS Notifications"
          description="Receive notifications via SMS"
          enabled={settings.notifications.sms}
          onChange={(val) => updateNotifications({ sms: val })}
        />
        <SettingToggle
          label="Push Notifications"
          description="Receive push notifications in browser"
          enabled={settings.notifications.push}
          onChange={(val) => updateNotifications({ push: val })}
        />
        <SettingToggle
          label="Weather Alerts"
          description="Get notified about weather issues for your events"
          enabled={settings.notifications.weatherAlerts}
          onChange={(val) => updateNotifications({ weatherAlerts: val })}
        />
        <SettingToggle
          label="Event Reminders"
          description="Receive reminders before your booked events"
          enabled={settings.notifications.eventReminders}
          onChange={(val) => updateNotifications({ eventReminders: val })}
        />
        <SettingToggle
          label="Promotional Notifications"
          description="Receive updates about offers and promotions"
          enabled={settings.notifications.promotionalNotifications}
          onChange={(val) => updateNotifications({ promotionalNotifications: val })}
        />
        <SettingToggle
          label="Critical Alerts Override"
          description="Always receive critical alerts even if other notifications are off"
          enabled={settings.notifications.criticalAlertsOverride}
          onChange={(val) => updateNotifications({ criticalAlertsOverride: val })}
        />
      </div>

      <SelectField
        label="Email Frequency"
        value={settings.notifications.emailFrequency}
        onChange={(e) => updateNotifications({ emailFrequency: e.target.value })}
        options={[
          { value: 'instant', label: 'Instant' },
          { value: 'daily', label: 'Daily Digest' },
          { value: 'weekly', label: 'Weekly Digest' },
        ]}
      />
    </div>
  )
}
