import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import API from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useDarkMode } from '../../context/DarkModeContext'
import formatINR from '../../utils/currency'

// Fallback categories in case API fails
const FALLBACK_CATEGORIES = ['Music', 'Sports', 'Comedy', 'Arts', 'Culture', 'Travel', 'Festival', 'Workshop', 'Conference', 'Other']

// Fallback plans in case API fails
const FALLBACK_PLANS = {
  Basic: { price: 999, features: ['Up to 100 tickets', 'QR code generation', 'Email notifications', 'Basic analytics', 'Payment gateway', '5% platform fee'] },
  Standard: { price: 2499, features: ['Up to 500 tickets', 'QR code generation', 'Email & SMS notifications', 'Advanced analytics', 'Custom branding', '4% platform fee'] },
  Professional: { price: 4999, features: ['Up to 2,000 tickets', 'Multi-channel notifications', 'Real-time analytics', 'Full branding', 'Promotional tools', '3% platform fee'] },
  Enterprise: { price: 0, priceLabel: 'Custom', features: ['Unlimited tickets', 'Custom analytics', 'White-label platform', 'API access', 'Dedicated manager', 'Custom platform fee'] }
}

export default function CreateEventRequest() {
  const { user } = useAuth()
  const { isDarkMode } = useDarkMode()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageSource, setImageSource] = useState('upload') // 'upload' or 'link'
  const [addingTicketType, setAddingTicketType] = useState(false)
  const [ticketForm, setTicketForm] = useState({ name: '', price: '', quantity: '', description: '' })
  const [plans, setPlans] = useState(FALLBACK_PLANS)
  const [plansLoading, setPlansLoading] = useState(true)
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES)
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  // Fetch plans and categories from backend
  useEffect(() => {
    fetchPlans()
    fetchCategories()
  }, [])

  const fetchPlans = async () => {
    try {
      setPlansLoading(true)
      const { data } = await API.get('/subscriptions/plans')
      if (data.plans && data.plans.length > 0) {
        // Convert API plans to the format needed for the form
        const plansObj = {}
        data.plans.sort((a, b) => a.displayOrder - b.displayOrder).forEach(plan => {
          const enabledFeatures = Object.entries(plan.features || {})
            .filter(([_, feature]) => feature.enabled)
            .map(([key, feature]) => {
              const name = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
              return feature.limit ? `${name} (${feature.limit})` : name
            })
          
          plansObj[plan.name] = {
            price: plan.price,
            displayName: plan.displayName,
            description: plan.description,
            features: enabledFeatures.length > 0 ? enabledFeatures : FALLBACK_PLANS[plan.name]?.features || []
          }
        })
        setPlans(plansObj)
      } else {
        setPlans(FALLBACK_PLANS)
      }
    } catch (err) {
      console.error('Error fetching plans:', err)
      setPlans(FALLBACK_PLANS)
    } finally {
      setPlansLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true)
      const { data } = await API.get('/categories/all')
      if (data && data.length > 0) {
        // Extract category names and ensure "Other" is at the end
        const categoryNames = data.map(cat => cat.name).filter(name => name !== 'Other')
        setCategories([...categoryNames, 'Other'])
      } else {
        setCategories(FALLBACK_CATEGORIES)
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
      setCategories(FALLBACK_CATEGORIES)
    } finally {
      setCategoriesLoading(false)
    }
  }

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Conference',
    customCategory: '',
    date: '',
    location: '',
    locationDetails: '',
    price: 0,
    totalTickets: '',
    availableTickets: '',
    ticketTypes: [],
    organizerPhone: user?.phone || '',
    organizerCompany: '',
    image: '',
    planSelected: 'Standard'
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          image: reader.result
        }))
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageLink = (e) => {
    const url = e.target.value
    setFormData(prev => ({
      ...prev,
      image: url
    }))
    if (url) {
      setImagePreview(url)
    } else {
      setImagePreview(null)
    }
  }

  const validateStep1 = () => {
    if (!formData.title.trim()) {
      setMessage({ type: 'error', text: 'Event title is required' })
      return false
    }
    if (!formData.description.trim()) {
      setMessage({ type: 'error', text: 'Event description is required' })
      return false
    }
    if (!formData.date) {
      setMessage({ type: 'error', text: 'Event date is required' })
      return false
    }
    if (!formData.location.trim()) {
      setMessage({ type: 'error', text: 'Event location is required' })
      return false
    }
    if (formData.category === 'Other' && !formData.customCategory.trim()) {
      setMessage({ type: 'error', text: 'Please specify a custom category' })
      return false
    }
    if (!formData.totalTickets || formData.totalTickets < 1) {
      setMessage({ type: 'error', text: 'Total tickets must be at least 1' })
      return false
    }
    if (!formData.organizerPhone.trim()) {
      setMessage({ type: 'error', text: 'Phone number is required' })
      return false
    }
    setMessage(null)
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate step 2
    if (!formData.planSelected) {
      setMessage({ type: 'error', text: 'Please select a plan' })
      return
    }
    
    setLoading(true)
    setMessage(null)

    try {
      const resolvedCategory = formData.category === 'Other'
        ? formData.customCategory.trim() || 'Other'
        : formData.category

      const { data } = await API.post('/event-requests/create-request', {
        ...formData,
        category: resolvedCategory
      }, {
        headers: { Authorization: `Bearer ${user?.token || localStorage.getItem('token')}` }
      })
      setMessage({ type: 'success', text: 'Request submitted! Redirecting to your status page...' })
      setTimeout(() => {
        setFormData({
          title: '',
          description: '',
          category: 'Conference',
          customCategory: '',
          date: '',
          location: '',
          locationDetails: '',
          price: 0,
          totalTickets: '',
          availableTickets: '',
          ticketTypes: [],
          organizerPhone: user?.phone || '',
          organizerCompany: '',
          image: '',
          planSelected: 'Standard'
        })
        setImagePreview(null)
        setStep(1)
        navigate('/my-event-requests')
      }, 1200)
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to submit event request' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen py-12 px-4 transition-colors ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className={`text-4xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Create Your Event</h1>
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Launch your event with K&M Events platform</p>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-8 flex gap-4 justify-center">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                step >= s 
                  ? 'bg-blue-600 text-white' 
                  : isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-300 text-gray-600'
              }`}>
                {s}
              </div>
              <span className={`text-sm font-medium ${step >= s ? isDarkMode ? 'text-blue-300' : 'text-blue-600' : isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                {s === 1 ? 'Event Details' : 'Select Plan'}
              </span>
              {s === 1 && <div className={`w-12 h-0.5 mx-2 ${step > 1 ? 'bg-blue-600' : isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>}
            </div>
          ))}
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg text-sm ${
            message.type === 'success'
              ? isDarkMode ? 'bg-green-900/30 text-green-300 border border-green-700' : 'bg-green-50 text-green-700 border border-green-200'
              : isDarkMode ? 'bg-red-900/30 text-red-300 border border-red-700' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {step === 1 ? (
          /* Step 1: Event Details */
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className={`rounded-2xl shadow-lg p-8 transition-colors ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
          >
            <form className="space-y-6">
              {/* Event Image Upload */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Event Poster/Image</label>
                
                {/* Toggle between upload and link */}
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="imageSource"
                      value="upload"
                      checked={imageSource === 'upload'}
                      onChange={(e) => {
                        setImageSource(e.target.value)
                        setImagePreview(null)
                        setFormData(prev => ({ ...prev, image: '' }))
                      }}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Upload File</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="imageSource"
                      value="link"
                      checked={imageSource === 'link'}
                      onChange={(e) => {
                        setImageSource(e.target.value)
                        setImagePreview(null)
                        setFormData(prev => ({ ...prev, image: '' }))
                      }}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Image Link/URL</span>
                  </label>
                </div>

                {imageSource === 'upload' ? (
                  <div className={`relative border-2 border-dashed rounded-lg p-6 transition text-center cursor-pointer hover:border-blue-500 ${
                    isDarkMode ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300 bg-gray-50'
                  }`}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {imagePreview ? (
                      <div className="space-y-3">
                        <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Click to change image</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <svg className={`mx-auto w-12 h-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Click to upload event poster</p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>PNG, JPG up to 5MB</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={formData.image}
                      onChange={handleImageLink}
                      className={`w-full px-4 py-2.5 border-2 rounded-lg transition ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'} focus:outline-none`}
                    />
                    {imagePreview && (
                      <div className="space-y-2">
                        <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Image preview from URL</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Event Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-2.5 border-2 rounded-lg transition ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'} focus:outline-none`}
                  placeholder="e.g., Annual Tech Conference 2026"
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  className={`w-full px-4 py-2.5 border-2 rounded-lg transition ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'} focus:outline-none`}
                  placeholder="Describe your event in detail..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    disabled={categoriesLoading}
                    className={`w-full px-4 py-2.5 border-2 rounded-lg transition ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-400' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'} focus:outline-none`}
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>

                  {formData.category === 'Other' && (
                    <div className="mt-3">
                      <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Custom Category</label>
                      <input
                        type="text"
                        name="customCategory"
                        value={formData.customCategory}
                        onChange={handleInputChange}
                        placeholder="Enter custom category"
                        className={`w-full px-4 py-2 border-2 rounded-lg transition ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'} focus:outline-none`}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Event Date *</label>
                  <input
                    type="datetime-local"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-2.5 border-2 rounded-lg transition ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-400' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'} focus:outline-none`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Location *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-2.5 border-2 rounded-lg transition ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'} focus:outline-none`}
                  placeholder="e.g., Convention Center, New Delhi"
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Venue Details</label>
                <textarea
                  name="locationDetails"
                  value={formData.locationDetails}
                  onChange={handleInputChange}
                  rows="2"
                  className={`w-full px-4 py-2.5 border-2 rounded-lg transition ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'} focus:outline-none`}
                  placeholder="Venue name, hall/floor, full address..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Expected Attendees *</label>
                  <input
                    type="number"
                    name="totalTickets"
                    value={formData.totalTickets}
                    onChange={(e) => {
                      handleInputChange(e);
                      setFormData(prev => ({ ...prev, availableTickets: e.target.value }))
                    }}
                    required
                    min="1"
                    className={`w-full px-4 py-2.5 border-2 rounded-lg transition ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'} focus:outline-none`}
                    placeholder="e.g., 500"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Ticket Price (₹)</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="10"
                    className={`w-full px-4 py-2.5 border-2 rounded-lg transition ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'} focus:outline-none`}
                    placeholder="e.g., 500"
                  />
                </div>
              </div>

              {/* Ticket Types Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Ticket Types (Optional)</label>
                  <button type="button" onClick={() => setAddingTicketType(true)} className={`text-sm font-medium ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>+ Add Ticket Type</button>
                </div>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Add different ticket types (e.g., VIP, General, Student) with individual prices</p>
                
                {formData.ticketTypes.length > 0 && (
                  <div className="space-y-2">
                    {formData.ticketTypes.map((ticket, idx) => (
                      <div key={idx} className={`flex items-center gap-2 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <div className="flex-1">
                          <div className={`font-medium text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{ticket.name}</div>
                          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{formatINR(ticket.price)} • {ticket.quantity} tickets</div>
                        </div>
                        <button type="button" onClick={() => setFormData({ ...formData, ticketTypes: formData.ticketTypes.filter((_, i) => i !== idx) })} className={`text-sm font-medium ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}>Remove</button>
                      </div>
                    ))}
                  </div>
                )}

                {addingTicketType && (
                  <div className={`p-4 rounded-lg space-y-3 ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex gap-2">
                      <input placeholder="Name (e.g., VIP)" value={ticketForm.name} onChange={e => setTicketForm({ ...ticketForm, name: e.target.value })} className={`flex-1 px-3 py-2 border-2 rounded-lg text-sm transition ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'} focus:outline-none`} />
                      <input type="number" placeholder="Price" value={ticketForm.price} onChange={e => setTicketForm({ ...ticketForm, price: e.target.value })} className={`w-24 px-3 py-2 border-2 rounded-lg text-sm transition ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'} focus:outline-none`} />
                      <input type="number" placeholder="Qty" value={ticketForm.quantity} onChange={e => setTicketForm({ ...ticketForm, quantity: e.target.value })} className={`w-20 px-3 py-2 border-2 rounded-lg text-sm transition ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'} focus:outline-none`} />
                    </div>
                    <input placeholder="Description (optional)" value={ticketForm.description} onChange={e => setTicketForm({ ...ticketForm, description: e.target.value })} className={`w-full px-3 py-2 border-2 rounded-lg text-sm transition ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'} focus:outline-none`} />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => {
                        if (ticketForm.name && ticketForm.price && ticketForm.quantity) {
                          setFormData({ ...formData, ticketTypes: [...formData.ticketTypes, { ...ticketForm, price: Number(ticketForm.price), quantity: Number(ticketForm.quantity), available: Number(ticketForm.quantity) }] })
                          setTicketForm({ name: '', price: '', quantity: '', description: '' })
                          setAddingTicketType(false)
                        }
                      }} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">Add</button>
                      <button type="button" onClick={() => { setAddingTicketType(false); setTicketForm({ name: '', price: '', quantity: '', description: '' }) }} className={`px-3 py-1 border-2 text-sm font-medium rounded-lg transition ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Phone Number *</label>
                <input
                    type="tel"
                    name="organizerPhone"
                    value={formData.organizerPhone}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-2.5 border-2 rounded-lg transition ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'} focus:outline-none`}
                    placeholder="Your phone number"
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Company/Organization</label>
                <input
                  type="text"
                  name="organizerCompany"
                  value={formData.organizerCompany}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 border-2 rounded-lg transition ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'} focus:outline-none`}
                  placeholder="Your company name (optional)"
                />
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => validateStep1() && setStep(2)}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition transform hover:scale-105"
                >
                  Next: Select Plan →
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          /* Step 2: Plan Selection */
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Choose Your Plan</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {Object.entries(plans).map(([name, { price, priceLabel, features }]) => (
                  <motion.div
                    key={name}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setFormData(prev => ({ ...prev, planSelected: name }))}
                    className={`p-8 rounded-xl cursor-pointer border-2 transition ${
                      formData.planSelected === name
                        ? isDarkMode ? 'border-blue-500 bg-blue-900/20' : 'border-blue-600 bg-blue-50'
                        : isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{name}</h3>
                      {formData.planSelected === name && (
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-3xl font-bold mb-6">
                      {priceLabel ? (
                        <span className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}>{priceLabel}</span>
                      ) : (
                        <>
                          <span className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}>₹{price.toLocaleString()}</span>
                          <span className={`text-lg ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>/event</span>
                        </>
                      )}
                    </p>

                    <ul className="space-y-3">
                      {features.map((feature, idx) => (
                        <li key={idx} className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`flex-1 px-6 py-3 font-semibold rounded-lg transition border-2 ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition transform hover:scale-105"
              >
                {loading ? 'Submitting...' : 'Submit Event Request'}
              </button>
            </div>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  )
}