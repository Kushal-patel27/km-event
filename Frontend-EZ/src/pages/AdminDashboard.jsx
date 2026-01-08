import React, { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import API from '../services/api'
import formatINR from '../utils/currency'

export default function AdminDashboard(){
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(()=>{
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const res = await API.get('/admin/overview')
        setOverview(res.data)
      } catch (err) {
        console.error('Dashboard load failed', err)
        setError(err.response?.data?.message || 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <AdminLayout title="Dashboard">
      {loading && (
        <div className="text-sm text-gray-500 py-8">Loading metrics…</div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
      )}

      {!loading && !error && overview && (
        <div className="space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Total Events</div>
              <div className="text-3xl font-bold mt-2">{overview.totalEvents}</div>
              <p className="text-xs text-gray-500 mt-1">{overview.activeEvents} active</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Total Bookings</div>
              <div className="text-3xl font-bold mt-2">{overview.totalBookings}</div>
              <p className="text-xs text-gray-500 mt-1">{overview.confirmedBookings} confirmed</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Total Revenue</div>
              <div className="text-2xl font-bold mt-2">{formatINR(overview.totalRevenue)}</div>
              <p className="text-xs text-gray-500 mt-1">All events</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Revenue/Event</div>
              <div className="text-2xl font-bold mt-2">{formatINR(overview.revenuePerEvent)}</div>
              <p className="text-xs text-gray-500 mt-1">Average</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Confirmation Rate</div>
              <div className="text-3xl font-bold mt-2">
                {overview.totalBookings > 0 ? Math.round((overview.confirmedBookings / overview.totalBookings) * 100) : 0}%
              </div>
              <p className="text-xs text-gray-500 mt-1">Of all bookings</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 text-sm">
            <a href="/admin/team" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
              Manage Team
            </a>
            <a href="/admin/events" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              View Events
            </a>
            <a href="/admin/bookings" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              View Bookings
            </a>
            <a href="/admin/contacts" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              View Contacts
            </a>
          </div>

          {/* Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Organization Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Events Created</span>
                  <span className="font-semibold">{overview.totalEvents}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Events</span>
                  <span className="font-semibold text-green-700">{overview.activeEvents}</span>
                </div>
                <div className="flex justify-between pt-3 border-t">
                  <span className="text-gray-600">Total Bookings Received</span>
                  <span className="font-semibold">{overview.totalBookings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Confirmed Bookings</span>
                  <span className="font-semibold text-blue-700">{overview.confirmedBookings}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Revenue Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Revenue</span>
                  <span className="font-semibold text-lg">{formatINR(overview.totalRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average per Event</span>
                  <span className="font-semibold">{formatINR(overview.revenuePerEvent)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t">
                  <span className="text-gray-600">Booking Confirmation Rate</span>
                  <span className="font-semibold text-green-700">
                    {overview.totalBookings > 0 ? Math.round((overview.confirmedBookings / overview.totalBookings) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
