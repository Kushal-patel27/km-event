import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import Booking from './pages/Booking'
import MyBookings from './pages/MyBookings'
import BookingSuccess from './pages/BookingSuccess'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AuthCallback from './pages/AuthCallback'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLogin from './pages/AdminLogin'
import AdminEvents from './pages/AdminEvents'
import AdminBookings from './pages/AdminBookings'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import EventAdminDashboard from './pages/EventAdminDashboard'
import EventAdminEvents from './pages/EventAdminEvents'
import EventAdminBookings from './pages/EventAdminBookings'
import StaffLogin from './pages/StaffLogin'
import StaffScanner from './pages/StaffScanner'
import ProtectedAdminRoute from './components/ProtectedAdminRoute'
import { DarkModeProvider } from './context/DarkModeContext'

export default function App(){
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')
  const isStaffRoute = location.pathname.startsWith('/staff')
  return (
    <DarkModeProvider>
      <div className="min-h-screen flex flex-col">
        {!isAdminRoute && !isStaffRoute && <Navbar />}
        <main className={isAdminRoute || isStaffRoute ? "flex-1" : "flex-1"}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/event/:id" element={<EventDetail />} />
            <Route path="/events" element={<Events />} />
            <Route path="/book/:id" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
            <Route path="/booking-success" element={<BookingSuccess />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
            <Route path="/admin/events" element={<ProtectedAdminRoute><AdminEvents /></ProtectedAdminRoute>} />
            <Route path="/admin/bookings" element={<ProtectedAdminRoute><AdminBookings /></ProtectedAdminRoute>} />
            <Route path="/admin/users" element={<ProtectedAdminRoute><AdminUsers /></ProtectedAdminRoute>} />

            {/* Event Admin dedicated area */}
            <Route path="/event-admin" element={<ProtectedAdminRoute allowedRoles={["event_admin"]} redirectTo="/admin/login"><EventAdminDashboard /></ProtectedAdminRoute>} />
            <Route path="/event-admin/events" element={<ProtectedAdminRoute allowedRoles={["event_admin"]} redirectTo="/admin/login"><EventAdminEvents /></ProtectedAdminRoute>} />
            <Route path="/event-admin/bookings" element={<ProtectedAdminRoute allowedRoles={["event_admin"]} redirectTo="/admin/login"><EventAdminBookings /></ProtectedAdminRoute>} />

            {/* Staff Scanner area */}
            <Route path="/staff/login" element={<StaffLogin />} />
            <Route path="/staff/scanner" element={<ProtectedAdminRoute allowedRoles={["staff_admin"]} redirectTo="/staff/login"><StaffScanner /></ProtectedAdminRoute>} />
          </Routes>
        </main>

        <footer className="bg-white dark:bg-gray-900 border-t dark:border-gray-700 py-4">
          <div className="container mx-auto text-center text-sm text-gray-500 dark:text-gray-400">© 2025 K&M Events</div>
        </footer>
      </div>
    </DarkModeProvider>
  )
}
