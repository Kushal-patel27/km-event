import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children }){
  const { user } = useAuth()
  const location = useLocation()
  if(!user) return <Navigate to="/login" state={{ from: location }} replace />
  const isUserRole = String(user?.role || '').toLowerCase() === 'user'
  const hasWhatsappNumber = Boolean(user?.whatsappNumber)
  const skipWhatsappPrompt = user?.skipWhatsappPrompt === true
  if (isUserRole && !hasWhatsappNumber && !skipWhatsappPrompt && location.pathname !== '/complete-whatsapp') {
    return <Navigate to="/complete-whatsapp" replace />
  }
  return children
}
