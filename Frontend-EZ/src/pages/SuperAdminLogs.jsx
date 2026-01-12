import React, { useState, useEffect } from 'react'
import API from '../services/api'
import SuperAdminLayout from '../components/SuperAdminLayout'

export default function SuperAdminLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit] = useState(50)

  useEffect(() => {
    fetchLogs()
  }, [page])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams({
        page,
        limit,
      })
      const res = await API.get(`/super-admin/logs?${params}`)
      console.log('Logs response:', res.data) // Debug log
      setLogs(res.data.logs)
      setTotal(res.data.pagination.total)
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
        return 'bg-green-100 text-green-800'
      case 'user_created':
        return 'bg-blue-100 text-blue-800'
      case 'booking_created':
        return 'bg-purple-100 text-purple-800'
      case 'session_activity':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatLogType = (type) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const getLogDetails = (log) => {
    if (log.type === 'booking_created') {
      return `Event: ${log.details?.event || 'N/A'}, Qty: ${log.details?.quantity || 0}`
    }
    if (log.details?.userAgent) {
      return log.details.userAgent.substring(0, 50) + '...'
    }
    if (log.details?.role) {
      return `Role: ${log.details.role}`
    }
    return '-'
  }

  return (
    <SuperAdminLayout title="System Logs & Audit Trail" subtitle="View platform activity and security logs">

      {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <>
            {/* Logs Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6 overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Timestamp</th>
                    <th className="px-3 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">User</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">IP Address</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        No logs found
                      </td>
                    </tr>
                  ) : (
                    logs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-3 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getLogTypeStyle(log.type)}`}>
                            {formatLogType(log.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {log.userName || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {log.userEmail || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {log.details?.ip || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {getLogDetails(log)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={page * limit >= total}
                  onClick={() => setPage(page + 1)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
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
