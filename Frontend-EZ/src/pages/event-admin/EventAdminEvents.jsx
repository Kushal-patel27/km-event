import React, { useEffect, useState } from 'react'
import EventAdminLayout from '../../components/layout/EventAdminLayout'
import ExportDataModal from '../../components/admin/ExportDataModal'
import API from '../../services/api'
import formatINR from '../../utils/currency'
import { EventForm } from '../admin/AdminEvents'
import { Link } from 'react-router-dom'

export default function EventAdminEvents() {
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showExportModal, setShowExportModal] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await API.get('/event-admin/events')
      setEvents(res.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format, filters) => {
    try {
      setError('')
      
      // Build query params - export event admin's events
      const params = new URLSearchParams({ format })
      
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.ticketType) params.append('ticketType', filters.ticketType)
      if (filters.status) params.append('status', filters.status)
      
      // Call export API - use event-admin specific endpoint
      const response = await API.get(`/event-admin/export/events?${params.toString()}`, {
        responseType: 'blob'
      })
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      
      // Determine file extension
      const ext = format === 'csv' ? 'csv' : format === 'xlsx' ? 'xlsx' : 'pdf'
      link.setAttribute('download', `my-events-export-${Date.now()}.${ext}`)
      
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
      setError(err.response?.data?.message || 'Failed to export data')
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
      key: 'ticketType',
      label: 'Ticket Type',
      type: 'text',
    },
    {
      key: 'status',
      label: 'Event Status',
      type: 'select',
      options: [
        { value: 'upcoming', label: 'Upcoming' },
        { value: 'ongoing', label: 'Ongoing' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
    },
  ]

  const isInitialLoad = loading && events.length === 0

  return (
    <EventAdminLayout title="My Events">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {isInitialLoad && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {!isInitialLoad && selectedEvent ? (
        <EventDetails 
          event={selectedEvent} 
          onBack={() => setSelectedEvent(null)}
          onUpdate={(updatedEvent) => {
            // Update the events list in real-time
            setEvents((prev) => prev.map((e) => 
              e._id === updatedEvent._id ? { ...e, ...updatedEvent } : e
            ))
            // Update the selected event as well
            setSelectedEvent(updatedEvent)
          }}
        />
      ) : !isInitialLoad ? (
        <div className="space-y-4">
          {events.length > 0 && (
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowExportModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                📥 Export Events
              </button>
            </div>
          )}
          {events.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
              <p className="text-gray-500">No events assigned to you yet.</p>
            </div>
          ) : (
            events.map(event => (
              <EventCard 
                key={event._id} 
                event={event}
                onSelect={() => setSelectedEvent(event)}
              />
            ))
          )}
        </div>
      ) : null}

      <ExportDataModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title="Export My Events"
        filters={exportFilters}
      />
    </EventAdminLayout>
  )
}

