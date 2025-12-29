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
import Login from './pages/Login'
import Signup from './pages/Signup'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLogin from './pages/AdminLogin'
import AdminEvents from './pages/AdminEvents'
import AdminBookings from './pages/AdminBookings'
import AdminDashboard from './pages/AdminDashboard'
import AdminContacts from './pages/AdminContacts'
import ProtectedAdminRoute from './components/ProtectedAdminRoute'
import { DarkModeProvider } from './context/DarkModeContext'

export default function App(){
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')
  return (
    <DarkModeProvider>
      <div className="min-h-screen flex flex-col">
        {!isAdminRoute && <Navbar />}
        <main className={isAdminRoute ? "flex-1" : "flex-1"}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/event/:id" element={<EventDetail />} />
            <Route path="/events" element={<Events />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/book/:id" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
            <Route path="/booking-success" element={<BookingSuccess />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
            <Route path="/admin/events" element={<ProtectedAdminRoute><AdminEvents /></ProtectedAdminRoute>} />
            <Route path="/admin/bookings" element={<ProtectedAdminRoute><AdminBookings /></ProtectedAdminRoute>} />
            <Route path="/admin/contacts" element={<ProtectedAdminRoute><AdminContacts /></ProtectedAdminRoute>} />
          </Routes>
        </main>

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
      </div>
    </DarkModeProvider>
  )
}
