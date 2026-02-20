import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import API from '../../services/api'
import SuperAdminLayout from '../../components/layout/SuperAdminLayout'
import formatINR from '../../utils/currency'

const PAGE_SIZE = 10

export default function SuperAdminEventRequests() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('PENDING')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [message, setMessage] = useState(null)
  const [counts, setCounts] = useState({ PENDING: 0, APPROVED: 0, REJECTED: 0 })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [planCatalog, setPlanCatalog] = useState([])

  const fetchRequests = useCallback(async (options = {}) => {
    const { silent } = options
    try {
      if (!silent) setLoading(true)
      const { data } = await API.get('/event-requests/all', {
        params: { status: filter, page, limit: PAGE_SIZE }
      })

      const fetchedRequests = Array.isArray(data.requests) ? data.requests : []
      setRequests(fetchedRequests)
      setCounts({
        PENDING: data.counts?.PENDING ?? 0,
        APPROVED: data.counts?.APPROVED ?? 0,
        REJECTED: data.counts?.REJECTED ?? 0
      })
      setTotalPages(data.pagination?.totalPages || 1)
      setTotal(data.pagination?.total || fetchedRequests.length)

      // Keep selection in sync with the current page
      setSelectedRequest(current => fetchedRequests.find(r => r._id === current?._id) || null)
    } catch (err) {
      console.error('Error fetching requests:', err)
      setRequests([])
      setCounts({ PENDING: 0, APPROVED: 0, REJECTED: 0 })
      setTotalPages(1)
      setTotal(0)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [filter, page])

  useEffect(() => {
    fetchRequests()
    setRejectReason('')
  }, [fetchRequests])

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await API.get('/subscriptions/plans')
        const apiPlans = Array.isArray(data?.plans)
          ? data.plans
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data)
              ? data
              : []
        setPlanCatalog(apiPlans)
      } catch (err) {
        console.error('Error fetching plans:', err)
        setPlanCatalog([])
      }
    }
    fetchPlans()
  }, [])

  const planLookup = useMemo(() => {
    return planCatalog.reduce((acc, plan) => {
      acc[plan.name] = plan
      return acc
    }, {})
  }, [planCatalog])

  const getPlanDisplay = (planName, planFromRequest) => {
    const plan = planFromRequest || planLookup[planName]
    if (!plan) {
      return { name: planName || 'N/A', priceLabel: 'N/A' }
    }

    const displayName = plan.displayName || plan.name
    const monthlyFee = plan.monthlyFee ?? 0
    const commissionLabel = plan.commissionPercentage !== undefined
      ? `Commission ${plan.commissionPercentage}%`
      : null

    let priceLabel = 'Free'
    if (monthlyFee > 0) {
      priceLabel = `${formatINR(monthlyFee)}/month`
    } else if (commissionLabel) {
      priceLabel = commissionLabel
    }

    return { name: displayName, priceLabel }
  }

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return
    setPage(nextPage)
    setSelectedRequest(null)
  }

  const handleApprove = async (requestId) => {
    try {
      await API.post(`/event-requests/${requestId}/approve`, {})
      setMessage({ type: 'success', text: 'Event approved successfully!' })
      setSelectedRequest(null)
      fetchRequests({ silent: true })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to approve event' })
    }
  }

  const handleReject = async (requestId) => {
    if (!rejectReason.trim()) {
      setMessage({ type: 'error', text: 'Please provide a rejection reason' })
      return
    }

    try {
      await API.post(`/event-requests/${requestId}/reject`, { rejectReason })
      setMessage({ type: 'success', text: 'Event rejected' })
      setSelectedRequest(null)
      setRejectReason('')
      fetchRequests({ silent: true })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to reject event' })
    }
  }

  const statusColors = {
    PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    APPROVED: 'bg-green-50 text-green-700 border-green-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200'
  }

  return (
    <SuperAdminLayout title="Event Requests" subtitle="Review and manage event creation requests">
      {message && (
        <div className={`mb-6 p-4 rounded-lg text-sm ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-8">
        {['PENDING', 'APPROVED', 'REJECTED'].map(status => (
          <button
            key={status}
            onClick={() => {
              setFilter(status)
              setPage(1)
            }}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {status} ({counts[status] || 0})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-600">
          Loading requests...
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 rounded-lg bg-white text-gray-600 border border-gray-200">
          No {filter.toLowerCase()} event requests
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <motion.div
              key={request._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setSelectedRequest(request)}
              className={`rounded-lg p-6 cursor-pointer border-2 transition ${
                selectedRequest?._id === request._id
                  ? 'bg-blue-50 border-blue-400'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{request.title}</h3>
                  <p className="text-sm text-gray-600">{request.organizerName}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[request.status]}`}>
                  {request.status}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="text-gray-600">Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(request.date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Location</p>
                  <p className="font-medium text-gray-900">{request.location}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Tickets</p>
                  <p className="font-medium text-gray-900">{request.totalTickets}</p>
                </div>
                <div>
                  <p className="text-gray-600">Subscription Plan</p>
                  <p className="font-medium text-blue-600">{getPlanDisplay(request.planSelected, request.subscriptionPlan).name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Plan Fee</p>
                  <p className="font-medium text-green-600">{getPlanDisplay(request.planSelected, request.subscriptionPlan).priceLabel}</p>
                </div>
                <div>
                  <p className="text-gray-600">Category</p>
                  <p className="font-medium text-gray-900">{request.category}</p>
                </div>
              </div>

              {selectedRequest?._id === request._id && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-6 pt-6 border-t border-gray-200"
                >
                  <div className="mb-6">
                    <h4 className="font-semibold mb-2 text-gray-700">Description</h4>
                    <p className="text-sm text-gray-600">{request.description}</p>
                  </div>

                  {/* Subscription Plan Details */}
                  <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                    <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Subscription Plan Details
                    </h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-blue-100">
                        <span className="text-sm font-medium text-gray-700">Plan Type</span>
                        <span className="text-sm font-bold text-blue-700">{getPlanDisplay(request.planSelected, request.subscriptionPlan).name}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-blue-100">
                        <span className="text-sm font-medium text-gray-700">Plan Fee</span>
                        <span className="text-sm font-bold text-green-700">{getPlanDisplay(request.planSelected, request.subscriptionPlan).priceLabel}</span>
                      </div>
                    </div>
                    {request.subscriptionPlan && (
                      <div className="mt-3 p-3 rounded-lg bg-white border border-blue-100">
                        <p className="text-xs text-gray-600 mb-2">Plan Features:</p>
                        <div className="flex flex-wrap gap-2">
                          {request.requestedFeatures && Object.entries(request.requestedFeatures).filter(([_, enabled]) => enabled).map(([feature]) => (
                            <span key={feature} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              {feature.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {request.status === 'PENDING' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          Rejection Reason (if rejecting)
                        </label>
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Provide reason for rejection..."
                          className="w-full px-3 py-2 border-2 rounded-lg text-sm bg-white border-gray-300 text-gray-900"
                          rows="3"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApprove(request._id)}
                          className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
                        >
                          ✓ Approve Event
                        </button>
                        <button
                          onClick={() => handleReject(request._id)}
                          className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
                        >
                          ✕ Reject Event
                        </button>
                      </div>
                    </div>
                  )}

                  {request.status === 'APPROVED' && (
                    <div className="mt-4">
                      <button
                        onClick={() => navigate(`/super-admin/event-requests/${request._id}/features`)}
                        className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition"
                      >
                        ⚙️ Configure Features & Limits
                      </button>
                    </div>
                  )}

                  {request.status === 'REJECTED' && request.rejectReason && (
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-sm font-medium text-red-700">Rejection Reason</p>
                      <p className="text-sm mt-1 text-red-600">{request.rejectReason}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {requests.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} of {total}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className={`px-3 py-2 rounded-md border text-sm font-medium ${
                  page === 1
                    ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">Page {page} of {totalPages}</span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className={`px-3 py-2 rounded-md border text-sm font-medium ${
                  page === totalPages
                    ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  )
}
