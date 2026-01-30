import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import API from '../../services/api';
import SuperAdminLayout from '../../components/layout/SuperAdminLayout';

/**
 * Real-Time Scanner Analytics Dashboard
 * Displays live entry stats, gate traffic, staff performance, duplicate attempts
 */
export default function ScannerAnalyticsDashboard() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Analytics Data
  const [liveStats, setLiveStats] = useState(null);
  const [gateReport, setGateReport] = useState(null);
  const [staffReport, setStaffReport] = useState(null);
  const [duplicateAttempts, setDuplicateAttempts] = useState([]);
  
  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(10); // seconds
  const [lastUpdated, setLastUpdated] = useState(null);
  
  useEffect(() => {
    fetchEvents();
  }, []);
  
  useEffect(() => {
    if (selectedEvent) {
      fetchAllAnalytics();
    }
  }, [selectedEvent]);
  
  useEffect(() => {
    if (autoRefresh && selectedEvent) {
      const interval = setInterval(() => {
        fetchAllAnalytics();
      }, refreshInterval * 1000);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedEvent, refreshInterval]);
  
  const fetchEvents = async () => {
    try {
      const res = await API.get('/events');
      setEvents(res.data);
      if (res.data.length > 0) {
        setSelectedEvent(res.data[0]._id);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAllAnalytics = async () => {
    if (!selectedEvent) return;
    
    try {
      setError(null);
      const [analyticsRes, gateRes, staffRes, duplicatesRes] = await Promise.all([
        API.get(`/hp-scanner/analytics/${selectedEvent}`),
        API.get(`/hp-scanner/gate-report/${selectedEvent}`),
        API.get(`/hp-scanner/staff-report/${selectedEvent}`),
        API.get(`/hp-scanner/duplicate-attempts/${selectedEvent}`, { params: { limit: 20 } })
      ]);
      
      setLiveStats(analyticsRes.data.data);
      setGateReport(gateRes.data.data);
      setStaffReport(staffRes.data.data);
      setDuplicateAttempts(duplicatesRes.data.data.duplicates || []);
      setLastUpdated(new Date());
      
    } catch (err) {
      const statusCode = err.response?.status;
      const errorMessage = err.response?.data?.message || err.message;
      
      if (statusCode === 429) {
        setError('Rate limit exceeded. Refreshing too frequently. Try increasing the refresh interval.');
        console.warn('[Analytics] Rate limit (429) - reducing refresh frequency');
      } else if (statusCode === 401 || statusCode === 403) {
        setError('You do not have permission to view this data.');
        console.error('[Analytics] Permission error:', errorMessage);
      } else {
        setError(`Failed to load analytics: ${errorMessage}`);
        console.error('[Analytics] Fetch error:', err);
      }
    }
  };
  
  const formatGateChartData = () => {
    if (!gateReport?.gateStats) return [];
    
    return gateReport.gateStats.map(gate => ({
      name: gate._id || 'Unknown',
      entries: gate.totalEntries,
      duplicates: gate.duplicateAttempts,
      avgTime: Math.round(gate.avgValidationTime)
    }));
  };
  
  const formatStaffChartData = () => {
    if (!staffReport?.staffPerformance) return [];
    
    return staffReport.staffPerformance.map(staff => ({
      name: staff.staffName || 'Unknown',
      scans: staff.totalScans,
      successful: staff.successfulScans,
      duplicates: staff.duplicates,
      avgTime: Math.round(staff.avgResponseTime)
    }));
  };
  
  const formatTimelineData = () => {
    if (!liveStats?.recentScans) return [];
    
    const hourlyData = {};
    
    liveStats.recentScans.forEach(scan => {
      const hour = new Date(scan.scannedAt).getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = { hour: `${hour}:00`, count: 0 };
      }
      hourlyData[hour].count++;
    });
    
    return Object.values(hourlyData).sort((a, b) => 
      parseInt(a.hour) - parseInt(b.hour)
    );
  };
  
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }
  
  return (
    <SuperAdminLayout title="Scanner Analytics">
      <div className="space-y-6">
        
        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-start">
              <span className="text-red-600 dark:text-red-400 mr-3 text-xl">⚠️</span>
              <div className="flex-1">
                <p className="text-red-800 dark:text-red-200 font-medium">Error Loading Analytics</p>
                <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 text-xl"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📊 Scanner Analytics</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Real-time entry monitoring and performance metrics
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Event Selector */}
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Event</option>
                {events.map(event => (
                  <option key={event._id} value={event._id}>{event.title}</option>
                ))}
              </select>
              
              {/* Auto Refresh Toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  autoRefresh
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {autoRefresh ? '🔄 Auto-Refresh ON' : '⏸️ Auto-Refresh OFF'}
              </button>
              
              {/* Manual Refresh */}
              <button
                onClick={fetchAllAnalytics}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
              >
                🔄 Refresh Now
              </button>
            </div>
          </div>
          
          {lastUpdated && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Last updated: {lastUpdated.toLocaleTimeString()} • Next refresh in {refreshInterval}s
            </p>
          )}
        </div>
        
        {!selectedEvent ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Select an Event</h2>
            <p className="text-gray-600 dark:text-gray-400">Choose an event to view real-time scanner analytics</p>
          </div>
        ) : !liveStats ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading analytics data...</p>
          </div>
        ) : (
          <>
            
            {/* Live Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Entries</p>
                    <p className="text-4xl font-bold mt-2">{liveStats.liveStats.totalEntries}</p>
                  </div>
                  <div className="text-5xl opacity-50">🎫</div>
                </div>
                <div className="mt-4 text-sm text-blue-100">
                  {liveStats.liveStats.uniqueAttendees} unique attendees
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Active Gates</p>
                    <p className="text-4xl font-bold mt-2">{liveStats.liveStats.activeGates}</p>
                  </div>
                  <div className="text-5xl opacity-50">🚪</div>
                </div>
                <div className="mt-4 text-sm text-green-100">
                  {liveStats.liveStats.activeStaff} staff scanning
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Duplicate Attempts</p>
                    <p className="text-4xl font-bold mt-2">{liveStats.liveStats.duplicateAttempts}</p>
                  </div>
                  <div className="text-5xl opacity-50">⚠️</div>
                </div>
                <div className="mt-4 text-sm text-orange-100">
                  {liveStats.liveStats.totalEntries > 0 
                    ? ((liveStats.liveStats.duplicateAttempts / liveStats.liveStats.totalEntries) * 100).toFixed(1)
                    : 0}% duplicate rate
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Avg Response Time</p>
                    <p className="text-4xl font-bold mt-2">{Math.round(liveStats.liveStats.avgResponseTime)}ms</p>
                  </div>
                  <div className="text-5xl opacity-50">⚡</div>
                </div>
                <div className="mt-4 text-sm text-purple-100">
                  {liveStats.liveStats.cacheHitRate}% cache hit rate
                </div>
              </div>
              
            </div>
            
            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              
              {/* Gate Traffic Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Gate Traffic</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={formatGateChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="entries" fill="#3B82F6" name="Entries" />
                    <Bar dataKey="duplicates" fill="#F59E0B" name="Duplicates" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Entry Timeline */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Entry Timeline</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={formatTimelineData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="hour" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      name="Entries per Hour"
                      dot={{ fill: '#10B981', r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
            </div>
            
            {/* Staff Performance Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Staff Performance</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Staff Member</th>
                      <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Total Scans</th>
                      <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Successful</th>
                      <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Duplicates</th>
                      <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Avg Response</th>
                      <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Success Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffReport?.staffPerformance && staffReport.staffPerformance.length > 0 ? (
                      staffReport.staffPerformance.map((staff, index) => (
                        <tr 
                          key={index}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                {staff.staffName?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{staff.staffName || 'Unknown'}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{staff.gatesWorked.join(', ')}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">{staff.totalScans}</td>
                          <td className="py-3 px-4 text-right">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                              {staff.successfulScans}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                              {staff.duplicates}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">{Math.round(staff.avgResponseTime)}ms</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    staff.successRate >= 95 ? 'bg-green-500' :
                                    staff.successRate >= 85 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${staff.successRate}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {staff.successRate.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-gray-500 dark:text-gray-400">
                          No staff performance data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Duplicate Attempts Log */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Recent Duplicate Attempts</h2>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {duplicateAttempts.length > 0 ? (
                  duplicateAttempts.map((attempt, index) => (
                    <div 
                      key={index}
                      className="flex items-start gap-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg"
                    >
                      <div className="text-3xl">⚠️</div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {attempt.booking?.user?.name || 'Unknown User'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Booking ID: {attempt.booking?.bookingId || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Gate: {attempt.gateId} • Staff: {attempt.staff?.name || 'N/A'}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                              Attempt #{attempt.duplicateAttemptNumber}
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              {new Date(attempt.scannedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>Device: {attempt.deviceName || attempt.deviceId}</span>
                          <span>•</span>
                          <span>First Entry: {new Date(attempt.firstScanTime).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="text-5xl mb-4">✅</div>
                    <p>No duplicate attempts detected</p>
                  </div>
                )}
              </div>
            </div>
            
          </>
        )}
        
      </div>
    </SuperAdminLayout>
  );
}
