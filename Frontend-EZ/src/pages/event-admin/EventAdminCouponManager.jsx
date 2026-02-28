import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useDarkMode } from '../../context/DarkModeContext'
import EventAdminLayout from '../../components/layout/EventAdminLayout'
import API from '../../services/api'

export default function EventAdminCouponManager() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isDarkMode } = useDarkMode()

  const [coupons, setCoupons] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [authError, setAuthError] = useState(false)

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    expiryDate: '',
    usageLimit: '',
    minOrderAmount: 0,
    maxDiscountAmount: '',
    eventIds: [],
    tags: '',
  })

  useEffect(() => {
    if (!user || user.role !== 'event_admin') {
      setAuthError(true)
      return
    }
    setAuthError(false)
    fetchData()
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [couponsRes, eventsRes] = await Promise.all([
        API.get('/coupons/event-admin/my-coupons'),
        API.get('/event-admin/events'),
      ])
      setCoupons(couponsRes.data.data || [])
      const rawEvents = eventsRes?.data
      const normalizedEvents = Array.isArray(rawEvents)
        ? rawEvents
        : rawEvents?.events || rawEvents?.data || rawEvents?.assignedEvents || []
      setEvents(normalizedEvents)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load data' })
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    if (name === 'eventIds') {
      setFormData(prev => ({
        ...prev,
        eventIds: checked
          ? [...prev.eventIds, value]
          : prev.eventIds.filter(id => id !== value)
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)

      const payload = {
        ...formData,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        minOrderAmount: Number(formData.minOrderAmount),
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
        discountValue: Number(formData.discountValue),
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        eventIds: formData.eventIds.length > 0 ? formData.eventIds : null,
      }

      if (editingId) {
        await API.put(`/coupons/event-admin/${editingId}`, payload)
        setMessage({ type: 'success', text: 'Coupon updated successfully' })
      } else {
        await API.post('/coupons/event-admin/create', payload)
        setMessage({ type: 'success', text: 'Coupon created successfully' })
      }

      resetForm()
      fetchData()
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save coupon' })
      console.error('Error saving coupon:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (coupon) => {
    setFormData({
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      expiryDate: coupon.expiryDate.split('T')[0],
      usageLimit: coupon.usageLimit || '',
      minOrderAmount: coupon.minOrderAmount,
      maxDiscountAmount: coupon.maxDiscountAmount || '',
      eventIds: coupon.applicableEventIds ? coupon.applicableEventIds.map(e => e._id || e) : [],
      tags: coupon.tags?.join(', ') || '',
    })
    setEditingId(coupon._id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return

    try {
      await API.delete(`/coupons/event-admin/${id}`)
      setMessage({ type: 'success', text: 'Coupon deleted successfully' })
      fetchData()
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete coupon' })
      console.error('Error deleting coupon:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      expiryDate: '',
      usageLimit: '',
      minOrderAmount: 0,
      maxDiscountAmount: '',
      eventIds: [],
      tags: '',
    })
    setEditingId(null)
    setShowForm(false)
  }

  if (authError) {
    return (
      <EventAdminLayout title="Discount Coupons">
        <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-red-900/20 border border-red-700' : 'bg-red-50 border border-red-200'}`}>
          <p className={isDarkMode ? 'text-red-300' : 'text-red-700'}>You don't have permission to access this page</p>
        </div>
      </EventAdminLayout>
    )
  }

  return (
    <EventAdminLayout title="Discount Coupons">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            {showForm ? '✕ Cancel' : '+ New Coupon'}
          </button>
        </div>

        {/* Messages */}
        {message.text && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success'
              ? isDarkMode ? 'bg-green-900/20 border border-green-700 text-green-300' : 'bg-green-50 border border-green-200 text-green-700'
              : isDarkMode ? 'bg-red-900/20 border border-red-700 text-red-300' : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className={`p-6 rounded-lg border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } space-y-4`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Coupon Code *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="e.g., SAVE20"
                  disabled={editingId ? true : false}
                  className={`w-full px-4 py-2 rounded-lg border transition ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Discount Type *
                </label>
                <select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-lg border transition ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Discount Value *
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleInputChange}
                    min="0.01"
                    max={formData.discountType === 'percentage' ? '100' : '999999'}
                    step="0.01"
                    className={`w-full px-4 py-2 rounded-lg border transition ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
                    required
                  />
                  <span className={`ml-2 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {formData.discountType === 'percentage' ? '%' : '₹'}
                  </span>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Expiry Date *
                </label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-lg border transition ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Usage Limit (Leave empty for unlimited)
                </label>
                <input
                  type="number"
                  name="usageLimit"
                  value={formData.usageLimit}
                  onChange={handleInputChange}
                  min="1"
                  className={`w-full px-4 py-2 rounded-lg border transition ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
                  placeholder="e.g., 100"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Minimum Order Amount (₹)
                </label>
                <input
                  type="number"
                  name="minOrderAmount"
                  value={formData.minOrderAmount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className={`w-full px-4 py-2 rounded-lg border transition ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
                  placeholder="0"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Max Discount Amount (₹)
                </label>
                <input
                  type="number"
                  name="maxDiscountAmount"
                  value={formData.maxDiscountAmount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className={`w-full px-4 py-2 rounded-lg border transition ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
                  placeholder="e.g., 500"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Tags (Comma-separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="e.g., summer, sale"
                  className={`w-full px-4 py-2 rounded-lg border transition ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Optional description for this coupon"
                rows={2}
                className={`w-full px-4 py-2 rounded-lg border transition ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
              />
            </div>

            {/* Event Selection */}
            <div>
              <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Apply to Events (Optional)
              </label>
              {events.length === 0 ? (
                <div className={`p-4 rounded-lg border-2 border-dashed ${isDarkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-300'}`}>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
                    📅 No events found
                  </p>
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                    Create an event first to apply this coupon to specific events. For now, this coupon will apply to all future events.
                  </p>
                </div>
              ) : (
                <div>
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto mb-3 p-3 rounded-lg border ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'}`}>
                    {events.map(event => (
                      <label key={event._id} className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition">
                        <input
                          type="checkbox"
                          name="eventIds"
                          value={event._id}
                          checked={formData.eventIds.includes(event._id)}
                          onChange={handleInputChange}
                          className="w-4 h-4 rounded accent-indigo-600"
                        />
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {event.title || event.name || event.eventTitle || 'Untitled Event'}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    💡 Leave empty to apply this coupon to all your events
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50"
              >
                {editingId ? 'Update Coupon' : 'Create Coupon'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className={`px-6 py-2 rounded-lg transition font-medium ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Coupons List */}
        {loading ? (
          <div className="text-center py-10">
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Loading coupons...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className={`p-8 rounded-lg text-center border-2 border-dashed ${
            isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-300'
          }`}>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              No coupons yet. Create one to offer discounts on your events!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {coupons.map(coupon => (
              <div
                key={coupon._id}
                className={`p-4 rounded-lg border ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                } hover:shadow-lg transition`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <p className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {coupon.code}
                    </p>
                    <p className={`text-2xl font-bold mt-1 text-indigo-600`}>
                      {coupon.discountValue}{coupon.discountType === 'percentage' ? '%' : '₹'} OFF
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    coupon.isActive && new Date(coupon.expiryDate) > new Date()
                      ? isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
                      : isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
                  }`}>
                    {coupon.isActive && new Date(coupon.expiryDate) > new Date() ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {coupon.description && (
                  <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {coupon.description}
                  </p>
                )}

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Expires:</span>
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-900'}>
                      {new Date(coupon.expiryDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Usage:</span>
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-900'}>
                      {coupon.usageCount} / {coupon.usageLimit || '∞'}
                    </span>
                  </div>
                  {coupon.minOrderAmount > 0 && (
                    <div className="flex justify-between">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Min Order:</span>
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-900'}>₹{coupon.minOrderAmount}</span>
                    </div>
                  )}
                  {coupon.applicableEventIds && (
                    <div className="flex justify-between">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Events:</span>
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-900'}>
                        {coupon.applicableEventIds.length}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(coupon)}
                    className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(coupon._id)}
                    className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </EventAdminLayout>
  )
}
