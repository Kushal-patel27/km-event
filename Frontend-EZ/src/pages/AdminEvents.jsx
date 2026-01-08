import React, { useEffect, useState } from 'react'
import formatINR from '../utils/currency'
import API from '../services/api'
import { useAuth } from '../context/AuthContext'
import AdminLayout from '../components/AdminLayout'
import { AnimatePresence, motion } from 'framer-motion'

const CATEGORIES = ['Music', 'Sports', 'Comedy', 'Arts', 'Culture', 'Travel', 'Festival', 'Workshop', 'Conference']
const CITY_SUGGESTIONS = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Chandigarh']

function toInputDateTime(value) {
  if (!value) return ''
  try {
    const d = new Date(value)
    if (isNaN(d)) return ''
    const pad = n => String(n).padStart(2, '0')
    const yyyy = d.getFullYear()
    const mm = pad(d.getMonth() + 1)
    const dd = pad(d.getDate())
    const hh = pad(d.getHours())
    const mi = pad(d.getMinutes())
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
  } catch {
    return ''
  }
}

function EventForm({ initial = {}, onSave, onCancel, busy = false }) {
  const [form, setForm] = useState({
    title: '',
    location: '',
    locationDetails: '',
    category: '',
    description: '',
    image: '',
    ...initial,
    date: toInputDateTime(initial.date) || '',
    ticketTypes: initial.ticketTypes || []
  })
  const [errors, setErrors] = useState({})
  const [dateSaved, setDateSaved] = useState(false)
  const [addingTicketType, setAddingTicketType] = useState(false)
  const [ticketForm, setTicketForm] = useState({ name: '', price: '', quantity: '', description: '' })

  function validate(f) {
    const err = {}
    if (!f.title?.trim()) err.title = 'Title is required'
    if (!f.description?.trim()) err.description = 'Description is required'
    if (!f.location?.trim()) err.location = 'Location is required'
    if (!f.image?.trim()) err.image = 'Image URL is required'
    if (!f.date) err.date = 'Date/time is required'
    else if (isNaN(new Date(f.date))) err.date = 'Invalid date/time'
    
    // Require at least one ticket type
    if (!f.ticketTypes || f.ticketTypes.length === 0) {
      err.ticketTypes = 'At least one ticket type is required'
    }
    
    return err
  }

  function save(e) {
    e.preventDefault()
    const trimmed = {
      ...form,
      title: form.title.trim(),
      location: form.location.trim(),
      locationDetails: (form.locationDetails || '').trim(),
      category: (form.category || '').trim(),
      description: form.description.trim(),
      image: form.image.trim(),
    }
    const err = validate(trimmed)
    setErrors(err)
    if (Object.keys(err).length) return
    onSave(trimmed)
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">Title*</label>
        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Summer Music Fest" className="w-full p-2 border rounded" />
        {errors.title && <div className="text-xs text-red-600">{errors.title}</div>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Date & Time*</label>
        <div className="flex gap-2 items-center">
          <input type="datetime-local" value={form.date} onChange={e => { setForm({ ...form, date: e.target.value }); setDateSaved(false) }} className="w-full p-2 border rounded" />
          <button type="button" onClick={() => {
            if (!form.date || isNaN(new Date(form.date))) {
              setErrors(prev => ({ ...prev, date: 'Invalid date/time' }))
              setDateSaved(false)
            } else {
              setErrors(prev => ({ ...prev, date: undefined }))
              setDateSaved(true)
            }
          }} className="px-3 py-2 border rounded text-sm">Save</button>
        </div>
        {errors.date && <div className="text-xs text-red-600">{errors.date}</div>}
        {dateSaved && !errors.date && <div className="text-xs text-green-600">Date saved</div>}
        <div className="text-xs text-gray-500">Use your local timezone; we store ISO for consistency.</div>
      </div>

      <div className="space-y-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">City / Venue*</label>
          <input list="citySuggestions" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="City or venue" className="w-full p-2 border rounded" />
          <datalist id="citySuggestions">
            {CITY_SUGGESTIONS.map(city => <option key={city} value={city} />)}
          </datalist>
          {errors.location && <div className="text-xs text-red-600">{errors.location}</div>}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Venue details</label>
          <textarea value={form.locationDetails} onChange={e => setForm({ ...form, locationDetails: e.target.value })} placeholder="Venue name, hall/floor, full address" className="w-full p-2 border rounded" rows={2} />
          <div className="text-xs text-gray-500">Include venue, street, landmark to avoid confusion.</div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Description*</label>
        <textarea
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="What is this event about? Add highlights, headliners, timings."
          className="w-full p-2 border rounded"
          rows={3}
        />
        {errors.description && <div className="text-xs text-red-600">{errors.description}</div>}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="sm:w-1/2 space-y-1">
          <label className="text-sm font-medium">Category</label>
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="p-2 border rounded w-full">
            <option value="">Select category</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="sm:w-1/2 space-y-1">
          <label className="text-sm font-medium">Or type category</label>
          <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Custom category" className="p-2 border rounded w-full" />
        </div>
      </div>

      {/* Ticket Types Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Ticket Types *</label>
          <button type="button" onClick={() => setAddingTicketType(true)} className="text-sm text-indigo-600 hover:text-indigo-700">+ Add Ticket Type</button>
        </div>
        <div className="text-xs text-gray-500">Add different ticket types (e.g., VIP, General, Student). At least one type is required.</div>
        {errors.ticketTypes && <div className="text-xs text-red-600">{errors.ticketTypes}</div>}
        
        {form.ticketTypes.length > 0 && (
          <div className="space-y-2">
            {form.ticketTypes.map((ticket, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <div className="flex-1">
                  <div className="font-medium text-sm">{ticket.name}</div>
                  <div className="text-xs text-gray-600">{formatINR(ticket.price)} • {ticket.quantity} tickets</div>
                </div>
                <button type="button" onClick={() => setForm({ ...form, ticketTypes: form.ticketTypes.filter((_, i) => i !== idx) })} className="text-red-600 hover:text-red-700 text-sm">Remove</button>
              </div>
            ))}
          </div>
        )}

        {addingTicketType && (
          <div className="bg-gray-50 p-3 rounded space-y-2">
            <div className="flex gap-2">
              <input placeholder="Name (e.g., VIP)" value={ticketForm.name} onChange={e => setTicketForm({ ...ticketForm, name: e.target.value })} className="flex-1 p-2 border rounded text-sm" />
              <input type="number" placeholder="Price" value={ticketForm.price} onChange={e => setTicketForm({ ...ticketForm, price: e.target.value })} className="w-24 p-2 border rounded text-sm" />
              <input type="number" placeholder="Qty" value={ticketForm.quantity} onChange={e => setTicketForm({ ...ticketForm, quantity: e.target.value })} className="w-20 p-2 border rounded text-sm" />
            </div>
            <input placeholder="Description (optional)" value={ticketForm.description} onChange={e => setTicketForm({ ...ticketForm, description: e.target.value })} className="w-full p-2 border rounded text-sm" />
            <div className="flex gap-2">
              <button type="button" onClick={() => {
                if (ticketForm.name && ticketForm.price && ticketForm.quantity) {
                  setForm({ ...form, ticketTypes: [...form.ticketTypes, { ...ticketForm, price: Number(ticketForm.price), quantity: Number(ticketForm.quantity), available: Number(ticketForm.quantity) }] })
                  setTicketForm({ name: '', price: '', quantity: '', description: '' })
                  setAddingTicketType(false)
                }
              }} className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">Add</button>
              <button type="button" onClick={() => { setAddingTicketType(false); setTicketForm({ name: '', price: '', quantity: '', description: '' }) }} className="px-3 py-1 border rounded text-sm">Cancel</button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Hero image URL*</label>
        <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://..." className="w-full p-2 border rounded" type="url" />
        {errors.image && <div className="text-xs text-red-600">{errors.image}</div>}
        <div className="text-xs text-gray-500">Use a landscape image for best card display.</div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-3 py-1 border rounded disabled:opacity-50" disabled={busy}>Cancel</button>
        <button className="px-3 py-1 bg-indigo-600 text-white rounded disabled:opacity-50" disabled={busy}>{busy ? 'Saving...' : 'Save event'}</button>
      </div>
    </form>
  )
}

// Export EventForm for reuse in other admin pages
export { EventForm }

export default function AdminEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit] = useState(20)
  const [search, setSearch] = useState('')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [editingMode, setEditingMode] = useState(false)
  const [savingDetail, setSavingDetail] = useState(false)

  // Prevent background scroll when any modal is open
  useEffect(() => {
    const shouldLock = Boolean(selectedEvent || creating || editingEvent)
    if (!shouldLock) return undefined

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previous
    }
  }, [selectedEvent, creating, editingEvent])

  useEffect(() => {
    fetchEvents()
  }, [page, search])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      setFormError('')
      const params = new URLSearchParams({
        page,
        limit,
        ...(search && { search }),
      })
      const res = await API.get(`/admin/events?${params}`)
      setEvents(res.data.events)
      setTotal(res.data.pagination.total)
    } catch (err) {
      console.error('Failed to load events', err)
      setFormError(err.response?.data?.message || 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(data) {
    try {
      setBusy(true)
      setFormError('')
      
      // Calculate total capacity and use first ticket type price as base price
      const totalCapacity = data.ticketTypes.reduce((sum, t) => sum + Number(t.quantity), 0)
      const basePrice = data.ticketTypes.length > 0 ? data.ticketTypes[0].price : 0
      
      const payload = {
        title: data.title,
        description: data.description,
        location: data.location,
        locationDetails: data.locationDetails || '',
        image: data.image,
        category: data.category,
        price: basePrice,
        date: new Date(data.date).toISOString(),
        totalTickets: totalCapacity,
        availableTickets: totalCapacity,
        status: 'active',
        ticketTypes: data.ticketTypes || []
      }
      const res = await API.post('/admin/events', payload)
      const newEvent = res.data?.event || res.data
      
      // Add the new event to the list in real-time
      setEvents((prev) => [newEvent, ...prev])
      setTotal((prev) => prev + 1)
      setCreating(false)
    } catch (err) {
      console.error('Create event failed', err)
      const errorMsg = err.response?.data?.message || err.message || 'Failed to create event'
      setFormError(errorMsg)
    } finally {
      setBusy(false)
    }
  }

  async function handleUpdate(id, data) {
    try {
      setBusy(true)
      setFormError('')
      
      // Calculate total capacity and use first ticket type price as base price
      const totalCapacity = data.ticketTypes.reduce((sum, t) => sum + Number(t.quantity), 0)
      const basePrice = data.ticketTypes.length > 0 ? data.ticketTypes[0].price : 0
      
      const payload = {
        title: data.title,
        description: data.description,
        location: data.location,
        locationDetails: data.locationDetails || '',
        image: data.image,
        category: data.category,
        price: basePrice,
        date: new Date(data.date).toISOString(),
        totalTickets: totalCapacity,
        status: 'active',
        ticketTypes: data.ticketTypes || []
      }
      const res = await API.put(`/admin/events/${id}`, payload)
      const updated = res.data?.event || res.data
      
      // Update the events list in real-time without full refetch
      setEvents((prev) => prev.map((e) => (e._id === updated._id ? { ...e, ...updated } : e)))
      setEditingEvent(null)
    } catch (err) {
      console.error('Update event failed', err)
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update event'
      setFormError(errorMsg)
    } finally {
      setBusy(false)
    }
  }

  const handleEventDetails = async (eventId) => {
    try {
      setFormError('')
      const res = await API.get(`/admin/events/${eventId}`)
      setSelectedEvent(res.data)
      setEditingMode(false)
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to load event details')
    }
  }

  const handleDeleteEvent = async (eventId, title) => {
    if (!confirm(`Permanently delete "${title}" and all its bookings? This cannot be undone.`)) {
      return
    }
    try {
      setFormError('')
      await API.delete(`/admin/events/${eventId}`)
      setEvents(events.filter((e) => e._id !== eventId))
      setSelectedEvent(null)
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to delete event')
    }
  }

  const handleUpdateEventDetails = async (formData) => {
    if (!selectedEvent?.event?._id) return
    setSavingDetail(true)
    try {
      // Calculate total capacity and use first ticket type price as base price
      const totalCapacity = formData.ticketTypes.reduce((sum, t) => sum + Number(t.quantity), 0)
      const basePrice = formData.ticketTypes.length > 0 ? formData.ticketTypes[0].price : 0
      
      const payload = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        locationDetails: formData.locationDetails || '',
        image: formData.image,
        category: formData.category,
        price: basePrice,
        date: new Date(formData.date).toISOString(),
        totalTickets: totalCapacity,
        ticketTypes: formData.ticketTypes || []
      }

      const res = await API.put(`/admin/events/${selectedEvent.event._id}`, payload)
      const updated = res.data?.event || res.data

      setEvents((prev) => prev.map((e) => (e._id === updated._id ? { ...e, ...updated } : e)))
      setSelectedEvent((prev) => (prev ? { ...prev, event: { ...prev.event, ...updated } } : prev))
      setFormError('')
      setEditingMode(false)
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update event')
    } finally {
      setSavingDetail(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this event? This cannot be undone.')) return
    try {
      setBusy(true)
      setFormError('')
      await API.delete(`/admin/events/${id}`)
      
      // Remove the event from the list in real-time
      setEvents((prev) => prev.filter((e) => e._id !== id))
      setTotal((prev) => prev - 1)
    } catch (err) {
      console.error('Delete event failed', err)
      setFormError('Failed to delete event')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminLayout title="Events">
      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {formError}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Event Management</h2>
        {!creating && !editingEvent && (
          <button onClick={() => setCreating(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium">
            + Create Event
          </button>
        )}
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 md:items-end">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search events by title or location..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            onClick={() => {
              setSearch('')
              setPage(1)
            }}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition border border-gray-200 whitespace-nowrap"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Total Events</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{total}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Page</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{page} of {Math.ceil(total / limit)}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <>
          {/* Events grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {events.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 py-12">
                {search ? 'No events found matching your search.' : 'No events created yet.'}
              </div>
            ) : (
              events.map((event) => (
                <div key={event._id || event.id} className="bg-white rounded-lg shadow-sm hover:shadow-lg transition overflow-hidden border border-gray-200">
                  {event.image && (
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">{event.title}</h3>
                        <p className="text-xs text-gray-500">{event.category || '—'}</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{formatINR(event.price || 0)}</span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>📅 {event.date ? new Date(event.date).toLocaleDateString() : '—'}</p>
                      <p className="line-clamp-2">📍 {event.location || '—'}</p>
                      <p>🎟️ {event.availableTickets}/{event.totalTickets || event.capacity || 0} tickets</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEventDetails(event._id || event.id)}
                        className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleDelete(event._id || event.id)}
                        className="px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm border border-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {total > limit && (
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
          )}
        </>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
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

              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {formError}
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
                        <p><strong>Available Tickets:</strong> {selectedEvent.event.availableTickets || 0}</p>
                      </div>
                    </div>

                    {selectedEvent.event.ticketTypes && selectedEvent.event.ticketTypes.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Ticket Types</h4>
                        <div className="space-y-2">
                          {selectedEvent.event.ticketTypes.map((ticket, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                              <div>
                                <p className="font-medium text-gray-900">{ticket.name}</p>
                                {ticket.description && <p className="text-xs text-gray-600">{ticket.description}</p>}
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-gray-900">{formatINR(ticket.price)}</p>
                                <p className="text-xs text-gray-600">{ticket.quantity} available</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-sm font-medium text-blue-900">
                            Total Capacity: {selectedEvent.event.ticketTypes.reduce((sum, t) => sum + Number(t.quantity), 0)} tickets
                          </p>
                          <p className="text-sm text-blue-800">
                            Price Range: {formatINR(Math.min(...selectedEvent.event.ticketTypes.map(t => t.price)))} - {formatINR(Math.max(...selectedEvent.event.ticketTypes.map(t => t.price)))}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedEvent.event.organizer && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Event Manager (Staff Admin)</h4>
                        <p className="text-sm">{selectedEvent.event.organizer.name}</p>
                        <p className="text-sm text-gray-600">{selectedEvent.event.organizer.email}</p>
                      </div>
                    )}

                    {selectedEvent.bookingStats && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Booking Statistics</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                            <p className="font-bold text-lg">{formatINR(selectedEvent.bookingStats.totalRevenue)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row gap-3">
                    <button
                      onClick={() => setSelectedEvent(null)}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => setEditingMode(true)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Edit Event
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(selectedEvent.event._id, selectedEvent.event.title)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Delete Event
                    </button>
                  </div>
                </>
              ) : (
                <EventForm
                  initial={{
                    title: selectedEvent.event.title,
                    description: selectedEvent.event.description || '',
                        location: selectedEvent.event.location || '',
                        locationDetails: selectedEvent.event.locationDetails || '',
                    image: selectedEvent.event.image || '',
                    category: selectedEvent.event.category || '',
                    date: selectedEvent.event.date || '',
                    ticketTypes: selectedEvent.event.ticketTypes || []
                  }}
                  onSave={handleUpdateEventDetails}
                  onCancel={() => setEditingMode(false)}
                  busy={savingDetail}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Event Modal */}
      <AnimatePresence>
        {(creating || editingEvent) && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/40" onClick={() => { setCreating(false); setEditingEvent(null) }} />
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 12 }}
              transition={{ type: 'tween', duration: 0.22 }}
              className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">{creating ? 'Create Event' : 'Edit Event'}</h3>
                <button onClick={() => { setCreating(false); setEditingEvent(null) }} className="p-2 rounded hover:bg-gray-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              {formError && <div className="mb-3 p-2 text-sm text-red-600 bg-red-50 rounded border border-red-200">{formError}</div>}
              <EventForm
                initial={editingEvent || undefined}
                onSave={creating ? handleCreate : (data) => handleUpdate(editingEvent._id || editingEvent.id, data)}
                onCancel={() => { setCreating(false); setEditingEvent(null) }}
                busy={busy}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  )
}
