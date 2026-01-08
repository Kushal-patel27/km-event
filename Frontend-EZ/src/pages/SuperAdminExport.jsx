import React, { useState } from 'react'
import API from '../services/api'
import SuperAdminLayout from '../components/SuperAdminLayout'

export default function SuperAdminExport() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [exportType, setExportType] = useState('all')

  const handleExport = async () => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const params = new URLSearchParams({
        dataType: exportType,
      })

      const res = await API.get(`/super-admin/export?${params}`)

      // Create and download JSON file
      const dataStr = JSON.stringify(res.data, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `km-events-export-${exportType}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setSuccess(`Successfully exported ${exportType} data!`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to export data')
    } finally {
      setLoading(false)
    }
  }

  const ExportOption = ({ type, title, description, icon }) => (
    <div
      onClick={() => setExportType(type)}
      className={`p-6 rounded-lg border-2 cursor-pointer transition ${
        exportType === type
          ? 'border-purple-600 bg-purple-50'
          : 'border-gray-300 bg-white hover:border-gray-400'
      }`}
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )

  return (
    <SuperAdminLayout title="Data Export" subtitle="Download platform data for analysis or backup">

      {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

      {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            ✓ {success}
          </div>
        )}

      {/* Export Type Selection */}
      <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Select Data to Export</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ExportOption
              type="users"
              title="👥 Users Only"
              description="Export all user accounts and profiles"
              icon="👥"
            />
            <ExportOption
              type="events"
              title="📅 Events Only"
              description="Export all events and their details"
              icon="📅"
            />
            <ExportOption
              type="bookings"
              title="🎫 Bookings Only"
              description="Export all booking transactions and payments"
              icon="🎫"
            />
            <ExportOption
              type="all"
              title="📦 Everything"
              description="Export users, events, and bookings together"
              icon="📦"
            />
          </div>
        </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="font-bold text-blue-900 mb-2">📋 About Data Export</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Data is exported in JSON format</li>
            <li>✓ Includes complete records with all fields</li>
            <li>✓ Suitable for backup, migration, or analysis</li>
            <li>✓ File names include timestamp and data type</li>
            <li>⚠️ Large exports may take a few moments to generate</li>
          </ul>
        </div>

      {/* Export Button */}
      <button
          onClick={handleExport}
          disabled={loading}
          className="w-full px-6 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-bold text-lg transition"
        >
          {loading ? '⏳ Preparing Export...' : '📥 Download Export'}
        </button>

      {/* Usage Examples */}
      <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">How to Use Exported Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-2">📊 Analytics</h3>
              <p className="text-sm text-gray-600">Import into spreadsheet or analytics tools for deeper insights</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-2">🔄 Migration</h3>
              <p className="text-sm text-gray-600">Transfer data to another system or backup location safely</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-2">📑 Reporting</h3>
              <p className="text-sm text-gray-600">Create custom reports and documentation for stakeholders</p>
            </div>
          </div>
      </div>
    </SuperAdminLayout>
  )
}
