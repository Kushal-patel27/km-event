import React, { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import API from '../services/api'

export default function AdminContacts(){
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit] = useState(20)
  const [selectedContact, setSelectedContact] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [replying, setReplying] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchContacts()
  }, [page])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams({
        page,
        limit,
      })
      const res = await API.get(`/admin/contacts?${params}`)
      const normalized = (res.data.contacts || []).map((c) => ({
        ...c,
        replied: c.replied ?? c.status === 'replied',
        replyMessage: c.replyMessage ?? c.reply ?? null,
        repliedAt: c.repliedAt ?? c.replyDate ?? null,
      }))
      setContacts(normalized)
      setTotal(res.data.pagination.total)
    } catch (err) {
      console.error('Failed to load contacts', err)
      setError(err.response?.data?.message || 'Failed to load contact messages')
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async () => {
    if (!replyText.trim()) {
      setError('Reply cannot be empty')
      return
    }

    try {
      setReplying(true)
      setError('')
      await API.put(`/admin/contacts/${selectedContact._id}/reply`, { reply: replyText })
      // Re-fetch to ensure database state is in sync
      await fetchContacts()
      setSelectedContact(null)
      setReplyText('')
      setSuccess('Reply sent and saved')
      setTimeout(() => setSuccess(''), 2500)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reply')
    } finally {
      setReplying(false)
    }
  }

  return (
    <AdminLayout title="Contacts">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Contact Messages</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Total Messages</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{total}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Page</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{page} of {Math.ceil(total / limit)}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {(() => {
            const pending = contacts.filter((c) => !c.replied)
            const replied = contacts.filter((c) => c.replied)

            const renderTable = (items, title) => (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 mb-6">
                <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 font-semibold text-gray-800 text-sm">
                  {title}
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Name</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Email</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Subject</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Date</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                          No messages here.
                        </td>
                      </tr>
                    ) : (
                      items.map(contact => (
                        <tr key={contact._id} className="hover:bg-gray-50 transition">
                          <td className="px-5 py-4">
                            <p className="font-semibold text-gray-900">{contact.name || '—'}</p>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-600">
                            <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                              {contact.email || '—'}
                            </a>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-600">
                            {contact.subject || '—'}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                contact.replied
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {contact.replied ? 'Replied' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-600">
                            {contact.createdAt ? new Date(contact.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-5 py-4 text-sm space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSelectedContact(contact)
                                setReplyText(contact.replyMessage || '')
                              }}
                              className="text-blue-600 hover:text-blue-900 font-medium"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )

            return (
              <>
                {renderTable(pending, 'Pending messages')}
                {renderTable(replied, 'Previously replied')}
              </>
            )
          })()}

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {contacts.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
                {Math.min(page * limit, total)} of {total} messages
              </p>
              <div className="space-x-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={page * limit >= total}
                  onClick={() => setPage(page + 1)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Contact Details Modal */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Contact Message</h3>
                <button
                  onClick={() => setSelectedContact(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-gray-600 text-sm font-medium">From</p>
                  <p className="font-semibold text-gray-900">{selectedContact.name}</p>
                  <a href={`mailto:${selectedContact.email}`} className="text-blue-600 hover:underline text-sm">
                    {selectedContact.email}
                  </a>
                </div>

                <div>
                  <p className="text-gray-600 text-sm font-medium">Subject</p>
                  <p className="font-semibold text-gray-900">{selectedContact.subject || '—'}</p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm font-medium">Message</p>
                  <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {selectedContact.message}
                  </p>
                </div>

                {selectedContact.replyMessage && (
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Your Reply</p>
                    <p className="text-gray-900 whitespace-pre-wrap bg-green-50 p-3 rounded-lg border border-green-200">
                      {selectedContact.replyMessage}
                    </p>
                    {selectedContact.repliedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Sent: {new Date(selectedContact.repliedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <p className="text-gray-600 text-sm font-medium">Received</p>
                  <p className="text-gray-900 text-sm">
                    {selectedContact.createdAt ? new Date(selectedContact.createdAt).toLocaleString() : '—'}
                  </p>
                </div>
              </div>

              {/* Reply Form */}
              <div className="border-t border-gray-200 pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Send Reply</label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply here..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setSelectedContact(null)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Close
                </button>
                <button
                  onClick={handleReply}
                  disabled={replying || !replyText.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                >
                  {replying ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
