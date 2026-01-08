import React from 'react'
import { Routes, Route, useLocation, Link } from 'react-router-dom'
import Home from './pages/Home'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import Booking from './pages/Booking'
import MyBookings from './pages/MyBookings'
import BookingSuccess from './pages/BookingSuccess'
import Messages from './pages/Messages'
import Settings from './pages/Settings'
import About from './pages/About'
import Contact from './pages/Contact'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import GenieEffect from './components/GenieEffect'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AuthCallback from './pages/AuthCallback'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLogin from './pages/AdminLogin'
import AdminEvents from './pages/AdminEvents'
import AdminBookings from './pages/AdminBookings'
import AdminDashboard from './pages/AdminDashboard'
import EventAdminDashboard from './pages/EventAdminDashboard'
import EventAdminEvents from './pages/EventAdminEvents'
import EventAdminBookings from './pages/EventAdminBookings'
import EventAdminLogin from './pages/EventAdminLogin'
import StaffLogin from './pages/StaffLogin'
import StaffAdminLogin from './pages/StaffAdminLogin'
import StaffScanner from './pages/StaffScanner'
import StaffAdminDashboard from './pages/StaffAdminDashboard'
import StaffAdminTeam from './pages/StaffAdminTeam'
import StaffAdminEntries from './pages/StaffAdminEntries'
import StaffAdminSettings from './pages/StaffAdminSettings'
import AdminContacts from './pages/AdminContacts'
import AdminTeam from './pages/AdminTeam'
import AdminFAQ from './pages/AdminFAQ'
import AdminHelp from './pages/AdminHelp'
import ProtectedAdminRoute from './components/ProtectedAdminRoute'
import SuperAdminLogin from './pages/SuperAdminLogin'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import SuperAdminUsers from './pages/SuperAdminUsers'
import SuperAdminEvents from './pages/SuperAdminEvents'
import SuperAdminBookings from './pages/SuperAdminBookings'
import SuperAdminLogs from './pages/SuperAdminLogs'
import SuperAdminConfig from './pages/SuperAdminConfig'
import SuperAdminExport from './pages/SuperAdminExport'
import SuperAdminStaff from './pages/SuperAdminStaff'
import ProtectedSuperAdminRoute from './components/ProtectedSuperAdminRoute'
import FAQ from './pages/FAQ'
import HelpCenter from './pages/HelpCenter'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import Cookies from './pages/Cookies'
import GenieAnimationDemo from './pages/GenieAnimationDemo'
import { DarkModeProvider } from './context/DarkModeContext'

