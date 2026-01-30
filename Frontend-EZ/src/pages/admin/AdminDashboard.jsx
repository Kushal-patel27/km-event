import React, { useEffect, useState, useRef } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import API from '../../services/api'
import formatINR from '../../utils/currency'

export default function AdminDashboard(){
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showComposer, setShowComposer] = useState(false)
  const [subject, setSubject] = useState('')
  const [title, setTitle] = useState('')
  const [messageType, setMessageType] = useState('announcement')
  const [recipientType, setRecipientType] = useState('all')
  const [htmlContent, setHtmlContent] = useState('<p>Write your message...</p>')
  const [sending, setSending] = useState(false)
  const [composerError, setComposerError] = useState('')
  const [templates, setTemplates] = useState([])
  const [notifications, setNotifications] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [templateName, setTemplateName] = useState('')
  const editorRef = useRef(null)

  useEffect(()=>{
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const res = await API.get('/admin/overview')
        setOverview(res.data)
      } catch (err) {
        console.error('Dashboard load failed', err)
        setError(err.response?.data?.message || 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!showComposer) return
    const fetchTemplates = async () => {
      try {
        const res = await API.get('/admin/notifications/templates')
        setTemplates(res.data.templates || [])
      } catch (err) {
        console.error('Load templates failed', err)
      }
    }
    const fetchHistory = async () => {
      try {
        const res = await API.get('/admin/notifications')
        setNotifications(res.data.notifications || [])
      } catch (err) {
        console.error('Load notifications failed', err)
      }
    }
    fetchTemplates()
    fetchHistory()
  }, [showComposer])

  const applyTemplate = (templateId) => {
    setSelectedTemplateId(templateId)
    const tpl = templates.find(t => t._id === templateId)
    if (tpl) {
      setSubject(tpl.subject)
      setTitle(tpl.title)
      setMessageType(tpl.messageType || 'custom')
      setHtmlContent(tpl.html)
      if (editorRef.current) {
        editorRef.current.innerHTML = tpl.html
      }
    }
  }

  const execCommand = (cmd, value = null) => {
    document.execCommand(cmd, false, value)
    if (editorRef.current) {
      setHtmlContent(editorRef.current.innerHTML)
    }
  }

  const handleSend = async () => {
    try {
      setSending(true)
      setComposerError('')
      const payload = { subject, title, html: htmlContent, messageType, recipientType }
      const res = await API.post('/admin/notifications/send', payload)
      if (res.data?.notification) {
        setNotifications(prev => [res.data.notification, ...prev].slice(0, 50))
      }
      setShowComposer(false)
    } catch (err) {
      setComposerError(err.response?.data?.message || 'Failed to send notification')
    } finally {
      setSending(false)
    }
  }

  const handleSaveTemplate = async () => {
    try {
      setComposerError('')
      const payload = { name: templateName || subject || 'Untitled', subject, title, html: htmlContent, messageType }
      const res = await API.post('/admin/notifications/templates', payload)
      if (res.data?.template) {
        setTemplates(prev => [res.data.template, ...prev])
        setTemplateName('')
      }
    } catch (err) {
      setComposerError(err.response?.data?.message || 'Failed to save template')
    }
  }

  return (
    <AdminLayout title="Dashboard">
      {loading && (
        <div className="text-sm text-gray-500 py-8">Loading metrics…</div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
      )}

      {!loading && !error && overview && (
        <div className="space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Total Events</div>
              <div className="text-3xl font-bold mt-2">{overview.totalEvents}</div>
              <p className="text-xs text-gray-500 mt-1">{overview.activeEvents} active</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Total Bookings</div>
              <div className="text-3xl font-bold mt-2">{overview.totalBookings}</div>
              <p className="text-xs text-gray-500 mt-1">{overview.confirmedBookings} confirmed</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Total Revenue</div>
              <div className="text-2xl font-bold mt-2">{formatINR(overview.totalRevenue)}</div>
              <p className="text-xs text-gray-500 mt-1">All events</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Revenue/Event</div>
              <div className="text-2xl font-bold mt-2">{formatINR(overview.revenuePerEvent)}</div>
              <p className="text-xs text-gray-500 mt-1">Average</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Confirmation Rate</div>
              <div className="text-3xl font-bold mt-2">
                {overview.totalBookings > 0 ? Math.round((overview.confirmedBookings / overview.totalBookings) * 100) : 0}%
              </div>
              <p className="text-xs text-gray-500 mt-1">Of all bookings</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 text-sm">
            <button
              type="button"
              onClick={() => setShowComposer(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm"
            >
              📧 Push Notification / Send Email
            </button>
            <a href="/admin/team" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
              Manage Team
            </a>
            <a href="/admin/events" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              View Events
            </a>
            <a href="/admin/bookings" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              View Bookings
            </a>
            <a href="/admin/contacts" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              View Contacts
            </a>
          </div>

          {/* Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Organization Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Events Created</span>
                  <span className="font-semibold">{overview.totalEvents}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Events</span>
                  <span className="font-semibold text-green-700">{overview.activeEvents}</span>
                </div>
                <div className="flex justify-between pt-3 border-t">
                  <span className="text-gray-600">Total Bookings Received</span>
                  <span className="font-semibold">{overview.totalBookings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Confirmed Bookings</span>
                  <span className="font-semibold text-blue-700">{overview.confirmedBookings}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Revenue Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Revenue</span>
                  <span className="font-semibold text-lg">{formatINR(overview.totalRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average per Event</span>
                  <span className="font-semibold">{formatINR(overview.revenuePerEvent)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t">
                  <span className="text-gray-600">Booking Confirmation Rate</span>
                  <span className="font-semibold text-green-700">
                    {overview.totalBookings > 0 ? Math.round((overview.confirmedBookings / overview.totalBookings) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showComposer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="flex items-start justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold">Send Email / Push Notification</h3>
                <p className="text-sm text-gray-600">Send formatted messages to selected user groups. Preview before sending.</p>
              </div>
              <button onClick={() => setShowComposer(false)} className="p-2 rounded-lg hover:bg-gray-100">✕</button>
            </div>

            {composerError && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{composerError}</div>
            )}

            <div className="grid lg:grid-cols-3 gap-6 p-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 font-semibold">Email Subject</label>
                    <input value={subject} onChange={e => setSubject(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Summer sale announcement" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 font-semibold">Message Title (header)</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Limited time offer" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 font-semibold">Message Type</label>
                    <select value={messageType} onChange={e => setMessageType(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      <option value="offer">Offer</option>
                      <option value="announcement">Announcement</option>
                      <option value="update">Update</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 font-semibold">Recipients</label>
                    <select value={recipientType} onChange={e => setRecipientType(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      <option value="all">All users</option>
                      <option value="registered">Registered users</option>
                      <option value="participants">Event participants</option>
                      <option value="staff">Staff & admins</option>
                    </select>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg">
                  <div className="flex flex-wrap gap-2 border-b border-gray-200 px-3 py-2 bg-gray-50 text-sm">
                    <button type="button" onClick={() => execCommand('bold')} className="px-2 py-1 rounded hover:bg-gray-100 font-semibold">B</button>
                    <button type="button" onClick={() => execCommand('italic')} className="px-2 py-1 rounded hover:bg-gray-100 italic">I</button>
                    <button type="button" onClick={() => execCommand('insertUnorderedList')} className="px-2 py-1 rounded hover:bg-gray-100">• List</button>
                    <button type="button" onClick={() => {
                      const url = prompt('Enter link URL')
                      if (url) execCommand('createLink', url)
                    }} className="px-2 py-1 rounded hover:bg-gray-100">Link</button>
                  </div>
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => setHtmlContent(e.currentTarget.innerHTML)}
                    className="min-h-[180px] px-4 py-3 text-sm focus:outline-none"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={handleSend} disabled={sending} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60">
                    {sending ? 'Sending...' : 'Send Now'}
                  </button>
                  <button onClick={handleSaveTemplate} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Save as Template</button>
                  <input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="Template name" className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs text-gray-500">Templates</p>
                      <h4 className="text-sm font-semibold">Saved Messages</h4>
                    </div>
                  </div>
                  <select value={selectedTemplateId} onChange={e => applyTemplate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Select a template</option>
                    {templates.map(t => (
                      <option key={t._id} value={t._id}>{t.name} ({t.messageType})</option>
                    ))}
                  </select>
                </div>

                <div className="border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-2">Preview</p>
                  <div className="border border-gray-100 rounded-lg p-3 bg-gray-50 text-sm max-h-72 overflow-auto">
                    <h4 className="font-bold text-gray-900 mb-1">{title || 'Message title'}</h4>
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: htmlContent }} />
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-2">History</p>
                  <div className="space-y-2 max-h-64 overflow-auto text-sm">
                    {(notifications || []).map((n) => (
                      <div key={n._id} className="p-2 border border-gray-100 rounded-lg">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{new Date(n.createdAt).toLocaleString()}</span>
                          <span className="font-semibold text-gray-700">{n.recipientType}</span>
                        </div>
                        <div className="font-semibold text-gray-900">{n.subject}</div>
                        <div className="text-gray-600">{n.sentCount} sent · {n.messageType}</div>
                      </div>
                    ))}
                    {(!notifications || notifications.length === 0) && (
                      <p className="text-xs text-gray-500">No notifications sent yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
