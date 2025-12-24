import React from 'react'
import { useAuth } from '../context/AuthContext'

export default function UserProfile() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">Please log in to view your profile.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-32"></div>
        
        <div className="px-8 pb-8">
          <div className="relative -mt-12 mb-6">
            <div className="w-24 h-24 bg-white dark:bg-gray-700 rounded-full p-1 shadow-lg">
              <div className="w-full h-full bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-3xl font-bold text-indigo-600 dark:text-indigo-300">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{user.name}</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">{user.email}</p>

          <div className="space-y-6 border-t border-gray-100 dark:border-gray-700 pt-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
              <p className="text-lg font-medium text-gray-900 dark:text-white">{user.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Email Address</label>
              <p className="text-lg font-medium text-gray-900 dark:text-white">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Account Type</label>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
                {user.isAdmin ? 'Administrator' : 'Personal Account'}
              </span>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-md">
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}