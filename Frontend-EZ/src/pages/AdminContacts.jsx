import React, { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import API from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function AdminContacts(){
  const { user } = useAuth()
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState(null)

  const authConfig = useMemo(() => {
    const token = user?.token || localStorage.getItem('token')
    return { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
  }, [user])

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await API.get('/contact', authConfig)
      setContacts(res.data || [])
    } catch (err) {
      console.error('Failed to load contact messages', err)
      setError('Failed to load contact messages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleReply = async (id) => {
    const reply = window.prompt('Enter your reply (this will be stored)')
    if (!reply) return
    try {
      setActionId(id)
      await API.put(`/contact/${id}`, { reply }, authConfig)
      await load()
    } catch (err) {
      console.error('Reply failed', err)
      alert('Failed to reply. Please try again.')
    } finally {
      setActionId(null)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message?')) return
    try {
      setActionId(id)
      await API.delete(`/contact/${id}`, authConfig)
      setContacts(prev => prev.filter(c => c._id !== id))
    } catch (err) {
      console.error('Delete failed', err)
      alert('Failed to delete. Please try again.')
    } finally {
      setActionId(null)
    }
  }

  const badgeClass = (status) => {
    switch (status) {
      case 'replied':
        return 'bg-green-100 text-green-700'
      case 'read':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <AdminLayout title="Contact Messages">
      {loading && <div className="text-sm text-gray-500">Loading messages…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && !error && contacts.length === 0 && (
        <div className="text-sm text-gray-500">No contact messages yet.</div>
      )}

      {!loading && !error && contacts.length > 0 && (
        <div className="space-y-3">
          {contacts.map(msg => (
            <div key={msg._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col">
                  <div className="font-semibold text-lg">{msg.subject || 'No subject'}</div>
                  <div className="text-sm text-gray-500">
                    {msg.name} • <a className="underline" href={`mailto:${msg.email}`}>{msg.email}</a>
                  </div>
                  <div className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleString()}</div>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full ${badgeClass(msg.status)}`}>
                  {msg.status || 'new'}
                </span>
              </div>

              <div className="mt-3 text-sm text-gray-800 dark:text-gray-100 whitespace-pre-line">
                {msg.message}
              </div>

              {msg.reply && (
                <div className="mt-3 text-sm text-green-700 dark:text-green-400">
                  <div className="font-semibold">Reply</div>
                  <div className="whitespace-pre-line">{msg.reply}</div>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <button
                  onClick={() => handleReply(msg._id)}
                  disabled={actionId === msg._id}
                  className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {actionId === msg._id ? 'Working…' : msg.reply ? 'Update Reply' : 'Reply'}
                </button>
                <button
                  onClick={() => handleDelete(msg._id)}
                  disabled={actionId === msg._id}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}
