import React, { useEffect, useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import API from '../../services/api'
import formatCurrency from '../../utils/currency'

export default function EventAdminPayouts() {
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [updatingId, setUpdatingId] = useState('')
  const [expandedRow, setExpandedRow] = useState(null)

  useEffect(() => {
    fetchPayouts()
  }, [statusFilter])

  const fetchPayouts = async () => {
    try {
      setLoading(true)
      setError('')
      const params = statusFilter !== 'all' ? { status: statusFilter } : {}
      const res = await API.get('/subscriptions/payouts/event-admin', { params })
      setPayouts(res.data?.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load event admin payouts')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (payoutId, status) => {
    try {
      setUpdatingId(payoutId)
      const res = await API.put(`/subscriptions/payouts/event-admin/${payoutId}/status`, { status })
      const updated = res.data?.data
      if (updated) {
        setPayouts((prev) => prev.map((item) => (item._id === updated._id ? updated : item)))
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update payout status')
    } finally {
      setUpdatingId('')
    }
  }

  return (
    <AdminLayout title="Event Admin Payout Requests">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-600">Review and process payout requests submitted by event admins.</p>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-1 text-xs"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="reversed">Reversed</option>
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-4 text-center text-xs text-gray-500">Loading payouts...</div>
        ) : payouts.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-500">No event admin payout requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full table-fixed text-xs">
              <colgroup>
                <col className="w-[150px]" />
                <col className="w-[100px]" />
                <col className="w-[100px]" />
                <col className="w-[90px]" />
                <col className="w-[80px]" />
                <col className="w-[90px]" />
                <col className="w-[90px]" />
                <col className="w-[120px]" />
                <col className="w-[150px]" />
              </colgroup>
              <thead className="bg-gray-50 text-gray-600 whitespace-nowrap">
                <tr>
                  <th className="px-3 py-2.5 text-left font-semibold">Event Admin</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Amount</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Commission</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Comms</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Tickets</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Method</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Status</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Requested</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payouts.map((payout) => (
                  <React.Fragment key={payout._id}>
                    <tr className="text-gray-700 align-top">
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-gray-900 truncate">{payout.eventAdmin?.name || 'Event Admin'}</div>
                      <div className="text-[11px] text-gray-500 truncate">{payout.eventAdmin?.email || 'No email'}</div>
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-gray-900 whitespace-nowrap">
                      {formatCurrency(payout.totalAmount || 0)}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{formatCurrency(payout.commissionAmount || 0)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{payout.commissionCount ?? 0}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{payout.ticketCount ?? 0}</td>
                    <td className="px-3 py-2.5 capitalize whitespace-nowrap">
                      <div className="font-medium text-gray-900">{(payout.paymentMethod || '').replace('_', ' ')}</div>
                      {payout.upiId && (
                        <div className="text-[11px] text-gray-500">UPI: {payout.upiId}</div>
                      )}
                      {payout.walletId && (
                        <div className="text-[11px] text-gray-500">Wallet: {payout.walletId}</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
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
                    <td className="px-3 py-2.5 text-[11px] text-gray-500 whitespace-nowrap">
                      {payout.requestedAt ? new Date(payout.requestedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => setExpandedRow(expandedRow === payout._id ? null : payout._id)}
                          className="rounded border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100"
                        >
                          {expandedRow === payout._id ? 'Hide' : 'Details'}
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStatus(payout._id, 'processing')}
                          disabled={updatingId === payout._id}
                          className="rounded border border-gray-300 px-2 py-0.5 text-[11px] text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Processing
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStatus(payout._id, 'completed')}
                          disabled={updatingId === payout._id}
                          className="rounded border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50"
                        >
                          Complete
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStatus(payout._id, 'failed')}
                          disabled={updatingId === payout._id}
                          className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          Fail
                        </button>
                      </div>
                    </td>
                    </tr>
                    {expandedRow === payout._id && (
                      <tr className="bg-gray-50">
                        <td colSpan={9} className="px-4 py-3 text-sm text-gray-700">
                          <div className="grid gap-4 md:grid-cols-3">
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase">Request Summary</p>
                              <div className="mt-2 space-y-1 text-sm text-gray-800">
                                <div>Amount: {formatCurrency(payout.totalAmount || 0)}</div>
                                <div>Commission: {formatCurrency(payout.commissionAmount || 0)}</div>
                                <div>Commissions: {payout.commissionCount ?? 0}</div>
                                <div>Tickets: {payout.ticketCount ?? 0}</div>
                                <div>Method: {(payout.paymentMethod || '').replace('_', ' ')}</div>
                                <div>Status: {payout.status}</div>
                                <div>
                                  Requested:{' '}
                                  {payout.requestedAt ? new Date(payout.requestedAt).toLocaleString() : '—'}
                                </div>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase">Events</p>
                              <p className="mt-2 text-sm text-gray-800">
                                {Array.isArray(payout.eventIds) && payout.eventIds.length > 0
                                  ? payout.eventIds.map((event) => event.title || 'Untitled').join(', ')
                                  : '—'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase">Payout Details</p>
                              {payout.bankDetails || payout.upiId || payout.walletId ? (
                                <div className="mt-2 space-y-1 text-sm text-gray-800">
                                  {payout.bankDetails?.accountHolderName && (
                                    <div>{payout.bankDetails.accountHolderName}</div>
                                  )}
                                  {payout.bankDetails?.bankName && (
                                    <div>{payout.bankDetails.bankName}</div>
                                  )}
                                  {payout.bankDetails?.accountNumber && (
                                    <div>Account: {payout.bankDetails.accountNumber}</div>
                                  )}
                                  {payout.bankDetails?.ifscCode && (
                                    <div>IFSC: {payout.bankDetails.ifscCode}</div>
                                  )}
                                  {payout.upiId && (
                                    <div>UPI: {payout.upiId}</div>
                                  )}
                                  {payout.walletId && (
                                    <div>Wallet: {payout.walletId}</div>
                                  )}
                                </div>
                              ) : (
                                <p className="mt-2 text-sm text-gray-500">—</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
