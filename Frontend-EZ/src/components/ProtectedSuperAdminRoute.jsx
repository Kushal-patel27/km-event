import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedSuperAdminRoute({ children }) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/super-admin/login" replace />
  }

  if (user.role !== 'super_admin') {
    return <Navigate to="/" replace />
  }

  return children
}
