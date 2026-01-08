import React, { useEffect, useState } from 'react'
import EventAdminLayout from '../components/EventAdminLayout'
import API from '../services/api'
import formatINR from '../utils/currency'
import { EventForm } from './AdminEvents'

export default function EventAdminEvents() {
  const [events, setEvents] = useState([])
  const [creating, setCreating] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await API.get('/events/my')
        const evs = (res.data || []).map(e => ({
          ...e,
          id: e.id || e._id,
          capacity: e.capacity ?? e.totalTickets ?? 0,
          availableTickets: e.availableTickets ?? e.capacity ?? e.totalTickets ?? 0,
        }))
        setEvents(evs)
      } catch (err) {
        setFormError(err.response?.data?.message || 'Failed to load events')
      }
    }
    fetch()
  }, [])

  async function handleCreate(data) {
    try {
      setBusy(true)
      setFormError('')
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
      const res = await API.post('/events', payload)
      setEvents(prev => [{
        ...res.data,
        id: res.data._id || res.data.id,
        capacity: res.data.capacity ?? res.data.totalTickets ?? data.capacity,
        availableTickets: res.data.availableTickets ?? res.data.totalTickets ?? data.capacity,
      }, ...prev])
      setCreating(false)
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to create event')
    } finally {
      setBusy(false)
    }
  }

  async function handleUpdate(id, data) {
    try {
      setBusy(true)
      setFormError('')
      const payload = {
        title: data.title,
        description: data.description,
        location: data.location,
        image: data.image,
        category: data.category,
        price: Number(data.price) || 0,
        date: new Date(data.date).toISOString(),
        totalTickets: Number(data.capacity),
      }
      const res = await API.put(`/events/${id}`, payload)
      const updated = {
        ...res.data,
        id: res.data._id || res.data.id,
        capacity: res.data.capacity ?? res.data.totalTickets ?? data.capacity,
        availableTickets: res.data.availableTickets ?? res.data.totalTickets ?? data.capacity,
      }
      setEvents(prev => prev.map(ev => ev.id === id ? updated : ev))
      setEditingEvent(null)
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to update event')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this event? This cannot be undone.')) return
    try {
      setBusy(true)
      setFormError('')
      await API.delete(`/events/${id}`)
      setEvents(prev => prev.filter(ev => ev.id !== id))
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to delete event')
    } finally {
      setBusy(false)
    }
  }

  return (
    <EventAdminLayout title="My Events">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">My Events</h2>
        {!creating && !editingEvent && (
          <button onClick={() => setCreating(true)} className="bg-indigo-600 text-white px-3 py-1 rounded">Add Event</button>
        )}
      </div>

      {formError && <div className="mb-3 p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded">{formError}</div>}
      {busy && <div className="mb-3 text-sm text-gray-500">Working…</div>}

      {(creating || editingEvent) && (
        <div className="bg-white border rounded p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">{creating ? 'Create Event' : 'Edit Event'}</h3>
            <button onClick={() => { setCreating(false); setEditingEvent(null) }} className="p-2 rounded hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <EventForm
            initial={editingEvent || undefined}
            onSave={creating ? handleCreate : (data) => handleUpdate(editingEvent.id, data)}
            onCancel={() => { setCreating(false); setEditingEvent(null) }}
            busy={busy}
          />
        </div>
      )}

      <div className="space-y-3 mt-4">
        {events.map(ev => (
          <div key={ev.id} className="bg-white border rounded p-3 flex justify-between items-start">
            <div>
              <div className="font-semibold">{ev.title}</div>
              <div className="text-sm text-gray-500">{ev.date} • {ev.location}</div>
              <div className="text-sm mt-2">Price: {formatINR(ev.price)} • Capacity: {ev.capacity}</div>
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
        {events.length === 0 && (
          <div className="text-sm text-gray-500 border rounded p-3">No events yet. Create your first event.</div>
        )}
      </div>
    </EventAdminLayout>
  )
}
