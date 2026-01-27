import React, { useEffect, useState } from 'react'
import EventAdminLayout from '../../components/layout/EventAdminLayout'
import API from '../../services/api'
import formatINR from '../../utils/currency'
import { EventForm } from '../admin/AdminEvents'
import { Link } from 'react-router-dom'

export default function EventAdminEvents() {
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  if (loading) {
    return (
      <EventAdminLayout title="My Events">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </EventAdminLayout>
    )
  }

  return (
    <EventAdminLayout title="My Events">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {selectedEvent ? (
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
      ) : (
        <div className="space-y-4">
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
      )}
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
              {event.status || (isPast ? 'Completed' : 'Upcoming')}
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
  const [loadingFeatures, setLoadingFeatures] = useState(true)

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

  // Fetch event features on mount
  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        setLoadingFeatures(true)
        const res = await API.get(`/event-requests/${event._id}/features`)
        setFeatures(res.data.features || {})
      } catch (err) {
        console.error('Failed to fetch features:', err)
        // Default to all enabled if fetch fails
        setFeatures({ analytics: { enabled: true } })
      } finally {
        setLoadingFeatures(false)
      }
    }
    fetchFeatures()
  }, [event._id])

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
              <OverviewTab event={eventData} />
            ) : (
              <FeatureDisabledMessage featureName="Analytics" featureIcon="📊" />
            )
          )}
          {activeTab === 'tickets' && (
            ticketingEnabled ? (
              <TicketTypesTab event={eventData} onRefresh={refreshEvent} />
            ) : (
              <FeatureDisabledMessage featureName="Ticketing" featureIcon="🎫" />
            )
          )}
          {activeTab === 'staff' && (
            subAdminsEnabled ? (
              <StaffTab event={eventData} onRefresh={refreshEvent} />
            ) : (
              <FeatureDisabledMessage featureName="Sub-Admins" featureIcon="👥" />
            )
          )}
          {activeTab === 'bookings' && (
            ticketingEnabled ? (
              <BookingsTab eventId={eventData._id} />
            ) : (
              <FeatureDisabledMessage featureName="Bookings" featureIcon="📋" />
            )
          )}
          {activeTab === 'logs' && (
            scannerEnabled ? (
              <EntryLogsTab eventId={eventData._id} />
            ) : (
              <FeatureDisabledMessage featureName="Entry Logs & Scanner" featureIcon="📝" />
            )
          )}
        </>
      )}
    </div>
  )
}

// Reusable component for feature disabled message
function FeatureDisabledMessage({ featureName, featureIcon = '🔒' }) {
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
            <span>Contact your system administrator or super admin</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-600 font-bold mt-0.5">2.</span>
            <span>Request {featureName.toLowerCase()} feature activation for this event</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-600 font-bold mt-0.5">3.</span>
            <span>Or consider upgrading your subscription plan</span>
          </li>
        </ul>
      </div>
      <Link
        to="/for-organizers"
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        Upgrade Plan
      </Link>
    </div>
  )
}

function OverviewTab({ event }) {
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
        console.error('Failed to load stats:', err)
        if (!cancelled) {
          // Check if it's a feature disabled error
          if (err.response?.status === 403 && err.response?.data?.feature === 'analytics') {
            setError({ type: 'disabled', message: err.response.data.message })
          } else {
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
  }, [event._id])

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
          <Link
            to="/for-organizers"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            View Pricing & Upgrade
          </Link>
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
      alert('Failed to download attendee list')
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
