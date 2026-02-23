import React from 'react'
import API from '../../services/api'
import { useDarkMode } from '../../context/DarkModeContext'
import { applyUISettingsToDocument, storeUISettings } from '../../utils/uiSettings'
import { SettingToggle, SelectField } from './SettingsComponents'

export default function UISettings({ settings, setSettings, showMessage, tokenHeader }) {
  const { setThemePreference } = useDarkMode()

  const updateUI = async (updates) => {
    try {
      await API.put('/settings/ui', updates, tokenHeader())
      setSettings(prev => {
        const next = { ...prev, uiSettings: { ...prev.uiSettings, ...updates } }
        storeUISettings(next.uiSettings)
        applyUISettingsToDocument(next.uiSettings)
        return next
      })
      if (updates.theme) {
        setThemePreference(updates.theme)
      }
      showMessage('UI settings updated')
    } catch (error) {
      showMessage('Failed to update UI settings', 'error')
    }
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-300 bg-clip-text text-transparent\">Appearance & Accessibility</h2>

      <div className="space-y-4">
        <SelectField
          label="Theme"
          value={settings.uiSettings.theme}
          onChange={(e) => updateUI({ theme: e.target.value })}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'System Default' },
          ]}
        />

        <SelectField
          label="Font Size"
          value={settings.uiSettings.fontSize}
          onChange={(e) => updateUI({ fontSize: e.target.value })}
          options={[
            { value: 'small', label: 'Small' },
            { value: 'medium', label: 'Medium' },
            { value: 'large', label: 'Large' },
          ]}
        />

        <SelectField
          label="Dashboard Layout"
          value={settings.uiSettings.dashboardLayout}
          onChange={(e) => updateUI({ dashboardLayout: e.target.value })}
          options={[
            { value: 'default', label: 'Default' },
            { value: 'compact', label: 'Compact' },
            { value: 'spacious', label: 'Spacious' },
          ]}
        />

        <SettingToggle
          label="High Contrast"
          description="Increase contrast for better visibility"
          enabled={settings.uiSettings.highContrast}
          onChange={(val) => updateUI({ highContrast: val })}
        />
        <SettingToggle
          label="Reduce Animations"
          description="Minimize animations and transitions for better performance"
          enabled={settings.uiSettings.reduceAnimations}
          onChange={(val) => updateUI({ reduceAnimations: val })}
        />
      </div>
    </div>
  )
}
