import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import API from '../../services/api'
import StaffAdminLayout from '../../components/layout/StaffAdminLayout'

export default function StaffAdminDashboard() {
  const [stats, setStats] = useState(null)
  const [events, setEvents] = useState([])
  const [allEventsMode, setAllEventsMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await API.get('/staff-admin/dashboard')
      setStats(res.data.stats)
      setEvents(res.data.events || [])
      setAllEventsMode(res.data.allEventsMode || false)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <StaffAdminLayout title="Dashboard">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </StaffAdminLayout>
    )
  }

  if (error) {
    return (
      <StaffAdminLayout title="Dashboard">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </StaffAdminLayout>
    )
  }

  return (
    <StaffAdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            label="Events Managed" 
            value={stats?.totalEvents || 0} 
            icon="🎫"
            subtitle="Active events"
            color="bg-gradient-to-br from-indigo-400 to-indigo-600 text-white"
          />
          <StatCard 
            label="Active Staff" 
            value={stats?.totalStaff || 0} 
            icon="👥"
            subtitle="Team members"
            color="bg-gradient-to-br from-green-400 to-green-600 text-white"
          />
          <StatCard 
            label="Total Scanned" 
            value={stats?.totalScanned || 0} 
            icon="📊"
            subtitle="All time entries"
            color="bg-gradient-to-br from-blue-400 to-blue-600 text-white"
          />
          <StatCard 
            label="Today's Scans" 
            value={stats?.todayScanned || 0} 
            icon="✅"
            subtitle="Entries today"
            color="bg-gradient-to-br from-orange-400 to-orange-600 text-white"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link 
              to="/staff/scanner" 
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors flex items-center gap-2"
            >
              <span>📱</span> Open Scanner
            </Link>
            <Link 
              to="/staff-admin/team" 
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              Manage Team Members
            </Link>
            <Link 
              to="/staff-admin/entries" 
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              View Entry Logs
            </Link>
          </div>
        </div>

        {/* Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Operations Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Events Managed</span>
                <span className="font-semibold">{stats?.totalEvents || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Staff Members</span>
                <span className="font-semibold text-green-700">{stats?.totalStaff || 0}</span>
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="text-gray-600">Total Entries Scanned</span>
                <span className="font-semibold">{stats?.totalScanned || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Today's Entries</span>
                <span className="font-semibold text-blue-700">{stats?.todayScanned || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Activity Overview</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Average Scans per Event</span>
                <span className="font-semibold text-lg">
                  {stats?.totalEvents > 0 ? Math.round((stats?.totalScanned || 0) / stats.totalEvents) : 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Scans per Staff Member</span>
                <span className="font-semibold">
                  {stats?.totalStaff > 0 ? Math.round((stats?.totalScanned || 0) / stats.totalStaff) : 0}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="text-gray-600">Today's Activity Rate</span>
                <span className="font-semibold text-green-700">
                  {stats?.totalScanned > 0 ? Math.round(((stats?.todayScanned || 0) / stats.totalScanned) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Events */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {allEventsMode ? 'All Events' : 'Assigned Events'}
            </h3>
            {allEventsMode && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                Managing All Events
              </span>
            )}
          </div>
          {events.length === 0 ? (
            <p className="text-gray-500 text-sm">No events assigned</p>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <Link
                  key={event._id}
                  to={`/staff-admin/entries?event=${event._id}`}
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-indigo-50 transition-colors border border-transparent hover:border-indigo-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{event.title}</h4>
                      <div className="mt-1 space-y-1 text-sm text-gray-600">
                        <p>📅 {new Date(event.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</p>
                        <p>📍 {event.location} {event.venue && `• ${event.venue}`}</p>
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {event.availableTickets || 0} / {event.totalTickets || 0}
                      </div>
                      <div className="text-xs text-gray-500">Available</div>
                      <div className="mt-2 text-xs text-indigo-600 font-semibold">View scans & details →</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </StaffAdminLayout>
  )
}

function StatCard({ label, value, icon, subtitle, color }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        <div className={`${color} w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-sm`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900">
        {value}
      </div>
      {subtitle && (
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  )
}
