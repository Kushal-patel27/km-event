import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import API from '../../services/api'
import formatCurrency from '../../utils/currency'
import EventAdminLayout from '../../components/layout/EventAdminLayout'

export default function PayoutRequest() {
  const navigate = useNavigate()
  const location = useLocation()
  const [pendingPayout, setPendingPayout] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [payoutAmount, setPayoutAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [requesting, setRequesting] = useState(false)
  const [payoutHistory, setPayoutHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [upiId, setUpiId] = useState('')
  const [walletId, setWalletId] = useState('')
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: ''
  })

  useEffect(() => {
    fetchPendingPayout()
    fetchPayoutHistory()
  }, [])

  const fetchPendingPayout = async () => {
    try {
      setLoading(true)
      const response = await API.get('/subscriptions/payouts/event-admin/pending/amount')
      setPendingPayout(response.data)
      setPayoutAmount(response.data.pendingAmount)
    } catch (err) {
      console.error('Error fetching pending payout:', err)
      setError('Failed to load payout information')
    } finally {
      setLoading(false)
    }
  }

  const fetchPayoutHistory = async () => {
    try {
      setLoadingHistory(true)
      const response = await API.get('/subscriptions/payouts/event-admin/my')
      setPayoutHistory(response.data?.data || [])
    } catch (err) {
      console.error('Error fetching payout history:', err)
      setError(err.response?.data?.message || 'Failed to load payout history')
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleRequestPayout = async (e) => {
    e.preventDefault()

    if (hasActiveRequest) {
      setError('You already have a payout request in progress')
      return
    }

    if (!payoutAmount || payoutAmount <= 0) {
      setError('Please enter a valid payout amount')
      return
    }

    if (payoutAmount < pendingPayout.minPayoutAmount) {
      setError(`Minimum payout amount is ₹${pendingPayout.minPayoutAmount}`)
      return
    }

    if (payoutAmount > pendingPayout.pendingAmount) {
      setError('Payout amount exceeds available balance')
      return
    }

    if (paymentMethod === 'bank_transfer' && (!bankDetails.accountNumber || !bankDetails.ifscCode)) {
      setError('Please provide bank details')
      return
    }

    if (paymentMethod === 'upi' && !upiId.trim()) {
      setError('Please provide UPI ID')
      return
    }

    if (paymentMethod === 'wallet' && !walletId.trim()) {
      setError('Please provide wallet details')
      return
    }

    try {
      setRequesting(true)
      await API.post('/subscriptions/payouts/request', {
        payoutType: 'event_admin',
        paymentMethod,
        amount: parseFloat(payoutAmount),
        upiId: paymentMethod === 'upi' ? upiId.trim() : undefined,
        walletId: paymentMethod === 'wallet' ? walletId.trim() : undefined,
        bankDetails: paymentMethod === 'bank_transfer' ? bankDetails : undefined
      })

      setSuccess('Payout request submitted successfully!')
      await fetchPayoutHistory()
      setTimeout(() => {
        navigate('/event-admin/dashboard')
      }, 2000)
    } catch (err) {
      console.error('Error requesting payout:', err)
      setError(err.response?.data?.message || 'Failed to request payout')
    } finally {
      setRequesting(false)
    }
  }

  const isInitialLoad = loading && !pendingPayout
  const hasActiveRequest = payoutHistory.some((payout) =>
    ['pending', 'processing'].includes(payout.status)
  )

  const isFormDisabled = hasActiveRequest || !pendingPayout || loading

  return (
    <EventAdminLayout title="Event Admin Payout">
      {isInitialLoad && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-300 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {!isInitialLoad && pendingPayout && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Payout Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <div className="text-sm text-gray-600">Available Balance</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                {formatCurrency(pendingPayout.pendingAmount)}
              </div>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <div className="text-sm text-gray-600">Commission Amount</div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(pendingPayout.commissionAmount)}
              </div>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <div className="text-sm text-gray-600">Minimum Payout</div>
              <div className="text-2xl font-bold text-purple-600 mt-1">
                {formatCurrency(pendingPayout.minPayoutAmount)}
              </div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingPayout.payoutFrequency && (
              <div className="border-l-4 border-indigo-500 pl-4">
                <div className="text-sm text-gray-600">Payout Frequency</div>
                <div className="text-lg font-semibold text-indigo-600 mt-1">
                  {pendingPayout.payoutFrequency}
                </div>
              </div>
            )}
            {pendingPayout.commissionCount !== undefined && (
              <div className="border-l-4 border-pink-500 pl-4">
                <div className="text-sm text-gray-600">Commission Count</div>
                <div className="text-lg font-semibold text-pink-600 mt-1">
                  {pendingPayout.commissionCount}
                </div>
              </div>
            )}
            {pendingPayout.ticketCount !== undefined && (
              <div className="border-l-4 border-yellow-500 pl-4">
                <div className="text-sm text-gray-600">Ticket Count</div>
                <div className="text-lg font-semibold text-yellow-600 mt-1">
                  {pendingPayout.ticketCount}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {hasActiveRequest && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            A payout request is already pending or processing. You can submit a new request after it is completed.
          </div>
        )}
        {isInitialLoad && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Loading payout details. Please wait...
          </div>
        )}
        <form onSubmit={handleRequestPayout} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Payout Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-gray-700 font-semibold">₹</span>
              <input
                type="number"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                min={pendingPayout?.minPayoutAmount}
                max={pendingPayout?.pendingAmount}
                step="0.01"
                className="w-full pl-8 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={isFormDisabled}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Min: {formatCurrency(pendingPayout?.minPayoutAmount)} | 
              Max: {formatCurrency(pendingPayout?.pendingAmount)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-3">Payment Method</label>
            <div className="grid grid-cols-2 gap-4">
              {['bank_transfer', 'upi', 'wallet'].map(method => (
                <label
                  key={method}
                  className={`flex items-center p-3 border border-gray-300 rounded-lg ${
                    isFormDisabled ? 'cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4"
                    disabled={isFormDisabled}
                  />
                  <span className="ml-3 capitalize font-semibold">{method.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          {paymentMethod === 'upi' && (
            <div>
              <label className="block text-sm font-semibold mb-2">UPI ID</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g., name@bank"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={isFormDisabled}
              />
            </div>
          )}

          {paymentMethod === 'wallet' && (
            <div>
              <label className="block text-sm font-semibold mb-2">Wallet Details</label>
              <input
                type="text"
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                placeholder="e.g., wallet number or ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={isFormDisabled}
              />
            </div>
          )}

          {paymentMethod === 'bank_transfer' && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
              <h3 className="font-semibold">Bank Account Details</h3>

              <div>
                <label className="block text-sm font-semibold mb-2">Account Holder Name</label>
                <input
                  type="text"
                  value={bankDetails.accountHolderName}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                    disabled={hasActiveRequest}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Bank Name</label>
                  <input
                    type="text"
                    value={bankDetails.bankName}
                    onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={isFormDisabled}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Account Number</label>
                  <input
                    type="text"
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={isFormDisabled}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">IFSC Code</label>
                <input
                  type="text"
                  value={bankDetails.ifscCode}
                  onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value })}
                  placeholder="e.g., HDFC0000123"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                    disabled={isFormDisabled}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={requesting || !payoutAmount || isFormDisabled}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {requesting ? 'Processing...' : 'Request Payout'}
          </button>
        </form>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-300 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Processing Information</h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>✓ Payout requests are processed within 5-7 business days</li>
          <li>✓ A confirmation email will be sent to your registered email</li>
          <li>✓ You can track the status of your payout in the Payouts section</li>
        </ul>
      </div>

      <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Previous Payout Requests</h3>
        {loadingHistory ? (
          <div className="text-sm text-gray-500">Loading payout history...</div>
        ) : payoutHistory.length === 0 ? (
          <div className="text-sm text-gray-500">No payout requests submitted yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[720px] text-sm">
              <thead className="bg-gray-50 text-gray-600 whitespace-nowrap">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold">Commission</th>
                  <th className="px-4 py-3 text-left font-semibold">Tickets</th>
                  <th className="px-4 py-3 text-left font-semibold">Events</th>
                  <th className="px-4 py-3 text-left font-semibold">Method</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Requested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payoutHistory.map((payout) => (
                  <tr key={payout._id} className="text-gray-700 align-top">
                    <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                      {formatCurrency(payout.totalAmount || 0)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatCurrency(payout.commissionAmount || 0)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {payout.ticketCount ?? 0}
                    </td>
                    <td className="px-4 py-3 max-w-[240px]">
                      <div className="text-xs text-gray-600 break-words">
                        {Array.isArray(payout.eventIds) && payout.eventIds.length > 0
                          ? payout.eventIds.map((event) => event.title || 'Untitled').join(', ')
                          : '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {(payout.paymentMethod || '').replace('_', ' ')}
                      </div>
                      {payout.upiId && (
                        <div className="text-xs text-gray-500">UPI: {payout.upiId}</div>
                      )}
                      {payout.walletId && (
                        <div className="text-xs text-gray-500">Wallet: {payout.walletId}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        payout.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : payout.status === 'processing'
                            ? 'bg-blue-100 text-blue-700'
                            : payout.status === 'failed'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                      }`}>
                        {payout.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {payout.requestedAt ? new Date(payout.requestedAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </EventAdminLayout>
  )
}
