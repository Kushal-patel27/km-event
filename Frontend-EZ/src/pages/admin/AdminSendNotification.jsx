import React, { useState, useEffect, useCallback, useRef } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import API from '../../services/api'

const PUSH_TEMPLATES = [
  {
    id: 'event-reminder',
    name: 'Event Reminder',
    title: 'Event starts soon',
    message: 'Your event begins in 1 hour. Please arrive 15 minutes early for a smooth check-in.'
  },
  {
    id: 'ticket-live',
    name: 'Tickets Live',
    title: 'Tickets are now live',
    message: 'Bookings are now open. Reserve your seat before tickets sell out.'
  },
  {
    id: 'venue-update',
    name: 'Venue Update',
    title: 'Important venue update',
    message: 'The event entry gate has changed. Open the app to view updated venue details.'
  },
  {
    id: 'schedule-change',
    name: 'Schedule Change',
    title: 'Schedule updated',
    message: 'There is a schedule update for this event. Check the app for the latest timeline.'
  },
  {
    id: 'thank-you',
    name: 'Post-Event Thank You',
    title: 'Thanks for joining us',
    message: 'Thank you for attending. We would love your feedback. Open the app to rate your experience.'
  },
]

function mapApiErrorToMessage(err) {
  const status = err?.response?.status
  const apiMessage = err?.response?.data?.message
  const apiDetail = err?.response?.data?.detail

  if (status === 401) return 'Your admin session expired. Please log in again.'
  if (status === 403) return apiMessage || 'You do not have permission to send notifications.'
  if (status === 429) return apiMessage || 'Too many notification requests. Please wait and try again.'
  if (status === 503 && apiDetail) return `${apiMessage || 'Push notification service is unavailable.'} ${apiDetail}`

  return apiMessage || apiDetail || 'Failed to send notification. Please try again.'
}

// ─── helpers ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = 'gray' }) {
  const ring = {
    green: 'border-green-200 bg-green-50',
    blue:  'border-blue-200 bg-blue-50',
    gray:  'border-gray-200 bg-white',
  }[color] ?? 'border-gray-200 bg-white'

  return (
    <div className={`border rounded-xl p-4 shadow-sm ${ring}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-xs uppercase tracking-wide font-semibold text-gray-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value ?? '—'}</div>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

function Alert({ type, children }) {
  const cls = type === 'error'
    ? 'bg-red-50 border-red-200 text-red-700'
    : 'bg-green-50 border-green-200 text-green-700'
  const icon = type === 'error' ? '⚠️' : '✅'
  return (
    <div className={`flex items-start gap-3 border px-4 py-3 rounded-lg text-sm ${cls}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>{children}</div>
    </div>
  )
}

// ─── UserPicker: live search for FCM-registered users ─────────────────────────
function UserPicker({ selectedUser, onSelect }) {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen]         = useState(false)
  const debounceRef             = useRef(null)
  const containerRef            = useRef(null)

  // cleanup debounce on unmount
  useEffect(() => () => clearTimeout(debounceRef.current), [])

  const search = useCallback(async (q) => {
    setSearching(true)
    try {
      const res = await API.get('/admin/fcm-devices', { params: { search: q, limit: 10 } })
      setResults(res.data?.users || [])
      setOpen(true)
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  const handleInput = (e) => {
    const val = e.target.value
    setQuery(val)
    if (selectedUser) onSelect(null)        // clear selection when typing again
    clearTimeout(debounceRef.current)
    if (val.trim().length >= 1) {
      debounceRef.current = setTimeout(() => search(val.trim()), 300)
    } else {
      setOpen(false)
      setResults([])
    }
  }

  const handleSelect = (user) => {
    onSelect(user)
    setQuery(`${user.name} (${user.email})`)
    setOpen(false)
  }

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
        placeholder="Search by name or email…"
        value={query}
        onChange={handleInput}
        autoComplete="off"
      />
      {searching && (
        <span className="absolute right-3 top-2.5 text-xs text-gray-400">Searching…</span>
      )}

      {/* Dropdown */}
      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-auto">
          {results.map(u => (
            <li
              key={u._id}
              onMouseDown={() => handleSelect(u)}
              className="flex flex-col px-3 py-2 cursor-pointer hover:bg-gray-50 text-sm border-b last:border-0"
            >
              <span className="font-semibold text-gray-800">{u.name}</span>
              <span className="text-xs text-gray-500">{u.email}</span>
            </li>
          ))}
        </ul>
      )}
      {open && !searching && results.length === 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-3 text-sm text-gray-500">
          No FCM-registered users found.
        </div>
      )}

      {selectedUser && (
        <div className="mt-2 inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs px-3 py-1.5 rounded-lg">
          <span>📱</span>
          <span className="font-semibold">{selectedUser.name}</span>
          <span className="text-blue-500">{selectedUser.email}</span>
          <button
            type="button"
            onClick={() => { onSelect(null); setQuery('') }}
            className="ml-1 text-blue-400 hover:text-blue-600"
          >✕</button>
        </div>
      )}
    </div>
  )
}

