import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import API from '../../services/api';
import StaffLayout from '../../components/layout/StaffLayout';

/**
 * High-Performance QR Scanner
 * Supports 60 scans/minute with offline mode and real-time feedback
 */
export default function HighPerformanceScannerScreen() {
  // Device & Scanner State
  const [deviceId] = useState(() => `SCANNER-${Math.random().toString(36).substr(2, 9)}`);
  const [deviceName, setDeviceName] = useState(localStorage.getItem('deviceName') || '');
  const [isConfigured, setIsConfigured] = useState(false);
  
  // Event & Gate State
  const [assignedInfo, setAssignedInfo] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedGate, setSelectedGate] = useState('');
  const [gates] = useState(['GATE-A', 'GATE-B', 'GATE-C', 'GATE-D', 'VIP-GATE']);
  
  // Scanning State
  const [scanMode, setScanMode] = useState('qr'); // 'qr' or 'manual'
  const [manualInput, setManualInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraFlipped, setIsCameraFlipped] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  
  // Performance Metrics
  const [metrics, setMetrics] = useState({
    totalScans: 0,
    successfulScans: 0,
    duplicates: 0,
    avgResponseTime: 0
  });
  
  // Offline Mode
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Analytics
  const [liveStats, setLiveStats] = useState(null);
  
  // Refs
  const scannerRef = useRef(null);
  const qrScannerInstance = useRef(null);
  
  // Setup device configuration
  useEffect(() => {
    const savedConfig = localStorage.getItem('scannerConfig');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setDeviceName(config.deviceName);
      setSelectedGate(config.defaultGate);
      setIsConfigured(true);
    }
    
    // Load offline queue from localStorage
    const savedQueue = localStorage.getItem('offlineQueue');
    if (savedQueue) {
      setOfflineQueue(JSON.parse(savedQueue));
    }
    
    // Load scan history
    const savedHistory = localStorage.getItem('scanHistory');
    if (savedHistory) {
      setScanHistory(JSON.parse(savedHistory));
    }
    
    fetchAssignedInfo();
  }, []);
  
  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineScans();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineQueue]);
  
  // Initialize QR scanner
  useEffect(() => {
    if (scanMode === 'qr' && isScanning && scannerRef.current) {
      try {
        setCameraError(null);
        
        // Clear previous scanner instance if it exists
        if (qrScannerInstance.current) {
          try {
            qrScannerInstance.current.clear();
          } catch (e) {
            console.debug('[QR_SCANNER] Previous scanner clear:', e);
          }
        }
        
        qrScannerInstance.current = new Html5QrcodeScanner(
          'qr-reader',
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            disableFlip: false
          },
          false
        );
        
        // Define callbacks with proper closure
        const onScanSuccess = (decodedText) => {
          console.log('[QR_SCANNER] QR code detected:', decodedText.substring(0, 50) + '...');
          handleQRScan(decodedText);
        };
        
        const onScanError = (error) => {
          // Ignore scan errors (continuous scanning)
          // console.debug('[QR_SCANNER] Scan error:', error);
        };
        
        qrScannerInstance.current.render(onScanSuccess, onScanError);
        console.log('[QR_SCANNER] Scanner initialized and rendering');
      } catch (err) {
        const errorMsg = err.message || 'Camera initialization failed';
        console.error('[QR_SCANNER] Initialization error:', err);
        
        // Check for common camera errors
        if (errorMsg.includes('permission') || errorMsg.includes('Permission denied')) {
          setCameraError('Camera permission denied. Please allow camera access in browser settings.');
        } else if (errorMsg.includes('camera') || errorMsg.includes('Camera not found')) {
          setCameraError('No camera found. Please check your device has a camera.');
        } else if (errorMsg.includes('not supported')) {
          setCameraError('QR scanning not supported in your browser. Try Chrome, Firefox, or Safari.');
        } else {
          setCameraError(`Camera error: ${errorMsg}`);
        }
        
        setIsScanning(false);
      }
    }
    
    return () => {
      if (qrScannerInstance.current && !isScanning) {
        try {
          qrScannerInstance.current.clear();
        } catch (err) {
          console.debug('[QR_SCANNER] Clear error:', err);
        }
      }
    };
  }, [scanMode, isScanning]);
  
  // Fetch analytics every 10 seconds
  useEffect(() => {
    if (selectedEvent && isConfigured) {
      fetchLiveStats();
      const interval = setInterval(fetchLiveStats, 10000);
      return () => clearInterval(interval);
    }
  }, [selectedEvent, isConfigured]);
  
  const fetchAssignedInfo = async () => {
    try {
      const res = await API.get('/scanner/info');
      setAssignedInfo(res.data.staff);
      if (res.data.staff.assignedEvents?.length > 0) {
        const eventId = res.data.staff.assignedEvents[0]._id;
        setSelectedEvent(eventId);
        console.log('[SCANNER] Selected event:', eventId);
      } else {
        console.warn('[SCANNER] No assigned events found');
      }
    } catch (err) {
      console.error('Failed to fetch assigned info:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
    }
  };
  
  const fetchLiveStats = async () => {
    if (!selectedEvent) return;
    
    try {
      const res = await API.get(`/hp-scanner/analytics/${selectedEvent}`);
      if (res.data && res.data.data) {
        setLiveStats(res.data.data);
      } else {
        console.warn('Analytics response missing data:', res.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        selectedEvent
      });
    }
  };
  
  const handleQRScan = async (qrPayload) => {
    const startTime = Date.now();
    
    console.log('[HANDLE_QR_SCAN] Started with payload:', {
      payload: qrPayload.substring(0, 50) + '...',
      payloadLength: qrPayload.length,
      isOnline,
      selectedGate,
      deviceId,
      deviceName
    });
    
    try {
      setIsScanning(false); // Pause scanning
      
      const scanData = {
        qrPayload,
        gateId: selectedGate,
        gateName: selectedGate,
        deviceId,
        deviceName,
        deviceType: 'mobile',
        localTimestamp: new Date().toISOString()
      };
      
      if (!isOnline) {
        // Offline mode - queue scan
        const newQueue = [...offlineQueue, scanData];
        setOfflineQueue(newQueue);
        localStorage.setItem('offlineQueue', JSON.stringify(newQueue));
        
        console.log('[HANDLE_QR_SCAN] Queued in offline mode. Queue size:', newQueue.length);
        
        setScanResult({
          success: true,
          offline: true,
          message: 'Scan queued for sync (offline mode)',
          validationTime: Date.now() - startTime
        });
        
        addToHistory({
          ...scanData,
          status: 'queued',
          timestamp: new Date().toISOString()
        });
        
        // Auto-resume scanning after 2 seconds
        setTimeout(() => setIsScanning(true), 2000);
        return;
      }
      
      // Online mode - send to server
      const res = await API.post('/hp-scanner/validate-qr', scanData, {
        headers: {
          'X-Device-ID': deviceId
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      setScanResult({
        success: true,
        data: res.data.data,
        validationTime: res.data.validationTime || responseTime,
        cacheHit: res.data.cacheHit
      });
      
      // Update metrics
      setMetrics(prev => ({
        totalScans: prev.totalScans + 1,
        successfulScans: prev.successfulScans + 1,
        duplicates: prev.duplicates,
        avgResponseTime: ((prev.avgResponseTime * prev.totalScans) + responseTime) / (prev.totalScans + 1)
      }));
      
      addToHistory({
        qrPayload: qrPayload.substring(0, 20) + '...',
        gateId: selectedGate,
        status: 'success',
        booking: res.data.data.booking,
        timestamp: new Date().toISOString(),
        responseTime
      });
      
      // Play success sound
      playSound('success');
      
      // Auto-resume scanning after 3 seconds
      setTimeout(() => {
        setScanResult(null);
        setIsScanning(true);
      }, 3000);
      
    } catch (err) {
      const responseTime = Date.now() - startTime;
      const errorData = err.response?.data;
      const status = err.response?.status;
      
      console.error('[QR_SCAN_ERROR]', {
        status,
        statusText: err.response?.statusText,
        error: errorData?.error,
        message: errorData?.message,
        data: errorData?.data
      });
      
      // Determine error type and message based on status code and error data
      let errorType = 'entry_denied';
      let displayError = errorData?.error || 'Scan failed';
      let displayMessage = errorData?.message || err.message;
      
      // Map HTTP status codes to specific error types
      if (status === 409) {
        errorType = 'duplicate';
        displayError = 'Duplicate Scan';
        displayMessage = displayMessage || 'This ticket has already been used for entry';
      } else if (status === 401) {
        errorType = 'unauthorized';
        displayError = 'Unauthorized';
        displayMessage = 'You are not authorized to scan. Please log in again.';
      } else if (status === 403) {
        errorType = 'forbidden';
        displayError = 'Access Denied';
        displayMessage = 'Your device or role does not have permission to scan.';
      } else if (status === 404) {
        errorType = 'not_found';
        displayError = 'Invalid QR Code';
        displayMessage = 'No booking found for this QR code';
      } else if (status === 400) {
        // Extract specific error message from 400 response
        const errorMsg = errorData?.error || '';
        if (errorMsg.includes('duplicate')) {
          errorType = 'duplicate';
          displayError = 'Duplicate Scan';
        } else if (errorMsg.includes('cancelled')) {
          errorType = 'cancelled';
          displayError = 'Booking Cancelled';
        } else if (errorMsg.includes('wrong') || errorMsg.includes('Wrong')) {
          errorType = 'wrong_event';
          displayError = 'Wrong Event';
        } else if (errorMsg.includes('invalid') || errorMsg.includes('Invalid')) {
          errorType = 'invalid_qr';
          displayError = 'Invalid QR Code';
        } else if (errorMsg.includes('status')) {
          errorType = 'invalid_booking_status';
          displayError = 'Invalid Booking Status';
        }
      } else if (status === 429) {
        errorType = 'rate_limit';
        displayError = 'Rate Limited';
        displayMessage = 'Scanning too fast. Please wait a moment and try again.';
      }
      
      setScanResult({
        success: false,
        error: displayError,
        message: displayMessage,
        validationTime: responseTime,
        isDuplicate: errorType === 'duplicate',
        errorType,
        status
      });
      
      // Update metrics
      setMetrics(prev => ({
        totalScans: prev.totalScans + 1,
        successfulScans: prev.successfulScans,
        duplicates: prev.duplicates + (errorType === 'duplicate' ? 1 : 0),
        avgResponseTime: ((prev.avgResponseTime * prev.totalScans) + responseTime) / (prev.totalScans + 1)
      }));
      
      addToHistory({
        qrPayload: qrPayload.substring(0, 20) + '...',
        gateId: selectedGate,
        status: errorType,
        error: displayMessage,
        timestamp: new Date().toISOString(),
        responseTime
      });
      
      // Play error sound
      playSound(errorType === 'duplicate' ? 'duplicate' : 'error');
      
      // Auto-resume scanning after 2 seconds
      setTimeout(() => {
        setScanResult(null);
        setIsScanning(true);
      }, 2000);
    }
  };
  
  const handleManualScan = async (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    
    // Manual entry uses booking ID
    const startTime = Date.now();
    
    try {
      const res = await API.post('/scanner/scan', {
        bookingId: manualInput,
        gate: selectedGate || 'Manual Entry'
      });
      
      const responseTime = Date.now() - startTime;
      
      setScanResult({
        success: true,
        data: { booking: res.data.booking },
        validationTime: responseTime,
        manual: true
      });
      
      setManualInput('');
      
      addToHistory({
        bookingId: manualInput,
        gateId: selectedGate,
        status: 'success',
        method: 'manual',
        booking: res.data.booking,
        timestamp: new Date().toISOString(),
        responseTime
      });
      
      playSound('success');
      
    } catch (err) {
      setScanResult({
        success: false,
        error: err.response?.data?.message || 'Manual entry failed',
        manual: true
      });
      
      playSound('error');
    }
  };
  
  const syncOfflineScans = async () => {
    if (offlineQueue.length === 0) return;
    
    setIsSyncing(true);
    
    try {
      const res = await API.post('/hp-scanner/offline-sync', {
        scans: offlineQueue,
        deviceId,
        syncedAt: new Date().toISOString()
      }, {
        headers: {
          'X-Device-ID': deviceId
        }
      });
      
      const results = res.data.results;
      
      // Clear successful scans from queue
      setOfflineQueue([]);
      localStorage.removeItem('offlineQueue');
      
      // Show sync results
      alert(`Offline sync complete!\nTotal: ${results.total}\nSuccess: ${results.successful}\nDuplicate: ${results.duplicate}\nFailed: ${results.failed}`);
      
    } catch (err) {
      console.error('Offline sync failed:', err);
      alert('Offline sync failed. Will retry later.');
    } finally {
      setIsSyncing(false);
    }
  };
  
  const addToHistory = (scan) => {
    const newHistory = [scan, ...scanHistory].slice(0, 50); // Keep last 50
    setScanHistory(newHistory);
    localStorage.setItem('scanHistory', JSON.stringify(newHistory));
  };
  
  const playSound = (type) => {
    // Simple audio feedback
    const audio = new Audio();
    if (type === 'success') {
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiM0/LUejACInO98N2JOA...'; // Success beep
    } else if (type === 'duplicate') {
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiM0/LUejACInO98N2JOA...'; // Warning beep
    } else {
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiM0/LUejACInO98N2JOA...'; // Error beep
    }
    audio.play().catch(() => {}); // Ignore autoplay errors
  };
  
  const saveConfiguration = () => {
    if (!deviceName.trim() || !selectedGate) {
      alert('Please enter device name and select a gate');
      return;
    }
    
    const config = {
      deviceName: deviceName.trim(),
      defaultGate: selectedGate,
      deviceId
    };
    
    localStorage.setItem('scannerConfig', JSON.stringify(config));
    localStorage.setItem('deviceName', deviceName.trim());
    setIsConfigured(true);
  };
  
  // Configuration Screen
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🎫</div>
            <h1 className="text-3xl font-bold text-gray-900">Scanner Setup</h1>
            <p className="text-gray-600 mt-2">Configure your scanning device</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Device Name *
              </label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="e.g., Main Entrance Scanner"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Device ID: {deviceId}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Gate *
              </label>
              <select
                value={selectedGate}
                onChange={(e) => setSelectedGate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Gate</option>
                {gates.map((gate) => (
                  <option key={gate} value={gate}>{gate}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={saveConfiguration}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all"
            >
              Save & Start Scanning
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Main Scanner Screen
  return (
    <StaffLayout title="High-Performance QR Scanner">
      <div className="bg-blue-600 p-4 rounded-2xl">
        <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold">🎫 High-Performance Scanner</h1>
              <p className="text-white/80 mt-1">{deviceName} • {selectedGate}</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Online Status */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isOnline ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                <span className="font-medium">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
              
              {/* Offline Queue */}
              {offlineQueue.length > 0 && (
                <div className="bg-yellow-500/20 px-4 py-2 rounded-lg">
                  <span className="font-medium">📦 {offlineQueue.length} queued</span>
                  {isOnline && !isSyncing && (
                    <button
                      onClick={syncOfflineScans}
                      className="ml-2 text-sm underline"
                    >
                      Sync Now
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Assigned Events Section */}
        {assignedInfo && assignedInfo.assignedEvents && assignedInfo.assignedEvents.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  📅 Assigned Events
                </label>
                {assignedInfo.assignedEvents.length === 1 ? (
                  <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                    <p className="font-semibold text-gray-900">{assignedInfo.assignedEvents[0].title}</p>
                    <p className="text-sm text-gray-600 mt-1">📍 {assignedInfo.assignedEvents[0].location}</p>
                    <p className="text-sm text-gray-600">📅 {new Date(assignedInfo.assignedEvents[0].date).toLocaleDateString()}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <select
                      value={selectedEvent}
                      onChange={(e) => setSelectedEvent(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="">Select an event</option>
                      {assignedInfo.assignedEvents.map((event) => (
                        <option key={event._id} value={event._id}>
                          {event.title} - {event.location}
                        </option>
                      ))}
                    </select>
                    {selectedEvent && (
                      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                        {(() => {
                          const selected = assignedInfo.assignedEvents.find(e => e._id === selectedEvent);
                          return selected ? (
                            <>
                              <p className="font-semibold text-gray-900">Currently scanning: {selected.title}</p>
                              <p className="text-sm text-gray-600 mt-1">📍 {selected.location}</p>
                              <p className="text-sm text-gray-600">📅 {new Date(selected.date).toLocaleDateString()}</p>
                            </>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Live Stats */}
        {liveStats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="text-3xl font-bold text-blue-600">{liveStats.liveStats?.totalEntries || 0}</div>
              <div className="text-gray-600 text-sm mt-1">Total Entries</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="text-3xl font-bold text-green-600">{metrics.successfulScans}</div>
              <div className="text-gray-600 text-sm mt-1">My Scans</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="text-3xl font-bold text-orange-600">{liveStats.liveStats?.duplicateAttempts || 0}</div>
              <div className="text-gray-600 text-sm mt-1">Duplicates</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="text-3xl font-bold text-purple-600">{Math.round(metrics.avgResponseTime)}ms</div>
              <div className="text-gray-600 text-sm mt-1">Avg Response</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="text-3xl font-bold text-blue-600">0</div>
              <div className="text-gray-600 text-sm mt-1">Total Entries</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="text-3xl font-bold text-green-600">{metrics.successfulScans}</div>
              <div className="text-gray-600 text-sm mt-1">My Scans</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="text-3xl font-bold text-orange-600">0</div>
              <div className="text-gray-600 text-sm mt-1">Duplicates</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="text-3xl font-bold text-purple-600">{Math.round(metrics.avgResponseTime)}ms</div>
              <div className="text-gray-600 text-sm mt-1">Avg Response</div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Scanning Section */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Scan Ticket</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setScanMode('qr')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    scanMode === 'qr'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  📷 QR Code
                </button>
                <button
                  onClick={() => setScanMode('manual')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    scanMode === 'manual'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ⌨️ Manual
                </button>
              </div>
            </div>
            
            {/* QR Scanner */}
            {scanMode === 'qr' && (
              <div>
                {!isScanning ? (
                  <button
                    onClick={() => {
                      if (!selectedGate) {
                        alert('Please select a gate first in the configuration section');
                        return;
                      }
                      console.log('[UI] Starting scanner with config:', { selectedGate, deviceName });
                      setIsScanning(true);
                    }}
                    disabled={!selectedGate}
                    className={`w-full px-6 py-4 rounded-xl font-semibold text-lg transition-all ${
                      !selectedGate
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    Start QR Scanner
                  </button>
                ) : (
                  <div>
                    {cameraError && (
                      <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                        <p className="text-red-800 font-medium">❌ Camera Error</p>
                        <p className="text-red-700 text-sm mt-1">{cameraError}</p>
                        <button
                          onClick={() => {
                            setCameraError(null);
                            setIsScanning(false);
                          }}
                          className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
                        >
                          Close & Try Again
                        </button>
                      </div>
                    )}
                    <div 
                      id="qr-reader" 
                      ref={scannerRef}
                      style={{
                        transform: isCameraFlipped ? 'scaleX(-1)' : 'scaleX(1)',
                        transition: 'transform 0.3s ease'
                      }}
                    ></div>
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => setIsCameraFlipped(!isCameraFlipped)}
                        className="flex-1 bg-blue-500 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-600 transition-all"
                        title="Flip camera horizontally"
                      >
                        🔄 Flip Camera
                      </button>
                      <button
                        onClick={() => setIsScanning(false)}
                        className="flex-1 bg-red-500 text-white px-4 py-3 rounded-lg font-medium hover:bg-red-600 transition-all"
                      >
                        Stop Scanner
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Manual Entry */}
            {scanMode === 'manual' && (
              <form onSubmit={handleManualScan}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Booking ID
                  </label>
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Enter booking ID"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={!manualInput.trim()}
                  className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Validate Entry
                </button>
              </form>
            )}
            
            {/* Scan Result */}
            {scanResult && (
              <div className={`mt-6 p-6 rounded-xl border-2 ${
                scanResult.success
                  ? 'bg-green-50 border-green-500'
                  : 'bg-red-50 border-red-500'
              }`}>
                <div className="flex items-start gap-4">
                  <div className="text-4xl">
                    {scanResult.success 
                      ? '✅' 
                      : scanResult.isDuplicate 
                      ? '⚠️' 
                      : scanResult.errorType === 'invalid_qr'
                      ? '🔍'
                      : scanResult.errorType === 'cancelled'
                      ? '❌'
                      : scanResult.errorType === 'wrong_event'
                      ? '📍'
                      : scanResult.errorType === 'unauthorized' || scanResult.errorType === 'forbidden'
                      ? '🔒'
                      : scanResult.errorType === 'rate_limit'
                      ? '⏱️'
                      : '❌'
                    }
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-xl font-bold ${
                      scanResult.success ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {scanResult.success
                        ? (scanResult.offline ? 'Queued for Sync' : 'Entry Granted')
                        : scanResult.error || 'Entry Denied'}
                    </h3>
                    
                    {scanResult.success && scanResult.data && (
                      <div className="mt-3 space-y-2 text-sm text-gray-700">
                        <p><strong>Event:</strong> {scanResult.data.booking?.eventName}</p>
                        <p><strong>Attendee:</strong> {scanResult.data.booking?.userName}</p>
                        <p><strong>Ticket:</strong> {scanResult.data.booking?.ticketType}</p>
                        <p><strong>Gate:</strong> {scanResult.data.scan?.gateId}</p>
                      </div>
                    )}
                    
                    {!scanResult.success && (
                      <p className="mt-2 text-sm text-red-700">{scanResult.message}</p>
                    )}
                    
                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      <span>⏱️ {scanResult.validationTime}ms</span>
                      {scanResult.cacheHit && <span>💨 Cache Hit</span>}
                      {scanResult.offline && <span>📦 Offline</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Scan History */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Scans</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {scanHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No scans yet</p>
              ) : (
                scanHistory.map((scan, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${
                      scan.status === 'success'
                        ? 'bg-green-50 border-green-200'
                        : scan.status === 'duplicate'
                        ? 'bg-yellow-50 border-yellow-200'
                        : scan.status === 'queued'
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {scan.booking && (
                          <p className="font-medium text-gray-900 truncate">
                            {scan.booking.userName}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          {scan.gateId}
                        </p>
                        {scan.error && (
                          <p className="text-xs text-red-600 mt-1">{scan.error}</p>
                        )}
                      </div>
                      <div className="text-2xl flex-shrink-0">
                        {scan.status === 'success' ? '✅' :
                         scan.status === 'duplicate' ? '⚠️' :
                         scan.status === 'queued' ? '📦' : '❌'}
                      </div>
                    </div>
                    {scan.responseTime && (
                      <div className="mt-2 text-xs text-gray-500">
                        ⏱️ {scan.responseTime}ms
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            
            {scanHistory.length > 0 && (
              <button
                onClick={() => {
                  setScanHistory([]);
                  localStorage.removeItem('scanHistory');
                }}
                className="w-full mt-4 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                Clear History
              </button>
            )}
          </div>
          
        </div>
        
      </div>
      </div>
    </StaffLayout>
  );
}
