import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AdminLayout from '../../components/layout/AdminLayout'
import API from '../../services/api'
import formatCurrency from '../../utils/currency'

export default function OrganizerSubscriptionManager() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [subscriptions, setSubscriptions] = useState([])
  const [plans, setPlans] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [formData, setFormData] = useState({
    organizerId: '',
    planId: ''
  })
  const [authError, setAuthError] = useState(false)

  useEffect(() => {
    if (!user || !user.token) {
      setAuthError(true)
      setLoading(false)
      return
    }
    setAuthError(false)
    fetchData()
  }, [user?.token, statusFilter, search])

  const fetchData = async () => {
    // Guard: Don't fetch if no user token
    if (!user || !user.token) {
      console.log('Skipping fetch - no auth token')
      return
    }
    
    try {
      setLoading(true)
      const [subsRes, plansRes, usersRes] = await Promise.all([
        API.get(`/subscriptions/all-subscriptions?status=${statusFilter}&search=${search}`),
        API.get('/subscriptions/plans?all=true'),
        API.get('/super-admin/users?role=event_admin&limit=999')
      ])
      setSubscriptions(subsRes.data.data || [])
      setPlans(plansRes.data.plans || [])
      setUsers(usersRes.data.users || [])
      setError('')
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await API.post('/subscriptions/assign-plan', {
        organizerId: formData.organizerId,
        planId: formData.planId
      })
      setSuccess('Plan assigned successfully!')
      resetForm()
      fetchData()
    } catch (err) {
      console.error('Error assigning plan:', err)
      setError(err.response?.data?.message || 'Failed to assign plan')
    }
  }

  const handleStatusChange = async (subscriptionId, newStatus) => {
    try {
      await API.put(`/subscriptions/subscriptions/${subscriptionId}/status`, {
        status: newStatus
      })
      setSuccess(`Subscription ${newStatus} successfully!`)
      fetchData()
    } catch (err) {
      console.error('Error updating subscription:', err)
      setError('Failed to update subscription')
    }
  }

  const resetForm = () => {
    setFormData({ organizerId: '', planId: '' })
    setShowAssignForm(false)
  }

  return (
    <AdminLayout title="Organizer Subscriptions" subtitle="Manage and assign subscription plans to organizers">
      {authError && (
        <div className="mb-4 p-6 bg-yellow-100 border-2 border-yellow-400 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-yellow-800 mb-2">🔒 Authentication Required</h3>
              <p className="text-yellow-700">You must be logged in as an admin to manage organizer subscriptions.</p>
            </div>
            <button
              onClick={() => navigate('/admin/login')}
              className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-semibold"
            >
              Sign In
            </button>
          </div>
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-lg text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-300 rounded-lg text-green-700">
          {success}
        </div>
      )}

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search organizer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button
          onClick={() => setShowAssignForm(!showAssignForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showAssignForm ? 'Cancel' : 'Assign Plan'}
        </button>
      </div>

      {/* Assign Plan Form */}
      {showAssignForm && (
        <div className="mb-6 p-6 bg-white border border-gray-200 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Assign Subscription Plan</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Select Organizer</label>
                <select
                  value={formData.organizerId}
                  onChange={(e) => setFormData({ ...formData, organizerId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose an organizer</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Select Plan</label>
                <select
                  value={formData.planId}
                  onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose a plan</option>
                  {plans.map(plan => (
                    <option key={plan._id} value={plan._id}>
                      {plan.name} - {plan.commissionPercentage}% commission
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Assign Plan
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Subscriptions Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Organizer</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Plan</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Commission</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Total Revenue</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No subscriptions found
                  </td>
                </tr>
              ) : (
                subscriptions.map(sub => (
                  <tr key={sub._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{sub.organizer?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{sub.organizer?.email || 'N/A'}</td>
                    <td className="px-6 py-4 font-semibold text-blue-600">{sub.plan?.name}</td>
                    <td className="px-6 py-4 text-sm">{sub.currentCommissionPercentage}%</td>
                    <td className="px-6 py-4 text-sm font-semibold">{formatCurrency(sub.totalRevenue || 0)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded text-xs font-semibold ${
                        sub.status === 'active' ? 'bg-green-100 text-green-700'
                          : sub.status === 'suspended' ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={sub.status}
                        onChange={(e) => handleStatusChange(sub._id, e.target.value)}
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
