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
    price: 0,
    capacity: 100,
    image: '',
    ...initial,
    date: toInputDateTime(initial.date) || '',
  })
  const [errors, setErrors] = useState({})
  const [dateSaved, setDateSaved] = useState(false)

  function validate(f) {
    const err = {}
    if (!f.title?.trim()) err.title = 'Title is required'
    if (!f.description?.trim()) err.description = 'Description is required'
    if (!f.location?.trim()) err.location = 'Location is required'
    if (!f.image?.trim()) err.image = 'Image URL is required'
    if (!f.date) err.date = 'Date/time is required'
    else if (isNaN(new Date(f.date))) err.date = 'Invalid date/time'
    if (!(Number(f.price) > 0)) err.price = 'Price must be greater than 0'
    if (!(Number(f.capacity) > 0)) err.capacity = 'Capacity must be greater than 0'
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
    const combinedLocation = [trimmed.location, trimmed.locationDetails].filter(Boolean).join(' — ')
    const err = validate({ ...trimmed, location: combinedLocation })
    setErrors(err)
    if (Object.keys(err).length) return
    onSave({ ...trimmed, location: combinedLocation })
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

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="sm:w-1/2 space-y-1">
          <label className="text-sm font-medium">Ticket price (INR)*</label>
          <input type="number" min="1" step="1" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} placeholder="e.g. 499" className="p-2 border rounded w-full" />
          {errors.price && <div className="text-xs text-red-600">{errors.price}</div>}
        </div>
        <div className="sm:w-1/2 space-y-1">
          <label className="text-sm font-medium">Capacity*</label>
          <input type="number" min="1" step="1" value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} placeholder="Total tickets" className="p-2 border rounded w-full" />
          {errors.capacity && <div className="text-xs text-red-600">{errors.capacity}</div>}
        </div>
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

export default function AdminEvents() {
  const [events, setEvents] = useState([])
  const [creating, setCreating] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await API.get('/events')
        const evs = (res.data || []).map(e => ({
          ...e,
          id: e.id || e._id,
          capacity: e.capacity ?? e.totalTickets ?? 0,
          availableTickets: e.availableTickets ?? e.capacity ?? e.totalTickets ?? 0,
        }))
        setEvents(evs)
      } catch (err) {
        console.error('Failed to load events', err)
      }
    }
    fetch()
  }, [])

  async function handleCreate(data) {
    try {
      setBusy(true)
      setFormError('')
      const token = user?.token || localStorage.getItem('token')
      if (!token) {
        setFormError('No authentication token found. Please log in again.')
        setBusy(false)
        return
      }
      const config = { headers: { Authorization: `Bearer ${token}` } }
      const payload = {
        title: data.title,
        description: data.description,
        location: data.location,
        image: data.image,
        category: data.category,
        price: Number(data.price) || 0,
        date: new Date(data.date).toISOString(),
        totalTickets: Number(data.capacity),
        availableTickets: Number(data.capacity),
      }
      const res = await API.post('/events', payload, config)
      setEvents(prev => [{
        ...res.data,
        id: res.data._id || res.data.id,
        capacity: res.data.capacity ?? res.data.totalTickets ?? data.capacity,
        availableTickets: res.data.availableTickets ?? res.data.totalTickets ?? data.capacity,
      }, ...prev])
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
      const token = user?.token || localStorage.getItem('token')
      if (!token) {
        setFormError('No authentication token found. Please log in again.')
        setBusy(false)
        return
      }
      const config = { headers: { Authorization: `Bearer ${token}` } }
      const payload = {
        title: data.title,
        description: data.description,
        location: data.location,
        image: data.image,
        category: data.category,
        price: Number(data.price) || 0,
        date: new Date(data.date).toISOString(),
        totalTickets: Number(data.capacity), // keep server-side logic to adjust availableTickets
      }
      const res = await API.put(`/events/${id}`, payload, config)
      const updated = {
        ...res.data,
        id: res.data._id || res.data.id,
        capacity: res.data.capacity ?? res.data.totalTickets ?? data.capacity,
        availableTickets: res.data.availableTickets ?? res.data.totalTickets ?? data.capacity,
      }
      setEvents(prev => prev.map(ev => ev.id === id ? updated : ev))
      setEditingEvent(null)
    } catch (err) {
      console.error('Update event failed', err)
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update event'
      setFormError(errorMsg)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this event? This cannot be undone.')) return
    try {
      setBusy(true)
      setFormError('')
      const token = user?.token || localStorage.getItem('token')
      const config = { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
      await API.delete(`/events/${id}`, config)
      setEvents(prev => prev.filter(ev => ev.id !== id))
    } catch (err) {
      console.error('Delete event failed', err)
      setFormError('Failed to delete event')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminLayout title="Events">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Manage Events</h2>
        <div className="flex gap-2">
          {!creating && !editingEvent && (
            <button onClick={() => setCreating(true)} className="bg-indigo-600 text-white px-3 py-1 rounded">Add Event</button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {(creating || editingEvent) && (
          <motion.div className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/40" onClick={() => { setCreating(false); setEditingEvent(null) }} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-white dark:bg-gray-900 shadow-xl p-4 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-semibold">{creating ? 'Create Event' : 'Edit Event'}</h3>
                <button onClick={() => { setCreating(false); setEditingEvent(null) }} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              {formError && <div className="mb-3 p-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-800">{formError}</div>}
              {busy && <div className="mb-3 text-sm text-gray-500">Saving…</div>}
              <EventForm
                initial={editingEvent || undefined}
                onSave={creating ? handleCreate : (data) => handleUpdate(editingEvent.id, data)}
                onCancel={() => { setCreating(false); setEditingEvent(null) }}
                busy={busy}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3 mt-4">
        {events.map(ev => (
          <div key={ev.id} className="bg-white border rounded p-3 flex justify-between items-start">
            <div>
              <div className="font-semibold">{ev.title}</div>
              <div className="text-sm text-gray-500">{ev.date} • {ev.location}</div>
              <div className="text-sm mt-2">Category: {ev.category || '-'} • Price: {formatINR(ev.price)} • Capacity: {ev.capacity}</div>
            </div>
            <div className="flex flex-col gap-2">
              <a href={`/event/${ev.id}`} className="text-indigo-600">View</a>
              <button
                onClick={() => { setEditingEvent(ev); setCreating(false) }}
                className="text-sm px-3 py-1 border rounded"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(ev.id)}
                className="text-sm px-3 py-1 border rounded text-red-600 border-red-300 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  )
}
