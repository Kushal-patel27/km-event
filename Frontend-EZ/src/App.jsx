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
import AdminUsers from './pages/AdminUsers'
import EventAdminDashboard from './pages/EventAdminDashboard'
import EventAdminEvents from './pages/EventAdminEvents'
import EventAdminBookings from './pages/EventAdminBookings'
import StaffLogin from './pages/StaffLogin'
import StaffScanner from './pages/StaffScanner'
import AdminContacts from './pages/AdminContacts'
import AdminFAQ from './pages/AdminFAQ'
import AdminHelp from './pages/AdminHelp'
import ProtectedAdminRoute from './components/ProtectedAdminRoute'
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
  const isStaffRoute = location.pathname.startsWith('/staff')
  return (
    <DarkModeProvider>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col">
        {!isAdminRoute && !isStaffRoute && <Navbar />}
        <main className={isAdminRoute || isStaffRoute ? "flex-1" : "flex-1"}>
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
              <Route path="/admin/contacts" element={<ProtectedAdminRoute><AdminContacts /></ProtectedAdminRoute>} />
              <Route path="/admin/faq" element={<ProtectedAdminRoute><AdminFAQ /></ProtectedAdminRoute>} />
              <Route path="/admin/help" element={<ProtectedAdminRoute><AdminHelp /></ProtectedAdminRoute>} />
            </Routes>
          </GenieEffect>
        </main>

        <Footer />
      </div>
    </DarkModeProvider>
  )
}
