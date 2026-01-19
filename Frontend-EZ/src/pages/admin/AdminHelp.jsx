import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useDarkMode } from '../../context/DarkModeContext'
import {
  fetchHelpArticlesAdmin,
  createHelpArticle,
  updateHelpArticle,
  deleteHelpArticle,
  seedHelpArticlesAdmin,
} from '../../services/api'

export default function AdminHelp() {
  const { isDarkMode } = useDarkMode()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const [formData, setFormData] = useState({
    category: 'Getting Started',
    title: '',
    description: '',
    stepsText: '',
    order: 1,
    isActive: true,
  })

  const categories = [
    'Getting Started',
    'Booking & Tickets',
    'Tickets & Entry',
    'Payment & Refunds',
    'Account & Profile',
    'Troubleshooting',
    'Other',
  ]

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    setLoading(true)
    try {
      const res = await fetchHelpArticlesAdmin({ includeInactive: true, limit: 200 })
      setArticles(res.data?.data || [])
      setError(null)
    } catch (err) {
      setError('Failed to load help articles')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const resetForm = () => {
    setFormData({
      category: 'Getting Started',
      title: '',
      description: '',
      stepsText: '',
      order: 1,
      isActive: true,
    })
    setEditingId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required')
      return
    }

    const payload = {
      category: formData.category,
      title: formData.title.trim(),
      description: formData.description.trim(),
      steps: formData.stepsText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean),
      order: Number(formData.order) || 0,
      isActive: formData.isActive,
    }

    setLoading(true)
    try {
      if (editingId) {
        await updateHelpArticle(editingId, payload)
        setSuccess('Help article updated')
      } else {
        await createHelpArticle(payload)
        setSuccess('Help article created')
      }

      resetForm()
      setShowForm(false)
      setError(null)
      fetchArticles()
      setTimeout(() => setSuccess(null), 2500)
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to save help article'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (article) => {
    setFormData({
      category: article.category || 'Getting Started',
      title: article.title || '',
      description: article.description || '',
      stepsText: (article.steps || []).join('\n'),
      order: article.order ?? 1,
      isActive: article.isActive,
    })
    setEditingId(article._id)
    setShowForm(true)
    window.scrollTo(0, 0)
  }

  const handleDelete = async (id) => {
    setLoading(true)
    try {
      await deleteHelpArticle(id)
      setSuccess('Help article deleted')
      setDeleteConfirm(null)
      setError(null)
      fetchArticles()
      setTimeout(() => setSuccess(null), 2500)
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete help article'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (article) => {
    setLoading(true)
    try {
      await updateHelpArticle(article._id, { isActive: !article.isActive })
      setSuccess(`Marked as ${article.isActive ? 'inactive' : 'active'}`)
      fetchArticles()
      setTimeout(() => setSuccess(null), 2000)
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update status'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const seedDefaults = async () => {
    setLoading(true)
    try {
      await seedHelpArticlesAdmin()
      setSuccess('Seeded default help articles')
      fetchArticles()
      setTimeout(() => setSuccess(null), 2000)
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to seed help articles'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-[#0B0F19] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold mb-1">Help Center Management</h1>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              Create, edit, publish, or hide Help Center articles.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowForm(true)}
              className="px-5 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold rounded-lg transition"
            >
              + New Article
            </button>
            <button
              onClick={seedDefaults}
              className={`px-5 py-2 rounded-lg font-semibold border transition ${
                isDarkMode
                  ? 'border-white/20 hover:bg-white/10'
                  : 'border-gray-300 hover:bg-gray-100'
              }`}
            >
              Seed Defaults
            </button>
          </div>
        </motion.div>

        {/* Alerts */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-green-500/15 border border-green-500/50 rounded-lg text-green-100"
          >
            {success}
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-red-500/15 border border-red-500/50 rounded-lg text-red-100"
          >
            {error}
          </motion.div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-8 p-6 rounded-lg border ${
              isDarkMode
                ? 'bg-[#1a1f2e] border-white/10'
                : 'bg-white border-gray-200'
            }`}
          >
            <h2 className="text-2xl font-bold mb-6">
              {editingId ? 'Edit Article' : 'Add New Article'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-2">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-[#0B0F19] border-white/20 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:border-red-500`}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-2">Display Order</label>
                  <input
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-[#0B0F19] border-white/20 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:border-red-500`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-2">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Article title"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-[#0B0F19] border-white/20 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:border-red-500`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Short description"
                  rows="3"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-[#0B0F19] border-white/20 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:border-red-500`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Steps (one per line)</label>
                <textarea
                  name="stepsText"
                  value={formData.stepsText}
                  onChange={handleInputChange}
                  placeholder="Add instructions on separate lines"
                  rows="6"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-[#0B0F19] border-white/20 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:border-red-500`}
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="isActive"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 cursor-pointer"
                />
                <label htmlFor="isActive" className="cursor-pointer">
                  Active (visible to users)
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold rounded-lg disabled:opacity-50 transition"
                >
                  {loading ? 'Saving...' : editingId ? 'Update Article' : 'Create Article'}
                </button>
                <button
                  type="button"
                  onClick={() => { resetForm(); setShowForm(false) }}
                  className={`px-6 py-2 border rounded-lg font-semibold transition ${
                    isDarkMode
                      ? 'border-white/20 hover:bg-white/10'
                      : 'border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* List */}
        {loading && !showForm ? (
          <div className="text-center py-12">
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Loading help articles...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>No help articles yet. Add your first one!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article, idx) => (
              <motion.div
                key={article._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-6 rounded-lg border ${
                  isDarkMode
                    ? 'bg-[#1a1f2e] border-white/10'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400">
                        {article.category}
                      </span>
                      {!article.isActive && (
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-500/20 text-gray-300">
                          Inactive
                        </span>
                      )}
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400">
                        Order {article.order ?? 0}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold mb-1">{article.title}</h3>
                    <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{article.description}</p>

                    {article.steps?.length > 0 && (
                      <ul className={`mt-4 space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {article.steps.map((step, i) => (
                          <li key={`${article._id}-step-${i}`} className="flex gap-2">
                            <span className="w-5 text-right font-semibold text-red-500">{i + 1}.</span>
                            <span className="flex-1">{step}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 sm:w-52 sm:flex-col">
                    <button
                      onClick={() => handleEdit(article)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition w-full"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleActive(article)}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded-lg transition w-full"
                    >
                      {article.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(article._id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition w-full"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {deleteConfirm === article._id && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
                  >
                    <p className="mb-3">Are you sure you want to delete this help article?</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleDelete(article._id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition"
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className={`px-4 py-2 border rounded font-semibold transition ${
                          isDarkMode
                            ? 'border-white/20 hover:bg-white/10'
                            : 'border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
