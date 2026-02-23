import React from 'react'
import API from '../../services/api'
import { SettingToggle, SelectField, Button } from './SettingsComponents'

export default function PrivacySettings({ settings, setSettings, showMessage, tokenHeader }) {
  
  const updatePrivacy = async (updates) => {
    try {
      await API.put('/settings/privacy', updates, tokenHeader())
      setSettings(prev => ({ ...prev, privacy: { ...prev.privacy, ...updates } }))
      showMessage('Privacy settings updated')
    } catch (error) {
      showMessage('Failed to update privacy settings', 'error')
    }
  }

  const downloadPersonalData = async () => {
    try {
      const { data } = await API.get('/settings/privacy/download-data', tokenHeader())
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `personal-data-${Date.now()}.json`
      a.click()
      showMessage('Personal data downloaded')
    } catch (error) {
      showMessage('Failed to download data', 'error')
    }
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-300 bg-clip-text text-transparent\">Privacy Settings</h2>

      <div className="space-y-4">
        <SelectField
          label="Data Visibility"
          value={settings.privacy.dataVisibility}
          onChange={(e) => updatePrivacy({ dataVisibility: e.target.value })}
          options={[
            { value: 'private', label: 'Private' },
            { value: 'public', label: 'Public' },
            { value: 'friends', label: 'Friends Only' },
          ]}
        />

        <SettingToggle
          label="Allow Analytics"
          description="Help us improve by sharing usage data"
          enabled={settings.privacy.allowAnalytics}
          onChange={(val) => updatePrivacy({ allowAnalytics: val })}
        />
        <SettingToggle
          label="Personalized Recommendations"
          description="Get event suggestions based on your preferences"
          enabled={settings.privacy.allowPersonalization}
          onChange={(val) => updatePrivacy({ allowPersonalization: val })}
        />
        <SettingToggle
          label="Consent Given"
          description="I consent to processing of my data for services and compliance"
          enabled={settings.privacy.consentGiven}
          onChange={(val) => updatePrivacy({ consentGiven: val })}
        />
      </div>

      <div className="pt-6 border-t border-indigo-200 dark:border-indigo-500/30">
        <Button onClick={downloadPersonalData} fullWidth>
          Download Personal Data
        </Button>
      </div>
    </div>
  )
}
