import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useDarkMode } from '../../context/DarkModeContext'
import AdminLayout from '../../components/layout/AdminLayout'
import API from '../../services/api'
import formatINR from '../../utils/currency'

export default function AdminCouponManager() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isDarkMode } = useDarkMode()

  const [coupons, setCoupons] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [authError, setAuthError] = useState(false)
  const [eventSearch, setEventSearch] = useState('')

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    expiryDate: '',
    usageLimit: '',
    minOrderAmount: 0,
    maxDiscountAmount: '',
    isPublic: true,
    tags: '',
    eventIds: [],
  })

  useEffect(() => {
    const allowedRoles = ['admin', 'super_admin', 'event_admin']
    if (!user || !allowedRoles.includes(user.role)) {
      setAuthError(true)
      return
    }
    setAuthError(false)
    fetchEvents()
    fetchCoupons()
  }, [user, page, searchTerm, filterActive])

  const fetchEvents = async () => {
    try {
      const res = await API.get('/admin/events')
      setEvents(res.data.events || [])
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(filterActive !== null && { isActive: filterActive }),
      })

      const res = await API.get(`/coupons?${params}`)
      setCoupons(res.data.data || [])
      setTotalPages(res.data.pagination?.totalPages || 1)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load coupons' })
      console.error('Error fetching coupons:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    if (name === 'eventIds') {
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value)
      setFormData(prev => ({
        ...prev,
        eventIds: selectedOptions
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
        applicableEventIds: formData.eventIds.length > 0 ? formData.eventIds : null,
      }
      delete payload.eventIds

      if (editingId) {
        await API.put(`/coupons/${editingId}`, payload)
        setMessage({ type: 'success', text: 'Coupon updated successfully' })
      } else {
        await API.post('/coupons', payload)
        setMessage({ type: 'success', text: 'Coupon created successfully' })
      }

      resetForm()
      fetchCoupons()
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
      isPublic: coupon.isPublic,
      tags: coupon.tags?.join(', ') || '',
      eventIds: coupon.applicableEventIds || [],
    })
    setEditingId(coupon._id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return

    try {
      await API.delete(`/coupons/${id}`)
      setMessage({ type: 'success', text: 'Coupon deleted successfully' })
      fetchCoupons()
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
      isPublic: true,
      tags: '',
      eventIds: [],
    })
    setEventSearch('')
    setEditingId(null)
    setShowForm(false)
  }

  if (authError) {
    return (
      <AdminLayout>
        <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-red-900/20 border border-red-700' : 'bg-red-50 border border-red-200'}`}>
          <p className={isDarkMode ? 'text-red-300' : 'text-red-700'}>You don't have permission to access this page</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Discount Coupons
            </h1>
            <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Create and manage discount coupons
            </p>
          </div>
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
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-indigo-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500'
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
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
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
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
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
                  Max Discount Amount (₹) (Leave empty for no limit)
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
                  placeholder="e.g., summer, holiday, sale"
                  className={`w-full px-4 py-2 rounded-lg border transition ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Apply to Specific Events {formData.eventIds.length > 0 && `(${formData.eventIds.length} selected)`}
                </label>
                
                {/* Event Search */}
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="🔍 Search events..."
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border transition ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
                  />
                </div>

                {/* Selected Events Tags */}
                {formData.eventIds.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {formData.eventIds.map(eventId => {
                      const event = events.find(e => e._id === eventId)
                      return (
                        <div
                          key={eventId}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 ${
                            isDarkMode
                              ? 'bg-indigo-600 text-white'
                              : 'bg-indigo-100 text-indigo-700'
                          }`}
                        >
                          <span>{event?.title.substring(0, 20)}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                eventIds: prev.eventIds.filter(id => id !== eventId)
                              }))
                            }}
                            className="hover:opacity-70 transition"
                          >
                            ✕
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Event Checkboxes */}
                <div className={`rounded-lg border overflow-hidden ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                  {events.filter(event =>
                    eventSearch === '' ||
                    event.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
                    event.eventDate?.toLowerCase().includes(eventSearch.toLowerCase())
                  ).length === 0 ? (
                    <div className={`p-4 text-center ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                      No events found
                    </div>
                  ) : (
                    <div className={`max-h-64 overflow-y-auto ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      {events
                        .filter(event =>
                          eventSearch === '' ||
                          event.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
                          event.eventDate?.toLowerCase().includes(eventSearch.toLowerCase())
                        )
                        .map(event => (
                          <label
                            key={event._id}
                            className={`flex items-center gap-3 px-4 py-3 border-b cursor-pointer hover:${isDarkMode ? 'bg-gray-600' : 'bg-white'} transition ${
                              isDarkMode ? 'border-gray-600' : 'border-gray-200'
                            } last:border-b-0`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.eventIds.includes(event._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    eventIds: [...prev.eventIds, event._id]
                                  }))
                                } else {
                                  setFormData(prev => ({
                                    ...prev,
                                    eventIds: prev.eventIds.filter(id => id !== event._id)
                                  }))
                                }
                              }}
                              className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {event.title}
                              </p>
                              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                📅 {event.eventDate?.split('T')[0]}
                              </p>
                            </div>
                            {event.category && (
                              <span className={`text-xs px-2 py-1 rounded font-medium flex-shrink-0 ${isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'}`}>
                                {event.category}
                              </span>
                            )}
                          </label>
                        ))}
                    </div>
                  )}
                </div>

                <p className={`mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  💡 Tip: Leave empty to apply this coupon to all events
                </p>
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
                rows={3}
                className={`w-full px-4 py-2 rounded-lg border transition ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded accent-indigo-600"
                />
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Make this coupon public (visible to all users)
                </span>
              </label>
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

        {/* Search and Filter */}
        <div className="flex flex-col gap-3 md:flex-row md:gap-4">
          <input
            type="text"
            placeholder="Search coupons by code or description..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setPage(1)
            }}
            className={`flex-1 px-4 py-2 rounded-lg border transition ${
              isDarkMode
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
          />
          <select
            value={filterActive === null ? '' : filterActive}
            onChange={(e) => {
              setFilterActive(e.target.value === '' ? null : e.target.value === 'true')
              setPage(1)
            }}
            className={`px-4 py-2 rounded-lg border transition ${
              isDarkMode
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {/* Coupons Table/List */}
        {loading && !showForm ? (
          <div className="text-center py-10">
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Loading coupons...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className={`p-8 rounded-lg text-center border-2 border-dashed ${
            isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-300'
          }`}>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              No coupons found. Create one to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className={`w-full text-sm border-collapse rounded-lg overflow-hidden ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <thead>
                  <tr className={isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}>
                    <th className={`px-4 py-3 text-left font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>Code</th>
                    <th className={`px-4 py-3 text-left font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>Discount</th>
                    <th className={`px-4 py-3 text-left font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>Expiry</th>
                    <th className={`px-4 py-3 text-left font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>Usage</th>
                    <th className={`px-4 py-3 text-left font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>Events</th>
                    <th className={`px-4 py-3 text-left font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>Status</th>
                    <th className={`px-4 py-3 text-right font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(coupon => (
                    <tr
                      key={coupon._id}
                      className={`border-t transition ${
                        isDarkMode
                          ? 'border-gray-700 hover:bg-gray-700/50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <td className={`px-4 py-3 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {coupon.code}
                      </td>
                      <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {coupon.discountValue}{coupon.discountType === 'percentage' ? '%' : '₹'} off
                      </td>
                      <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {new Date(coupon.expiryDate).toLocaleDateString()}
                      </td>
                      <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {coupon.usageCount} / {coupon.usageLimit || '∞'}
                      </td>
                      <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {coupon.applicableEventIds && coupon.applicableEventIds.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {coupon.applicableEventIds.slice(0, 2).map((eventId, idx) => {
                              const event = events.find(e => e._id === eventId)
                              return (
                                <span key={idx} className={`px-2 py-1 rounded text-xs font-medium ${
                                  isDarkMode 
                                    ? 'bg-indigo-900/30 text-indigo-300' 
                                    : 'bg-indigo-100 text-indigo-700'
                                }`}>
                                  {event?.title.substring(0, 10) || 'Event'}
                                </span>
                              )
                            })}
                            {coupon.applicableEventIds.length > 2 && (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                isDarkMode 
                                  ? 'bg-indigo-900/30 text-indigo-300' 
                                  : 'bg-indigo-100 text-indigo-700'
                              }`}>
                                +{coupon.applicableEventIds.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className={`italic ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>All Events</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          coupon.isActive && new Date(coupon.expiryDate) > new Date()
                            ? isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
                            : isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
                        }`}>
                          {coupon.isActive && new Date(coupon.expiryDate) > new Date() ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(coupon)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(coupon._id)}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-3">
              {coupons.map(coupon => (
                <div
                  key={coupon._id}
                  className={`p-4 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {coupon.code}
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {coupon.discountValue}{coupon.discountType === 'percentage' ? '%' : '₹'} off
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
                  <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                    <div>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Expiry</p>
                      <p className={isDarkMode ? 'text-gray-300' : 'text-gray-900'}>
                        {new Date(coupon.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Usage</p>
                      <p className={isDarkMode ? 'text-gray-300' : 'text-gray-900'}>
                        {coupon.usageCount} / {coupon.usageLimit || '∞'}
                      </p>
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Events</p>
                    {coupon.applicableEventIds && coupon.applicableEventIds.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {coupon.applicableEventIds.map((eventId, idx) => {
                          const event = events.find(e => e._id === eventId)
                          return (
                            <span key={idx} className={`px-2 py-1 rounded text-xs font-medium ${
                              isDarkMode 
                                ? 'bg-indigo-900/30 text-indigo-300' 
                                : 'bg-indigo-100 text-indigo-700'
                            }`}>
                              {event?.title.substring(0, 12) || 'Event'}
                            </span>
                          )
                        })}
                      </div>
                    ) : (
                      <span className={`text-xs italic ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>All Events</span>
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

            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 rounded transition ${
                    p === page
                      ? 'bg-indigo-600 text-white'
                      : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
