import React, { useEffect, useState, useRef } from 'react'
import QrScanner from 'qr-scanner'
import StaffLayout from '../components/StaffLayout'
import API from '../services/api'

export default function StaffScanner() {
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState('')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [offline, setOffline] = useState(false)
  const [pendingScans, setPendingScans] = useState([])
  const [scanMode, setScanMode] = useState('manual')
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraPaused, setCameraPaused] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [scanHistory, setScanHistory] = useState([])

  const qrInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const qrScannerRef = useRef(null)

  // Load events and init
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await API.get('/staff/events')
        const assignedEvents = res.data || []
        setEvents(assignedEvents)
        // Auto-select first event if available
        if (assignedEvents.length > 0) {
          setSelectedEvent(assignedEvents[0]._id)
        }
      } catch (err) {
        console.error('Failed to load events', err)
      }
    }
    loadEvents()

    // Check offline status
    const handleOnline = () => setOffline(false)
    const handleOffline = () => setOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setOffline(!navigator.onLine)

    // Load pending scans from localStorage
    const saved = localStorage.getItem('pendingScans')
    if (saved) setPendingScans(JSON.parse(saved))

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Update stats when event changes
  useEffect(() => {
    if (selectedEvent) {
      const fetchStats = async () => {
        try {
          const res = await API.get(`/staff/stats/${selectedEvent}`)
          setStats(res.data)
        } catch (err) {
          console.error('Failed to load stats', err)
        }
      }
      fetchStats()
    }
  }, [selectedEvent])

  // Initialize camera for QR scanning
  const startCamera = async () => {
    try {
      if (qrScannerRef.current) {
        await qrScannerRef.current.start()
        setCameraActive(true)
        return
      }

      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => {
          // Auto-process scan when QR detected
          processScan(result.data)
          // Stop briefly to prevent duplicate rapid scans, then auto-resume
          setCameraPaused(true)
          qrScanner.stop()
          const resumeTimeout = setTimeout(async () => {
            if (qrScannerRef.current) {
              try {
                await qrScanner.start()
                setCameraPaused(false)
              } catch (err) {
                console.error('Failed to resume camera:', err)
              }
            }
          }, 2000)
          // Cleanup if component unmounts
          return () => clearTimeout(resumeTimeout)
        },
        {
          onDecodeError: (err) => {
            // Silently ignore decode errors (scanning...)
          },
          preferredCamera: 'environment',
          maxScansPerSecond: 5,
        }
      )

      qrScannerRef.current = qrScanner
      await qrScanner.start()
      setCameraActive(true)
    } catch (err) {
      console.error('Camera access denied:', err)
      alert('Camera access required. Please enable camera permissions in your browser settings.')
    }
  }

  // Stop camera
  const stopCamera = async () => {
    if (qrScannerRef.current) {
      await qrScannerRef.current.stop()
      qrScannerRef.current = null
    }
    setCameraActive(false)
  }

  // Cleanup on unmount
  useEffect(() => {
    return async () => {
      if (qrScannerRef.current) {
        await qrScannerRef.current.destroy()
      }
    }
  }, [])

  // Handle manual QR input
  const handleManualQRInput = async (e) => {
    e.preventDefault()
    if (!qrInputRef.current?.value.trim() || !selectedEvent) {
      alert('Please select an event and enter a QR code')
      return
    }

    await processScan(qrInputRef.current.value.trim())
    qrInputRef.current.value = ''
  }

  // Process scan (manual or camera)
  const processScan = async (qrData) => {
    // Prevent empty scans
    if (!qrData?.trim() || !selectedEvent) {
      return
    }

    setLoading(true)
    setScanResult(null)

    try {
      const res = await API.post('/staff/scan', {
        eventId: selectedEvent,
        qrData: qrData.trim()
      })

      // Extract attendee info from booking.user and ticket details
      const attendeeInfo = {
        name: res.data.booking?.user?.name || 'Unknown',
        email: res.data.booking?.user?.email || '',
        ticketNumber: res.data.booking?.ticketId || `#${res.data.booking?._id?.slice(-8) || 'N/A'}`,
        quantity: res.data.booking?.quantity || 0,
        ticketIndex: res.data.booking?.ticketIndex || 1
      }

      const result = {
        success: true,
        status: res.data.duplicate ? 'duplicate' : 'valid',
        attendee: attendeeInfo,
        message: res.data.message,
        timestamp: new Date()
      }

      setScanResult(result)
      // Only add successful scans to history
      if (result.success && result.status === 'valid') {
        setScanHistory(prev => [result, ...prev].slice(0, 15))
      }

      // Clear pending scan if sync succeeded
      setPendingScans(prev => prev.filter(s => s.qrData !== qrData.trim()))
      localStorage.setItem('pendingScans', JSON.stringify(pendingScans))

      // Refresh stats
      const statsRes = await API.get(`/staff/stats/${selectedEvent}`)
      setStats(statsRes.data)

      // Clear manual input
      if (qrInputRef.current) {
        qrInputRef.current.value = ''
      }
    } catch (err) {
      // Check if it's a duplicate scan error
      const isDuplicate = err.response?.status === 400 && err.response?.data?.duplicate;
      
      const result = {
        success: isDuplicate ? true : false,
        status: isDuplicate ? 'duplicate' : 'invalid',
        message: err.response?.data?.message || 'Scan failed - ticket not found',
        attendee: isDuplicate ? {
          name: err.response?.data?.booking?.user?.name || 'Unknown',
          email: err.response?.data?.booking?.user?.email || '',
          ticketNumber: err.response?.data?.booking?.ticketId || '',
          quantity: err.response?.data?.booking?.quantity || 0
        } : null,
        timestamp: new Date()
      }

      setScanResult(result)
      // Don't add duplicate or failed scans to history
      // Only add successful scans (result.success && result.status === 'valid')

      // Add to pending if offline
      if (offline || err.message.includes('Network')) {
        const pending = {
          qrData: qrData.trim(),
          eventId: selectedEvent,
          timestamp: new Date().toISOString()
        }
        setPendingScans(prev => [...prev, pending])
        localStorage.setItem('pendingScans', JSON.stringify([...pendingScans, pending]))
      }
    } finally {
      setLoading(false)
    }
  }

  // Retry pending scan
  const retryPendingScan = async (pending) => {
    await processScan(pending.qrData)
  }

  // Export scan history
  const exportHistory = () => {
    const csv = [
      ['Time', 'Name', 'Email', 'Ticket ID', 'Ticket', 'Total Tickets'],
      ...scanHistory.map(s => [
        s.timestamp.toLocaleString(),
        s.attendee?.name || '',
        s.attendee?.email || '',
        s.attendee?.ticketNumber || '',
        s.attendee?.ticketIndex || '',
        s.attendee?.quantity || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `check-in-${selectedEvent}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const selectedEventObj = events.find(e => e._id === selectedEvent)
  const pageTitle = selectedEventObj 
    ? `QR Check-In • ${selectedEventObj.name || selectedEventObj.title || 'Event'}`
    : 'QR Check-In'

  return (
    <StaffLayout title={pageTitle}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

        {offline && (
          <div className="bg-yellow-50 dark:bg-yellow-900 border-b border-yellow-200 dark:border-yellow-700 p-3 flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200 mb-4 rounded-lg">
            📡 <span>Offline mode - scans will sync when connection returns</span>
            {pendingScans.length > 0 && <span className="font-semibold ml-auto">{pendingScans.length} pending</span>}
          </div>
        )}

        {selectedEvent ? (
          <div className="space-y-6">
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-200 dark:border-blue-700/50 shadow-sm hover:shadow-md transition">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalBookings || 0}</div>
                  <div className="text-sm text-blue-600 dark:text-blue-300 mt-2 font-medium">Total Bookings</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-xl border border-purple-200 dark:border-purple-700/50 shadow-sm hover:shadow-md transition">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.totalTickets || 0}</div>
                  <div className="text-sm text-purple-600 dark:text-purple-300 mt-2 font-medium">Total Tickets</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-xl border border-green-200 dark:border-green-700/50 shadow-sm hover:shadow-md transition">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.scannedCount || 0}</div>
                  <div className="text-sm text-green-600 dark:text-green-300 mt-2 font-medium">Scanned Tickets</div>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-xl border border-indigo-200 dark:border-indigo-700/50 shadow-sm hover:shadow-md transition">
                  <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats.scanRate || 0}%</div>
                  <div className="text-sm text-indigo-600 dark:text-indigo-300 mt-2 font-medium">Scan Rate</div>
                </div>
              </div>
            )}

            {/* Scan Mode Toggle */}
            <div className="flex gap-3">
              <button
                onClick={() => { setScanMode('manual'); stopCamera() }}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                  scanMode === 'manual'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                📝 Manual Input
              </button>
              <button
                onClick={() => { setScanMode('camera'); startCamera() }}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                  scanMode === 'camera'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                📷 Camera
              </button>
            </div>

            {/* Manual QR Input */}
            {scanMode === 'manual' && (
              <form onSubmit={handleManualQRInput} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Enter Ticket ID
                  </label>
                  <input
                    ref={qrInputRef}
                    type="text"
                    placeholder='e.g., A1B2C3D4'
                    autoFocus
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg tracking-widest"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                    📋 Enter the unique ticket ID printed on the ticket
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-lg shadow-md hover:shadow-lg"
                >
                  {loading ? '⏳ Verifying...' : '✓ Verify Ticket'}
                </button>
              </form>
            )}

            {/* Camera Mode */}
            {scanMode === 'camera' && (
              <div className="space-y-3">
                <div className="bg-gray-900 rounded-lg overflow-hidden aspect-square relative">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Camera Status Overlay */}
                  <div className="absolute top-2 right-2">
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                      cameraPaused
                        ? 'bg-yellow-500 text-white' 
                        : cameraActive 
                          ? 'bg-green-500 text-white' 
                          : 'bg-red-500 text-white'
                    }`}>
                      <span className="inline-block w-2 h-2 rounded-full bg-current animate-pulse"></span>
                      {cameraPaused ? 'Processing...' : cameraActive ? 'Scanning...' : 'Ready'}
                    </div>
                  </div>

                  {/* Scan Guide */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-yellow-400 rounded-lg opacity-50"></div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={cameraActive ? stopCamera : startCamera}
                    className={`flex-1 font-medium py-2 px-4 rounded-lg transition-colors ${
                      cameraActive
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {cameraActive ? '⏹️ Stop Camera' : '▶️ Start Camera'}
                  </button>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                  {cameraActive 
                    ? 'Point camera at QR code - will auto-scan' 
                    : 'Click "Start Camera" to begin scanning tickets'}
                </p>
              </div>
            )}

            {/* Last Scan Result - Ticket Verification */}
            {scanResult && (
              <div className={`p-6 rounded-lg border-2 ${
                scanResult.success
                  ? scanResult.status === 'duplicate'
                    ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900'
                    : 'border-green-400 bg-green-50 dark:bg-green-900'
                  : 'border-red-400 bg-red-50 dark:bg-red-900'
              }`}>
                <div className="flex items-start gap-4">
                  {/* Large Status Icon */}
                  <div className="text-5xl flex-shrink-0">
                    {scanResult.success
                      ? scanResult.status === 'duplicate'
                        ? '⚠️'
                        : '✅'
                      : '❌'}
                  </div>
                  
                  <div className="flex-1">
                    {/* Message */}
                    <p className="font-bold text-xl text-gray-900 dark:text-white mb-4">{scanResult.message}</p>

                    {/* Attendee Info Card */}
                    {scanResult.attendee && (
                      <div className={`p-4 rounded-lg mb-4 ${
                        scanResult.success
                          ? 'bg-white dark:bg-gray-700'
                          : 'bg-gray-100 dark:bg-gray-600'
                      }`}>
                        {/* Name - Large and Prominent */}
                        <div className="mb-3">
                          <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase mb-1">Attendee</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{scanResult.attendee.name}</p>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-2">
                          {scanResult.attendee.email && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600 dark:text-gray-400">📧</span>
                              <span className="text-sm text-gray-700 dark:text-gray-300">{scanResult.attendee.email}</span>
                            </div>
                          )}
                          
                          {scanResult.attendee.ticketNumber && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600 dark:text-gray-400">🎫</span>
                              <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{scanResult.attendee.ticketNumber}</span>
                            </div>
                          )}

                          {scanResult.attendee.quantity && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600 dark:text-gray-400">🛟</span>
                              <span className="text-sm text-gray-700 dark:text-gray-300">{scanResult.attendee.quantity} ticket(s)</span>
                            </div>
                          )}

                          {scanResult.attendee.phone && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600 dark:text-gray-400">📱</span>
                              <span className="text-sm text-gray-700 dark:text-gray-300">{scanResult.attendee.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Timestamp */}
                    <p className="text-xs text-gray-600 dark:text-gray-500">
                      {scanResult.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Approval Status */}
                {scanResult.success && scanResult.status === 'valid' && (
                  <div className="mt-4 bg-green-100 dark:bg-green-800 border-2 border-green-400 dark:border-green-600 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-800 dark:text-green-100">✅ ENTRY APPROVED</p>
                    <p className="text-sm text-green-700 dark:text-green-200 mt-2">Attendee verified and cleared for entry</p>
                  </div>
                )}

                {/* Duplicate Warning */}
                {scanResult.success && scanResult.status === 'duplicate' && (
                  <div className="mt-4 bg-yellow-100 dark:bg-yellow-800 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-4 text-center">
                    <p className="text-lg font-bold text-yellow-800 dark:text-yellow-100">⚠️ ALREADY CHECKED IN</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-200 mt-2">This attendee has already been scanned</p>
                  </div>
                )}
              </div>
            )}

            {/* Pending Scans Queue */}
            {pendingScans.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900 border border-amber-200 dark:border-amber-700 p-4 rounded-lg">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-3">Pending Scans ({pendingScans.length})</h3>
                <div className="space-y-2">
                  {pendingScans.map((scan, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white dark:bg-gray-700 p-3 rounded">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        <p className="font-mono text-xs text-gray-500 dark:text-gray-400">{scan.qrData.slice(0, 20)}...</p>
                        <p className="text-xs text-gray-500">{new Date(scan.timestamp).toLocaleTimeString()}</p>
                      </div>
                      <button
                        onClick={() => retryPendingScan(scan)}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scan History */}
            {scanHistory.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">✅ Check-In History ({scanHistory.length})</h3>
                  <button
                    onClick={exportHistory}
                    className="text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 px-3 py-1 rounded transition-colors"
                  >
                    📥 Export CSV
                  </button>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {scanHistory.map((scan, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-green-50 dark:bg-green-900 border-l-4 border-green-400"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-lg flex-shrink-0">✅</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {scan.attendee?.name || 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                🎫 {scan.attendee?.ticketNumber || 'N/A'}
                              </p>
                              {scan.attendee?.ticketIndex && scan.attendee?.quantity && (
                                <p className="text-xs text-gray-600 dark:text-gray-300">
                                  🎟️ Ticket {scan.attendee.ticketIndex} of {scan.attendee.quantity}
                                </p>
                              )}
                              {scan.attendee?.email && (
                                <p className="text-xs text-gray-600 dark:text-gray-300">📧 {scan.attendee.email}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
                          {scan.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">
            <p className="text-lg">No events assigned</p>
            <p className="text-sm mt-2">Contact your administrator to assign events to your account</p>
          </div>
        )}
      </div>
    </StaffLayout>
  )

}
