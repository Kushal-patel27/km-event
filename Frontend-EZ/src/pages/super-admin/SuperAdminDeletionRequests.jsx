import React, { useState, useEffect } from 'react'
import API from '../../services/api'
import SuperAdminLayout from '../../components/layout/SuperAdminLayout'

export default function SuperAdminDeletionRequests() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit] = useState(20)
  const [cancelling, setCancelling] = useState(null)

  useEffect(() => {
    fetchDeletionRequests()
  }, [page])

  const fetchDeletionRequests = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await API.get(`/super-admin/users/deletion/pending?page=${page}&limit=${limit}`)
      setUsers(res.data.users)
      setTotal(res.data.pagination.total)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load deletion requests')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelDeletion = async (userId, userName) => {
    if (!window.confirm(`Cancel deletion request for ${userName}? Their account will be restored.`)) {
      return
    }

    setCancelling(userId)
    try {
      await API.post(`/super-admin/users/${userId}/deletion/cancel`)
      setUsers(prev => prev.filter(u => u._id !== userId))
      setTotal(prev => Math.max(0, prev - 1))
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel deletion request')
    } finally {
      setCancelling(null)
    }
  }

  const getDaysRemaining = (scheduledDate) => {
    const remaining = Math.max(0, Math.ceil((new Date(scheduledDate) - new Date()) / (1000 * 60 * 60 * 24)))
    return remaining
  }

  const getStatusColor = (days) => {
    if (days <= 3) return 'bg-red-100 text-red-800 border-red-300'
    if (days <= 7) return 'bg-orange-100 text-orange-800 border-orange-300'
    return 'bg-yellow-100 text-yellow-800 border-yellow-300'
  }

  return (
    <SuperAdminLayout 
      title="Account Deletion Requests" 
      subtitle="Manage pending account deletion requests from users"
    >
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Total Requests</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{total}</p>
          <p className="text-xs text-gray-500 mt-1">Pending account deletions</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">On This Page</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{users.length}</p>
          <p className="text-xs text-gray-500 mt-1">Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg font-medium">No pending account deletion requests</p>
          <p className="text-gray-400 text-sm mt-2">All users' accounts are safe</p>
        </div>
      ) : (
        <>
          {/* Deletion Requests Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 mb-6">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">User</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Role</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Request Date</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Scheduled Deletion</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Days Remaining</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => {
                    const daysRemaining = getDaysRemaining(user.deletionDetails.scheduledFor)
                    return (
                      <tr key={user._id} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-600">{user.email}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {new Date(user.deletionDetails.requestedAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {new Date(user.deletionDetails.scheduledFor).toLocaleDateString()} {new Date(user.deletionDetails.scheduledFor).toLocaleTimeString()}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(daysRemaining)}`}>
                            {daysRemaining} days
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm space-x-2">
                          <button
                            onClick={() => handleCancelDeletion(user._id, user.name)}
                            disabled={cancelling === user._id}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                          >
                            {cancelling === user._id ? 'Cancelling...' : 'Cancel Request'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {users.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, total)} of {total} requests
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
