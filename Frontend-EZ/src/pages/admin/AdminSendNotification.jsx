import React, { useState, useEffect, useCallback, useRef } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import API from '../../services/api'

const PUSH_TEMPLATES = [
  {
    id: 'event-reminder',
    icon: '⏰',
    category: 'Reminder',
    name: 'Event Reminder',
    title: 'Event starts soon',
    message: 'Your event begins in 1 hour. Please arrive 15 minutes early for a smooth check-in.',
    color: '#E11D48',
  },
  {
    id: 'ticket-live',
    icon: '🎟️',
    category: 'Sales',
    name: 'Tickets Live',
    title: 'Tickets are now live',
    message: 'Bookings are now open. Reserve your seat before tickets sell out.',
    color: '#2563EB',
  },
  {
    id: 'venue-update',
    icon: '📍',
    category: 'Update',
    name: 'Venue Update',
    title: 'Important venue update',
    message: 'The event entry gate has changed. Open the app to view updated venue details.',
    color: '#7C3AED',
  },
  {
    id: 'schedule-change',
    icon: '🗓️',
    category: 'Update',
    name: 'Schedule Change',
    title: 'Schedule updated',
    message: 'There is a schedule update for this event. Check the app for the latest timeline.',
    color: '#0F766E',
  },
  {
    id: 'thank-you',
    icon: '💌',
    category: 'Engagement',
    name: 'Post-Event Thank You',
    title: 'Thanks for joining us',
    message: 'Thank you for attending. We would love your feedback. Open the app to rate your experience.',
    color: '#EA580C',
  },
  {
    id: 'flash-sale',
    icon: '⚡',
    category: 'Sales',
    name: 'Flash Sale Alert',
    title: 'Flash Sale is live now',
    message: 'Limited-time ticket offer is now active. Grab your seat before the timer ends.',
    color: '#BE123C',
  },
  {
    id: 'countdown-24h',
    icon: '🔥',
    category: 'Reminder',
    name: '24h Countdown',
    title: 'Only 24 hours left',
    message: 'Your event starts tomorrow. Open the app to review schedule, gate, and checklist.',
    color: '#DC2626',
  },
  {
    id: 'seat-upgrade',
    icon: '✨',
    category: 'Offer',
    name: 'Seat Upgrade Offer',
    title: 'Upgrade your seat today',
    message: 'Premium seats are now available at a special upgrade price. Offer valid for a short time.',
    color: '#9333EA',
  },
  {
    id: 'entry-open',
    icon: '🚪',
    category: 'Update',
    name: 'Entry Gates Open',
    title: 'Entry gates are now open',
    message: 'Gates are open now. Please keep your QR ticket ready for faster access.',
    color: '#0891B2',
  },
  {
    id: 'new-drop',
    icon: '🎉',
    category: 'Launch',
    name: 'New Event Drop',
    title: 'New event just dropped',
    message: 'A new event is now live in your city. Open the app to discover details and book early.',
    color: '#0F766E',
  },
]

const COLOR_PRESETS = [
  { id: 'bookmyshow-red', label: 'BMS Red', value: '#E11D48' },
  { id: 'royal-blue', label: 'Royal Blue', value: '#2563EB' },
  { id: 'premium-purple', label: 'Premium Purple', value: '#7C3AED' },
  { id: 'teal', label: 'Teal', value: '#0F766E' },
  { id: 'sunset', label: 'Sunset', value: '#EA580C' },
  { id: 'charcoal', label: 'Charcoal', value: '#111827' },
]

const HEX_COLOR_RE = /^#([0-9A-Fa-f]{6})$/

