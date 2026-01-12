import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import API from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useDarkMode } from '../context/DarkModeContext'

export default function Settings(){
  const { user, login, logout } = useAuth()
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState(null)

  const [security, setSecurity] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [securitySaving, setSecuritySaving] = useState(false)
  const [securityMsg, setSecurityMsg] = useState(null)

  const [prefs, setPrefs] = useState({ emailUpdates: true, bookingReminders: true, newsletter: false, language: 'en', timezone: 'UTC' })
  const [prefsMsg, setPrefsMsg] = useState(null)
  const [dataExport, setDataExport] = useState(null)
  const [resetOtp, setResetOtp] = useState('')
  const [resetNewPassword, setResetNewPassword] = useState('')
  const [resetConfirmPassword, setResetConfirmPassword] = useState('')
  const [resetStatus, setResetStatus] = useState(null)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)

  useEffect(()=>{
    const load = async () => {
      if (!user) return
      try {
        const { data } = await API.get('/auth/preferences', tokenHeader())
        setPrefs(prev => ({ ...prev, ...data }))
      } catch {}
    }
    load()
  },[user])

  const tokenHeader = () => {
    const token = user?.token || localStorage.getItem('token')
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    setProfileSaving(true)
    setProfileMsg(null)
    try {
      const { data } = await API.put('/auth/profile', profile, tokenHeader())
      // Update auth context with refreshed token from server
      login({ ...user, ...data })
      setProfileMsg({ type: 'success', text: 'Profile updated successfully' })
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' })
    } finally {
      setProfileSaving(false)
    }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    setSecurityMsg(null)
    if(security.newPassword !== security.confirmPassword){
      setSecurityMsg({ type: 'error', text: 'New password and confirmation do not match' })
      return
    }
    try {
      setSecuritySaving(true)
      await API.put('/auth/password', { currentPassword: security.currentPassword, newPassword: security.newPassword }, tokenHeader())
      setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setSecurityMsg({ type: 'success', text: 'Password updated successfully' })
    } catch (err) {
      setSecurityMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password' })
    } finally {
      setSecuritySaving(false)
    }
  }

  const sendOtpForReset = async () => {
    setResetStatus(null)
    const targetEmail = profile.email || user?.email
    if(!targetEmail){
      setResetStatus({ type: 'error', text: 'Email is required to send OTP' })
      return
    }
    try {
      setSendingOtp(true)
      const { data } = await API.post('/auth/password/forgot', { email: targetEmail })
      setResetStatus({ type: 'success', text: data?.message || 'If the account exists, we sent an OTP' })
    } catch (err) {
      setResetStatus({ type: 'error', text: err.response?.data?.message || 'Failed to send OTP' })
    } finally {
      setSendingOtp(false)
    }
  }

  const resetPasswordWithOtp = async (e) => {
    e.preventDefault()
    setResetStatus(null)
    const targetEmail = profile.email || user?.email
    if(!resetOtp || !resetNewPassword){
      setResetStatus({ type: 'error', text: 'OTP and new password are required' })
      return
    }
    if(resetNewPassword !== resetConfirmPassword){
      setResetStatus({ type: 'error', text: 'New password and confirmation do not match' })
      return
    }
    try {
      setResettingPassword(true)
      const { data } = await API.post('/auth/password/reset', {
        email: targetEmail,
        otp: resetOtp,
        newPassword: resetNewPassword,
      })
      setResetStatus({ type: 'success', text: data?.message || 'Password reset successfully' })
      setResetOtp('')
      setResetNewPassword('')
      setResetConfirmPassword('')
      setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setResetStatus({ type: 'error', text: err.response?.data?.message || 'Failed to reset password' })
    } finally {
      setResettingPassword(false)
    }
  }

  const savePrefs = async (next) => {
    try {
      setPrefs(next)
      const { data } = await API.put('/auth/preferences', next, tokenHeader())
      setPrefs(data)
      setPrefsMsg('Preferences saved')
      setTimeout(()=> setPrefsMsg(null), 2000)
    } catch (err) {
      setPrefsMsg('Failed to save preferences')
      setTimeout(()=> setPrefsMsg(null), 2000)
    }
  }

  const logoutAllDevices = async () => {
    try {
      await API.post('/auth/logout-all', {}, tokenHeader())
      // Force local logout
      logout()
    } catch {}
  }

  const downloadMyData = async () => {
    try {
      const { data } = await API.get('/auth/my-data', tokenHeader())
      setDataExport(data)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `km-events-data-${new Date().toISOString().slice(0,10)}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {}
  }

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen py-16 px-4 sm:px-6 lg:px-12">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your account, security, and preferences</p>
        </motion.div>

        {/* Profile */}
        <section className="mb-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Profile</h2>

            {profileMsg && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${profileMsg.type==='success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800'}`}>
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={saveProfile} className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input value={profile.name} onChange={e=>setProfile(p=>({...p, name: e.target.value}))} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input type="email" value={profile.email} onChange={e=>setProfile(p=>({...p, email: e.target.value}))} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100" required />
              </div>
              <div className="sm:col-span-2">
                <button disabled={profileSaving} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-60">
                  {profileSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Security */}
        <section className="mb-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Security</h2>

            {securityMsg && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${securityMsg.type==='success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800'}`}>
                {securityMsg.text}
              </div>
            )}

            <form onSubmit={savePassword} className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                <input type="password" value={security.currentPassword} onChange={e=>setSecurity(s=>({...s, currentPassword: e.target.value}))} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                <input type="password" value={security.newPassword} onChange={e=>setSecurity(s=>({...s, newPassword: e.target.value}))} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
                <input type="password" value={security.confirmPassword} onChange={e=>setSecurity(s=>({...s, confirmPassword: e.target.value}))} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100" required />
              </div>
              <div className="sm:col-span-3">
                <button disabled={securitySaving} className="px-5 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:opacity-90 rounded-lg font-semibold disabled:opacity-60">
                  {securitySaving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reset via email OTP</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Send a code to {profile.email || user?.email || 'your email'} to reset without the current password.</p>
                </div>
                <button
                  type="button"
                  onClick={sendOtpForReset}
                  disabled={sendingOtp}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60"
                >
                  {sendingOtp ? 'Sending...' : 'Send OTP'}
                </button>
              </div>

              {resetStatus && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${resetStatus.type==='success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800'}`}>
                  {resetStatus.text}
                </div>
              )}

              <form onSubmit={resetPasswordWithOtp} className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">OTP code</label>
                  <input type="text" value={resetOtp} onChange={e=>setResetOtp(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="6-digit code" maxLength={6} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New password</label>
                  <input type="password" value={resetNewPassword} onChange={e=>setResetNewPassword(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm new password</label>
                  <input type="password" value={resetConfirmPassword} onChange={e=>setResetConfirmPassword(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100" required />
                </div>
                <div className="sm:col-span-3">
                  <button disabled={resettingPassword} className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-60">
                    {resettingPassword ? 'Updating...' : 'Reset password with OTP'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="mb-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Appearance</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Toggle dark mode</p>
            </div>
            <button onClick={toggleDarkMode} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700">
              {isDarkMode ? 'Disable Dark Mode' : 'Enable Dark Mode'}
            </button>
          </div>
        </section>

        {/* Preferences */}
        <section className="mb-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Preferences</h2>
            {prefsMsg && <div className="mb-4 p-3 rounded-lg text-sm bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800">{prefsMsg}</div>}
            <div className="space-y-3">
              <label className="flex items-center justify-between py-2">
                <span className="text-gray-800 dark:text-gray-200">Email updates</span>
                <input type="checkbox" checked={prefs.emailUpdates} onChange={e=>savePrefs({...prefs, emailUpdates: e.target.checked})} />
              </label>
              <label className="flex items-center justify-between py-2">
                <span className="text-gray-800 dark:text-gray-200">Booking reminders</span>
                <input type="checkbox" checked={prefs.bookingReminders} onChange={e=>savePrefs({...prefs, bookingReminders: e.target.checked})} />
              </label>
              <label className="flex items-center justify-between py-2">
                <span className="text-gray-800 dark:text-gray-200">Newsletter</span>
                <input type="checkbox" checked={prefs.newsletter} onChange={e=>savePrefs({...prefs, newsletter: e.target.checked})} />
              </label>
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Language</label>
                  <select value={prefs.language} onChange={e=>savePrefs({...prefs, language: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="es">Spanish</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timezone</label>
                  <select value={prefs.timezone} onChange={e=>savePrefs({...prefs, timezone: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                    <option value="UTC">UTC</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="Europe/London">Europe/London</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy & Data */}
        <section className="mb-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Privacy & Data</h2>
            <div className="flex flex-wrap gap-3">
              <button onClick={downloadMyData} className="px-5 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:opacity-90 rounded-lg font-semibold">Download my data</button>
              <button onClick={logoutAllDevices} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold">Logout from all devices</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
