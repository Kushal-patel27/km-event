import React, { useState } from 'react'
import { motion } from 'framer-motion'
import API from '../../services/api'
import { InputField, Button, Modal } from './SettingsComponents'

export default function AccountSettings({ settings, setSettings, showMessage, tokenHeader, saving, setSaving, logout }) {
  const [emailChangeStep, setEmailChangeStep] = useState(null)
  const [newEmail, setNewEmail] = useState('')
  const [emailOtp, setEmailOtp] = useState('')
  const [phoneChangeStep, setPhoneChangeStep] = useState(null)
  const [newPhone, setNewPhone] = useState('')
  const [phoneOtp, setPhoneOtp] = useState('')
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  const updateAccountInfo = async () => {
    setSaving(true)
    try {
      await API.put('/settings/account/info', {
        name: settings.account.name,
        phone: settings.account.phone,
        profileImage: settings.account.profileImage,
      }, tokenHeader())
      showMessage('Account information updated successfully')
    } catch (error) {
      showMessage(error.response?.data?.message || 'Failed to update account', 'error')
    } finally {
      setSaving(false)
    }
  }

  const requestEmailChange = async () => {
    setSaving(true)
    try {
      await API.post('/settings/account/email/request', { newEmail }, tokenHeader())
      setEmailChangeStep('verify')
      showMessage('Verification code sent to your new email')
    } catch (error) {
      showMessage(error.response?.data?.message || 'Failed to send verification code', 'error')
    } finally {
      setSaving(false)
    }
  }

  const verifyEmailChange = async () => {
    setSaving(true)
    try {
      const { data } = await API.post('/settings/account/email/verify', { otp: emailOtp }, tokenHeader())
      setSettings(prev => ({ ...prev, account: { ...prev.account, email: data.email } }))
      setEmailChangeStep(null)
      setNewEmail('')
      setEmailOtp('')
      showMessage('Email updated successfully')
    } catch (error) {
      showMessage(error.response?.data?.message || 'Invalid verification code', 'error')
    } finally {
      setSaving(false)
    }
  }

  const requestPhoneChange = async () => {
    setSaving(true)
    try {
      await API.post('/settings/account/phone/request', { newPhone }, tokenHeader())
      setPhoneChangeStep('verify')
      showMessage('Verification code sent to your new phone')
    } catch (error) {
      showMessage(error.response?.data?.message || 'Failed to send verification code', 'error')
    } finally {
      setSaving(false)
    }
  }

  const verifyPhoneChange = async () => {
    setSaving(true)
    try {
      const { data } = await API.post('/settings/account/phone/verify', { otp: phoneOtp }, tokenHeader())
      setSettings(prev => ({ ...prev, account: { ...prev.account, phone: data.phone } }))
      setPhoneChangeStep(null)
      setNewPhone('')
      setPhoneOtp('')
      showMessage('Phone number updated successfully')
    } catch (error) {
      showMessage(error.response?.data?.message || 'Invalid verification code', 'error')
    } finally {
      setSaving(false)
    }
  }

  const deactivateAccount = async () => {
    try {
      await API.post('/settings/account/deactivate', { reason: 'User requested' }, tokenHeader())
      showMessage('Account deactivated')
      logout()
    } catch (error) {
      showMessage('Failed to deactivate account', 'error')
    }
  }

  const requestAccountDeletion = async () => {
    setIsDeletingAccount(true)
    try {
      const { data } = await API.post('/settings/account/delete/request', {}, tokenHeader())
      showMessage(`Account deletion scheduled for ${new Date(data.deletionDate).toLocaleDateString()}. You received an email at ${settings.account.email} with details.`)
      setShowDeleteConfirm(false)
      // Reload settings to reflect deletion status
      setTimeout(() => window.location.reload(), 2000)
    } catch (error) {
      showMessage(error.response?.data?.message || 'Failed to request account deletion. Please try again.', 'error')
    } finally {
      setIsDeletingAccount(false)
    }
  }

  const cancelAccountDeletion = async () => {
    if (!window.confirm('Cancel account deletion request? Your account will not be deleted.')) return
    try {
      await API.post('/settings/account/delete/cancel', {}, tokenHeader())
      showMessage('Account deletion request cancelled')
      setTimeout(() => window.location.reload(), 1500)
    } catch (error) {
      showMessage(error.response?.data?.message || 'Failed to cancel deletion request', 'error')
    }
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-300 bg-clip-text text-transparent">Account Settings</h2>

      {/* Profile Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-300">Profile Information</h3>
        
        {/* Deletion Status Alert */}
        {settings.account?.accountSettings?.deletionScheduledAt && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-600/30 rounded-lg"
          >
            <p className="text-red-700 dark:text-red-300 font-semibold mb-2">
              ⚠️ Account Deletion Scheduled
            </p>
            <p className="text-red-600 dark:text-red-400 text-sm mb-3">
              Your account is scheduled to be deleted on <strong>{new Date(settings.account.accountSettings.deletionScheduledAt).toLocaleDateString()}</strong>
            </p>
            <Button onClick={cancelAccountDeletion} variant="warning" className="text-sm">
              Cancel Deletion
            </Button>
          </motion.div>
        )}
        
        <InputField
          label="Name"
          value={settings.account.name}
          onChange={(e) => setSettings(prev => ({ ...prev, account: { ...prev.account, name: e.target.value } }))}
        />

        <InputField
          label="Profile Image URL"
          value={settings.account.profileImage}
          onChange={(e) => setSettings(prev => ({ ...prev, account: { ...prev.account, profileImage: e.target.value } }))}
          placeholder="https://example.com/avatar.jpg"
        />

        <InputField
          label="Login Method"
          value={settings.account.loginMethod}
          onChange={() => {}}
          disabled
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
          <div className="flex gap-2">
            <input
              type="email"
              value={settings.account.email}
              disabled
              className="flex-1 px-4 py-2 rounded-lg border border-indigo-200 dark:border-indigo-500/30 bg-white/60 dark:bg-gray-600/30 text-gray-900 dark:text-white cursor-not-allowed"
            />
            <Button onClick={() => setEmailChangeStep('request')} variant="primary">
              Change
            </Button>
          </div>
        </div>

        {emailChangeStep === 'request' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-500/30 rounded-lg space-y-2">
            <InputField label="New Email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Enter new email" />
            <Button onClick={requestEmailChange} disabled={saving} fullWidth>
              {saving ? 'Sending...' : 'Send Code'}
            </Button>
          </motion.div>
        )}

        {emailChangeStep === 'verify' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/30 rounded-lg space-y-2">
            <InputField label="Enter OTP" value={emailOtp} onChange={(e) => setEmailOtp(e.target.value)} placeholder="6-digit code" maxLength={6} />
            <Button onClick={verifyEmailChange} disabled={saving} fullWidth variant="primary">
              {saving ? 'Verifying...' : 'Verify'}
            </Button>
          </motion.div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
          <div className="flex gap-2">
            <input
              type="tel"
              value={settings.account.phone}
              onChange={(e) => setSettings(prev => ({ ...prev, account: { ...prev.account, phone: e.target.value } }))}
              className="flex-1 px-4 py-2 rounded-lg border border-indigo-200 dark:border-indigo-500/30 bg-white/80 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              placeholder="10-digit phone number"
            />
            <Button onClick={() => setPhoneChangeStep('request')} variant="primary">
              Verify
            </Button>
          </div>
        </div>

        {phoneChangeStep === 'request' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-500/30 rounded-lg space-y-2">
            <InputField label="New Phone Number" type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="10-digit number" maxLength={10} />
            <Button onClick={requestPhoneChange} disabled={saving} fullWidth>
              {saving ? 'Sending...' : 'Send OTP'}
            </Button>
          </motion.div>
        )}

        {phoneChangeStep === 'verify' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/30 rounded-lg space-y-2">
            <InputField label="Enter OTP" value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value)} placeholder="6-digit code" maxLength={6} />
            <Button onClick={verifyPhoneChange} disabled={saving} fullWidth variant="primary">
              {saving ? 'Verifying...' : 'Verify'}
            </Button>
          </motion.div>
        )}

        <Button onClick={updateAccountInfo} disabled={saving} fullWidth>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Danger Zone */}
      <div className="border-t border-indigo-200 dark:border-indigo-500/30 pt-8">
        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Danger Zone</h3>
        <div className="space-y-3">
          <Button onClick={() => setShowDeactivateConfirm(true)} variant="warning" fullWidth disabled={isDeletingAccount}>
            Deactivate Account
          </Button>
          <Button onClick={() => setShowDeleteConfirm(true)} variant="danger" fullWidth disabled={isDeletingAccount}>
            Delete Account Permanently
          </Button>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={showDeactivateConfirm} onClose={() => setShowDeactivateConfirm(false)} title="Deactivate Account?" danger>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Your account will be temporarily disabled. You can reactivate it anytime by logging back in.</p>
        <div className="flex gap-3">
          <Button onClick={() => setShowDeactivateConfirm(false)} variant="secondary" fullWidth>
            Cancel
          </Button>
          <Button onClick={deactivateAccount} variant="warning" fullWidth>
            Deactivate
          </Button>
        </div>
      </Modal>

      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Account?" danger>
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-600/30 p-4 rounded-lg">
            <p className="text-red-800 dark:text-red-200 font-semibold mb-2">⚠️ This is permanent!</p>
            <ul className="text-red-700 dark:text-red-300 text-sm space-y-1">
              <li>• Your account will be deleted in 30 days</li>
              <li>• A confirmation email will be sent to {settings.account.email}</li>
              <li>• All bookings and data will be permanently deleted</li>
              <li>• You can cancel within 30 days by logging in</li>
            </ul>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            We'll send a confirmation email. You have 30 days to cancel the deletion request.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => setShowDeleteConfirm(false)} variant="secondary" fullWidth disabled={isDeletingAccount}>
              Cancel
            </Button>
            <Button onClick={requestAccountDeletion} variant="danger" fullWidth disabled={isDeletingAccount}>
              {isDeletingAccount ? 'Processing...' : 'Yes, Delete My Account'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