function EventCard({ event, onSelect }) {
  const eventDate = new Date(event.date);
  const isPast = eventDate < new Date();
  
  return (
    <div 
      className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <span>📅 {eventDate.toLocaleDateString()}</span>
            <span>📍 {event.location}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              isPast ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-700'
            }`}>
              {isPast ? 'Completed' : 'Scheduled'}
            </span>
          </div>
          <div className="flex items-center gap-6 mt-4 text-sm">
            <div>
              <span className="text-gray-500">Tickets:</span> {event.availableTickets}/{event.totalTickets}
            </div>
            <div>
              <span className="text-gray-500">Price:</span> {formatINR(event.price)}
            </div>
            {event.assignedStaff?.length > 0 && (
              <div>
                <span className="text-gray-500">Staff:</span> {event.assignedStaff.length}
              </div>
            )}
          </div>
        </div>
        <button className="text-indigo-600 hover:text-indigo-700 font-medium">
          Manage →
        </button>
      </div>
    </div>
  )
}

function EventDetails({ event, onBack, onUpdate }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [eventData, setEventData] = useState(event)
  const [loading, setLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [features, setFeatures] = useState(null)
  const [loadingFeatures, setLoadingFeatures] = useState(false)
  const [showPricingDetails, setShowPricingDetails] = useState(true)
  const [showPlansModal, setShowPlansModal] = useState(false)
  const [plans, setPlans] = useState([])
  const [currentPlan, setCurrentPlan] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [upgradingPlan, setUpgradingPlan] = useState(false)
  const [planPrice, setPlanPrice] = useState(null)
  const [loadingPlanPrice, setLoadingPlanPrice] = useState(false)

  const refreshEvent = async () => {
    try {
      const res = await API.get(`/event-admin/events/${event._id}`)
      const updated = res.data
      setEventData(updated)
      onUpdate(updated)
    } catch (err) {
      console.error('Failed to refresh event:', err)
    }
  }

  const handleUpdateEvent = async (formData) => {
    try {
      setSaving(true)
      setEditError('')
      
      // Calculate total capacity and use first ticket type price as base price
      const totalCapacity = formData.ticketTypes.reduce((sum, t) => sum + Number(t.quantity), 0)
      const basePrice = formData.ticketTypes.length > 0 ? formData.ticketTypes[0].price : 0
      
      const payload = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        locationDetails: formData.locationDetails,
        image: formData.image,
        category: formData.category,
        price: basePrice,
        date: new Date(formData.date).toISOString(),
        totalTickets: totalCapacity,
        ticketTypes: formData.ticketTypes || []
      }
      const res = await API.put(`/event-admin/events/${event._id}`, payload)
      const updated = res.data?.event || res.data
      
      // Update local state immediately
      setEventData(updated)
      // Update parent component's list
      onUpdate(updated)
      setEditMode(false)
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update event')
    } finally {
      setSaving(false)
    }
  }

  // Fetch event features and subscription plan on mount
  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        setLoadingFeatures(true)
        const res = await API.get(`/event-requests/${event._id}/features`)
        setFeatures(res.data.features || {})
      } catch (err) {
        // 403 is expected when features endpoint is not accessible (normal for event admins)
        if (err.response?.status === 403) {
          // Default to all enabled if access is forbidden
          setFeatures({ analytics: { enabled: true }, ticketing: { enabled: true }, qrCheckIn: { enabled: true }, scannerApp: { enabled: true }, subAdmins: { enabled: true } })
        } else {
          console.error('Failed to fetch features:', err)
          // Default to all enabled if fetch fails
          setFeatures({ analytics: { enabled: true }, ticketing: { enabled: true }, qrCheckIn: { enabled: true }, scannerApp: { enabled: true }, subAdmins: { enabled: true } })
        }
      } finally {
        setLoadingFeatures(false)
      }
    }
    fetchFeatures()
    fetchSubscriptionPlan()
  }, [event._id])

  const fetchSubscriptionPlan = async () => {
    try {
      setLoadingPlanPrice(true)
      const res = await API.get(`/event-admin/events/${event._id}/subscription`)
      if (res.data && res.data.plan) {
        setCurrentPlan(res.data.plan)
        setPlanPrice(res.data.plan.monthlyFee)
      }
    } catch (err) {
      console.log('No subscription plan found')
      setPlanPrice(null)
    } finally {
      setLoadingPlanPrice(false)
    }
  }

  const normalizePlan = (plan) => {
    return {
      ...plan,
      displayName: plan.displayName || plan.name
    }
  }

  // Fetch subscription plans when modal opens
  const fetchPlans = async () => {
    try {
      const res = await API.get('/subscriptions/plans')
      const plansData = res.data?.data || res.data?.plans || res.data
      const plansArray = Array.isArray(plansData) ? plansData : (Array.isArray(res.data) ? res.data : [])
      const normalized = plansArray
        .map(normalizePlan)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      setPlans(normalized)
      
      // Fetch current subscription
      try {
        const currentRes = await API.get(`/event-admin/events/${event._id}/subscription`)
        if (currentRes.data && currentRes.data.plan) {
          setCurrentPlan(currentRes.data.plan)
        }
      } catch (err) {
        console.log('No current subscription found')
      }
    } catch (err) {
      console.error('Failed to fetch plans:', err.message, err.response?.data)
      setPlans([])
    }
  }

  const handlePlanSelect = (plan) => {
    const isCurrent = currentPlan && (currentPlan._id === plan._id || currentPlan.name === plan.name)
    if (isCurrent) {
      return
    }
    setSelectedPlan(plan)
    setShowConfirmModal(true)
  }

  const handleConfirmUpgrade = async () => {
    if (!selectedPlan) return
    
    try {
      setUpgradingPlan(true)
      const res = await API.post(`/event-admin/events/${event._id}/subscription`, {
        planId: selectedPlan._id
      })
      
      if (res.data.success) {
        setCurrentPlan(selectedPlan)
        setShowConfirmModal(false)
        setShowPlansModal(false)
        // Refresh features after plan update
        try {
          const featuresRes = await API.get(`/event-requests/${event._id}/features`)
          if (featuresRes.data.features) {
            setFeatures(featuresRes.data.features)
          }
        } catch (featuresError) {
          console.warn('Skipping feature refresh after upgrade:', featuresError)
        }
        alert('Subscription plan updated successfully!')
        // Refresh the page to apply new features
        window.location.reload()
      }
    } catch (err) {
      console.error('Failed to upgrade plan:', err)
      alert(err.response?.data?.message || 'Failed to upgrade plan. Please try again.')
    } finally {
      setUpgradingPlan(false)
    }
  }

  const handleShowPlans = () => {
    console.log('handleShowPlans called')
    setShowPlansModal(true)
    // Fetch plans after modal is shown
    setTimeout(() => {
      fetchPlans()
    }, 100)
  }

  useEffect(() => {
    if (editMode) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [editMode])

  // Filter tabs based on features
  const analyticsEnabled = features?.analytics?.enabled !== false
  const ticketingEnabled = features?.ticketing?.enabled !== false
  const subAdminsEnabled = features?.subAdmins?.enabled !== false
  const scannerEnabled = features?.scannerApp?.enabled !== false
  
  const tabs = [
    analyticsEnabled && { id: 'overview', label: '📊 Overview' },
    ticketingEnabled && { id: 'tickets', label: '🎫 Ticket Types' },
    subAdminsEnabled && { id: 'staff', label: '👥 Staff' },
    ticketingEnabled && { id: 'bookings', label: '📋 Bookings' },
    scannerEnabled && { id: 'logs', label: '📝 Entry Logs' },
  ].filter(Boolean)

  // Adjust active tab if current tab is disabled
  useEffect(() => {
    const tabExists = tabs.some(tab => tab.id === activeTab)
    if (!tabExists && tabs.length > 0) {
      setActiveTab(tabs[0].id)
    }
  }, [analyticsEnabled, ticketingEnabled, subAdminsEnabled, scannerEnabled, activeTab])

  return (
    <div>
      <button 
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        ← Back to Events
      </button>

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{eventData.title}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span>📅 {new Date(eventData.date).toLocaleDateString()}</span>
              <span>📍 {eventData.location}</span>
            </div>
          </div>
          <button
            onClick={() => setEditMode(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            ✏️ Edit Event
          </button>
        </div>
      </div>

      {/* Pricing Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <button 
          type="button"
          onClick={(e) => {
            e.preventDefault()
            handleShowPlans()
          }}
          className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6 hover:shadow-lg hover:scale-105 transition-all cursor-pointer text-left"
        >
          <p className="text-sm text-gray-600 mb-2">Monthly Fee</p>
          <p className="text-3xl font-bold text-indigo-600">
            {loadingPlanPrice ? '...' : formatINR(planPrice || eventData.price)}
          </p>
          {planPrice && currentPlan && (
            <p className="text-xs text-indigo-500 mt-2 font-medium">{currentPlan.name}</p>
          )}
        </button>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <p className="text-sm text-gray-600 mb-2">Total Capacity</p>
          <p className="text-3xl font-bold text-green-600">{eventData.totalTickets}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
          <p className="text-sm text-gray-600 mb-2">Available Tickets</p>
          <p className="text-3xl font-bold text-purple-600">{eventData.availableTickets}</p>
        </div>
      </div>

      {/* View Plans Button */}
      <div className="mb-6 flex justify-center">
        <button
          type="button"
          onClick={handleShowPlans}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all hover:shadow-lg"
        >
          📋 View All Subscription Plans
        </button>
      </div>

      {/* Edit Event Modal */}
      {editMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Edit Event</h3>
              <button
                onClick={() => { setEditMode(false); setEditError('') }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {editError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {editError}
                </div>
              )}
              <EventForm
                initial={{
                  ...eventData,
                  capacity: eventData.totalTickets
                }}
                onSave={handleUpdateEvent}
                onCancel={() => { setEditMode(false); setEditError('') }}
                busy={saving}
              />
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {loadingFeatures ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading features...</p>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            analyticsEnabled ? (
              <OverviewTab event={eventData} onShowPlans={handleShowPlans} />
            ) : (
              <FeatureDisabledMessage featureName="Analytics" featureIcon="📊" onShowPlans={handleShowPlans} />
            )
          )}
          {activeTab === 'tickets' && (
            ticketingEnabled ? (
              <TicketTypesTab event={eventData} onRefresh={refreshEvent} />
            ) : (
              <FeatureDisabledMessage featureName="Ticketing" featureIcon="🎫" onShowPlans={handleShowPlans} />
            )
          )}
          {activeTab === 'staff' && (
            subAdminsEnabled ? (
              <StaffTab event={eventData} onRefresh={refreshEvent} />
            ) : (
              <FeatureDisabledMessage featureName="Sub-Admins" featureIcon="👥" onShowPlans={handleShowPlans} />
            )
          )}
          {activeTab === 'bookings' && (
            ticketingEnabled ? (
              <BookingsTab eventId={eventData._id} />
            ) : (
              <FeatureDisabledMessage featureName="Bookings" featureIcon="📋" onShowPlans={handleShowPlans} />
            )
          )}
          {activeTab === 'logs' && (
            scannerEnabled ? (
              <EntryLogsTab eventId={eventData._id} />
            ) : (
              <FeatureDisabledMessage featureName="Entry Logs & Scanner" featureIcon="📝" onShowPlans={handleShowPlans} />
            )
          )}
        </>
      )}

      {/* Plans Modal */}
      {showPlansModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] overflow-y-auto flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">📋 Subscription Plans</h3>
                {currentPlan && (
                  <p className="text-sm text-gray-600 mt-1">Current Plan: <span className="font-semibold text-indigo-600">{currentPlan.displayName || currentPlan.name}</span></p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowPlansModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {plans.length === 0 ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 text-lg font-medium">Loading subscription plans...</p>
                  <p className="text-gray-500 text-sm mt-2">Please wait while we fetch the available plans</p>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {plans.map((plan) => (
                      <PlanCard 
                        key={plan._id || plan.name} 
                        plan={plan} 
                        currentPlan={currentPlan}
                        onSelect={() => handlePlanSelect(plan)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Subscription Change</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to {currentPlan ? 'change' : 'subscribe'} to the <span className="font-bold text-indigo-600">{selectedPlan.displayName || selectedPlan.name}</span> plan?
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-semibold">{selectedPlan.displayName || selectedPlan.name}</span>
                </div>
                {selectedPlan.monthlyFee !== undefined && selectedPlan.monthlyFee !== null && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Fee:</span>
                    <span className="font-semibold text-indigo-600">
                      {formatINR(selectedPlan.monthlyFee)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false)
                  setSelectedPlan(null)
                }}
                disabled={upgradingPlan}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUpgrade}
                disabled={upgradingPlan}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {upgradingPlan ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Plan Card Component
function PlanCard({ plan, currentPlan, onSelect }) {
  if (!plan) return null
  
  const isCurrentPlan = currentPlan && (currentPlan._id === plan._id || currentPlan.name === plan.name)
  const featureEntries = plan.features ? Object.entries(plan.features) : []

  const detailItems = []
  if (plan.monthlyFee !== undefined && plan.monthlyFee !== null) {
    detailItems.push({ label: 'Monthly Fee', value: formatINR(plan.monthlyFee) })
  }
  if (plan.commissionPercentage !== undefined && plan.commissionPercentage !== null) {
    detailItems.push({ label: 'Commission', value: `${plan.commissionPercentage}%` })
  }
  if (plan.eventLimit !== undefined && plan.eventLimit !== null) {
    detailItems.push({ label: 'Event Limit', value: plan.eventLimit })
  }
  if (plan.ticketLimit !== undefined && plan.ticketLimit !== null) {
    detailItems.push({ label: 'Ticket Limit', value: plan.ticketLimit })
  }
  if (plan.payoutFrequency) {
    detailItems.push({ label: 'Payout Frequency', value: plan.payoutFrequency })
  }
  if (plan.minPayoutAmount !== undefined && plan.minPayoutAmount !== null) {
    detailItems.push({ label: 'Min Payout', value: formatINR(plan.minPayoutAmount) })
  }

  const formatFeatureValue = (feature, key) => {
    if (feature === null || feature === undefined) return null
    if (typeof feature !== 'object') return String(feature)

    const parts = []
    if (feature.description) parts.push(feature.description)
    if (feature.enabled !== undefined) parts.push(`Enabled: ${feature.enabled ? 'Yes' : 'No'}`)
    if (feature.limit !== undefined && feature.limit !== null) parts.push(`Limit: ${feature.limit}`)
    if (feature.emailLimit !== undefined && feature.emailLimit !== null) parts.push(`Email Limit: ${feature.emailLimit}`)
    if (feature.smsLimit !== undefined && feature.smsLimit !== null) parts.push(`SMS Limit: ${feature.smsLimit}`)
    if (feature.transactionFee !== undefined && feature.transactionFee !== null) {
      parts.push(`Transaction Fee: ${feature.transactionFee}%`)
    }
    if (Array.isArray(feature.types) && feature.types.length > 0) {
      parts.push(`Types: ${feature.types.join(', ')}`)
    }

    return parts.length > 0 ? parts.join(' • ') : key
  }
  
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isCurrentPlan}
      className={`border-2 rounded-xl p-5 hover:shadow-lg transition-all bg-white text-left w-full ${
        isCurrentPlan 
          ? 'border-green-500 bg-green-50 cursor-not-allowed opacity-90' 
          : 'border-gray-200 hover:border-indigo-400'
      }`}
    >
      {isCurrentPlan && (
        <div className="mb-2">
          <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
            Current Plan
          </span>
        </div>
      )}
      <h4 className="text-lg font-bold text-gray-900 mb-2">{plan.displayName || plan.name || 'Unknown Plan'}</h4>
      {(detailItems.length > 0 || plan.description) && (
        <div className="mb-4">
          {detailItems.length > 0 && (
            <div className="space-y-1 text-sm text-gray-700">
              {detailItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-2">
                  <span className="text-gray-600">{item.label}:</span>
                  <span className="font-semibold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          )}
          {plan.description && (
            <p className="text-xs text-gray-600 mt-2">{plan.description}</p>
          )}
        </div>
      )}
      
      {featureEntries.length > 0 && (
        <div className="space-y-2 text-xs border-t border-gray-200 pt-3">
          {featureEntries.map(([key, feature]) => {
            const featureValue = formatFeatureValue(feature, key)
            if (!featureValue) return null
            return (
              <div key={key} className="flex items-start gap-2 text-green-700">
                <span>✓</span>
                <span>{featureValue}</span>
              </div>
            )
          })}
        </div>
      )}
    </button>
  )
}

// Reusable component for feature disabled message
function FeatureDisabledMessage({ featureName, featureIcon = '🔒', onShowPlans }) {
  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl p-10 text-center shadow-lg">
      <div className="bg-white rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-md">
        <svg className="w-14 h-14 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h3 className="text-3xl font-bold text-gray-900 mb-4">{featureIcon} {featureName} Not Available</h3>
      <p className="text-lg text-gray-700 mb-6 max-w-lg mx-auto">
        {featureName} features are not enabled for this event.
      </p>
      <div className="bg-white border border-yellow-200 rounded-xl p-6 max-w-md mx-auto mb-6">
        <p className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-center gap-2">
          <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          How to Enable {featureName}
        </p>
        <ul className="text-sm text-gray-600 space-y-2 text-left">
          <li className="flex items-start gap-2">
            <span className="text-yellow-600 font-bold mt-0.5">1.</span>
            <span>Upgrade your subscription plan</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-600 font-bold mt-0.5">2.</span>
            <span>Or contact your administrator to manually enable this feature</span>
          </li>
        </ul>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onShowPlans}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          View Plans with {featureName}
        </button>
        <Link
          to="/for-organizers"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Learn More
        </Link>
      </div>
    </div>
  )
}

function OverviewTab({ event, onShowPlans }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const fetchStats = async () => {
      try {
        const res = await API.get(`/event-admin/events/${event._id}/stats`)
        if (!cancelled) {
          setStats(res.data.stats)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          // Check if it's a feature disabled error
          if (err.response?.status === 403 && err.response?.data?.feature === 'analytics') {
            // This is expected - analytics feature is disabled
            setError({ type: 'disabled', message: err.response.data.message })
          } else if (err.response?.status === 403) {
            // Access denied or feature error - set default stats
            console.warn('Access denied or feature disabled for stats:', err.response?.data)
            setError(null)
            // Set default empty stats
            setStats({
              totalBookings: 0,
              confirmedBookings: 0,
              cancelledBookings: 0,
              totalRevenue: 0,
              ticketsSold: 0,
              ticketsAvailable: event.availableTickets || 0
            })
          } else {
            // Log actual errors
            console.error('Failed to load stats:', err)
            setError({ type: 'error', message: err.response?.data?.message || 'Failed to load statistics' })
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchStats()
    const intervalId = setInterval(fetchStats, 30000) // Refresh every 30 seconds instead of 1 second
    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [event._id, event.availableTickets])

  if (loading) return <div className="text-center py-8">Loading stats...</div>

  if (error) {
    if (error.type === 'disabled') {
      return (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-8 text-center">
          <svg className="w-20 h-20 mx-auto mb-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">📊 Analytics Feature Disabled</h3>
          <p className="text-lg text-gray-700 mb-2">
            {error.message}
          </p>
          <p className="text-gray-600 mb-4">
            Event analytics and reporting features are currently not available for this event.
          </p>
          <div className="bg-white border border-yellow-200 rounded-lg p-4 mt-4 text-left max-w-md mx-auto mb-6">
            <p className="text-sm font-semibold text-gray-900 mb-2">To enable analytics:</p>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Contact your system administrator</li>
              <li>Request analytics feature activation</li>
              <li>Or upgrade your subscription plan</li>
            </ul>
          </div>
          <button
            type="button"
            onClick={onShowPlans}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            View Pricing & Upgrade
          </button>
        </div>
      )
    }
    
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Bookings" value={stats?.totalBookings || 0} />
        <StatCard label="Confirmed" value={stats?.confirmedBookings || 0} />
        <StatCard label="Tickets Sold" value={stats?.ticketsSold || 0} />
        <StatCard label="Available" value={stats?.ticketsAvailable || 0} />
        <StatCard label="Revenue" value={formatINR(stats?.totalRevenue || 0)} />
        <StatCard label="Cancelled" value={stats?.cancelledBookings || 0} />
      </div>

      {/* Event Details */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-bold mb-4">Event Details</h3>
        <div className="space-y-2 text-sm">
          <div><span className="font-medium">Description:</span> {event.description}</div>
          <div><span className="font-medium">Location:</span> {event.location}</div>
          {event.locationDetails && (
            <div><span className="font-medium">Venue Details:</span> {event.locationDetails}</div>
          )}
          <div><span className="font-medium">Category:</span> {event.category || 'N/A'}</div>
          <div><span className="font-medium">Price:</span> {formatINR(event.price)}</div>
        </div>
      </div>
    </div>
  )
}

function TicketTypesTab({ event, onRefresh }) {
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({ name: '', price: '', quantity: '', description: '' })
  const [error, setError] = useState('')

  const handleAdd = async (e) => {
    e.preventDefault()
    try {
      setError('')
      await API.post(`/event-admin/events/${event._id}/ticket-types`, {
        name: formData.name,
        price: Number(formData.price),
        quantity: Number(formData.quantity),
        description: formData.description
      })
      setFormData({ name: '', price: '', quantity: '', description: '' })
      setAdding(false)
      onRefresh()
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.feature === 'ticketing') {
        setError('⚠️ Ticketing feature is disabled for this event. Please contact your administrator or upgrade your plan.')
      } else {
        setError(err.response?.data?.message || 'Failed to add ticket type')
      }
    }
  }

  const handleEdit = (ticket) => {
    setEditing(ticket._id)
    setFormData({
      name: ticket.name,
      price: ticket.price.toString(),
      quantity: ticket.quantity.toString(),
      description: ticket.description || ''
    })
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    try {
      setError('')
      await API.put(`/event-admin/events/${event._id}/ticket-types/${editing}`, {
        name: formData.name,
        price: Number(formData.price),
        quantity: Number(formData.quantity),
        description: formData.description
      })
      setFormData({ name: '', price: '', quantity: '', description: '' })
      setEditing(null)
      onRefresh()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update ticket type')
    }
  }

  const handleDelete = async (ticketTypeId) => {
    if (!confirm('Delete this ticket type?')) return
    try {
      await API.delete(`/event-admin/events/${event._id}/ticket-types/${ticketTypeId}`)
      onRefresh()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete')
    }
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">{error}</div>}
      
      <button
        onClick={() => {
          setAdding(!adding)
          setEditing(null)
          setFormData({ name: '', price: '', quantity: '', description: '' })
        }}
        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
      >
        {adding ? 'Cancel' : '+ Add Ticket Type'}
      </button>

      {(adding || editing) && (
        <form onSubmit={editing ? handleSaveEdit : handleAdd} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <h4 className="font-bold text-gray-900">{editing ? 'Edit Ticket Type' : 'Add New Ticket Type'}</h4>
          <input
            type="text"
            placeholder="Ticket Name (e.g., VIP, General)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="number"
            placeholder="Price"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
            min="0"
          />
          <input
            type="number"
            placeholder="Quantity"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
            min="1"
          />
          <textarea
            placeholder="Description (optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            rows="2"
          />
          <div className="flex gap-2">
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex-1">
              {editing ? 'Update Ticket Type' : 'Save Ticket Type'}
            </button>
            {editing && (
              <button 
                type="button"
                onClick={() => {
                  setEditing(null)
                  setFormData({ name: '', price: '', quantity: '', description: '' })
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <div className="space-y-3">
        {event.ticketTypes?.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center text-gray-500">
            No ticket types yet. Add one to get started.
          </div>
        ) : (
          event.ticketTypes?.map(ticket => (
            <div key={ticket._id} className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center">
              <div>
                <div className="font-bold">{ticket.name}</div>
                <div className="text-sm text-gray-600">
                  {formatINR(ticket.price)} • {ticket.available}/{ticket.quantity} available
                </div>
                {ticket.description && <div className="text-sm text-gray-500 mt-1">{ticket.description}</div>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(ticket)}
                  className="text-indigo-600 hover:text-indigo-700 px-3 py-1 border border-indigo-300 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(ticket._id)}
                  className="text-red-600 hover:text-red-700 px-3 py-1 border border-red-300 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function StaffTab({ event, onRefresh }) {
  const [assigning, setAssigning] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('staff')
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', email: '', role: 'staff', gates: '', password: '' })

  const handleAssign = async (e) => {
    e.preventDefault()
    try {
      setError('')
      // Search for staff by email using Event Admin endpoint
      const searchRes = await API.get(`/event-admin/staff/search?email=${email}`)
      const user = searchRes.data.users?.find(u => u.email === email)
      
      if (!user) {
        setError('Staff member not found with that email')
        return
      }

      const eventIdStr = event._id?.toString()
      const otherAssignments = (user.assignedEvents || []).filter(ev => {
        const id = ev?._id || ev
        return id?.toString() !== eventIdStr
      })

      if (otherAssignments.length > 0) {
        const proceed = window.confirm(
          `${user.name || 'This staff'} is already assigned to ${otherAssignments.length} other event${otherAssignments.length > 1 ? 's' : ''}. Continue assigning to this event?`
        )
        if (!proceed) {
          setError('Assignment cancelled')
          return
        }
      }

      await API.post(`/event-admin/events/${event._id}/staff`, {
        userId: user._id,
        role
      })
      setEmail('')
      setAssigning(false)
      onRefresh()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign staff')
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      setError('')
      setCreateLoading(true)
      const payload = {
        name: createForm.name,
        email: createForm.email,
        role: createForm.role,
        gates: createForm.role === 'staff' ? createForm.gates.split(',').map(g => g.trim()).filter(Boolean) : [],
        ...(createForm.password ? { password: createForm.password } : {}),
      }

      await API.post(`/event-admin/events/${event._id}/staff/new`, payload)
      setCreateForm({ name: '', email: '', role: 'staff', gates: '', password: '' })
      setCreating(false)
      onRefresh()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create staff')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleRemove = async (staffId) => {
    if (!staffId) {
      setError('Could not remove staff: missing staff id')
      return
    }
    if (!confirm('Remove this staff member?')) return
    try {
      await API.delete(`/event-admin/events/${event._id}/staff/${staffId}`)
      onRefresh()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove staff')
    }
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">{error}</div>}
      
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setAssigning(!assigning)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          {assigning ? 'Cancel' : '+ Assign Staff'}
        </button>

        <button
          onClick={() => setCreating(!creating)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          {creating ? 'Close Create' : '+ Create New Staff'}
        </button>
      </div>

      {assigning && (
        <form onSubmit={handleAssign} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <input
            type="email"
            placeholder="Staff Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="staff">Staff</option>
            <option value="staff_admin">Staff Admin</option>
          </select>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            Assign Staff
          </button>
        </form>
      )}

      {creating && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <h4 className="font-bold text-gray-900">Create & Assign Staff</h4>
          <input
            type="text"
            placeholder="Full Name"
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="password"
            placeholder="Set password (optional)"
            value={createForm.password}
            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
          <select
            value={createForm.role}
            onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="staff">Staff (scanner)</option>
            <option value="staff_admin">Staff Admin</option>
          </select>
          {createForm.role === 'staff' && (
            <input
              type="text"
              placeholder="Gates (comma separated)"
              value={createForm.gates}
              onChange={(e) => setCreateForm({ ...createForm, gates: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          )}
          <button type="submit" disabled={createLoading} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60">
            {createLoading ? 'Creating...' : 'Create & Assign'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {event.assignedStaff?.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center text-gray-500">
            No staff assigned yet.
          </div>
        ) : (
          event.assignedStaff?.map(staff => (
            <div key={staff._id} className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center">
              <div>
                <div className="font-bold">{staff.user?.name || 'Unknown'}</div>
                <div className="text-sm text-gray-600">{staff.user?.email}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Role: {staff.role} • Assigned: {new Date(staff.assignedAt).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => handleRemove(staff.user?._id || staff.user || staff._id)}
                className="text-red-600 hover:text-red-700 px-3 py-1 border border-red-300 rounded"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function BookingsTab({ eventId }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const fetchBookings = async () => {
      try {
        const res = await API.get(`/event-admin/events/${eventId}/bookings`)
        if (!cancelled) setBookings(res.data.bookings || [])
      } catch (err) {
        console.error('Failed to load bookings:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchBookings()
    const intervalId = setInterval(fetchBookings, 1000) // poll so booking list stays fresh
    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [eventId])

  const handleDownload = async () => {
    try {
      const res = await API.get(`/event-admin/events/${eventId}/attendees/download`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `attendees-${eventId}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      // Handle different error types
      if (err.response?.status === 403) {
        // Check if it's a feature disabled error
        if (err.response?.data?.feature === 'reports') {
          alert('The reports feature is not enabled for this event. Please enable it in event settings.')
        } else {
          alert('You do not have permission to download attendee list for this event.')
        }
      } else if (err.response?.status === 401) {
        alert('Your session has expired. Please log in again.')
      } else {
        console.error('Failed to download attendee list:', err)
        alert('Failed to download attendee list: ' + (err.response?.data?.message || 'Unknown error'))
      }
    }
  }

  if (loading) return <div className="text-center py-8">Loading bookings...</div>

  return (
    <div className="space-y-4">
      <button
        onClick={handleDownload}
        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
      >
        📥 Download Attendee List (CSV)
      </button>

      {bookings.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center text-gray-500">
          No bookings yet
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Customer</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Tickets</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Scanned</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(booking => (
                  <tr key={booking._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">{booking.user?.name || 'N/A'}</td>
                    <td className="px-4 py-3">{booking.user?.email || 'N/A'}</td>
                    <td className="px-4 py-3">{booking.quantity || 1}</td>
                    <td className="px-4 py-3">{new Date(booking.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {booking.lastScannedAt ? '✅ Yes' : '❌ No'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function EntryLogsTab({ eventId }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const fetchLogs = async () => {
      try {
        const res = await API.get(`/event-admin/events/${eventId}/entry-logs`)
        if (!cancelled) setLogs(res.data.logs || [])
      } catch (err) {
        console.error('Failed to load entry logs:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchLogs()
    const intervalId = setInterval(fetchLogs, 1000) // near-real-time scan visibility
    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [eventId])

  if (loading) return <div className="text-center py-8">Loading entry logs...</div>

  return (
    <div className="space-y-4">
      {logs.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center text-gray-500">
          No entries recorded yet
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Booking ID</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Ticket #</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Entry Time</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Scanned By</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{log.bookingId || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                        #{log.ticketIndex || 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">{log.userName}</td>
                    <td className="px-4 py-3">{log.userEmail}</td>
                    <td className="px-4 py-3">
                      {new Date(log.scannedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{log.scannedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  )
}
