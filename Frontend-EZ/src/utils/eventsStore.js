import initialEvents from '../data/events'

const KEY = 'events'

export function getEvents(){
  const stored = JSON.parse(localStorage.getItem(KEY) || 'null')
  if(stored && Array.isArray(stored)) return stored
  localStorage.setItem(KEY, JSON.stringify(initialEvents))
  return initialEvents
}

export function saveEvents(events){
  localStorage.setItem(KEY, JSON.stringify(events))
}

export function getEventById(id){
  const ev = getEvents().find(e => String(e.id) === String(id))
  return ev || null
}

export function addEvent(event){
  const events = getEvents()
  const newEvent = { ...event, id: String(Date.now()) }
  events.push(newEvent)
  saveEvents(events)
  return newEvent
}

export function updateEvent(id, patch){
  const events = getEvents()
  const idx = events.findIndex(e => String(e.id) === String(id))
  if(idx === -1) return null
  events[idx] = { ...events[idx], ...patch }
  saveEvents(events)
  return events[idx]
}

export function deleteEvent(id){
  const events = getEvents().filter(e => String(e.id) !== String(id))
  saveEvents(events)
  return events
}
