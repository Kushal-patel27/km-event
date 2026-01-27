import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../../services/api'

const EventAdminFeatureGuard = ({ children, requiredFeature, eventId }) => {
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [features, setFeatures] = useState({})

  useEffect(() => {
    checkFeatureAccess()
  }, [eventId, requiredFeature])

  const checkFeatureAccess = async () => {
    try {
      const response = await api.get(`/event-requests/${eventId}/enabled-features`)
      const enabledFeatures = response.data.enabledFeatures || {}
      
      setFeatures(enabledFeatures)
      setHasAccess(enabledFeatures[requiredFeature] === true)
    } catch (error) {
      console.error('Error checking feature access:', error)
      setHasAccess(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Feature Not Available</h2>
          <p className="text-gray-600 mb-4">
            The feature "<strong>{requiredFeature}</strong>" is not enabled for your event. 
            Please upgrade your plan or contact support to access this feature.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return children
}

export default EventAdminFeatureGuard
