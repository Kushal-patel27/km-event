import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const DEFAULT_ADMIN_ROLES = ['super_admin','event_admin','staff_admin','admin']

export default function ProtectedAdminRoute({ children, allowedRoles = DEFAULT_ADMIN_ROLES, redirectTo = '/admin/login' }){
  const { user } = useAuth()
  const role = user?.role
  const allowed = role && allowedRoles.includes(role)
  if(!allowed) return <Navigate to={redirectTo} replace />
  return children
}
