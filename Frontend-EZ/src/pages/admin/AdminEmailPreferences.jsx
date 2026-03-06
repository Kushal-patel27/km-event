import React, { useEffect, useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import API from '../../services/api'

export default function AdminEmailPreferences() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [type, setType] = useState('any')
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 })
  const [summary, setSummary] = useState({
    emailUpdatesEnabled: 0,
    bookingRemindersEnabled: 0,
    newsletterEnabled: 0,
  })

  const loadData = async (page = 1, currentSearch = search, currentType = type) => {
    try {
      setLoading(true)
      setError('')
      const res = await API.get('/admin/email-preferences', {
        params: {
          page,
          limit: 20,
          search: currentSearch,
          type: currentType,
          role: 'user',
        },
      })

      setUsers(res.data?.users || [])
      setPagination(res.data?.pagination || { page: 1, pages: 1, total: 0, limit: 20 })
      setSummary(
        res.data?.summary || {
          emailUpdatesEnabled: 0,
          bookingRemindersEnabled: 0,
          newsletterEnabled: 0,
        }
      )
    } catch (err) {
      console.error('Failed to load email preferences', err)
      setError(err.response?.data?.message || 'Failed to load email preferences')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(1, search, type)
  }, [search, type])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput.trim())
  }

  const pillClass = (enabled) =>
    enabled
      ? 'inline-flex px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 border border-green-200'
      : 'inline-flex px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600 border border-gray-200'

  return (
    <AdminLayout title="Email Preferences">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Email Updates</div>
            <div className="text-2xl font-bold mt-1">{summary.emailUpdatesEnabled}</div>
            <p className="text-xs text-gray-500 mt-1">Users enabled</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Booking Reminders</div>
            <div className="text-2xl font-bold mt-1">{summary.bookingRemindersEnabled}</div>
            <p className="text-xs text-gray-500 mt-1">Users enabled</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Newsletter</div>
            <div className="text-2xl font-bold mt-1">{summary.newsletterEnabled}</div>
            <p className="text-xs text-gray-500 mt-1">Users enabled</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-end md:justify-between">
            <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name or email"
                className="w-full md:w-80 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Search
              </button>
            </form>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Filter by preference</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="any">Any enabled</option>
                <option value="emailUpdates">Email updates</option>
                <option value="bookingReminders">Booking reminders</option>
                <option value="newsletter">Newsletter</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{users.length}</span> of{' '}
            <span className="font-semibold text-gray-900">{pagination.total}</span> users
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email Updates</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Booking Reminders</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Newsletter</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Updated</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">Loading users...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">No users found for this filter.</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{user.email || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={pillClass(!!user?.preferences?.emailUpdates)}>
                          {user?.preferences?.emailUpdates ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={pillClass(!!user?.preferences?.bookingReminders)}>
                          {user?.preferences?.bookingReminders ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={pillClass(!!user?.preferences?.newsletter)}>
                          {user?.preferences?.newsletter ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {user.updatedAt ? new Date(user.updatedAt).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => loadData(Math.max(1, pagination.page - 1), search, type)}
              disabled={loading || pagination.page <= 1}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <div className="text-sm text-gray-600">
              Page <span className="font-semibold text-gray-900">{pagination.page}</span> of{' '}
              <span className="font-semibold text-gray-900">{pagination.pages || 1}</span>
            </div>
            <button
              onClick={() => loadData(Math.min(pagination.pages || 1, pagination.page + 1), search, type)}
              disabled={loading || pagination.page >= (pagination.pages || 1)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
