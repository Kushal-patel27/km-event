import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import Booking from './pages/Booking'
import MyBookings from './pages/MyBookings'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLogin from './pages/AdminLogin'
import AdminEvents from './pages/AdminEvents'
import AdminBookings from './pages/AdminBookings'
import ProtectedAdminRoute from './components/ProtectedAdminRoute'
import { DarkModeProvider } from './context/DarkModeContext'

export default function App(){
  return (
    <DarkModeProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/event/:id" element={<EventDetail />} />
            <Route path="/events" element={<Events />} />
            <Route path="/book/:id" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedAdminRoute><div className="max-w-4xl mx-auto"><h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="bg-white dark:bg-gray-800 p-4 rounded shadow"> <a href="/admin/events" className="text-indigo-600 dark:text-indigo-400">Manage Events</a></div><div className="bg-white dark:bg-gray-800 p-4 rounded shadow"><a href="/admin/bookings" className="text-indigo-600 dark:text-indigo-400">Manage Bookings</a></div></div></div></ProtectedAdminRoute>} />
            <Route path="/admin/events" element={<ProtectedAdminRoute><AdminEvents /></ProtectedAdminRoute>} />
            <Route path="/admin/bookings" element={<ProtectedAdminRoute><AdminBookings /></ProtectedAdminRoute>} />
          </Routes>
        </main>

        <footer className="bg-white dark:bg-gray-900 border-t dark:border-gray-700 py-4">
          <div className="container mx-auto text-center text-sm text-gray-500 dark:text-gray-400">© 2025 K&M Events</div>
        </footer>
      </div>
    </DarkModeProvider>
  )
}
