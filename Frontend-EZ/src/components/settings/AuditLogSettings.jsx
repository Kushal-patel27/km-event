import React from 'react'
import API from '../../services/api'
import { Button } from './SettingsComponents'

export default function AuditLogSettings({ auditLogs, showMessage, tokenHeader, loadSettings }) {
  
  const resetAllSettings = async () => {
    if (!window.confirm('Are you sure you want to reset all settings to default?')) return
    try {
      await API.post('/settings/reset-all', {}, tokenHeader())
      await loadSettings()
      showMessage('All settings reset to default')
    } catch (error) {
      showMessage('Failed to reset settings', 'error')
    }
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-300 bg-clip-text text-transparent">Activity Log</h2>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {auditLogs.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No activity recorded</p>
        ) : (
          auditLogs.map((log) => (
            <div key={log._id} className="p-4 bg-white/40 dark:bg-gray-700/30 border border-white/20 dark:border-white/10 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/40 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">{log.action.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{log.category}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pt-6 border-t border-indigo-200 dark:border-indigo-500/30">
        <Button onClick={resetAllSettings} variant="secondary" fullWidth>
          Reset All Settings to Default
        </Button>
      </div>
    </div>
  )
}
