import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import StaffAdminLayout from '../../components/layout/StaffAdminLayout'
import API from '../../services/api'

export default function StaffAdminEntries() {
  const [entries, setEntries] = useState([])
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()

  const todayKey = new Date().toDateString()
  const todayScans = entries.filter(e => new Date(e.scannedAt).toDateString() === todayKey).length

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    if (selectedEvent) {
      fetchEntries()
      // Auto-refresh every 1 second
      const interval = setInterval(() => {
        fetchEntries()
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [selectedEvent])

  const fetchEvents = async () => {
    try {
      // Use staff-admin dashboard to get only assigned events
      const res = await API.get('/staff-admin/dashboard')
      const eventList = res.data?.events || []
      setEvents(eventList)
      const queryEvent = searchParams.get('event')
      if (queryEvent && eventList.some(ev => ev._id === queryEvent)) {
        setSelectedEvent(queryEvent)
      } else if (eventList.length > 0) {
        setSelectedEvent(eventList[0]._id)
        setSearchParams({ event: eventList[0]._id })
      } else {
        setSelectedEvent('')
        setSearchParams({})
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load events')
    }
  }

  const fetchEntries = async () => {
    if (!selectedEvent) return
    try {
      const res = await API.get(`/staff-admin/events/${selectedEvent}/entries`)
      setEntries(res.data.entries || [])
      setLoading(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load entry logs')
      setLoading(false)
    }
  }

  const handleApprove = async (logId) => {
    try {
      await API.put(`/staff-admin/entries/${logId}/approve`)
      fetchEntries()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve entry')
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleString()
  }

  return (
    <StaffAdminLayout title="Entry Logs">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-bold">Entry Logs</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Event:</label>
            <select
              value={selectedEvent}
              onChange={(e) => {
                setSelectedEvent(e.target.value)
                if (e.target.value) setSearchParams({ event: e.target.value })
                else setSearchParams({})
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {events.map((event) => (
                <option key={event._id} value={event._id}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide opacity-80">Total Scanned</p>
                  <p className="text-3xl font-bold">{entries.length}</p>
                  <p className="text-xs opacity-80">All time entries</p>
                </div>
                <span className="text-2xl" role="img" aria-label="chart">📊</span>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-green-500 to-green-600 text-white shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide opacity-80">Today's Scans</p>
                  <p className="text-3xl font-bold">{todayScans}</p>
                  <p className="text-xs opacity-80">Entries today</p>
                </div>
                <span className="text-2xl" role="img" aria-label="check">✅</span>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : entries.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No entry logs found for this event</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Booking ID</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Ticket #</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Customer</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Scanned By</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Time</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Gate</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{entry.booking?.bookingId || entry.booking?._id?.slice(-8) || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                        #{entry.ticketIndex || 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{entry.booking?.user?.name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{entry.booking?.user?.email}</div>
                    </td>
                    <td className="px-4 py-3">{entry.scannedBy?.name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(entry.scannedAt)}</td>
                    <td className="px-4 py-3">{entry.gate || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        Scanned
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* No stats needed - all entries are scanned */}
      </div>
    </StaffAdminLayout>
  )
}
