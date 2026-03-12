import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import API from '../../services/api'
import { useDarkMode } from '../../context/DarkModeContext'

export default function CompleteWhatsappNumber() {
  const { user, login, logout } = useAuth()
  const { isDarkMode } = useDarkMode()
  const navigate = useNavigate()

  const [whatsappNumber, setWhatsappNumber] = useState(user?.whatsappNumber || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleContinueWithoutWhatsapp = () => {
    login({
      ...user,
      skipWhatsappPrompt: true,
    })
    navigate('/', { replace: true })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await API.put('/auth/profile', { whatsappNumber })
      login({
        ...user,
        ...data,
        whatsappNumber: data.whatsappNumber,
        requiresWhatsappNumber: data.requiresWhatsappNumber,
        token: data.token || user?.token,
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save WhatsApp number')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
      <div className={`w-full max-w-md rounded-xl border p-6 ${isDarkMode ? 'bg-black border-gray-800 text-gray-100' : 'bg-white border-gray-200 text-gray-900'}`}>
        <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-red-400' : 'text-blue-700'}`}>Add WhatsApp Number</h1>
        <p className={`text-sm mb-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          A WhatsApp number is required to receive booking confirmations and ticket links.
        </p>

        {error && (
          <div className={`text-sm p-3 rounded-lg mb-4 ${
            isDarkMode
              ? 'bg-red-500/20 text-red-300 border border-red-500/50'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>WhatsApp Number</label>
            <input
              type="tel"
              required
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="+919876543210"
              className={`w-full px-4 py-3 rounded-lg border transition-all outline-none ${
                isDarkMode
                  ? 'bg-black border-gray-800 text-gray-100 placeholder-gray-500 focus:border-red-400 focus:ring-2 focus:ring-red-500/20'
                  : 'bg-white border-blue-200 text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-200'
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
              isDarkMode ? 'bg-red-700 hover:bg-red-800' : 'bg-blue-700 hover:bg-blue-800'
            } disabled:opacity-60`}
          >
            {loading ? 'Saving...' : 'Save and Continue'}
          </button>

          <button
            type="button"
            onClick={handleContinueWithoutWhatsapp}
            className={`w-full py-2 text-sm rounded-lg border ${
              isDarkMode
                ? 'border-gray-700 text-gray-300 hover:bg-gray-900'
                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            Continue without WhatsApp
          </button>

          <button
            type="button"
            onClick={logout}
            className={`w-full py-2 text-sm rounded-lg border ${
              isDarkMode
                ? 'border-gray-700 text-gray-300 hover:bg-gray-900'
                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            Logout
          </button>
        </form>
      </div>
    </div>
  )
}
