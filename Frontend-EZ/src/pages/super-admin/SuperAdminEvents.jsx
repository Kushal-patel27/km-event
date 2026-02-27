import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../../services/api'
import SuperAdminLayout from '../../components/layout/SuperAdminLayout'
import formatCurrency from '../../utils/currency'
import { EventForm } from '../admin/AdminEvents'

const FALLBACK_CATEGORIES = ['Music', 'Sports', 'Comedy', 'Arts', 'Culture', 'Travel', 'Festival', 'Workshop', 'Conference']

const featuresList = [
  { key: 'ticketing', label: 'Ticketing' },
  { key: 'qrCheckIn', label: 'QR Check-in' },
  { key: 'scannerApp', label: 'Scanner App' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'emailSms', label: 'Email/SMS' },
  { key: 'payments', label: 'Payments' },
  { key: 'weatherAlerts', label: 'Weather Alerts' },
  { key: 'subAdmins', label: 'Sub-Admins' },
  { key: 'reports', label: 'Reports' }
]

export default function SuperAdminEvents() {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [limit] = useState(20)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [editingMode, setEditingMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES)

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data } = await API.get('/categories/all')
      if (data && data.length > 0) {
        const categoryNames = data.map(cat => cat.name).filter(name => name !== 'Other')
        setCategories([...categoryNames, 'Other'])
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }

  // Prevent background scroll when modal is open
  useEffect(() => {
    const shouldLock = Boolean(selectedEvent)
    if (!shouldLock) return undefined

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previous
    }
  }, [selectedEvent])

  useEffect(() => {
    fetchEvents()
  }, [page, search])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams({
        page,
        limit,
        ...(search && { search }),
      })
      const res = await API.get(`/super-admin/events?${params}`)
      setEvents(res.data.events)
      setTotal(res.data.pagination.total)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEvent = async (eventId, title) => {
    if (!confirm(`Permanently delete "${title}" and all its bookings? This cannot be undone.`)) {
      return
    }

    try {
      await API.delete(`/super-admin/events/${eventId}`)
      setEvents(events.filter((e) => e._id !== eventId))
      setSelectedEvent(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete event')
    }
  }

  const handleEventDetails = async (eventId) => {
    try {
      const res = await API.get(`/super-admin/events/${eventId}`)
      const data = res.data
      
      // Initialize features if not present
      if (!data.features) {
        const initialFeatures = {}
        featuresList.forEach(feature => {
          initialFeatures[feature.key] = { enabled: true, description: '' }
        })
        data.features = initialFeatures
      }
      
      setSelectedEvent(data)
      setEditingMode(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load event details')
    }
  }

  const handleUpdateEvent = async (formData) => {
    if (!selectedEvent?.event?._id) return
    setSaving(true)
    try {
      // Calculate total capacity and use first ticket type price as base price
      const totalCapacity = formData.ticketTypes.reduce((sum, t) => sum + Number(t.quantity), 0)
      const basePrice = formData.ticketTypes.length > 0 ? formData.ticketTypes[0].price : 0
      
      const payload = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        locationDetails: formData.locationDetails || '',
        mapLink: formData.mapLink || '',
        image: formData.image,
        category: formData.category,
        price: basePrice,
        date: new Date(formData.date).toISOString(),
        totalTickets: totalCapacity,
        ticketTypes: formData.ticketTypes || []
      }

      const res = await API.put(`/super-admin/events/${selectedEvent.event._id}`, payload)
      const updated = res.data?.event

      setEvents((prev) => prev.map((e) => (e._id === updated._id ? { ...e, ...updated } : e)))
      setSelectedEvent((prev) => (prev ? { ...prev, event: { ...prev.event, ...updated } } : prev))
      setError('')
      setEditingMode(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update event')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SuperAdminLayout title="Event Management" subtitle="View, edit, and delete all platform events">

      {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

      {/* Search Filter */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <input
            type="text"
            placeholder="Search events by title or description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <>
            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {events.length === 0 ? (
                <div className="col-span-full text-center text-gray-500 py-12">
                  No events found
                </div>
              ) : (
                events.map((event) => (
                  <div key={event._id} className="bg-white rounded-lg shadow-sm hover:shadow-lg transition overflow-hidden">
                    {event.image && (
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-40 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{event.title}</h3>
                      <div className="space-y-2 mb-4 text-sm text-gray-600">
                        <p>📅 {new Date(event.date).toLocaleDateString()}</p>
                        <p>📍 {[event.location, event.locationDetails].filter(Boolean).join(' — ')}</p>
                        <p>💵 {formatCurrency(event.price)}</p>
                      </div>
                      <button
                        onClick={() => handleEventDetails(event._id)}
                        className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {events.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
                {Math.min(page * limit, total)} of {total} events
              </p>
              <div className="space-x-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={page * limit >= total}
                  onClick={() => setPage(page + 1)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
        </>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
            <div className="min-h-screen flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">{editingMode ? 'Edit Event' : selectedEvent.event.title}</h3>
                  <button
                    onClick={() => {
                      setSelectedEvent(null)
                      setEditingMode(false)
                    }}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {!editingMode ? (
                  <>
                    <div className="space-y-4 mb-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Event Details</h4>
                        <div className="text-sm space-y-2 text-gray-600">
                          <p><strong>Category:</strong> {selectedEvent.event.category || '—'}</p>
                          <p><strong>Location:</strong> {[selectedEvent.event.location, selectedEvent.event.locationDetails].filter(Boolean).join(' — ') || '—'}</p>
                          <p><strong>Date:</strong> {selectedEvent.event.date ? new Date(selectedEvent.event.date).toLocaleDateString() : '—'}</p>
                          <p><strong>Price:</strong> {formatCurrency(selectedEvent.event.price || 0)}</p>
                          <p><strong>Total Tickets:</strong> {selectedEvent.event.totalTickets || 0}</p>
                          <p><strong>Available Tickets:</strong> {selectedEvent.event.availableTickets || 0}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Event Manager (Staff Admin)</h4>
                        <p className="text-sm">{selectedEvent.event.organizer?.name}</p>
                        <p className="text-sm text-gray-600">{selectedEvent.event.organizer?.email}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Booking Statistics</h4>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div className="bg-blue-50 p-3 rounded">
                            <p className="text-gray-600">Total Bookings</p>
                            <p className="font-bold text-lg">{selectedEvent.bookingStats.total}</p>
                          </div>
                          <div className="bg-green-50 p-3 rounded">
                            <p className="text-gray-600">Confirmed</p>
                            <p className="font-bold text-lg">{selectedEvent.bookingStats.confirmed}</p>
                          </div>
                          <div className="bg-orange-50 p-3 rounded">
                            <p className="text-gray-600">Cancelled</p>
                            <p className="font-bold text-lg">{selectedEvent.bookingStats.cancelled}</p>
                          </div>
                          <div className="bg-purple-50 p-3 rounded">
                            <p className="text-gray-600">Revenue</p>
                            <p className="font-bold text-lg">{formatCurrency(selectedEvent.bookingStats.totalRevenue)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3">
                      <button
                        onClick={() => setSelectedEvent(null)}
                        className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => navigate(`/super-admin/event-requests/${selectedEvent.event._id}/features`)}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        Configure Features
                      </button>
                      <button
                        onClick={() => setEditingMode(true)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Edit Event
                      </button>
                      <button
                        onClick={() => {
                          handleDeleteEvent(selectedEvent.event._id, selectedEvent.event.title)
                        }}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Delete Event
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <EventForm
                      initial={{
                        title: selectedEvent.event.title,
                        description: selectedEvent.event.description || '',
                        location: selectedEvent.event.location || '',
                        locationDetails: selectedEvent.event.locationDetails || '',
                        mapLink: selectedEvent.event.mapLink || '',
                        image: selectedEvent.event.image || '',
                        category: selectedEvent.event.category || '',
                        date: selectedEvent.event.date || '',
                        ticketTypes: selectedEvent.event.ticketTypes || []
                      }}
                      onSave={handleUpdateEvent}
                      onCancel={() => setEditingMode(false)}
                      busy={saving}
                      categories={categories}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  )
}
