import React, { useState } from 'react'
import { motion } from 'framer-motion'
import API from '../../services/api'
import SuperAdminLayout from '../../components/layout/SuperAdminLayout'
import ExportDataModal from '../../components/admin/ExportDataModal'

export default function SuperAdminExport() {
  const [showExportModal, setShowExportModal] = useState(false)
  const [selectedExportType, setSelectedExportType] = useState(null)
  const [loadingExport, setLoadingExport] = useState(false)

  // Export filters configuration for each data type
  const exportFiltersConfig = {
    users: [
      {
        label: 'Date Range',
        name: 'dateRange',
        type: 'dateRange',
        startName: 'startDate',
        endName: 'endDate'
      },
      {
        label: 'User Role',
        name: 'role',
        type: 'select',
        options: [
          { value: 'super_admin', label: 'Super Admin' },
          { value: 'admin', label: 'Admin' },
          { value: 'event_admin', label: 'Event Admin' },
          { value: 'organizer', label: 'Organizer' },
          { value: 'customer', label: 'Customer' },
          { value: 'staff', label: 'Staff' }
        ]
      },
      {
        label: 'Status',
        name: 'active',
        type: 'select',
        options: [
          { value: 'true', label: 'Active' },
          { value: 'false', label: 'Inactive' }
        ]
      }
    ],
    events: [
      {
        label: 'Date Range',
        name: 'dateRange',
        type: 'dateRange',
        startName: 'startDate',
        endName: 'endDate'
      },
      {
        label: 'Event Status',
        name: 'status',
        type: 'select',
        options: [
          { value: 'draft', label: 'Draft' },
          { value: 'published', label: 'Published' },
          { value: 'active', label: 'Active' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' }
        ]
      }
    ],
    bookings: [
      {
        label: 'Date Range',
        name: 'dateRange',
        type: 'dateRange',
        startName: 'startDate',
        endName: 'endDate'
      },
      {
        label: 'Booking Status',
        name: 'status',
        type: 'select',
        options: [
          { value: 'confirmed', label: 'Confirmed' },
          { value: 'pending', label: 'Pending' },
          { value: 'cancelled', label: 'Cancelled' }
        ]
      },
      {
        label: 'Payment Status',
        name: 'paymentStatus',
        type: 'select',
        options: [
          { value: 'completed', label: 'Completed' },
          { value: 'pending', label: 'Pending' },
          { value: 'failed', label: 'Failed' },
          { value: 'refunded', label: 'Refunded' }
        ]
      }
    ]
  }

  const handleOpenExport = (type) => {
    setSelectedExportType(type)
    setShowExportModal(true)
  }

  const handleExport = async (format, filters) => {
    try {
      setLoadingExport(true)

      // Build query parameters
      const params = new URLSearchParams()
      params.append('format', format)

      // Add filter values
      if (filters) {
        Object.keys(filters).forEach(key => {
          if (filters[key]) {
            params.append(key, filters[key])
          }
        })
      }

      // Call appropriate endpoint
      const response = await API.get(`/super-admin/export/${selectedExportType}?${params}`, {
        responseType: 'blob'
      })

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url

      // Determine file extension
      const ext = format === 'xlsx' ? 'xlsx' : format
      link.setAttribute('download', `${selectedExportType}-export-${Date.now()}.${ext}`)

      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)

      setShowExportModal(false)
    } catch (error) {
      console.error('Export error:', error)
      alert(error.response?.data?.message || 'Failed to export data. Please try again.')
    } finally {
      setLoadingExport(false)
    }
  }

  const ExportCard = ({ type, title, description, icon }) => (
    <motion.div
      whileHover={{ translateY: -4 }}
      onClick={() => handleOpenExport(type)}
      className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md cursor-pointer transition-all border border-gray-100"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <button className="px-4 py-2 bg-purple-100 text-purple-600 rounded-lg text-sm font-semibold hover:bg-purple-200 transition">
        Export Data
      </button>
    </motion.div>
  )

  return (
    <SuperAdminLayout
      title="Data Export"
      subtitle="Download platform data in CSV, Excel, or PDF format with custom filters"
    >
      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <ExportCard
          type="users"
          title="👥 Users"
          description="Export all user accounts, roles, and activity data"
          icon="👥"
        />
        <ExportCard
          type="events"
          title="📅 Events"
          description="Export all events with details and availability"
          icon="📅"
        />
        <ExportCard
          type="bookings"
          title="🎫 Bookings"
          description="Export booking transactions and payment records"
          icon="🎫"
        />
      </div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 mb-8"
      >
        <h3 className="font-bold text-gray-900 mb-3">📋 Export Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold mt-0.5">✓</span>
            <span>Multiple formats: CSV, Excel (XLSX), and PDF</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold mt-0.5">✓</span>
            <span>Professional formatting and styling</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold mt-0.5">✓</span>
            <span>Custom date range and status filters</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold mt-0.5">✓</span>
            <span>Handles large datasets efficiently</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold mt-0.5">✓</span>
            <span>Empty data handling with clear messaging</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold mt-0.5">✓</span>
            <span>Timestamped file names for organization</span>
          </div>
        </div>
      </motion.div>

      {/* Use Cases */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Common Use Cases</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">📊</div>
            <h4 className="font-semibold text-gray-900 mb-1">Analytics</h4>
            <p className="text-xs text-gray-600">Analyze trends and patterns</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">🔄</div>
            <h4 className="font-semibold text-gray-900 mb-1">Migration</h4>
            <p className="text-xs text-gray-600">Transfer to another system</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">💾</div>
            <h4 className="font-semibold text-gray-900 mb-1">Backup</h4>
            <p className="text-xs text-gray-600">Create data backups safely</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">📑</div>
            <h4 className="font-semibold text-gray-900 mb-1">Reporting</h4>
            <p className="text-xs text-gray-600">Generate custom reports</p>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <ExportDataModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          title={`Export ${selectedExportType?.charAt(0).toUpperCase() + selectedExportType?.slice(1)}`}
          filters={exportFiltersConfig[selectedExportType] || []}
          onExport={handleExport}
          isLoading={loadingExport}
        />
      )}
    </SuperAdminLayout>
  )
}
