import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AdminLayout from '../../components/layout/AdminLayout'
import ExportDataModal from '../../components/admin/ExportDataModal'
import API from '../../services/api'
import formatCurrency from '../../utils/currency'

export default function SubscriptionDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [plans, setPlans] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(false)
  const getDefaultPlanForm = () => ({
    name: '',
    displayName: '',
    description: '',
    commissionPercentage: 30,
    monthlyFee: 0,
    eventLimit: null,
    ticketLimit: null,
    payoutFrequency: 'monthly',
    minPayoutAmount: 100,
    features: {
      ticketing: { enabled: true, limit: null, description: 'Sell and manage event tickets' },
      qrCheckIn: { enabled: false, description: 'QR code-based attendee check-in' },
      scannerApp: { enabled: false, description: 'Mobile scanner app for entry verification' },
      analytics: { enabled: false, description: 'Real-time event analytics and insights' },
      emailSms: { enabled: false, emailLimit: 0, smsLimit: 0, description: 'Automated email and SMS notifications' },
      payments: { enabled: true, transactionFee: 3.5, description: 'Secure payment processing' },
      weatherAlerts: { enabled: false, description: 'Weather-based alerts for outdoor events' },
      subAdmins: { enabled: false, limit: 0, description: 'Assign additional administrators' },
      reports: { enabled: false, types: [], description: 'Generate comprehensive event reports' }
    },
    limits: {
      eventsPerMonth: 1,
      customBranding: false,
      prioritySupport: false
    },
    isActive: true,
    displayOrder: 1,
    mostPopular: false
  })
  const [planForm, setPlanForm] = useState(getDefaultPlanForm())
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [editingPlanId, setEditingPlanId] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [authError, setAuthError] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)

  // Fetch dashboard data
  useEffect(() => {
    if (!user || !user.token) {
      setAuthError(true)
      setLoading(false)
      return
    }
    setAuthError(false)
    fetchData()

    const intervalId = setInterval(() => {
      fetchData({ silent: true })
    }, 15000)

    return () => clearInterval(intervalId)
  }, [user?.token])

  const fetchData = async ({ silent = false } = {}) => {
    // Guard: Don't fetch if no user token
    if (!user || !user.token) {
      console.log('Skipping fetch - no auth token')
      return
    }
    
    if (!silent) {
      setLoading(true)
    }
    try {
      const [analyticsRes, plansRes, subsRes] = await Promise.all([
        API.get('/subscriptions/analytics/platform'),
        API.get('/subscriptions/plans?all=true'),
        API.get('/subscriptions/all-subscriptions')
      ])

      setStats(analyticsRes.data?.data)
      setPlans(plansRes.data?.plans || [])
      setSubscriptions(subsRes.data?.data || [])
    } catch (error) {
      if (!silent) {
        setMessage({ type: 'error', text: 'Failed to load dashboard data' })
      }
      console.error('Error fetching data:', error)
    }
    if (!silent) {
      setLoading(false)
    }
  }

  const handleExport = async (format, filters) => {
    try {
      setMessage({ type: '', text: '' })
      
      // Build query params - export subscriptions (organizers)
      const params = new URLSearchParams({ format })
      
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.status) params.append('status', filters.status)
      
      // For subscriptions, we can use bookings export or create a custom endpoint
      // Using bookings export with subscription context
      const response = await API.get(`/admin/export/bookings?${params.toString()}`, {
        responseType: 'blob'
      })
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      
      // Determine file extension
      const ext = format === 'csv' ? 'csv' : format === 'xlsx' ? 'xlsx' : 'pdf'
      link.setAttribute('download', `subscriptions-export-${Date.now()}.${ext}`)
      
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      setMessage({ type: 'success', text: 'Data exported successfully!' })
    } catch (err) {
      console.error('Export error:', err)
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to export data' })
    }
  }

  // Filter configuration for export modal
  const exportFilters = [
    {
      key: 'startDate',
      label: 'Start Date',
      type: 'date',
    },
    {
      key: 'endDate',
      label: 'End Date',
      type: 'date',
    },
    {
      key: 'status',
      label: 'Subscription Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'expired', label: 'Expired' },
      ],
    },
  ]

  const mergeFeatures = (features) => {
    const baseFeatures = getDefaultPlanForm().features
    if (!features || Array.isArray(features)) {
      return baseFeatures
    }
    return Object.keys(baseFeatures).reduce((acc, key) => {
      const base = baseFeatures[key]
      const incoming = features[key] || {}
      acc[key] = { ...base, ...incoming }
      return acc
    }, {})
  }

  const normalizePlanForm = (plan) => {
    const base = getDefaultPlanForm()
    return {
      ...base,
      ...plan,
      displayName: plan.displayName || plan.name || '',
      description: plan.description || '',
      commissionPercentage: plan.commissionPercentage ?? base.commissionPercentage,
      monthlyFee: plan.monthlyFee ?? base.monthlyFee,
      eventLimit: plan.eventLimit ?? base.eventLimit,
      ticketLimit: plan.ticketLimit ?? base.ticketLimit,
      payoutFrequency: plan.payoutFrequency || base.payoutFrequency,
      minPayoutAmount: plan.minPayoutAmount ?? base.minPayoutAmount,
      features: mergeFeatures(plan.features),
      limits: { ...base.limits, ...(plan.limits || {}) },
      isActive: plan.isActive !== undefined ? plan.isActive : base.isActive,
      displayOrder: plan.displayOrder ?? base.displayOrder,
      mostPopular: plan.mostPopular ?? base.mostPopular
    }
  }

  const openCreatePlan = () => {
    setEditingPlanId(null)
    setPlanForm(getDefaultPlanForm())
    setShowPlanForm(true)
  }

  const openEditPlan = (plan) => {
    setEditingPlanId(plan._id)
    setPlanForm(normalizePlanForm(plan))
    setShowPlanForm(true)
  }

  const handlePlanSubmit = async (e) => {
    e.preventDefault()
    if (!planForm.name) {
      setMessage({ type: 'error', text: 'Plan name is required' })
      return
    }
    if (!planForm.displayName.trim()) {
      setMessage({ type: 'error', text: 'Display name is required' })
      return
    }
    if (!planForm.description.trim()) {
      setMessage({ type: 'error', text: 'Description is required' })
      return
    }
    if (!editingPlanId && plans.some(p => p.name === planForm.name)) {
      setMessage({ type: 'error', text: 'A plan with this name already exists' })
      return
    }

    try {
      const payload = {
        ...planForm,
        displayName: planForm.displayName.trim(),
        description: planForm.description.trim()
      }

      if (editingPlanId) {
        await API.put(`/subscriptions/plans/${editingPlanId}`, payload)
        setMessage({ type: 'success', text: 'Plan updated successfully' })
      } else {
        await API.post('/subscriptions/plans', payload)
        setMessage({ type: 'success', text: 'Plan created successfully' })
      }

      setShowPlanForm(false)
      setEditingPlanId(null)
      setPlanForm(getDefaultPlanForm())
      fetchData({ silent: true })
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save plan' })
    }
  }

  const togglePlanStatus = async (plan) => {
    try {
      await API.put(`/subscriptions/plans/${plan._id}`, { isActive: !plan.isActive })
      setMessage({ type: 'success', text: `Plan ${plan.isActive ? 'disabled' : 'enabled'} successfully` })
      fetchData({ silent: true })
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update plan status' })
    }
  }

  return (
    <AdminLayout title="Subscription Management Dashboard">
      {authError && (
        <div className="mb-4 p-6 bg-yellow-100 border-2 border-yellow-400 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-yellow-800 mb-2">🔒 Authentication Required</h3>
              <p className="text-yellow-700">You must be logged in as an admin to access subscription management.</p>
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
      {message.text && (
        <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium border-b-2 transition ${activeTab === 'overview' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
        >
          📊 Overview
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 font-medium border-b-2 transition ${activeTab === 'plans' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
        >
          💳 Plans
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-4 py-2 font-medium border-b-2 transition ${activeTab === 'subscriptions' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
        >
          👨‍💼 Subscriptions
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 font-medium border-b-2 transition ${activeTab === 'analytics' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
        >
          📈 Analytics
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-sm text-gray-600 font-medium">Total Revenue</div>
            <div className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats?.summary?.totalRevenue || 0)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-sm text-gray-600 font-medium">Platform Commission</div>
            <div className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(stats?.summary?.totalCommission || 0)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-sm text-gray-600 font-medium">Organizer Payouts</div>
            <div className="text-2xl font-bold text-blue-600 mt-2">{formatCurrency(stats?.summary?.totalOrganizerPayout || 0)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-sm text-gray-600 font-medium">Active Plans</div>
            <div className="text-2xl font-bold text-purple-600 mt-2">{plans.filter(p => p.isActive).length}</div>
          </div>
        </div>
      )}

      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-600">
              Total Plans: <span className="font-semibold text-gray-900">{plans.length}</span>
            </div>
            <button
              type="button"
              onClick={openCreatePlan}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Create Plan
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : plans.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No plans configured</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {plans.map((plan) => (
                <div key={plan._id} className="bg-white border border-gray-200 rounded-lg p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-semibold text-gray-900">{plan.displayName || plan.name}</h4>
                        {plan.mostPopular && (
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-700">Most Popular</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{plan.description || 'No description provided.'}</p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${plan.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-700">
                    <div>
                      <div className="text-xs text-gray-500">Commission</div>
                      <div className="font-semibold">{plan.commissionPercentage || 0}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Monthly Fee</div>
                      <div className="font-semibold">{formatCurrency(plan.monthlyFee || 0)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Event Limit</div>
                      <div className="font-semibold">
                        {plan.eventLimit === null || plan.eventLimit === undefined ? 'Unlimited' : plan.eventLimit}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Ticket Limit</div>
                      <div className="font-semibold">
                        {plan.ticketLimit === null || plan.ticketLimit === undefined ? 'Unlimited' : plan.ticketLimit}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Events/Month</div>
                      <div className="font-semibold">
                        {plan.limits?.eventsPerMonth === null || plan.limits?.eventsPerMonth === undefined
                          ? 'Unlimited'
                          : plan.limits?.eventsPerMonth}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Custom Branding</div>
                      <div className="font-semibold">
                        {plan.limits?.customBranding ? '✓ Enabled' : '✗ Disabled'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Priority Support</div>
                      <div className="font-semibold">
                        {plan.limits?.prioritySupport ? '✓ Enabled' : '✗ Disabled'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openEditPlan(plan)}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePlanStatus(plan)}
                      className={`px-3 py-2 text-sm rounded-lg ${plan.isActive ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                    >
                      {plan.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showPlanForm && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {editingPlanId ? 'Edit Plan' : 'Create Plan'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPlanForm(false)
                      setEditingPlanId(null)
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
                <form onSubmit={handlePlanSubmit} className="space-y-6">
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Plan Name *</label>
                        <input
                          type="text"
                          value={planForm.name}
                          onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                          disabled={!!editingPlanId}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Display Name *</label>
                        <input
                          type="text"
                          value={planForm.displayName}
                          onChange={(e) => setPlanForm({ ...planForm, displayName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                          required
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                      <textarea
                        value={planForm.description}
                        onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                      />
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Display Order</label>
                        <input
                          type="number"
                          min="0"
                          value={planForm.displayOrder}
                          onChange={(e) => setPlanForm({ ...planForm, displayOrder: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                          value={planForm.isActive}
                          onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.value === 'true' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={planForm.mostPopular}
                          onChange={(e) => setPlanForm({ ...planForm, mostPopular: e.target.checked })}
                          className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Mark as Most Popular</p>
                          <p className="text-xs text-gray-600">Highlight this plan on pricing pages</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="border-b pb-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Revenue & Payout</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Commission Percentage (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={planForm.commissionPercentage}
                          onChange={(e) => setPlanForm({ ...planForm, commissionPercentage: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Fee (₹)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={planForm.monthlyFee}
                          onChange={(e) => setPlanForm({ ...planForm, monthlyFee: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Event Limit</label>
                        <input
                          type="number"
                          placeholder="Unlimited"
                          value={planForm.eventLimit === null ? '' : planForm.eventLimit}
                          onChange={(e) => setPlanForm({ ...planForm, eventLimit: e.target.value === '' ? null : parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Ticket Limit</label>
                        <input
                          type="number"
                          placeholder="Unlimited"
                          value={planForm.ticketLimit === null ? '' : planForm.ticketLimit}
                          onChange={(e) => setPlanForm({ ...planForm, ticketLimit: e.target.value === '' ? null : parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payout Frequency</label>
                        <select
                          value={planForm.payoutFrequency}
                          onChange={(e) => setPlanForm({ ...planForm, payoutFrequency: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Min Payout Amount (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={planForm.minPayoutAmount}
                          onChange={(e) => setPlanForm({ ...planForm, minPayoutAmount: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-b pb-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Features</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <input
                          type="checkbox"
                          checked={planForm.features.ticketing.enabled}
                          onChange={(e) => setPlanForm({
                            ...planForm,
                            features: { ...planForm.features, ticketing: { ...planForm.features.ticketing, enabled: e.target.checked } }
                          })}
                          className="mt-1 w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">Ticketing</p>
                          <p className="text-sm text-gray-600">Sell and manage event tickets</p>
                          {planForm.features.ticketing.enabled && (
                            <input
                              type="number"
                              placeholder="Ticket limit (blank = unlimited)"
                              value={planForm.features.ticketing.limit === null ? '' : planForm.features.ticketing.limit}
                              onChange={(e) => setPlanForm({
                                ...planForm,
                                features: { ...planForm.features, ticketing: { ...planForm.features.ticketing, limit: e.target.value === '' ? null : parseInt(e.target.value) } }
                              })}
                              className="mt-2 w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <input
                          type="checkbox"
                          checked={planForm.features.qrCheckIn.enabled}
                          onChange={(e) => setPlanForm({
                            ...planForm,
                            features: { ...planForm.features, qrCheckIn: { ...planForm.features.qrCheckIn, enabled: e.target.checked } }
                          })}
                          className="mt-1 w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                        />
                        <div>
                          <p className="font-medium text-gray-900">QR Code Check-in</p>
                          <p className="text-sm text-gray-600">QR code-based attendee check-in</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <input
                          type="checkbox"
                          checked={planForm.features.scannerApp.enabled}
                          onChange={(e) => setPlanForm({
                            ...planForm,
                            features: { ...planForm.features, scannerApp: { ...planForm.features.scannerApp, enabled: e.target.checked } }
                          })}
                          className="mt-1 w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                        />
                        <div>
                          <p className="font-medium text-gray-900">Scanner App</p>
                          <p className="text-sm text-gray-600">Mobile scanner app for entry verification</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <input
                          type="checkbox"
                          checked={planForm.features.analytics.enabled}
                          onChange={(e) => setPlanForm({
                            ...planForm,
                            features: { ...planForm.features, analytics: { ...planForm.features.analytics, enabled: e.target.checked } }
                          })}
                          className="mt-1 w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                        />
                        <div>
                          <p className="font-medium text-gray-900">Analytics</p>
                          <p className="text-sm text-gray-600">Real-time event analytics and insights</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <input
                          type="checkbox"
                          checked={planForm.features.emailSms.enabled}
                          onChange={(e) => setPlanForm({
                            ...planForm,
                            features: { ...planForm.features, emailSms: { ...planForm.features.emailSms, enabled: e.target.checked } }
                          })}
                          className="mt-1 w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">Email & SMS Notifications</p>
                          <p className="text-sm text-gray-600">Automated email and SMS notifications</p>
                          {planForm.features.emailSms.enabled && (
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              <input
                                type="number"
                                placeholder="Emails/month"
                                value={planForm.features.emailSms.emailLimit}
                                onChange={(e) => setPlanForm({
                                  ...planForm,
                                  features: { ...planForm.features, emailSms: { ...planForm.features.emailSms, emailLimit: parseInt(e.target.value) || 0 } }
                                })}
                                className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                              <input
                                type="number"
                                placeholder="SMS/month"
                                value={planForm.features.emailSms.smsLimit}
                                onChange={(e) => setPlanForm({
                                  ...planForm,
                                  features: { ...planForm.features, emailSms: { ...planForm.features.emailSms, smsLimit: parseInt(e.target.value) || 0 } }
                                })}
                                className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <input
                          type="checkbox"
                          checked={planForm.features.payments.enabled}
                          onChange={(e) => setPlanForm({
                            ...planForm,
                            features: { ...planForm.features, payments: { ...planForm.features.payments, enabled: e.target.checked } }
                          })}
                          className="mt-1 w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">Payments</p>
                          <p className="text-sm text-gray-600">Secure payment processing</p>
                          {planForm.features.payments.enabled && (
                            <input
                              type="number"
                              placeholder="Transaction fee (%)"
                              value={planForm.features.payments.transactionFee}
                              onChange={(e) => setPlanForm({
                                ...planForm,
                                features: { ...planForm.features, payments: { ...planForm.features.payments, transactionFee: parseFloat(e.target.value) || 0 } }
                              })}
                              className="mt-2 w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                              step="0.1"
                            />
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <input
                          type="checkbox"
                          checked={planForm.features.weatherAlerts.enabled}
                          onChange={(e) => setPlanForm({
                            ...planForm,
                            features: { ...planForm.features, weatherAlerts: { ...planForm.features.weatherAlerts, enabled: e.target.checked } }
                          })}
                          className="mt-1 w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                        />
                        <div>
                          <p className="font-medium text-gray-900">Weather Alerts</p>
                          <p className="text-sm text-gray-600">Weather-based alerts for outdoor events</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <input
                          type="checkbox"
                          checked={planForm.features.subAdmins.enabled}
                          onChange={(e) => setPlanForm({
                            ...planForm,
                            features: { ...planForm.features, subAdmins: { ...planForm.features.subAdmins, enabled: e.target.checked } }
                          })}
                          className="mt-1 w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">Sub-admins</p>
                          <p className="text-sm text-gray-600">Assign additional administrators</p>
                          {planForm.features.subAdmins.enabled && (
                            <input
                              type="number"
                              placeholder="Max sub-admins allowed"
                              value={planForm.features.subAdmins.limit}
                              onChange={(e) => setPlanForm({
                                ...planForm,
                                features: { ...planForm.features, subAdmins: { ...planForm.features.subAdmins, limit: parseInt(e.target.value) || 0 } }
                              })}
                              className="mt-2 w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <input
                          type="checkbox"
                          checked={planForm.features.reports.enabled}
                          onChange={(e) => setPlanForm({
                            ...planForm,
                            features: { ...planForm.features, reports: { ...planForm.features.reports, enabled: e.target.checked } }
                          })}
                          className="mt-1 w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                        />
                        <div>
                          <p className="font-medium text-gray-900">Reports</p>
                          <p className="text-sm text-gray-600">Generate comprehensive event reports</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-b pb-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Plan Limits</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Events per Month</label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={planForm.limits.eventsPerMonth}
                          onChange={(e) => setPlanForm({
                            ...planForm,
                            limits: { ...planForm.limits, eventsPerMonth: parseInt(e.target.value) || 1 }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Custom Branding</label>
                        <select
                          value={planForm.limits.customBranding}
                          onChange={(e) => setPlanForm({
                            ...planForm,
                            limits: { ...planForm.limits, customBranding: e.target.value === 'true' }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="false">Disabled</option>
                          <option value="true">Enabled</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Priority Support</label>
                        <select
                          value={planForm.limits.prioritySupport}
                          onChange={(e) => setPlanForm({
                            ...planForm,
                            limits: { ...planForm.limits, prioritySupport: e.target.value === 'true' }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="false">Disabled</option>
                          <option value="true">Enabled</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowPlanForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                    >
                      {editingPlanId ? 'Update' : 'Create'} Plan
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBSCRIPTIONS TAB */}
      {activeTab === 'subscriptions' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Organizer Subscriptions</h3>
            <button
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              📥 Export Data
            </button>
          </div>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No organizers assigned yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] table-auto">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">Organizer</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">Plan</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">Commission</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">Total Revenue</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">Tickets Sold</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => (
                    <tr key={sub._id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium whitespace-nowrap">{sub.organizer?.name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{sub.plan?.name}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">{sub.currentCommissionPercentage}%</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${sub.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{formatCurrency(sub.totalRevenue || 0)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{sub.totalTicketsSold || 0}</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <button
                          onClick={() => navigate('/admin/organizer-subscriptions')}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-sm text-gray-600 font-medium">Total Revenue</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(stats?.summary?.totalRevenue || 0)}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-sm text-gray-600 font-medium">Tickets Sold</div>
              <div className="text-3xl font-bold text-purple-600 mt-2">
                {stats?.summary?.totalTickets || 0}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-sm text-gray-600 font-medium">Total Bookings</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{stats?.summary?.totalBookings || 0}</div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-sm text-gray-600 font-medium">Avg Commission Rate</div>
              <div className="text-3xl font-bold text-blue-600 mt-2">
                {plans.length > 0
                  ? Math.round(
                      plans.reduce((sum, p) => sum + (Number(p.commissionPercentage) || 0), 0) /
                        plans.length
                    )
                  : 0}%
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-sm text-gray-600 font-medium">Active Subscriptions</div>
              <div className="text-3xl font-bold text-green-600 mt-2">
                {subscriptions.filter(s => s.status === 'active').length}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-sm text-gray-600 font-medium">Revenue per Ticket</div>
              <div className="text-3xl font-bold text-purple-600 mt-2">
                {formatCurrency(stats?.summary?.totalTickets ? Math.round(stats.summary.totalCommission / stats.summary.totalTickets) : 0)}
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Organizers</h3>
            {stats?.topOrganizers && stats.topOrganizers.length > 0 ? (
              <div className="space-y-3">
                {stats.topOrganizers.slice(0, 5).map((org, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-semibold text-gray-900">#{idx + 1} {org.organizerName}</div>
                      <div className="text-sm text-gray-600">{org.ticketsSold} tickets sold</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{formatCurrency(org.totalRevenue || 0)}</div>
                      <div className="text-sm text-gray-600">
                        {formatCurrency(org.totalCommissionPaid || 0)} commission
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No data available</div>
            )}
          </div>

          <button
            onClick={() => navigate('/admin/commission-analytics')}
            className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          >
            View Detailed Analytics →
          </button>
        </div>
      )}

      <ExportDataModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title="Export Subscriptions"
        filters={exportFilters}
      />
    </AdminLayout>
  )
}
