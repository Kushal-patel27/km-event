import React, {useEffect, useState} from 'react'
import formatINR from '../utils/currency'
import { getEvents, addEvent, updateEvent, deleteEvent } from '../utils/eventsStore'

function EventForm({initial = {}, onSave, onCancel}){
  const [form, setForm] = useState({ title: '', date: '', location: '', description: '', price: 0, capacity: 100, image: '', ...initial })
  function save(e){
    e.preventDefault()
    onSave(form)
  }
  return (
    <form onSubmit={save} className="space-y-2 bg-white p-3 rounded border">
      <input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} placeholder="Title" className="w-full p-2 border rounded" />
      <input value={form.date} onChange={e=>setForm({...form, date:e.target.value})} placeholder="Date" className="w-full p-2 border rounded" />
      <input value={form.location} onChange={e=>setForm({...form, location:e.target.value})} placeholder="Location" className="w-full p-2 border rounded" />
      <textarea value={form.description} onChange={e=>setForm({...form, description:e.target.value})} placeholder="Description" className="w-full p-2 border rounded" />
      <div className="flex gap-2">
        <input type="number" value={form.price} onChange={e=>setForm({...form, price:Number(e.target.value)})} placeholder="Price" className="p-2 border rounded w-1/2" />
        <input type="number" value={form.capacity} onChange={e=>setForm({...form, capacity:Number(e.target.value)})} placeholder="Capacity" className="p-2 border rounded w-1/2" />
      </div>
      <input value={form.image} onChange={e=>setForm({...form, image:e.target.value})} placeholder="Image path or URL" className="w-full p-2 border rounded" />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-1 border rounded">Cancel</button>
        <button className="px-3 py-1 bg-indigo-600 text-white rounded">Save</button>
      </div>
    </form>
  )
}

export default function AdminEvents(){
  const [events, setEvents] = useState([])
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)

  useEffect(()=>{
    setEvents(getEvents())
  }, [])

  function handleCreate(data){
    addEvent(data)
    setEvents(getEvents())
    setCreating(false)
  }

  function handleUpdate(id, data){
    updateEvent(id, data)
    setEvents(getEvents())
    setEditing(null)
  }

  function handleDelete(id){
    if(!confirm('Delete this event?')) return
    deleteEvent(id)
    setEvents(getEvents())
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Manage Events</h2>
        <div>
          <button onClick={()=>setCreating(true)} className="bg-indigo-600 text-white px-3 py-1 rounded">Add Event</button>
        </div>
      </div>

      {creating && <EventForm onSave={handleCreate} onCancel={()=>setCreating(false)} />}

      <div className="space-y-3 mt-4">
        {events.map(ev => (
          <div key={ev.id} className="bg-white border rounded p-3 flex justify-between items-start">
            <div>
              <div className="font-semibold">{ev.title}</div>
              <div className="text-sm text-gray-500">{ev.date} • {ev.location}</div>
              <div className="text-sm mt-2">Price: {formatINR(ev.price)} • Capacity: {ev.capacity}</div>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={()=>setEditing(ev)} className="px-3 py-1 border rounded">Edit</button>
              <button onClick={()=>handleDelete(ev.id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
            </div>
            {editing && editing.id === ev.id && (
              <div className="w-full mt-3">
                <EventForm initial={editing} onSave={(data)=>handleUpdate(ev.id, data)} onCancel={()=>setEditing(null)} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
