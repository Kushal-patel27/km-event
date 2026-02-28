import React from 'react'
import { Routes, Route, useLocation, Link, Navigate } from 'react-router-dom'
// Public Pages
import Home from './pages/public/Home'
import Events from './pages/public/Events'
import EventDetail from './pages/public/EventDetail'
import Booking from './pages/public/Booking'
import MyBookings from './pages/public/MyBookings'
import BookingSuccess from './pages/public/BookingSuccess'
import Messages from './pages/public/Messages'
import Settings from './pages/public/Settings'
import About from './pages/public/About'
import Contact from './pages/public/Contact'
import FAQ from './pages/public/FAQ'
import HelpCenter from './pages/public/HelpCenter'
import Privacy from './pages/public/Privacy'
import TermsOfService from './pages/public/TermsOfService'
import Cookies from './pages/public/Cookies'
import CreateEventRequest from './pages/public/CreateEventRequest'
import MyEventRequests from './pages/public/MyEventRequests'
import ForOrganizers from './pages/public/ForOrganizers'
import QRScannerTestPage from './pages/public/QRScannerTestPage'
import Waitlist from './pages/public/Waitlist'
// Auth Pages
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import ForgotPassword from './pages/auth/ForgotPassword'
import AuthCallback from './pages/auth/AuthCallback'
import SetPassword from './pages/auth/SetPassword'
// Admin Pages
import AdminLogin from './pages/admin/AdminLogin'
import AdminEvents from './pages/admin/AdminEvents'
import AdminBookings from './pages/admin/AdminBookings'
import BookingSearchDashboard from './pages/admin/BookingSearchDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminContacts from './pages/admin/AdminContacts'
import AdminTeam from './pages/admin/AdminTeam'
import FAQManager from './pages/admin/FAQManager'
import HelpManager from './pages/admin/HelpManager'
import ForOrganizersContentManager from './pages/admin/ForOrganizersContentManager'
import AdminFeatureToggles from './pages/admin/AdminFeatureToggles'
import AdminCouponManager from './pages/admin/AdminCouponManager'
// Event Admin Pages
import EventAdminDashboard from './pages/event-admin/EventAdminDashboard'
import EventAdminEvents from './pages/event-admin/EventAdminEvents'
import EventAdminBookings from './pages/event-admin/EventAdminBookings'
import EventAdminLogin from './pages/event-admin/EventAdminLogin'
import EventAdminFeatures from './pages/event-admin/EventAdminFeatures'
import EventAdminCouponManager from './pages/event-admin/EventAdminCouponManager'
// Staff Admin Pages
import StaffAdminLogin from './pages/staff-admin/StaffAdminLogin'
import StaffAdminDashboard from './pages/staff-admin/StaffAdminDashboard'
import StaffAdminTeam from './pages/staff-admin/StaffAdminTeam'
import StaffAdminEntries from './pages/staff-admin/StaffAdminEntries'
import StaffAdminSettings from './pages/staff-admin/StaffAdminSettings'
// Staff Pages
import StaffLogin from './pages/staff/StaffLogin'
import StaffScanner from './pages/staff/StaffScanner'
import HighPerformanceScannerScreen from './pages/staff/HighPerformanceScannerScreen'
import StaffLayout from './components/layout/StaffLayout'
import ScannerAnalyticsDashboard from './pages/admin/ScannerAnalyticsDashboard'
// Super Admin Pages
import SuperAdminLogin from './pages/super-admin/SuperAdminLogin'
import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard'
import SuperAdminUsers from './pages/super-admin/SuperAdminUsers'
import SuperAdminEvents from './pages/super-admin/SuperAdminEvents'
import EventRequests from './pages/super-admin/EventRequests'
import SuperAdminBookings from './pages/super-admin/SuperAdminBookings'
import SuperAdminLogs from './pages/super-admin/SuperAdminLogs'
import SuperAdminConfig from './pages/super-admin/SuperAdminConfig'
import SuperAdminExport from './pages/super-admin/SuperAdminExport'
import SuperAdminStaff from './pages/super-admin/SuperAdminStaff'
import Subscriptions from './pages/super-admin/Subscriptions'
import FeatureToggles from './pages/super-admin/FeatureToggles'
// Subscription & Commission Pages (Admin)
import SubscriptionPlanManager from './pages/admin/SubscriptionPlanManager'
import OrganizerSubscriptionManager from './pages/admin/OrganizerSubscriptionManager'
import CommissionAnalytics from './pages/admin/CommissionAnalytics'
import SubscriptionDashboard from './pages/admin/SubscriptionDashboard'
import SubscriptionSetup from './pages/admin/SubscriptionSetup'
import EventAdminPayouts from './pages/admin/EventAdminPayouts'
// Subscription & Commission Pages (Organizer)
import OrganizerRevenueDashboard from './pages/event-admin/OrganizerRevenueDashboard'
import PayoutRequest from './pages/event-admin/PayoutRequest'
import OrganizerMainDashboard from './pages/event-admin/OrganizerMainDashboard'
// Layout Components
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
// Common Components
import ScrollToTop from './components/common/ScrollToTop'
import SessionNotification from './components/common/SessionNotification'
import CursorHearts from './components/common/CursorHearts'
// Auth Components
import ProtectedRoute from './components/auth/ProtectedRoute'
import ProtectedAdminRoute from './components/auth/ProtectedAdminRoute'
import ProtectedSuperAdminRoute from './components/auth/ProtectedSuperAdminRoute'
// Context
import { DarkModeProvider } from './context/DarkModeContext'
import { LoadingProvider } from './context/LoadingContext'

