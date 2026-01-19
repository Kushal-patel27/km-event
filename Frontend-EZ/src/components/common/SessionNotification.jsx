import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function SessionNotification() {
  const { sessionMessage } = useAuth()
  const [visible, setVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (sessionMessage) {
      setVisible(true)
      // Auto-redirect to login after showing message
      const redirectTimer = setTimeout(() => {
        navigate('/login')
      }, 3000)

      return () => clearTimeout(redirectTimer)
    } else {
      setVisible(false)
    }
  }, [sessionMessage, navigate])

  if (!visible || !sessionMessage) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-slide-in-right">
      <div className="bg-red-600 text-white px-6 py-4 rounded-lg shadow-2xl border border-red-500 max-w-md">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">Session Expired</h3>
            <p className="text-sm text-red-100">{sessionMessage}</p>
            <p className="text-xs text-red-200 mt-2">Redirecting to login...</p>
          </div>
          <button
            onClick={() => {
              setVisible(false)
              navigate('/login')
            }}
            className="flex-shrink-0 text-white hover:text-red-200 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
