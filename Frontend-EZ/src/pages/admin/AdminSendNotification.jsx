import React, { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import API from '../../services/api'

// ─── small stat card ────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = 'gray' }) {
  const ring = {
    green:  'border-green-200 bg-green-50',
    red:    'border-red-200 bg-red-50',
    blue:   'border-blue-200 bg-blue-50',
    gray:   'border-gray-200 bg-white',
  }[color]

  return (
    <div className={`border rounded-lg p-4 shadow-sm ${ring}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-xs uppercase tracking-wide font-semibold text-gray-500">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value ?? '—'}</div>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

// ─── history row ────────────────────────────────────────────────────────────
function HistoryRow({ item }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b last:border-0 gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{item.title}</p>
        <p className="text-xs text-gray-500 truncate">{item.message}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0 text-xs text-gray-500">
        <span className={`px-2 py-0.5 rounded-full border font-medium ${
          item.target === 'all'
            ? 'bg-blue-50 border-blue-200 text-blue-700'
            : 'bg-purple-50 border-purple-200 text-purple-700'
        }`}>
          {item.target === 'all' ? '📢 All users' : `👤 User`}
        </span>
        <span className="text-green-600 font-semibold">✓ {item.sent} sent</span>
        {item.failed > 0 && <span className="text-red-500">✗ {item.failed} failed</span>}
        <span>{new Date(item.sentAt).toLocaleString()}</span>
      </div>
    </div>
  )
}

// ─── main component ──────────────────────────────────────────────────────────
export default function AdminSendNotification() {
  // form state
  const [title,   setTitle]   = useState('')
  const [message, setMessage] = useState('')
  const [target,  setTarget]  = useState('all')
  const [userId,  setUserId]  = useState('')

  // submission state
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [result,  setResult]  = useState(null)   // { sent, failed, cleanedInvalidTokens }

  // history (kept in component state for the session)
  const [history, setHistory] = useState([])

  // fcm-enabled user count (for the stat card)
  const [tokenCount, setTokenCount] = useState(null)
  const [countLoading, setCountLoading] = useState(true)

  useEffect(() => {
    const fetchCount = async () => {
      try {
        // GET /admin/team with a large limit; count users whose fcmToken is truthy client-side.
        // This is a best-effort count — it won't paginate through thousands of users but gives
        // a useful indication. Set limit=500 to cover typical admin team sizes.
        const res = await API.get('/admin/team', { params: { limit: 500, role: 'user' } })
        const users = res.data?.users || []
        const withToken = users.filter(u => u.fcmToken).length
        // If the endpoint returns pagination total, prefer that over client-side count
        const total = res.data?.pagination?.total
        setTokenCount(withToken || (total ? `~${total}` : 0))
      } catch {
        setTokenCount(null)
      } finally {
        setCountLoading(false)
      }
    }
    fetchCount()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setResult(null)

    if (!title.trim())   { setError('Title is required.');   return }
    if (!message.trim()) { setError('Message is required.'); return }
    if (target === 'user' && !userId.trim()) {
      setError('User ID is required when sending to a specific user.')
      return
    }

    const payload =
      target === 'all'
        ? { title: title.trim(), message: message.trim(), target: 'all' }
        : { title: title.trim(), message: message.trim(), target: 'user', userId: userId.trim() }

    setLoading(true)
    try {
      const res = await API.post('/admin/send-notification', payload)
      const data = res.data

      setResult(data)
      // prepend to history
      setHistory(prev => [
        { ...payload, sent: data.sent ?? 0, failed: data.failed ?? 0, sentAt: new Date().toISOString() },
        ...prev,
      ])
      // reset form
      setTitle('')
      setMessage('')
      setUserId('')
      setTarget('all')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send notification. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout title="Push Notifications">
      <div className="space-y-6">

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon="📱"
            label="Registered Devices"
            value={countLoading ? '…' : (tokenCount ?? 'N/A')}
            sub="Users with FCM token"
            color="blue"
          />
          <StatCard
            icon="📤"
            label="Sent this session"
            value={history.reduce((a, h) => a + (h.sent || 0), 0)}
            sub="Across all dispatches"
            color="green"
          />
          <StatCard
            icon="🔔"
            label="Dispatches this session"
            value={history.length}
            sub="Notification batches sent"
            color="gray"
          />
        </div>

        {/* ── Compose form ── */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <span className="text-lg">📣</span>
            <h2 className="font-semibold text-gray-800">Compose Push Notification</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <span className="mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Success banner */}
            {result && (
              <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                <span className="mt-0.5 text-base">✅</span>
                <div>
                  <p className="font-semibold">Notification dispatched!</p>
                  <p>
                    Delivered to <strong>{result.sent}</strong> device{result.sent !== 1 ? 's' : ''}
                    {result.failed > 0 && <span>, <strong>{result.failed}</strong> failed</span>}
                    {result.cleanedInvalidTokens > 0 && (
                      <span> · {result.cleanedInvalidTokens} stale token{result.cleanedInvalidTokens !== 1 ? 's' : ''} cleaned</span>
                    )}.
                  </p>
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Notification Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition resize-none"
                placeholder="Write your notification message here…"
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{message.length}/500</p>
            </div>

            {/* Send to */}
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
                    onClick={() => { setTarget(opt.value); setUserId('') }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition ${
                      target === opt.value
                        ? 'bg-black text-white border-black shadow'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span>{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* User ID (conditional) */}
            {target === 'user' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  User ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
                  placeholder="MongoDB _id of the user"
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">
                  You can find this in the Team Management page.
                </p>
              </div>
            )}

            {/* Submit */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={loading}
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
                ) : (
                  <>🔔 Send Push Notification</>
                )}
              </button>
              {(title || message) && !loading && (
                <button
                  type="button"
                  onClick={() => { setTitle(''); setMessage(''); setUserId(''); setTarget('all'); setError(''); setResult(null) }}
                  className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ── Session history ── */}
        {history.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">📋</span>
                <h2 className="font-semibold text-gray-800">Recent Dispatches</h2>
              </div>
              <span className="text-xs text-gray-400">{history.length} this session</span>
            </div>
            <div className="px-5 divide-y divide-gray-100">
              {history.map((item, idx) => (
                <HistoryRow key={idx} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* ── Help / Tips ── */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5">💡</span>
            <div className="space-y-2 text-sm text-amber-900">
              <p className="font-semibold">Tips for push notifications</p>
              <ul className="list-disc list-inside space-y-1 text-amber-800">
                <li>Users must have the Flutter app installed and have opened it at least once to receive push notifications.</li>
                <li>Keep titles under 50 characters and messages under 200 characters for best readability on mobile.</li>
                <li>Stale or revoked device tokens are automatically cleaned up after each send.</li>
                <li>To deploy, set the <code className="bg-amber-100 px-1 rounded font-mono text-xs">FIREBASE_SERVICE_ACCOUNT_JSON</code> environment variable on Render.</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  )
}
