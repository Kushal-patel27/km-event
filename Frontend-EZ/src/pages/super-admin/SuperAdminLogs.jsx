import React, { useState, useEffect } from 'react'
import API from '../../services/api'
import SuperAdminLayout from '../../components/layout/SuperAdminLayout'

export default function SuperAdminLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit] = useState(50)
  
  // Filter states
  const [filterType, setFilterType] = useState('')
  const [filterEmail, setFilterEmail] = useState('')
  const [filterSearch, setFilterSearch] = useState('')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')
  const [availableTypes, setAvailableTypes] = useState([])

  useEffect(() => {
    setPage(1) // Reset to first page when filters change
  }, [filterType, filterEmail, filterSearch, filterStartDate, filterEndDate])

  useEffect(() => {
    fetchLogs()
  }, [page, filterType, filterEmail, filterSearch, filterStartDate, filterEndDate])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams({
        page,
        limit,
      })
      
      if (filterType) params.append('type', filterType)
      if (filterEmail) params.append('email', filterEmail)
      if (filterSearch) params.append('search', filterSearch)
      if (filterStartDate) params.append('startDate', filterStartDate)
      if (filterEndDate) params.append('endDate', filterEndDate)
      
      const res = await API.get(`/super-admin/logs?${params}`)
      console.log('Logs response:', res.data) // Debug log
      setLogs(res.data.logs)
      setTotal(res.data.pagination.total)
      
      if (res.data.filters?.availableTypes) {
        setAvailableTypes(res.data.filters.availableTypes)
      }
    } catch (err) {
      console.error('Error fetching logs:', err)
      setError(err.response?.data?.message || 'Failed to load logs')
    } finally {
      setLoading(false)
    }
  }

  const getLogTypeStyle = (type) => {
    switch(type) {
      case 'login':
        return 'bg-green-100 text-green-800 border-l-4 border-green-500'
      case 'user_created':
        return 'bg-blue-100 text-blue-800 border-l-4 border-blue-500'
      case 'booking_created':
        return 'bg-purple-100 text-purple-800 border-l-4 border-purple-500'
      case 'session_activity':
        return 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500'
      case 'event_created':
        return 'bg-orange-100 text-orange-800 border-l-4 border-orange-500'
      default:
        return 'bg-gray-100 text-gray-800 border-l-4 border-gray-500'
    }
  }

  const getLogTypeIcon = (type) => {
    switch(type) {
      case 'login':
        return '🔓'
      case 'user_created':
        return '👤'
      case 'booking_created':
        return '🎫'
      case 'session_activity':
        return '🔗'
      case 'event_created':
        return '📅'
      default:
        return '📋'
    }
  }

  const formatLogType = (type) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const getLogDetails = (log) => {
    if (log.type === 'booking_created') {
      return `Event: ${log.details?.event || 'N/A'}, Qty: ${log.details?.quantity || 0}, Status: ${log.details?.status || 'N/A'}`
    }
    if (log.type === 'event_created') {
      return `Event: ${log.details?.eventTitle || 'N/A'}, Category: ${log.details?.eventCategory || 'N/A'}, Tickets: ${log.details?.totalTickets || 0}`
    }
    if (log.details?.userAgent) {
      return log.details.userAgent.substring(0, 60) + '...'
    }
    if (log.details?.role) {
      return `Role: ${log.details.role}`
    }
    return '-'
  }

  const clearFilters = () => {
    setFilterType('')
    setFilterEmail('')
    setFilterSearch('')
    setFilterStartDate('')
    setFilterEndDate('')
  }

  const pages = Math.ceil(total / limit)

  return (
    <SuperAdminLayout title="System Logs & Audit Trail" subtitle="View all platform activity and system events">

      {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Log Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm"
            >
              <option value="">All Types</option>
              {availableTypes.map(type => (
                <option key={type} value={type}>
                  {formatLogType(type)}
                </option>
              ))}
            </select>
          </div>

          {/* Email Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={filterEmail}
              onChange={(e) => setFilterEmail(e.target.value)}
              placeholder="Filter by email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm"
            />
          </div>

          {/* Search Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Name, event, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm"
            />
          </div>

          {/* Start Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm"
            />
          </div>

          {/* End Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm"
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        {(filterType || filterEmail || filterSearch || filterStartDate || filterEndDate) && (
          <div className="mt-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <>
            {/* Logs Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-sm font-semibold text-gray-900">Timestamp</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-sm font-semibold text-gray-900">User</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-sm font-semibold text-gray-900">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        No logs found
                      </td>
                    </tr>
                  ) : (
                    logs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('en-US', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </td>
                        <td className="px-3 py-4">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getLogTypeStyle(log.type)}`}>
                            {getLogTypeIcon(log.type)} {formatLogType(log.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {log.userName || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {log.userEmail || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-sm break-words whitespace-normal">
                          {getLogDetails(log)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {logs.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
                {Math.min(page * limit, total)} of {total} log entries
              </p>
              <div className="space-x-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 mx-2">
                  Page {page} of {pages}
                </span>
                <button
                  disabled={page >= pages}
                  onClick={() => setPage(page + 1)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
        </>
      )}
    </SuperAdminLayout>
  )
}
