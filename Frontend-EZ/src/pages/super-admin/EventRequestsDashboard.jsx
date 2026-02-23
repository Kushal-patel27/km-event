import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'

const EventRequestsDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('PENDING')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  
  // Feature overrides
  const [featureOverrides, setFeatureOverrides] = useState({
    ticketing: false,
    qrCheckIn: false,
    scannerApp: false,
    analytics: false,
    emailSms: false,
    payments: false,
    weatherAlerts: false,
    subAdmins: false,
    reports: false
  })

  useEffect(() => {
    fetchRequests()
  }, [filter])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const endpoint = filter === 'ALL' 
        ? '/event-requests/all' 
        : `/event-requests/all?status=${filter}`
      const response = await api.get(endpoint)
      setRequests(response.data.requests || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const openApprovalModal = (request) => {
    setSelectedRequest(request)
    // Initialize feature overrides with requested features
    setFeatureOverrides(request.requestedFeatures || {
      ticketing: false,
      qrCheckIn: false,
      scannerApp: false,
      analytics: false,
      emailSms: false,
      payments: false,
      weatherAlerts: false,
      subAdmins: false,
      reports: false
    })
    setAdminNotes('')
    setShowApprovalModal(true)
  }

  const openRejectModal = (request) => {
    setSelectedRequest(request)
    setRejectReason('')
    setShowRejectModal(true)
  }

  const handleApprove = async () => {
    if (!selectedRequest) return

    try {
      const response = await api.post(`/event-requests/${selectedRequest._id}/approve`, {
        featureOverrides,
        adminNotes
      })

      if (response.data.success) {
        alert('Event approved successfully!')
        setShowApprovalModal(false)
        fetchRequests()
      }
    } catch (error) {
      console.error('Error approving request:', error)
      alert(error.response?.data?.message || 'Failed to approve request')
    }
  }

  const handleReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    try {
      const response = await api.post(`/event-requests/${selectedRequest._id}/reject`, {
        rejectReason
      })

      if (response.data.success) {
        alert('Event rejected successfully!')
        setShowRejectModal(false)
        fetchRequests()
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
      alert(error.response?.data?.message || 'Failed to reject request')
    }
  }

  const toggleFeature = (featureName) => {
    setFeatureOverrides(prev => ({
      ...prev,
      [featureName]: !prev[featureName]
    }))
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const featureLabels = {
    ticketing: 'Ticketing',
    qrCheckIn: 'QR Check-in',
    scannerApp: 'Scanner App',
    analytics: 'Analytics',
    emailSms: 'Email/SMS',
    payments: 'Payments',
    weatherAlerts: 'Weather Alerts',
    subAdmins: 'Sub-admins',
    reports: 'Reports'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Event Requests Management</h1>
          <p className="text-gray-600">Review and manage event creation requests</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-2">
            {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg">No {filter.toLowerCase()} requests found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(request => (
              <div key={request._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{request.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{request.description.substring(0, 150)}...</p>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-700">
                      <span className="bg-gray-100 px-2 py-1 rounded">📅 {new Date(request.date).toLocaleDateString()}</span>
                      <span className="bg-gray-100 px-2 py-1 rounded">📍 {request.location}</span>
                      <span className="bg-gray-100 px-2 py-1 rounded">🎫 {request.totalTickets} tickets</span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">{request.planSelected}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                </div>

                <div className="border-t pt-4">
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Organizer Details</h4>
                      <p className="text-sm text-gray-600">👤 {request.organizerName}</p>
                      <p className="text-sm text-gray-600">📧 {request.organizerEmail}</p>
                      {request.organizerPhone && <p className="text-sm text-gray-600">📞 {request.organizerPhone}</p>}
                      {request.organizerCompany && <p className="text-sm text-gray-600">🏢 {request.organizerCompany}</p>}
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Requested Features</h4>
                      <div className="flex flex-wrap gap-1">
                        {request.requestedFeatures && Object.entries(request.requestedFeatures).map(([key, value]) => 
                          value && (
                            <span key={key} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                              {featureLabels[key]}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {request.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openApprovalModal(request)}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => openRejectModal(request)}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  )}

                  {request.status === 'REJECTED' && request.rejectReason && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 mt-2">
                      <p className="text-sm text-red-800"><strong>Rejection Reason:</strong> {request.rejectReason}</p>
                    </div>
                  )}

                  {request.status === 'APPROVED' && (
                    <div className="bg-green-50 border border-green-200 rounded p-3 mt-2">
                      <p className="text-sm text-green-800">✓ Approved by {request.approvedBy?.name || 'Admin'} on {new Date(request.approvedAt).toLocaleDateString()}</p>
                      {request.adminNotes && <p className="text-sm text-gray-600 mt-1"><strong>Notes:</strong> {request.adminNotes}</p>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Approval Modal */}
        {showApprovalModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Approve Event Request</h2>
              
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Event: {selectedRequest.title}</h3>
                <p className="text-gray-600 text-sm">Plan: <strong>{selectedRequest.planSelected}</strong></p>
              </div>

              <div className="border rounded p-4 mb-4">
                <h4 className="font-semibold text-gray-800 mb-3">Configure Features (Toggle to Override)</h4>
                <p className="text-sm text-gray-600 mb-3">Enable or disable features for this event. Changes here will override the default plan features.</p>
                
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(featureLabels).map(([key, label]) => (
                    <label key={key} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={featureOverrides[key]}
                        onChange={() => toggleFeature(key)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes (Optional)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows="3"
                  placeholder="Add any notes or special instructions..."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
                >
                  Confirm Approval
                </button>
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Reject Event Request</h2>
              
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Event: {selectedRequest.title}</h3>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason *</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows="4"
                  required
                  placeholder="Provide a clear reason for rejection..."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition"
                >
                  Confirm Rejection
                </button>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EventRequestsDashboard
