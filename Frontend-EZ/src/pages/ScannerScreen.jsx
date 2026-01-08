import React, { useEffect, useState } from 'react'
import API from '../services/api'

export default function ScannerScreen() {
  const [assignedInfo, setAssignedInfo] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState('')
  const [scanInput, setScanInput] = useState('')
  const [scanResult, setScanResult] = useState(null)
  const [gate, setGate] = useState('')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAssignedInfo()
  }, [])

  useEffect(() => {
    if (selectedEvent) {
      fetchGateStats()
    }
  }, [selectedEvent])

  const fetchAssignedInfo = async () => {
    try {
      const res = await API.get('/scanner/info')
      setAssignedInfo(res.data.staff)
      if (res.data.staff.assignedEvents?.length > 0) {
        setSelectedEvent(res.data.staff.assignedEvents[0]._id)
      }
      setLoading(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load info')
      setLoading(false)
    }
  }

  const fetchGateStats = async () => {
    try {
      const res = await API.get(`/scanner/events/${selectedEvent}/stats`)
      setStats(res.data.stats)
    } catch (err) {
      console.error('Failed to fetch stats')
    }
  }

  const handleScan = async (e) => {
    e.preventDefault()
    if (!scanInput.trim()) return

    try {
      setScanResult(null)
      const res = await API.post('/scanner/scan', {
        bookingId: scanInput,
        gate: gate || 'Main Gate',
      })
      setScanResult({ success: true, data: res.data.booking })
      setScanInput('')
      // Refresh stats
      fetchGateStats()
    } catch (err) {
      setScanResult({
        success: false,
        error: err.response?.data?.message || 'Scan failed',
      })
      setScanInput('')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4">Loading scanner...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">🎫 Scanner</h1>
          <p className="text-gray-600 mt-1">Welcome, {assignedInfo?.name}</p>
        </div>

        {/* Event & Gate Selection */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event</label>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                {assignedInfo?.assignedEvents?.map((event) => (
                  <option key={event._id} value={event._id}>
                    {event.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gate/Zone</label>
              <select
                value={gate}
                onChange={(e) => setGate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="">Select gate</option>
                {assignedInfo?.assignedGates?.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Scan Input */}
        <form onSubmit={handleScan} className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Booking ID</label>
          <input
            type="text"
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            placeholder="Enter booking ID or scan QR code"
            autoFocus
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200"
          />
          <button
            type="submit"
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            🔍 Scan Ticket
          </button>
        </form>

        {/* Scan Result */}
        {scanResult && (
          <div
            className={`rounded-lg shadow-lg p-6 mb-6 ${
              scanResult.success
                ? 'bg-green-50 border-2 border-green-500'
                : 'bg-red-50 border-2 border-red-500'
            }`}
          >
            {scanResult.success ? (
              <div>
                <h3 className="text-lg font-bold text-green-700">✅ Success</h3>
                <p className="text-green-600 mt-2">Booking ID: {scanResult.data.bookingId}</p>
                <p className="text-green-600">User: {scanResult.data.userName}</p>
                <p className="text-green-600">Ticket Type: {scanResult.data.ticketType?.name}</p>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-bold text-red-700">❌ Failed</h3>
                <p className="text-red-600 mt-2">{scanResult.error}</p>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{stats.totalScanned}</p>
                <p className="text-sm text-gray-600">Total Scanned</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{stats.valid}</p>
                <p className="text-sm text-gray-600">Valid</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{stats.used}</p>
                <p className="text-sm text-gray-600">Used</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{stats.invalid}</p>
                <p className="text-sm text-gray-600">Invalid</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
