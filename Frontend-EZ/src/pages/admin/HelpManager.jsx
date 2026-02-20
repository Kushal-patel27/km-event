import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AdminLayout from '../../components/layout/AdminLayout'
import API from '../../services/api'

export default function HelpManager() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [authError, setAuthError] = useState(false)
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    steps: '',
    order: 0,
    isActive: true
  })

  useEffect(() => {
    if (!user || !user.token) {
      setAuthError(true)
      setLoading(false)
      return
    }
    setAuthError(false)
    fetchArticles()
  }, [user?.token])

  const fetchArticles = async () => {
    try {
      setLoading(true)
      const { data } = await API.get('/help/admin/all', {
        params: { includeInactive: true, limit: 200 }
      })
      setArticles(data.data || [])
      setError('')
    } catch (err) {
      console.error('Error fetching help articles:', err)
      setError('Failed to load help articles')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        steps: formData.steps.split('\n').filter(s => s.trim())
      }

      if (editingId) {
        await API.put(`/help/${editingId}`, payload)
        setSuccess('Help article updated successfully!')
      } else {
        await API.post('/help', payload)
        setSuccess('Help article created successfully!')
      }
      resetForm()
      fetchArticles()
    } catch (err) {
      console.error('Error saving help article:', err)
      setError(err.response?.data?.message || 'Failed to save help article')
    }
  }

  const handleEdit = (article) => {
    setFormData({
      category: article.category,
      title: article.title,
      description: article.description,
      steps: Array.isArray(article.steps) ? article.steps.join('\n') : '',
      order: article.order,
      isActive: article.isActive
    })
    setEditingId(article._id)
    setShowAddForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this help article?')) return

    try {
      await API.delete(`/help/${id}`)
      setSuccess('Help article deleted successfully!')
      fetchArticles()
    } catch (err) {
      console.error('Error deleting help article:', err)
      setError('Failed to delete help article')
    }
  }

  const resetForm = () => {
    setFormData({
      category: '',
      title: '',
      description: '',
      steps: '',
      order: 0,
      isActive: true
    })
    setEditingId(null)
    setShowAddForm(false)
  }

  if (loading) {
    return (
      <AdminLayout title="Help Center Management">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Help Center Management">
      {authError && (
        <div className="mb-4 p-6 bg-yellow-100 border-2 border-yellow-400 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-yellow-800 mb-2">🔒 Authentication Required</h3>
              <p className="text-yellow-700">You must be logged in as an admin to manage help articles.</p>
            </div>
            <button
              onClick={() => navigate('/admin/login')}
              className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-semibold"
            >
              Sign In
            </button>
          </div>
        </div>
      )}
      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {/* Add Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
        >
          {showAddForm ? 'Cancel' : '+ Add New Article'}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Help Article' : 'Add New Help Article'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Getting Started, Account Setup"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., How to book a ticket"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of the article"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Steps (one per line)</label>
              <textarea
                value={formData.steps}
                onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
                rows="6"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Step 1: Navigate to events page&#10;Step 2: Select an event&#10;Step 3: Click book now"
              />
              <p className="text-xs text-gray-500 mt-1">Enter each step on a new line</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Display Order</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="isActive" className="text-sm font-semibold">Active (visible to users)</label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingId ? 'Update Article' : 'Create Article'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Articles List */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Order</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Category</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Title</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    No help articles found. Click "Add New Article" to create one.
                  </td>
                </tr>
              ) : (
                articles.map((article) => (
                  <tr key={article._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-center">
                      {article.order}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                        {article.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium max-w-xs truncate">
                      {article.title}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-md truncate">
                      {article.description}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        article.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {article.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(article)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(article._id)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