export default function App(){
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')
  const isEventAdminRoute = location.pathname.startsWith('/event-admin')
  const isStaffAdminRoute = location.pathname.startsWith('/staff-admin')
  const isStaffRoute = location.pathname.startsWith('/staff')
  const isSuperAdminRoute = location.pathname.startsWith('/super-admin')
  const isLoginRoute = location.pathname === '/login' || location.pathname === '/admin/login' || location.pathname === '/event-admin/login' || location.pathname === '/staff/login' || location.pathname === '/super-admin/login'
  const isSignupRoute = location.pathname === '/signup'
  const isForgotPasswordRoute = location.pathname === '/forgot-password'
  const isAuthRoute = isLoginRoute || isSignupRoute || isForgotPasswordRoute
  return (
    <DarkModeProvider>
      <LoadingProvider>
        <ScrollToTop />
        <SessionNotification />
      {/*  // <CursorHearts />*/ }
       <div className="min-h-screen flex flex-col">{!isAdminRoute && !isEventAdminRoute && !isStaffAdminRoute && !isStaffRoute && !isSuperAdminRoute && <Navbar />}
        <main className={isAdminRoute || isEventAdminRoute || isStaffAdminRoute || isStaffRoute ? "flex-1" : "flex-1"}>
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/event/:id" element={<EventDetail />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/events" element={<Events />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/cookies" element={<Cookies />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/for-organizers" element={<ForOrganizers />} />
              <Route path="/qr-scanner-test" element={<QRScannerTestPage />} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/book/:id" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
              <Route path="/booking-success" element={<BookingSuccess />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/waitlist" element={<ProtectedRoute><Waitlist /></ProtectedRoute>} />
              <Route path="/create-event" element={<ProtectedRoute><CreateEventRequest /></ProtectedRoute>} />
              <Route path="/my-event-requests" element={<ProtectedRoute><MyEventRequests /></ProtectedRoute>} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/set-password" element={<ProtectedRoute><SetPassword /></ProtectedRoute>} />

              {/* Admin routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
            <Route path="/admin/team" element={<ProtectedAdminRoute><AdminTeam /></ProtectedAdminRoute>} />
              <Route path="/admin/events" element={<ProtectedAdminRoute><AdminEvents /></ProtectedAdminRoute>} />
              <Route path="/admin/bookings" element={<ProtectedAdminRoute><AdminBookings /></ProtectedAdminRoute>} />
              <Route path="/admin/booking-search" element={<ProtectedAdminRoute><BookingSearchDashboard /></ProtectedAdminRoute>} />
              <Route path="/admin/contacts" element={<ProtectedAdminRoute><AdminContacts /></ProtectedAdminRoute>} />
              <Route path="/admin/faq" element={<ProtectedAdminRoute><FAQManager /></ProtectedAdminRoute>} />
              <Route path="/admin/help" element={<ProtectedAdminRoute><HelpManager /></ProtectedAdminRoute>} />
              <Route path="/admin/organizers-content" element={<ProtectedAdminRoute><ForOrganizersContentManager /></ProtectedAdminRoute>} />
              <Route path="/admin/events/:eventId/features" element={<ProtectedAdminRoute><AdminFeatureToggles /></ProtectedAdminRoute>} />
              <Route path="/admin/subscription-plans" element={<ProtectedAdminRoute><SubscriptionPlanManager /></ProtectedAdminRoute>} />
              <Route path="/admin/organizer-subscriptions" element={<ProtectedAdminRoute><OrganizerSubscriptionManager /></ProtectedAdminRoute>} />
              <Route path="/admin/commission-analytics" element={<ProtectedAdminRoute><CommissionAnalytics /></ProtectedAdminRoute>} />
              <Route path="/admin/subscriptions" element={<ProtectedAdminRoute><SubscriptionDashboard /></ProtectedAdminRoute>} />
              <Route path="/admin/subscription-setup" element={<ProtectedAdminRoute><SubscriptionSetup /></ProtectedAdminRoute>} />
              <Route path="/admin/event-admin-payouts" element={<ProtectedAdminRoute><EventAdminPayouts /></ProtectedAdminRoute>} />
              <Route path="/admin/coupons" element={<ProtectedAdminRoute><AdminCouponManager /></ProtectedAdminRoute>} />
            
              {/* Event Admin routes */}
            <Route path="/event-admin/login" element={<EventAdminLogin />} />
              <Route path="/event-admin" element={<ProtectedAdminRoute allowedRoles={["event_admin"]} redirectTo="/event-admin/login"><EventAdminDashboard /></ProtectedAdminRoute>} />
              <Route path="/event-admin/events" element={<ProtectedAdminRoute allowedRoles={["event_admin"]} redirectTo="/event-admin/login"><EventAdminEvents /></ProtectedAdminRoute>} />
              <Route path="/event-admin/bookings" element={<ProtectedAdminRoute allowedRoles={["event_admin"]} redirectTo="/event-admin/login"><EventAdminBookings /></ProtectedAdminRoute>} />
            <Route path="/event-admin/:eventId/features" element={<ProtectedAdminRoute allowedRoles={["event_admin"]} redirectTo="/event-admin/login"><EventAdminFeatures /></ProtectedAdminRoute>} />
            <Route path="/event-admin/coupons" element={<ProtectedAdminRoute allowedRoles={["event_admin"]} redirectTo="/event-admin/login"><EventAdminCouponManager /></ProtectedAdminRoute>} />
            <Route path="/staff-admin" element={<ProtectedAdminRoute allowedRoles={["staff_admin"]} redirectTo="/staff-admin/login"><StaffAdminDashboard /></ProtectedAdminRoute>} />
            <Route path="/staff-admin/dashboard" element={<ProtectedAdminRoute allowedRoles={["staff_admin"]} redirectTo="/staff-admin/login"><StaffAdminDashboard /></ProtectedAdminRoute>} />
            <Route path="/staff-admin/team" element={<ProtectedAdminRoute allowedRoles={["staff_admin"]} redirectTo="/staff-admin/login"><StaffAdminTeam /></ProtectedAdminRoute>} />
            <Route path="/staff-admin/entries" element={<ProtectedAdminRoute allowedRoles={["staff_admin"]} redirectTo="/staff-admin/login"><StaffAdminEntries /></ProtectedAdminRoute>} />
            <Route path="/staff-admin/settings" element={<ProtectedAdminRoute allowedRoles={["staff_admin"]} redirectTo="/staff-admin/login"><StaffAdminSettings /></ProtectedAdminRoute>} />

            {/* Staff Scanner area (Scanner Only) */}
            <Route path="/staff/login" element={<StaffLogin />} />
            <Route path="/staff/scanner" element={<ProtectedRoute><StaffScanner /></ProtectedRoute>} />
            <Route path="/staff/hp-scanner" element={<Navigate to="/staff/scanner" replace />} />

            {/* Event Admin Routes */}
            <Route path="/event-admin/dashboard" element={<ProtectedRoute allowedRoles={["event_admin"]}><OrganizerMainDashboard /></ProtectedRoute>} />
            <Route path="/event-admin/revenue" element={<ProtectedRoute allowedRoles={["event_admin"]}><OrganizerRevenueDashboard /></ProtectedRoute>} />
            <Route path="/event-admin/payout" element={<ProtectedRoute allowedRoles={["event_admin"]}><PayoutRequest /></ProtectedRoute>} />

            {/* Super Admin routes */}
            <Route path="/super-admin/login" element={<SuperAdminLogin />} />
            <Route path="/super-admin" element={<ProtectedSuperAdminRoute><SuperAdminDashboard /></ProtectedSuperAdminRoute>} />
            <Route path="/super-admin/users" element={<ProtectedSuperAdminRoute><SuperAdminUsers /></ProtectedSuperAdminRoute>} />
            <Route path="/super-admin/staff" element={<ProtectedSuperAdminRoute><SuperAdminStaff /></ProtectedSuperAdminRoute>} />
            <Route path="/super-admin/events" element={<ProtectedSuperAdminRoute><SuperAdminEvents /></ProtectedSuperAdminRoute>} />
            <Route path="/super-admin/event-requests" element={<ProtectedSuperAdminRoute><EventRequests /></ProtectedSuperAdminRoute>} />
            <Route path="/super-admin/bookings" element={<ProtectedSuperAdminRoute><SuperAdminBookings /></ProtectedSuperAdminRoute>} />
            <Route path="/super-admin/logs" element={<ProtectedSuperAdminRoute><SuperAdminLogs /></ProtectedSuperAdminRoute>} />
            <Route path="/super-admin/config" element={<ProtectedSuperAdminRoute><SuperAdminConfig /></ProtectedSuperAdminRoute>} />
            <Route path="/super-admin/export" element={<ProtectedSuperAdminRoute><SuperAdminExport /></ProtectedSuperAdminRoute>} />
            <Route path="/super-admin/subscriptions" element={<ProtectedSuperAdminRoute><Subscriptions /></ProtectedSuperAdminRoute>} />
            <Route path="/super-admin/event-requests/:eventId/features" element={<ProtectedSuperAdminRoute><FeatureToggles /></ProtectedSuperAdminRoute>} />
            <Route path="/super-admin/scanner-analytics" element={<ProtectedSuperAdminRoute><ScannerAnalyticsDashboard /></ProtectedSuperAdminRoute>} />
          </Routes>
        </main>

        {!isAdminRoute && !isEventAdminRoute && !isStaffAdminRoute && !isStaffRoute && !isSuperAdminRoute && !isAuthRoute && <Footer />}
      </div>
      </LoadingProvider>
    </DarkModeProvider>
  )
}
