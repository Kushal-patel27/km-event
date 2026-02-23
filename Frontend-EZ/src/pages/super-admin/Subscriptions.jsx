import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import API from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useDarkMode } from '../../context/DarkModeContext'
import SuperAdminLayout from '../../components/layout/SuperAdminLayout'
import formatCurrency from '../../utils/currency'

export default function Subscriptions() {
  const { user } = useAuth()
  const { isDarkMode } = useDarkMode()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
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

  // Standard pricing tiers
  const standardPlans = {
    'Basic': { displayName: 'Basic Plan', description: 'Perfect for small gatherings and meetups' },
    'Standard': { displayName: 'Standard Plan', description: 'Ideal for medium-sized events' },
    'Professional': { displayName: 'Professional Plan', description: 'For large-scale professional events' },
    'Enterprise': { displayName: 'Enterprise Plan', description: 'Tailored solution for major events' }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const { data } = await API.get('/subscriptions/plans?all=true')
      setPlans(data.plans || [])
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load subscription plans' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    setEditingId(null)
    setFormData({
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
    setShowCreateForm(true)
  }

  const handleEdit = (plan) => {
    setEditingId(plan._id)
    setFormData({
      name: plan.name,
      displayName: plan.displayName,
      description: plan.description,
      commissionPercentage: plan.commissionPercentage ?? 30,
      monthlyFee: plan.monthlyFee ?? 0,
      eventLimit: plan.eventLimit ?? null,
      ticketLimit: plan.ticketLimit ?? null,
      payoutFrequency: plan.payoutFrequency || 'monthly',
      minPayoutAmount: plan.minPayoutAmount ?? 100,
      features: plan.features,
      limits: plan.limits,
      isActive: plan.isActive,
      displayOrder: plan.displayOrder,
      mostPopular: plan.mostPopular || false
    })
    setShowCreateForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.name) {
      setMessage({ type: 'error', text: 'Please select a plan name' })
      return
    }
    if (!formData.displayName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a display name' })
      return
    }
    if (!formData.description.trim()) {
      setMessage({ type: 'error', text: 'Please enter a description' })
      return
    }
    
    // Check if plan name already exists (only when creating new)
    if (!editingId && plans.some(p => p.name === formData.name)) {
      setMessage({ type: 'error', text: `A plan named "${formData.name}" already exists. Edit it or choose a different name.` })
      return
    }
    
    try {
      let response
      if (editingId) {
        // Update existing plan
        response = await API.put(`/subscriptions/plans/${editingId}`, formData)
        const updatedPlan = response.data.plan
        setPlans(plans.map(p => p._id === editingId ? updatedPlan : p))
        setMessage({ type: 'success', text: response.data.message || 'Plan updated successfully!' })
      } else {
        // Create new plan
        response = await API.post('/subscriptions/plans', formData)
        const newPlan = response.data.plan
        setPlans([...plans, newPlan])
        setMessage({ type: 'success', text: response.data.message || 'Plan created successfully!' })
      }
      
      // Reset form and close modal
      setShowCreateForm(false)
      setEditingId(null)
      setFormData({
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
      
      // Clear success message after delay
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      const errorMsg = err.response?.data?.errors 
        ? err.response.data.errors.join(', ')
        : err.response?.data?.message || (editingId ? 'Failed to update plan' : 'Failed to create plan')
      setMessage({ type: 'error', text: errorMsg })
      console.error('Subscription plan error:', err.response?.data || err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return
    try {
      await API.delete(`/subscriptions/plans/${id}`)
      setPlans(plans.filter(p => p._id !== id))
      setMessage({ type: 'success', text: 'Plan deleted successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete plan' })
    }
  }

  const toggleActive = async (plan) => {
    try {
      const { data } = await API.put(`/subscriptions/plans/${plan._id}`, {
        ...plan,
        isActive: !plan.isActive
      })
      setPlans(plans.map(p => p._id === plan._id ? data.plan : p))
      setMessage({
        type: 'success',
        text: `Plan ${data.plan.isActive ? 'activated' : 'deactivated'} successfully!`
      })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update plan status' })
    }
  }

  return (
    <SuperAdminLayout title="Subscription Plans" subtitle="Manage pricing tiers and features">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <p className="text-gray-600">Manage subscription plans, pricing, and features</p>
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
          >
            + New Plan
          </button>
        </div>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`mb-6 p-4 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <>
          {/* Plans Grid */}
          {!showCreateForm && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.sort((a, b) => a.displayOrder - b.displayOrder).map((plan) => (
                <motion.div
                  key={plan._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-lg border-2 p-6 transition ${
                    plan.isActive
                      ? isDarkMode ? 'bg-gray-800 border-purple-500/30 hover:border-purple-500' : 'bg-white border-purple-200 hover:border-purple-400'
                      : isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200 opacity-75'
                  }`}
                >
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{plan.displayName || plan.name}</h3>
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{plan.description}</p>
                      </div>
                      <div className="flex gap-2 flex-wrap justify-end">
                        {plan.mostPopular && (
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300`}>
                            ⭐ Popular
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                          plan.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Commission & Payout */}
                  <div className={`mb-4 pb-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className={`space-y-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <div>Commission: {plan.commissionPercentage ?? 0}%</div>
                      <div>Monthly Fee: {formatCurrency(plan.monthlyFee ?? 0)}</div>
                      <div>Payouts: {plan.payoutFrequency || 'monthly'}</div>
                      <div>Min Payout: {formatCurrency(plan.minPayoutAmount ?? 0)}</div>
                    </div>
                  </div>

                  {/* Features Count */}
                  {plan.features && (
                    <div className={`mb-4 pb-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <p className={`text-xs font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Features</p>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(plan.features).filter(([_, f]) => f.enabled).slice(0, 3).map(([key, feature]) => (
                          <span key={key} className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                            ✓ {key}
                          </span>
                        ))}
                        {Object.keys(plan.features).filter(k => plan.features[k].enabled).length > 3 && (
                          <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            +{Object.keys(plan.features).filter(k => plan.features[k].enabled).length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Limits */}
                  {plan.limits && Object.keys(plan.limits).length > 0 && (
                    <div className={`mb-4 pb-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <p className={`text-xs font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Limits</p>
                      <div className={`space-y-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <div>Events/mo: {plan.limits.eventsPerMonth === null ? '∞' : plan.limits.eventsPerMonth}</div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 flex-col sm:flex-row">
                    <button
                      onClick={() => handleEdit(plan)}
                      className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition ${isDarkMode ? 'bg-blue-900/30 hover:bg-blue-900/50 text-blue-300' : 'bg-blue-50 hover:bg-blue-100 text-blue-700'}`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleActive(plan)}
                      className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition ${
                        plan.isActive
                          ? isDarkMode ? 'bg-red-900/30 hover:bg-red-900/50 text-red-300' : 'bg-red-50 hover:bg-red-100 text-red-700'
                          : isDarkMode ? 'bg-green-900/30 hover:bg-green-900/50 text-green-300' : 'bg-green-50 hover:bg-green-100 text-green-700'
                      }`}
                    >
                      {plan.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Create/Edit Form */}
          <AnimatePresence>
            {showCreateForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                onClick={() => setShowCreateForm(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {editingId ? 'Edit Plan' : 'Create New Plan'}
                    </h2>
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>

                  {!editingId && (
                    <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <p className="text-sm font-semibold mb-3 text-blue-700">Quick Setup - Standard Plans:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(standardPlans).map(([planName, { displayName, description }]) => (
                          <button
                            key={planName}
                          type="button"
                          onClick={() => {
                            const baseFeatures = {
                              ticketing: { enabled: true, limit: null, description: 'Sell and manage event tickets' },
                              qrCheckIn: { enabled: ['Standard', 'Professional', 'Enterprise'].includes(planName), description: 'QR code-based attendee check-in' },
                              scannerApp: { enabled: ['Professional', 'Enterprise'].includes(planName), description: 'Mobile scanner app for entry verification' },
                              analytics: { enabled: ['Professional', 'Enterprise'].includes(planName), description: 'Real-time event analytics and insights' },
                              emailSms: { enabled: ['Standard', 'Professional', 'Enterprise'].includes(planName), emailLimit: ['Professional', 'Enterprise'].includes(planName) ? 1000 : 100, smsLimit: ['Professional', 'Enterprise'].includes(planName) ? 500 : 50, description: 'Automated email and SMS notifications' },
                              payments: { enabled: true, transactionFee: planName === 'Enterprise' ? 2.5 : 3.5, description: 'Secure payment processing' },
                              weatherAlerts: { enabled: ['Enterprise'].includes(planName), description: 'Weather-based alerts for outdoor events' },
                              subAdmins: { enabled: ['Professional', 'Enterprise'].includes(planName), limit: planName === 'Professional' ? 2 : 5, description: 'Assign additional administrators' },
                              reports: { enabled: ['Professional', 'Enterprise'].includes(planName), types: [], description: 'Generate comprehensive event reports' }
                            }
                            const baseLimits = {
                              eventsPerMonth: planName === 'Basic' ? 1 : planName === 'Standard' ? 5 : planName === 'Professional' ? 20 : 999,
                              customBranding: ['Professional', 'Enterprise'].includes(planName),
                              prioritySupport: ['Enterprise'].includes(planName)
                            }
                            setFormData({
                              name: planName,
                              displayName,
                              description,
                              commissionPercentage: 30,
                              monthlyFee: 0,
                              eventLimit: null,
                              ticketLimit: null,
                              payoutFrequency: 'monthly',
                              minPayoutAmount: 100,
                              features: baseFeatures,
                              limits: baseLimits,
                              isActive: true,
                              displayOrder: Object.keys(standardPlans).indexOf(planName) + 1
                            })
                          }}
                          className="text-sm px-3 py-2 rounded font-medium transition bg-blue-100 hover:bg-blue-200 text-blue-700"
                        >
                          {planName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                  <form onSubmit={handleSubmit} className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {/* Basic Information */}
                    <div className="border-b pb-6">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900">Basic Information</h3>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Plan Name *</label>
                          <select
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required
                            disabled={!!editingId}
                          >
                            <option value="">Select Plan Name</option>
                            <option value="Basic" disabled={!editingId && plans.some(p => p.name === 'Basic')}>
                              Basic {!editingId && plans.some(p => p.name === 'Basic') ? '(exists)' : ''}
                            </option>
                            <option value="Standard" disabled={!editingId && plans.some(p => p.name === 'Standard')}>
                              Standard {!editingId && plans.some(p => p.name === 'Standard') ? '(exists)' : ''}
                            </option>
                            <option value="Professional" disabled={!editingId && plans.some(p => p.name === 'Professional')}>
                              Professional {!editingId && plans.some(p => p.name === 'Professional') ? '(exists)' : ''}
                            </option>
                            <option value="Enterprise" disabled={!editingId && plans.some(p => p.name === 'Enterprise')}>
                              Enterprise {!editingId && plans.some(p => p.name === 'Enterprise') ? '(exists)' : ''}
                            </option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Display Name *</label>
                          <input
                            type="text"
                            placeholder="e.g., Standard Plan"
                            value={formData.displayName}
                            onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                        <textarea
                          placeholder="e.g., Great for growing events with essential features"
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                          rows="2"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Display Order</label>
                          <input
                            type="number"
                            placeholder="1"
                            value={formData.displayOrder}
                            onChange={(e) => setFormData({...formData, displayOrder: parseInt(e.target.value) || 1})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">Order in plan list</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                          <select
                            value={formData.isActive}
                            onChange={(e) => setFormData({...formData, isActive: e.target.value === 'true'})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-1">Show to organizers</p>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.mostPopular}
                            onChange={(e) => setFormData({...formData, mostPopular: e.target.checked})}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Mark as Most Popular</p>
                            <p className="text-xs text-gray-600">Highlight this plan with a "Most Popular" badge on the pricing page</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Revenue & Payout */}
                    <div className="border-b pb-6">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900">Revenue & Payout</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Commission Percentage (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={formData.commissionPercentage}
                            onChange={(e) => setFormData({...formData, commissionPercentage: parseFloat(e.target.value) || 0})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Fee (₹)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.monthlyFee}
                            onChange={(e) => setFormData({...formData, monthlyFee: parseFloat(e.target.value) || 0})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Event Limit</label>
                          <input
                            type="number"
                            placeholder="Unlimited"
                            value={formData.eventLimit === null ? '' : formData.eventLimit}
                            onChange={(e) => setFormData({...formData, eventLimit: e.target.value === '' ? null : parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ticket Limit</label>
                          <input
                            type="number"
                            placeholder="Unlimited"
                            value={formData.ticketLimit === null ? '' : formData.ticketLimit}
                            onChange={(e) => setFormData({...formData, ticketLimit: e.target.value === '' ? null : parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Payout Frequency</label>
                          <select
                            value={formData.payoutFrequency}
                            onChange={(e) => setFormData({...formData, payoutFrequency: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                            value={formData.minPayoutAmount}
                            onChange={(e) => setFormData({...formData, minPayoutAmount: parseInt(e.target.value) || 0})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="border-b pb-6">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900">Features</h3>
                      <p className="text-sm text-gray-600 mb-4">Select and configure the features available in this plan</p>
                      <div className="space-y-3">
                        {/* Ticketing */}
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            checked={formData.features.ticketing.enabled}
                            onChange={(e) => setFormData({
                              ...formData,
                              features: {...formData.features, ticketing: {...formData.features.ticketing, enabled: e.target.checked}}
                            })}
                            className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">Ticketing</p>
                            <p className="text-sm text-gray-600">Sell and manage event tickets</p>
                            {formData.features.ticketing.enabled && (
                              <input
                                type="number"
                                placeholder="Ticket limit (null = unlimited)"
                                value={formData.features.ticketing.limit === null ? '' : formData.features.ticketing.limit}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  features: {...formData.features, ticketing: {...formData.features.ticketing, limit: e.target.value === '' ? null : parseInt(e.target.value)}}
                                })}
                                className="mt-2 w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            )}
                          </div>
                        </div>

                        {/* QR Check-in */}
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            checked={formData.features.qrCheckIn.enabled}
                            onChange={(e) => setFormData({
                              ...formData,
                              features: {...formData.features, qrCheckIn: {...formData.features.qrCheckIn, enabled: e.target.checked}}
                            })}
                            className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                          />
                          <div>
                            <p className="font-medium text-gray-900">QR Code Check-in</p>
                            <p className="text-sm text-gray-600">QR code-based attendee check-in</p>
                          </div>
                        </div>

                        {/* Scanner App */}
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            checked={formData.features.scannerApp.enabled}
                            onChange={(e) => setFormData({
                              ...formData,
                              features: {...formData.features, scannerApp: {...formData.features.scannerApp, enabled: e.target.checked}}
                            })}
                            className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                          />
                          <div>
                            <p className="font-medium text-gray-900">Scanner App</p>
                            <p className="text-sm text-gray-600">Mobile scanner app for entry verification</p>
                          </div>
                        </div>

                        {/* Analytics */}
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            checked={formData.features.analytics.enabled}
                            onChange={(e) => setFormData({
                              ...formData,
                              features: {...formData.features, analytics: {...formData.features.analytics, enabled: e.target.checked}}
                            })}
                            className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                          />
                          <div>
                            <p className="font-medium text-gray-900">Analytics</p>
                            <p className="text-sm text-gray-600">Real-time event analytics and insights</p>
                          </div>
                        </div>

                        {/* Email & SMS */}
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            checked={formData.features.emailSms.enabled}
                            onChange={(e) => setFormData({
                              ...formData,
                              features: {...formData.features, emailSms: {...formData.features.emailSms, enabled: e.target.checked}}
                            })}
                            className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">Email & SMS Notifications</p>
                            <p className="text-sm text-gray-600">Automated email and SMS notifications</p>
                            {formData.features.emailSms.enabled && (
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                <input
                                  type="number"
                                  placeholder="Emails/month"
                                  value={formData.features.emailSms.emailLimit}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    features: {...formData.features, emailSms: {...formData.features.emailSms, emailLimit: parseInt(e.target.value) || 0}}
                                  })}
                                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <input
                                  type="number"
                                  placeholder="SMS/month"
                                  value={formData.features.emailSms.smsLimit}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    features: {...formData.features, emailSms: {...formData.features.emailSms, smsLimit: parseInt(e.target.value) || 0}}
                                  })}
                                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Payments */}
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            checked={formData.features.payments.enabled}
                            onChange={(e) => setFormData({
                              ...formData,
                              features: {...formData.features, payments: {...formData.features.payments, enabled: e.target.checked}}
                            })}
                            className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">Payments</p>
                            <p className="text-sm text-gray-600">Secure payment processing</p>
                            {formData.features.payments.enabled && (
                              <input
                                type="number"
                                placeholder="Transaction fee (%)"
                                value={formData.features.payments.transactionFee}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  features: {...formData.features, payments: {...formData.features.payments, transactionFee: parseFloat(e.target.value) || 0}}
                                })}
                                className="mt-2 w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                step="0.1"
                              />
                            )}
                          </div>
                        </div>

                        {/* Weather Alerts */}
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            checked={formData.features.weatherAlerts.enabled}
                            onChange={(e) => setFormData({
                              ...formData,
                              features: {...formData.features, weatherAlerts: {...formData.features.weatherAlerts, enabled: e.target.checked}}
                            })}
                            className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                          />
                          <div>
                            <p className="font-medium text-gray-900">Weather Alerts</p>
                            <p className="text-sm text-gray-600">Weather-based alerts for outdoor events</p>
                          </div>
                        </div>

                        {/* Sub-admins */}
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            checked={formData.features.subAdmins.enabled}
                            onChange={(e) => setFormData({
                              ...formData,
                              features: {...formData.features, subAdmins: {...formData.features.subAdmins, enabled: e.target.checked}}
                            })}
                            className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">Sub-admins</p>
                            <p className="text-sm text-gray-600">Assign additional administrators</p>
                            {formData.features.subAdmins.enabled && (
                              <input
                                type="number"
                                placeholder="Max sub-admins allowed"
                                value={formData.features.subAdmins.limit}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  features: {...formData.features, subAdmins: {...formData.features.subAdmins, limit: parseInt(e.target.value) || 0}}
                                })}
                                className="mt-2 w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            )}
                          </div>
                        </div>

                        {/* Reports */}
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            checked={formData.features.reports.enabled}
                            onChange={(e) => setFormData({
                              ...formData,
                              features: {...formData.features, reports: {...formData.features.reports, enabled: e.target.checked}}
                            })}
                            className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                          />
                          <div>
                            <p className="font-medium text-gray-900">Reports</p>
                            <p className="text-sm text-gray-600">Generate comprehensive event reports</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Limits */}
                    <div className="border-b pb-6">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900">Plan Limits</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Events per Month</label>
                          <input
                            type="number"
                            value={formData.limits.eventsPerMonth}
                            onChange={(e) => setFormData({
                              ...formData,
                              limits: {...formData.limits, eventsPerMonth: parseInt(e.target.value) || 1}
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            min="1"
                          />
                          <p className="text-xs text-gray-500 mt-1">Maximum events organizer can create</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Custom Branding</label>
                          <select
                            value={formData.limits.customBranding}
                            onChange={(e) => setFormData({
                              ...formData,
                              limits: {...formData.limits, customBranding: e.target.value === 'true'}
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="false">Disabled</option>
                            <option value="true">Enabled</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-1">Allow event branding customization</p>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Priority Support</label>
                          <select
                            value={formData.limits.prioritySupport}
                            onChange={(e) => setFormData({
                              ...formData,
                              limits: {...formData.limits, prioritySupport: e.target.value === 'true'}
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="false">Disabled</option>
                            <option value="true">Enabled</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-1">24/7 priority customer support</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end sticky bottom-0 bg-white pt-4 border-t">
                      <button
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
                      >
                        {editingId ? 'Update' : 'Create'} Plan
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </SuperAdminLayout>
  )
}
