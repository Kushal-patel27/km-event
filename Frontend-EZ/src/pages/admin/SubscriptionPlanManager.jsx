import React, { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import API from '../../services/api'

export default function SubscriptionPlanManager() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    commissionPercentage: 0,
    monthlyFee: 0,
    eventLimit: '',
    ticketLimit: '',
    eventsPerMonth: '',
    payoutFrequency: 'monthly',
    minPayoutAmount: 100,
    displayOrder: 0,
    isActive: true,
    mostPopular: false
  })

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const { data } = await API.get('/subscriptions/plans?all=true')
      setPlans(data.plans || [])
      setError('')
    } catch (err) {
      console.error('Error fetching plans:', err)
      setError('Failed to load subscription plans')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? (value === '' ? '' : parseFloat(value) || 0) : 
              value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      
      // Prepare data - convert empty strings to null for optional numeric fields
      const dataToSend = {
        ...formData,
        eventLimit: formData.eventLimit === '' ? null : formData.eventLimit,
        ticketLimit: formData.ticketLimit === '' ? null : formData.ticketLimit,
        limits: {
          eventsPerMonth: formData.eventsPerMonth === '' ? null : formData.eventsPerMonth
        }
      }

      delete dataToSend.eventsPerMonth
      
      if (editingId) {
        await API.put(`/subscriptions/plans/${editingId}`, dataToSend)
        setSuccess('Plan updated successfully!')
      } else {
        await API.post('/subscriptions/plans', dataToSend)
        setSuccess('Plan created successfully!')
      }
      resetForm()
      fetchPlans()
    } catch (err) {
      console.error('Error saving plan:', err)
      setError(err.response?.data?.message || 'Failed to save plan')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (plan) => {
    setFormData({
      name: plan.name || '',
      description: plan.description || '',
      commissionPercentage: plan.commissionPercentage || 0,
      monthlyFee: plan.monthlyFee || 0,
      eventLimit: plan.eventLimit || '',
      ticketLimit: plan.ticketLimit || '',
      eventsPerMonth: plan.limits?.eventsPerMonth ?? '',
      payoutFrequency: plan.payoutFrequency || 'monthly',
      minPayoutAmount: plan.minPayoutAmount || 100,
      displayOrder: plan.displayOrder || 0,
      isActive: plan.isActive !== undefined ? plan.isActive : true,
      mostPopular: plan.mostPopular || false
    })
    setEditingId(plan._id)
    setShowAddForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return
    try {
        await API.delete(`/subscriptions/plans/${id}`)
      setSuccess('Plan deleted successfully!')
      fetchPlans()
    } catch (err) {
      console.error('Error deleting plan:', err)
      setError(err.response?.data?.message || 'Failed to delete plan')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      commissionPercentage: 0,
      monthlyFee: 0,
      eventLimit: '',
      ticketLimit: '',
      eventsPerMonth: '',
      payoutFrequency: 'monthly',
      minPayoutAmount: 100,
      displayOrder: 0,
      isActive: true,
      mostPopular: false
    })
    setEditingId(null)
    setShowAddForm(false)
  }

  if (loading && plans.length === 0) {
    return (
      <AdminLayout title="Subscription Plans" subtitle="Manage organizer subscription tiers">
        <div className="text-center py-8">Loading...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Subscription Plans" subtitle="Manage organizer subscription tiers and commissions">
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

      <div className="mb-6 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Total Plans: <strong>{plans.length}</strong>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showAddForm ? 'Cancel' : 'Add New Plan'}
        </button>
      </div>

      {/* Form */}
      {showAddForm && (
        <div className="mb-6 p-6 bg-white border border-gray-200 rounded-lg">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? 'Edit Plan' : 'Create New Plan'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Plan Name</label>
                {editingId ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  />
                ) : (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Standard"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Commission Percentage (%)</label>
                <input
                  type="number"
                  name="commissionPercentage"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.commissionPercentage}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Monthly Fee (₹)</label>
                <input
                  type="number"
                  name="monthlyFee"
                  min="0"
                  step="0.01"
                  value={formData.monthlyFee}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Event Limit</label>
                <input
                  type="number"
                  name="eventLimit"
                  value={formData.eventLimit}
                  onChange={handleInputChange}
                  placeholder="Leave empty for unlimited"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Ticket Limit</label>
                <input
                  type="number"
                  name="ticketLimit"
                  value={formData.ticketLimit}
                  onChange={handleInputChange}
                  placeholder="Leave empty for unlimited"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Events per Month</label>
                <input
                  type="number"
                  name="eventsPerMonth"
                  value={formData.eventsPerMonth}
                  onChange={handleInputChange}
                  placeholder="Leave empty for unlimited"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Payout Frequency</label>
                <select
                  name="payoutFrequency"
                  value={formData.payoutFrequency}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Minimum Payout Amount (₹)</label>
                <input
                  type="number"
                  name="minPayoutAmount"
                  min="0"
                  step="0.01"
                  value={formData.minPayoutAmount}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Display Order</label>
                <input
                  type="number"
                  name="displayOrder"
                  value={formData.displayOrder}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="w-4 h-4"
              />
              <label htmlFor="isActive" className="text-sm font-semibold">Active</label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="mostPopular"
                name="mostPopular"
                checked={formData.mostPopular}
                onChange={handleInputChange}
                className="w-4 h-4"
              />
              <label htmlFor="mostPopular" className="text-sm font-semibold">Mark as Most Popular</label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingId ? 'Update Plan' : 'Create Plan'}
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

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map(plan => (
          <div key={plan._id} className="bg-white border border-gray-200 rounded-lg p-6 shadow hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  {plan.mostPopular && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">Most Popular</span>
                  )}
                </div>
                {!plan.isActive && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded mt-1">Inactive</span>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-blue-600">{plan.commissionPercentage}% Commission</div>
                {plan.monthlyFee > 0 && <div className="text-xs text-gray-600">₹{plan.monthlyFee}/mo</div>}
              </div>
            </div>

            {plan.description && <p className="text-sm text-gray-600 mb-4">{plan.description}</p>}

            <div className="space-y-2 text-sm mb-4 border-t pt-4">
              {plan.eventLimit && <div>📊 Max Events: {plan.eventLimit}</div>}
              {plan.ticketLimit && <div>🎫 Max Tickets: {plan.ticketLimit}</div>}
              {plan.limits?.eventsPerMonth && <div>📅 Events/mo: {plan.limits.eventsPerMonth}</div>}
              <div>💰 Min Payout: ₹{plan.minPayoutAmount}</div>
              <div>📅 Payout: {plan.payoutFrequency}</div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(plan)}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(plan._id)}
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && !showAddForm && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No plans created yet. Create your first subscription plan!</p>
        </div>
      )}
    </AdminLayout>
  )
}
