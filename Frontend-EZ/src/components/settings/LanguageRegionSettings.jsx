import React from 'react'
import API from '../../services/api'
import { SelectField } from './SettingsComponents'

export default function LanguageRegionSettings({ settings, setSettings, showMessage, tokenHeader }) {
  
  const updateLanguageRegion = async (updates) => {
    try {
      await API.put('/settings/preferences', updates, tokenHeader())
      setSettings(prev => ({ ...prev, preferences: { ...prev.preferences, ...updates } }))
      showMessage('Language and region updated')
    } catch (error) {
      showMessage('Failed to update preferences', 'error')
    }
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-300 bg-clip-text text-transparent\">Language & Region</h2>

      <div className="space-y-4">
        <SelectField
          label="Language"
          value={settings.preferences.language}
          onChange={(e) => updateLanguageRegion({ language: e.target.value })}
          options={[
            { value: 'en', label: 'English' },
            { value: 'hi', label: 'Hindi' },
            { value: 'es', label: 'Spanish' },
            { value: 'fr', label: 'French' },
          ]}
        />

        <SelectField
          label="Time Zone"
          value={settings.preferences.timezone}
          onChange={(e) => updateLanguageRegion({ timezone: e.target.value })}
          options={[
            { value: 'UTC', label: 'UTC' },
            { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
            { value: 'America/New_York', label: 'America/New_York (EST)' },
            { value: 'Europe/London', label: 'Europe/London (GMT)' },
          ]}
        />

        <SelectField
          label="Currency"
          value={settings.preferences.currency}
          onChange={(e) => updateLanguageRegion({ currency: e.target.value })}
          options={[
            { value: 'INR', label: 'INR (₹)' },
            { value: 'USD', label: 'USD ($)' },
            { value: 'EUR', label: 'EUR (€)' },
            { value: 'GBP', label: 'GBP (£)' },
          ]}
        />

        <SelectField
          label="Date Format"
          value={settings.preferences.dateFormat}
          onChange={(e) => updateLanguageRegion({ dateFormat: e.target.value })}
          options={[
            { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
            { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
            { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
          ]}
        />

        <SelectField
          label="Time Format"
          value={settings.preferences.timeFormat}
          onChange={(e) => updateLanguageRegion({ timeFormat: e.target.value })}
          options={[
            { value: '12h', label: '12-hour' },
            { value: '24h', label: '24-hour' },
          ]}
        />
      </div>
    </div>
  )
}