export default function App(){
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')
  const isEventAdminRoute = location.pathname.startsWith('/event-admin')
  const isStaffAdminRoute = location.pathname.startsWith('/staff-admin')
  const isStaffRoute = location.pathname.startsWith('/staff')
  const isSuperAdminRoute = location.pathname.startsWith('/super-admin')
  return (
    <DarkModeProvider>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col">
        {!isAdminRoute && !isEventAdminRoute && !isStaffAdminRoute && !isStaffRoute && !isSuperAdminRoute && <Navbar />}
        <main className={isAdminRoute || isEventAdminRoute || isStaffAdminRoute || isStaffRoute ? "flex-1" : "flex-1"}>
          <GenieEffect key={location.pathname}>
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/event/:id" element={<EventDetail />} />
              <Route path="/events" element={<Events />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/cookies" element={<Cookies />} />
              <Route path="/genie-demo" element={<GenieAnimationDemo />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/book/:id" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
              <Route path="/booking-success" element={<BookingSuccess />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Admin routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
            <Route path="/admin/team" element={<ProtectedAdminRoute><AdminTeam /></ProtectedAdminRoute>} />
              <Route path="/admin/events" element={<ProtectedAdminRoute><AdminEvents /></ProtectedAdminRoute>} />
              <Route path="/admin/bookings" element={<ProtectedAdminRoute><AdminBookings /></ProtectedAdminRoute>} />
              <Route path="/admin/contacts" element={<ProtectedAdminRoute><AdminContacts /></ProtectedAdminRoute>} />
            
              {/* Event Admin routes */}
            <Route path="/event-admin/login" element={<EventAdminLogin />} />
              <Route path="/event-admin" element={<ProtectedAdminRoute allowedRoles={["event_admin"]} redirectTo="/event-admin/login"><EventAdminDashboard /></ProtectedAdminRoute>} />
              <Route path="/event-admin/events" element={<ProtectedAdminRoute allowedRoles={["event_admin"]} redirectTo="/event-admin/login"><EventAdminEvents /></ProtectedAdminRoute>} />
              <Route path="/event-admin/bookings" element={<ProtectedAdminRoute allowedRoles={["event_admin"]} redirectTo="/event-admin/login"><EventAdminBookings /></ProtectedAdminRoute>} />

            {/* Staff Admin routes (Gate/Team Manager) */}
            <Route path="/staff-admin/login" element={<StaffAdminLogin />} />
            <Route path="/staff-admin" element={<ProtectedAdminRoute allowedRoles={["staff_admin"]} redirectTo="/staff-admin/login"><StaffAdminDashboard /></ProtectedAdminRoute>} />
            <Route path="/staff-admin/dashboard" element={<ProtectedAdminRoute allowedRoles={["staff_admin"]} redirectTo="/staff-admin/login"><StaffAdminDashboard /></ProtectedAdminRoute>} />
            <Route path="/staff-admin/team" element={<ProtectedAdminRoute allowedRoles={["staff_admin"]} redirectTo="/staff-admin/login"><StaffAdminTeam /></ProtectedAdminRoute>} />
            <Route path="/staff-admin/entries" element={<ProtectedAdminRoute allowedRoles={["staff_admin"]} redirectTo="/staff-admin/login"><StaffAdminEntries /></ProtectedAdminRoute>} />
            <Route path="/staff-admin/settings" element={<ProtectedAdminRoute allowedRoles={["staff_admin"]} redirectTo="/staff-admin/login"><StaffAdminSettings /></ProtectedAdminRoute>} />

            {/* Staff Scanner area (Scanner Only) */}
            <Route path="/staff/login" element={<StaffLogin />} />
            <Route path="/staff/scanner" element={<ProtectedRoute><StaffScanner /></ProtectedRoute>} />

            {/* Super Admin routes */}
            <Route path="/super-admin/login" element={<SuperAdminLogin />} />
            <Route path="/super-admin" element={<ProtectedSuperAdminRoute><SuperAdminDashboard /></ProtectedSuperAdminRoute>} />
            <Route path="/super-admin/users" element={<ProtectedSuperAdminRoute><SuperAdminUsers /></ProtectedSuperAdminRoute>} />
            <Route path="/super-admin/staff" element={<ProtectedSuperAdminRoute><SuperAdminStaff /></ProtectedSuperAdminRoute>} />
            <Route path="/super-admin/events" element={<ProtectedSuperAdminRoute><SuperAdminEvents /></ProtectedSuperAdminRoute>} />
            <Route path="/super-admin/bookings" element={<ProtectedSuperAdminRoute><SuperAdminBookings /></ProtectedSuperAdminRoute>} />
            <Route path="/super-admin/logs" element={<ProtectedSuperAdminRoute><SuperAdminLogs /></ProtectedSuperAdminRoute>} />
            <Route path="/super-admin/config" element={<ProtectedSuperAdminRoute><SuperAdminConfig /></ProtectedSuperAdminRoute>} />
            <Route path="/super-admin/export" element={<ProtectedSuperAdminRoute><SuperAdminExport /></ProtectedSuperAdminRoute>} />
          </Routes>
          </GenieEffect>
        </main>

        {!isSuperAdminRoute && (
          <footer className="bg-white dark:bg-gray-900 border-t dark:border-gray-700 py-8 mt-12">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
                <div className="text-center md:text-left">
                  <p className="text-gray-700 dark:text-gray-300 font-semibold mb-2">K&M Events</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Your gateway to unforgettable live experiences</p>
                </div>
                <div className="flex gap-6 text-sm">
                  <Link to="/about" className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 transition font-semibold">About Us</Link>
                  <Link to="/contact" className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 transition font-semibold">Contact Us</Link>
                </div>
              </div>
              <div className="border-t dark:border-gray-700 pt-6 text-center text-xs text-gray-500 dark:text-gray-400">
                © 2025 K&M Events. All rights reserved.
              </div>
            </div>
          </footer>
        )}
      </div>
    </DarkModeProvider>
  )
}
