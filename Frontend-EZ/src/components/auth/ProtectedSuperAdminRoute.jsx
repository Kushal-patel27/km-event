import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedSuperAdminRoute({ children }) {
  const { user } = useAuth()

  console.log('ProtectedSuperAdminRoute - User:', user);
  console.log('ProtectedSuperAdminRoute - User Role:', user?.role);

  if (!user) {
    console.log('No user found, redirecting to /super-admin/login');
    return <Navigate to="/super-admin/login" replace />
  }

  if (user.role !== 'super_admin') {
    console.log('User role is not super_admin, redirecting to /');
    return <Navigate to="/" replace />
  }

  console.log('Access granted to super admin route');
  return children
}
