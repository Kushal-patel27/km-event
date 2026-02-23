import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import API from '../../services/api'
import formatCurrency from '../../utils/currency'
import EventAdminLayout from '../../components/layout/EventAdminLayout'

export default function OrganizerRevenueDashboard() {
  const [subscription, setSubscription] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [pendingPayout, setPendingPayout] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const avgCommissionRate = (() => {
    const totalRevenue = Number(analytics?.summary?.totalRevenue) || 0
    const totalCommission = Number(analytics?.summary?.totalCommissionDeducted) || 0
    if (totalRevenue > 0) {
      const rate = (totalCommission / totalRevenue) * 100
      return Number.isFinite(rate) ? rate : 0
    }
    return Number(subscription?.currentCommissionPercentage) || 0
  })()

  const avgCommissionRateLabel = avgCommissionRate.toFixed(1).replace(/\.0$/, '')

  const formatSubscribedDate = (value) => {
    if (!value) return 'N/A'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return 'N/A'
    return parsed.toLocaleDateString('en-IN')
  }

  useEffect(() => {
    fetchDashboardData()

    const intervalId = setInterval(() => {
      fetchDashboardData({ silent: true })
    }, 15000)

    return () => clearInterval(intervalId)
  }, [fromDate, toDate])

  const fetchDashboardData = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true)
      }
      const params = new URLSearchParams()
      if (fromDate) params.append('fromDate', fromDate)
      if (toDate) params.append('toDate', toDate)

      const [subRes, analyticsRes, payoutRes] = await Promise.all([
        API.get('/subscriptions/my-subscription'),
        API.get(`/subscriptions/analytics/event-admin?${params.toString()}`),
        API.get('/subscriptions/payouts/event-admin/pending/amount')
      ])

      setSubscription(subRes.data.data)
      setAnalytics(analyticsRes.data.data)
      setPendingPayout(payoutRes.data)
      setError('')
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      if (!silent) {
        setError('Failed to load dashboard data')
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  const isInitialLoad = loading && !analytics && !subscription && !pendingPayout

  return (
    <EventAdminLayout title="Event Admin Revenue">
      {isInitialLoad && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {!isInitialLoad && subscription && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{subscription.plan?.name || 'Free'} Plan</h2>
              <p className="text-gray-600 mt-1">{subscription.plan?.description}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{subscription.currentCommissionPercentage}%</div>
              <div className="text-sm text-gray-600 mt-1">Commission Deducted</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
            <div>
              <div className="text-sm text-gray-600">Status</div>
              <div className="font-semibold mt-1">
                <span className={`px-3 py-1 rounded text-xs ${
                  subscription.status === 'active' ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {subscription.status}
                </span>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Subscribed Since</div>
              <div className="font-semibold mt-1">
                {formatSubscribedDate(subscription.subscribedAt)}
              </div>
            </div>
            {subscription.plan?.eventLimit && (
              <div>
                <div className="text-sm text-gray-600">Event Limit</div>
                <div className="font-semibold mt-1">{subscription.plan.eventLimit}</div>
              </div>
            )}
            {subscription.plan?.payoutFrequency && (
              <div>
                <div className="text-sm text-gray-600">Payout Frequency</div>
                <div className="font-semibold mt-1 capitalize">{subscription.plan.payoutFrequency}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {!isInitialLoad && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchDashboardData}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {!isInitialLoad && analytics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow min-h-[150px]">
              <div className="text-gray-600 text-sm font-semibold leading-tight min-h-[2.5rem]">Total Revenue</div>
              <div className="mt-2 h-9 flex items-center">
                <div className="text-[clamp(0.7rem,1.6vw,1.6rem)] font-bold text-blue-600 leading-tight whitespace-nowrap tracking-tight tabular-nums">
                  {formatCurrency(analytics.summary?.totalRevenue)}
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                From {analytics.summary?.totalBookings || 0} bookings
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow min-h-[150px]">
              <div className="text-gray-600 text-sm font-semibold leading-tight min-h-[2.5rem]">Commission Deducted</div>
              <div className="mt-2 h-9 flex items-center">
                <div className="text-[clamp(0.7rem,1.6vw,1.6rem)] font-bold text-red-600 leading-tight whitespace-nowrap tracking-tight tabular-nums">
                  {formatCurrency(analytics.summary?.totalCommissionDeducted)}
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Average commission rate: {avgCommissionRateLabel}%
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow min-h-[150px]">
              <div className="text-gray-600 text-sm font-semibold leading-tight min-h-[2.5rem]">Net Payout</div>
              <div className="mt-2 h-9 flex items-center">
                <div className="text-[clamp(0.7rem,1.6vw,1.6rem)] font-bold text-green-600 leading-tight whitespace-nowrap tracking-tight tabular-nums">
                  {formatCurrency(analytics.summary?.totalPayout)}
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {analytics.summary?.totalTickets || 0} tickets sold
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow min-h-[150px]">
              <div className="text-gray-600 text-sm font-semibold leading-tight min-h-[2.5rem]">Pending Payout</div>
              <div className="mt-2 h-9 flex items-center">
                <div className={`text-[clamp(0.7rem,1.6vw,1.6rem)] font-bold leading-tight whitespace-nowrap tracking-tight tabular-nums ${
                  pendingPayout?.pendingAmount > 0 ? 'text-purple-600' : 'text-gray-600'
                }`}>
                  {formatCurrency(pendingPayout?.pendingAmount)}
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Min payout: {formatCurrency(pendingPayout?.minPayoutAmount)}
              </div>
            </div>
          </div>

          {pendingPayout?.pendingAmount > 0 && (
            <div className="bg-blue-50 border border-blue-300 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-blue-900">Ready to Request Payout?</h3>
                  <p className="text-blue-800 mt-1">
                    You have {formatCurrency(pendingPayout.pendingAmount)} available for payout
                  </p>
                </div>
                {pendingPayout.canRequestPayout && (
                  <Link
                    to="/event-admin/payout"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                  >
                    Request Payout
                  </Link>
                )}
              </div>
            </div>
          )}

          {analytics.byEvent && analytics.byEvent.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Revenue by Event</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold">Event</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Revenue</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Commission</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Your Payout</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Tickets</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.byEvent.map(event => (
                      <tr key={event._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-4 font-semibold text-blue-600">{event.eventTitle}</td>
                        <td className="px-4 py-4 text-sm">
                          {new Date(event.eventDate).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-blue-600">
                          {formatCurrency(event.totalRevenue)}
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-red-600">
                          {formatCurrency(event.totalCommission)}
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-green-600">
                          {formatCurrency(event.totalPayout)}
                        </td>
                        <td className="px-4 py-4 text-right">{event.ticketsSold}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {analytics.commissionBreakdown && analytics.commissionBreakdown.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Commission Breakdown</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analytics.commissionBreakdown.map(breakdown => (
                  <div key={breakdown._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-600 font-semibold">{breakdown._id}% Commission</div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <div className="text-xs text-gray-500">Bookings</div>
                        <div className="text-lg font-bold">{breakdown.count}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Revenue</div>
                        <div className="text-lg font-bold text-blue-600">
                          {formatCurrency(breakdown.revenue)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Commission</div>
                        <div className="text-lg font-bold text-red-600">
                          {formatCurrency(breakdown.totalCommission)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Payout</div>
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(breakdown.payout)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </EventAdminLayout>
  )
}
