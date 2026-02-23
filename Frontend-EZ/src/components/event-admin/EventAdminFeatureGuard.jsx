import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../../../services/api'

const EventAdminFeatureGuard = ({ children, requiredFeature, eventId }) => {
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [features, setFeatures] = useState({})
  const navigate = useNavigate()

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
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center border-2 border-yellow-300">
          <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <div className="text-5xl">🔒</div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Feature Not Available</h2>
          <p className="text-gray-700 mb-6">
            The "<strong>{requiredFeature}</strong>" feature is not enabled for your event.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              How to Enable This Feature
            </p>
            <ul className="text-sm text-gray-600 space-y-1 text-left">
              <li>• Upgrade your subscription plan</li>
              <li>• Or contact your administrator</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Link
              to={`/event-admin/events`}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
            >
              View Plans & Upgrade
            </Link>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-all"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return children
}

export default EventAdminFeatureGuard