// ─── DevicesTab: paginated table of FCM-registered users ──────────────────────
function DevicesTab() {
  const [users, setUsers]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch]       = useState('')
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })

  const load = useCallback(async (page = 1, q = search) => {
    setLoading(true)
    setError('')
    try {
      const res = await API.get('/admin/fcm-devices', { params: { page, limit: 20, search: q } })
      setUsers(res.data?.users || [])
      setPagination(res.data?.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load devices')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { load(1, search) }, [search])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput.trim())
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Search by name or email"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition"
        >
          Search
        </button>
      </form>

      {error && <Alert type="error">{error}</Alert>}

      <p className="text-sm text-gray-500">
        Showing <span className="font-semibold text-gray-900">{users.length}</span> of{' '}
        <span className="font-semibold text-gray-900">{pagination.total}</span> registered devices
      </p>

      <div className="overflow-x-auto border border-gray-200 rounded-xl">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              {['Name', 'Email', 'Joined'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-400">Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-400">No FCM-registered users found.</td></tr>
            ) : users.map(u => (
              <tr key={u._id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button
            disabled={pagination.page <= 1}
            onClick={() => load(pagination.page - 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition"
          >
            ← Prev
          </button>
          <span className="text-gray-500">Page {pagination.page} of {pagination.pages}</span>
          <button
            disabled={pagination.page >= pagination.pages}
            onClick={() => load(pagination.page + 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

// ─── ComposeTab ───────────────────────────────────────────────────────────────
function ComposeTab({ onSuccess, pushConfigured }) {
  const [title,    setTitle]    = useState('')
  const [message,  setMessage]  = useState('')
  const [target,   setTarget]   = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)   // { _id, name, email }
  const [selectedTemplateId, setSelectedTemplateId] = useState('')

  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [result,   setResult]   = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setResult(null)

    if (!pushConfigured) {
      setError('Push service is not configured. Add Firebase service account credentials on the server first.')
      return
    }

    if (!title.trim())   { setError('Title is required.');   return }
    if (!message.trim()) { setError('Message is required.'); return }
    if (target === 'user' && !selectedUser) {
      setError('Please search and select a user.')
      return
    }

    const payload = target === 'all'
      ? { title: title.trim(), message: message.trim(), target: 'all' }
      : { title: title.trim(), message: message.trim(), target: 'user', userId: selectedUser._id }

    setLoading(true)
    try {
      const res = await API.post('/admin/send-notification', payload)
      setResult(res.data)
      onSuccess?.({ ...payload, sent: res.data.sent ?? 0, failed: res.data.failed ?? 0, sentAt: new Date().toISOString() })
      setTitle(''); setMessage(''); setTarget('all'); setSelectedUser(null); setSelectedTemplateId('')
    } catch (err) {
      setError(mapApiErrorToMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const applyTemplate = (template) => {
    setSelectedTemplateId(template.id)
    setTitle(template.title)
    setMessage(template.message)
    setError('')
    setResult(null)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error  && <Alert type="error">{error}</Alert>}
      {result && (
        <Alert type="success">
          <p className="font-semibold">Notification dispatched!</p>
          <p>
            Delivered to <strong>{result.sent}</strong> device{result.sent !== 1 ? 's' : ''}
            {result.failed > 0 && <>, <strong>{result.failed}</strong> failed</>}
            {result.cleanedInvalidTokens > 0 && <> · {result.cleanedInvalidTokens} stale token{result.cleanedInvalidTokens !== 1 ? 's' : ''} cleaned</>}.
          </p>
          {result.sent === 0 && result.failed === 0 && (
            <p className="text-xs mt-1 text-green-600">{result.message}</p>
          )}
        </Alert>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Quick Templates
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PUSH_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => applyTemplate(template)}
              className={`text-left px-3 py-2 rounded-lg border text-sm transition ${
                selectedTemplateId === template.id
                  ? 'border-black bg-gray-50 text-gray-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <p className="font-semibold">{template.name}</p>
              <p className="text-xs text-gray-500 truncate">{template.title}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Notification Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black transition"
          placeholder="e.g. Event Update"
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={100}
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{title.length}/100</p>
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black transition resize-none"
          placeholder="Write your notification message here…"
          rows={4}
          value={message}
          onChange={e => setMessage(e.target.value)}
          maxLength={500}
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{message.length}/500</p>
      </div>

      {/* Send-to toggle */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Send to <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-3">
          {[
            { value: 'all',  icon: '📢', label: 'All Users' },
            { value: 'user', icon: '👤', label: 'Specific User' },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { setTarget(opt.value); setSelectedUser(null) }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition ${
                target === opt.value
                  ? 'bg-black text-white border-black shadow'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span>{opt.icon}</span>{opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* User picker (shown only when target = 'user') */}
      {target === 'user' && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Search User <span className="text-red-500">*</span>
          </label>
          <UserPicker selectedUser={selectedUser} onSelect={setSelectedUser} />
          <p className="text-xs text-gray-400 mt-1.5">
            Only users who have the Flutter app installed and opened appear in this list.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={loading || !pushConfigured}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-black text-white text-sm font-semibold hover:bg-gray-800 active:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
              </svg>
              Sending…
            </>
          ) : '🔔 Send Push Notification'}
        </button>
        {(title || message) && !loading && (
          <button
            type="button"
            onClick={() => { setTitle(''); setMessage(''); setTarget('all'); setSelectedUser(null); setSelectedTemplateId(''); setError(''); setResult(null) }}
            className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            Clear
          </button>
        )}
      </div>
    </form>
  )
}

function PushHealthBanner({ health }) {
  if (!health?.checked) return null

  if (health?.configured) {
    return (
      <Alert type="success">
        Push service is ready. Firebase configured and {health.registeredDevices ?? 0} device token(s) registered.
      </Alert>
    )
  }

  return (
    <Alert type="error">
      <p className="font-semibold">Push service is not configured.</p>
      <p className="mt-1">{health.message || 'Firebase credentials are missing or invalid.'}</p>
      {health.detail && <p className="mt-1 text-xs">{health.detail}</p>}
    </Alert>
  )
}

// ─── HistoryRow ───────────────────────────────────────────────────────────────
function HistoryRow({ item }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b last:border-0 gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{item.title}</p>
        <p className="text-xs text-gray-500 truncate">{item.message}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0 text-xs text-gray-500">
        <span className={`px-2 py-0.5 rounded-full border font-medium ${
          item.target === 'all'
            ? 'bg-blue-50 border-blue-200 text-blue-700'
            : 'bg-purple-50 border-purple-200 text-purple-700'
        }`}>
          {item.target === 'all' ? '📢 All users' : `👤 ${item.userId ? 'Specific user' : 'User'}`}
        </span>
        <span className="text-green-600 font-semibold">✓ {item.sent} sent</span>
        {item.failed > 0 && <span className="text-red-500">✗ {item.failed} failed</span>}
        <span>{new Date(item.sentAt).toLocaleString()}</span>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminSendNotification() {
  const [activeTab, setActiveTab] = useState('compose')   // 'compose' | 'devices'
  const [history, setHistory]     = useState([])

  // Real device count from the API
  const [deviceCount, setDeviceCount]       = useState(null)
  const [deviceCountLoading, setDeviceCountLoading] = useState(true)
  const [pushHealth, setPushHealth] = useState({ checked: false, configured: false, message: '', detail: '', registeredDevices: 0 })

  useEffect(() => {
    API.get('/admin/fcm-devices', { params: { limit: 1 } })
      .then(r => setDeviceCount(r.data?.total ?? 0))
      .catch(() => setDeviceCount(null))
      .finally(() => setDeviceCountLoading(false))

    API.get('/admin/push-notification/health')
      .then((r) => {
        setPushHealth({
          checked: true,
          configured: !!r.data?.configured,
          message: r.data?.message || '',
          detail: r.data?.detail || '',
          registeredDevices: r.data?.registeredDevices ?? 0,
        })
      })
      .catch((err) => {
        setPushHealth({
          checked: true,
          configured: false,
          message: err?.response?.data?.message || 'Unable to verify push service health.',
          detail: err?.response?.data?.detail || '',
          registeredDevices: err?.response?.data?.registeredDevices ?? 0,
        })
      })
  }, [])

  const handleSuccess = (entry) => {
    setHistory(prev => [entry, ...prev])
    // refresh device count in case tokens were cleaned up
    API.get('/admin/fcm-devices', { params: { limit: 1 } })
      .then(r => setDeviceCount(r.data?.total ?? 0))
      .catch(() => {})
  }

  const tabs = [
    { id: 'compose', label: '📣 Compose', },
    { id: 'devices', label: '📱 Registered Devices', },
  ]

  return (
    <AdminLayout title="Push Notifications">
      <div className="space-y-6">

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon="📱" label="Registered Devices" color="blue"
            value={deviceCountLoading ? '…' : (deviceCount ?? 'N/A')}
            sub="Users with FCM token"
          />
          <StatCard
            icon="📤" label="Sent this session" color="green"
            value={history.reduce((a, h) => a + (h.sent || 0), 0)}
            sub="Across all dispatches"
          />
          <StatCard
            icon="🔔" label="Dispatches this session"
            value={history.length}
            sub="Notification batches sent"
          />
        </div>

        {/* ── Tab nav ── */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-1">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === t.id
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* ── Tab content ── */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          {activeTab === 'compose' && (
            <div className="mb-4">
              <PushHealthBanner health={pushHealth} />
            </div>
          )}

          {activeTab === 'compose' && (
            <ComposeTab onSuccess={handleSuccess} pushConfigured={pushHealth.configured} />
          )}
          {activeTab === 'devices' && (
            <DevicesTab />
          )}
        </div>

        {/* ── Session history (only on compose tab) ── */}
        {activeTab === 'compose' && history.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">📋</span>
                <h2 className="font-semibold text-gray-800">Recent Dispatches</h2>
              </div>
              <span className="text-xs text-gray-400">{history.length} this session</span>
            </div>
            <div className="px-5 divide-y divide-gray-100">
              {history.map((item, idx) => <HistoryRow key={idx} item={item} />)}
            </div>
          </div>
        )}

        {/* ── Tips ── */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5">💡</span>
            <div className="space-y-1.5 text-sm text-amber-900">
              <p className="font-semibold">Tips for push notifications</p>
              <ul className="list-disc list-inside space-y-1 text-amber-800">
                <li>Users must have the Flutter app installed and opened at least once.</li>
                <li>Keep titles under 50 chars and messages under 200 chars for best readability on mobile.</li>
                <li>Stale or revoked device tokens are automatically cleaned up after each send.</li>
                <li>
                  Set{' '}
                  <code className="bg-amber-100 px-1 rounded font-mono text-xs">FIREBASE_SERVICE_ACCOUNT_JSON</code>
                  {' '}on Render to enable push notifications in production.
                </li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  )
}