function normalizeHexColor(input) {
  if (typeof input !== 'string') return ''
  let value = input.trim()
  if (!value) return ''
  if (!value.startsWith('#')) value = `#${value}`
  return value.toUpperCase()
}

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
    green: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white',
    blue:  'border-red-200 bg-gradient-to-br from-rose-50 to-white',
    gray:  'border-gray-200 bg-gradient-to-br from-gray-50 to-white',
  }[color] ?? 'border-gray-200 bg-gradient-to-br from-gray-50 to-white'

  return (
    <div className={`border rounded-2xl p-4 shadow-sm hover:shadow-md transition ${ring}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-xs uppercase tracking-wide font-semibold text-gray-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value ?? '—'}</div>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

function PremiumDispatchToast({ toast, onClose }) {
  if (!toast?.show) return null

  const isError = toast.type === 'error'
  const boxClass = isError
    ? 'from-red-700 to-red-600 border-red-400/40'
    : 'from-gray-900 to-black border-rose-400/30'

  return (
    <div className="fixed top-6 right-6 z-[10000] w-[92vw] max-w-md animate-[fadeIn_.25s_ease-out]">
      <div className={`rounded-2xl border bg-gradient-to-br ${boxClass} text-white shadow-2xl px-4 py-4`}>
        <div className="flex items-start gap-3">
          <div className="text-xl mt-0.5">{isError ? '⚠️' : '🔔'}</div>
          <div className="flex-1">
            <p className="font-semibold tracking-wide">{toast.title}</p>
            <p className="text-sm text-white/90 mt-1">{toast.message}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white text-lg leading-none"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      </div>
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
function ComposeTab({ onSuccess, pushConfigured, onNotify }) {
  const [title,    setTitle]    = useState('')
  const [message,  setMessage]  = useState('')
  const [target,   setTarget]   = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)   // { _id, name, email }
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [selectedColor, setSelectedColor] = useState('#E11D48')
  const [colorInput, setColorInput] = useState('#E11D48')

  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [result,   setResult]   = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setResult(null)

    if (!pushConfigured) {
      setError('Push service is not configured. Add Firebase service account credentials on the server first.')
      onNotify?.({ type: 'error', title: 'Push Not Ready', message: 'Configure Firebase service account on the server first.' })
      return
    }

    if (!title.trim())   { setError('Title is required.');   return }
    if (!message.trim()) { setError('Message is required.'); return }
    if (!HEX_COLOR_RE.test(selectedColor)) {
      setError('Please choose a valid hex color (for example: #E11D48).')
      return
    }
    if (target === 'user' && !selectedUser) {
      setError('Please search and select a user.')
      return
    }

    const payload = target === 'all'
      ? { title: title.trim(), message: message.trim(), target: 'all', color: selectedColor }
      : { title: title.trim(), message: message.trim(), target: 'user', userId: selectedUser._id, color: selectedColor }

    setLoading(true)
    try {
      const res = await API.post('/admin/send-notification', payload)
      setResult(res.data)
      const sent = res.data?.sent ?? 0
      const failed = res.data?.failed ?? 0
      onNotify?.({
        type: failed > 0 ? 'error' : 'success',
        title: failed > 0 ? 'Notification Sent With Issues' : 'Notification Sent',
        message: `Delivered: ${sent} • Failed: ${failed}`,
      })
      onSuccess?.({ ...payload, sent: res.data.sent ?? 0, failed: res.data.failed ?? 0, sentAt: new Date().toISOString() })
      setTitle(''); setMessage(''); setTarget('all'); setSelectedUser(null); setSelectedTemplateId(''); setSelectedColor('#E11D48'); setColorInput('#E11D48')
    } catch (err) {
      const mapped = mapApiErrorToMessage(err)
      setError(mapped)
      onNotify?.({ type: 'error', title: 'Notification Failed', message: mapped })
    } finally {
      setLoading(false)
    }
  }

  const applyTemplate = (template) => {
    setSelectedTemplateId(template.id)
    setTitle(template.title)
    setMessage(template.message)
    const templateColor = template.color || '#E11D48'
    setSelectedColor(templateColor)
    setColorInput(templateColor)
    setError('')
    setResult(null)
  }

  const applyColorInput = () => {
    const normalized = normalizeHexColor(colorInput)
    if (!HEX_COLOR_RE.test(normalized)) {
      setError('Invalid color format. Use a full hex value like #E11D48.')
      return
    }
    setSelectedColor(normalized)
    setColorInput(normalized)
    setError('')
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
          Pre-Built Premium Templates
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PUSH_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => applyTemplate(template)}
              className={`text-left px-3 py-2 rounded-lg border text-sm transition relative overflow-hidden ${
                selectedTemplateId === template.id
                  ? 'border-red-400 bg-gradient-to-r from-rose-50 to-red-50 text-red-900 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:bg-rose-50/40'
              }`}
            >
              <span
                className="absolute top-0 right-0 h-full w-1.5"
                style={{ backgroundColor: template.color }}
                aria-hidden="true"
              />
              <div className="flex items-start justify-between gap-2 pr-2">
                <p className="font-semibold flex items-center gap-1.5">
                  <span>{template.icon || '🔔'}</span>
                  <span>{template.name}</span>
                </p>
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-gray-300 text-gray-600 bg-white/70">
                  {template.category || 'General'}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate mt-0.5">{template.title}</p>
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

      {/* Notification color */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">
          Notification Color <span className="text-red-500">*</span>
        </label>

        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => { setSelectedColor(preset.value); setColorInput(preset.value); setError('') }}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition ${
                selectedColor === preset.value
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="w-3 h-3 rounded-full border border-white/70" style={{ backgroundColor: preset.value }} />
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={colorInput}
            onChange={(e) => setColorInput(e.target.value)}
            onBlur={applyColorInput}
            placeholder="#E11D48"
            className="w-36 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <button
            type="button"
            onClick={applyColorInput}
            className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition"
          >
            Apply
          </button>
          <span className="text-xs text-gray-500">Use full hex format.</span>
        </div>

        <div className="rounded-xl border border-gray-200 p-4" style={{ background: `linear-gradient(135deg, ${selectedColor}22, #ffffff)` }}>
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Live Preview</p>
          <p className="font-semibold" style={{ color: selectedColor }}>{title.trim() || 'Notification title preview'}</p>
          <p className="text-sm text-gray-700 mt-1">{message.trim() || 'Your message preview will appear here.'}</p>
        </div>
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
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-black text-white text-sm font-semibold hover:bg-gray-800 active:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition shadow"
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
            onClick={() => { setTitle(''); setMessage(''); setTarget('all'); setSelectedUser(null); setSelectedTemplateId(''); setSelectedColor('#E11D48'); setColorInput('#E11D48'); setError(''); setResult(null) }}
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
  const [toast, setToast] = useState({ show: false, type: 'success', title: '', message: '' })

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

  useEffect(() => {
    if (!toast.show) return undefined
    const timer = setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3600)
    return () => clearTimeout(timer)
  }, [toast.show])

  const notify = useCallback(({ type = 'success', title = '', message = '' }) => {
    setToast({ show: true, type, title, message })
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
      <PremiumDispatchToast toast={toast} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />
      <div className="space-y-6">

        <div className="rounded-2xl border border-red-100 bg-gradient-to-r from-[#2a0f18] via-[#4b1024] to-[#7a1236] p-5 text-white shadow-lg">
          <p className="text-xs uppercase tracking-[0.16em] text-rose-200">Campaign Studio</p>
          <h1 className="text-xl sm:text-2xl font-bold mt-1">Premium Push Notification Center</h1>
          <p className="text-sm text-rose-100 mt-1">Design, target, and dispatch high-visibility alerts with live delivery feedback.</p>
        </div>

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
                    ? 'border-red-600 text-red-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-red-300'
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
            <ComposeTab onSuccess={handleSuccess} pushConfigured={pushHealth.configured} onNotify={notify} />
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

