import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import API from '../../services/api'
import { useDarkMode } from '../../context/DarkModeContext'

export default function AdminFAQ() {
  const { isDarkMode } = useDarkMode()
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const [formData, setFormData] = useState({
    category: 'Other',
    question: '',
    answer: '',
    isActive: true
  })

  const categories = [
    'Booking & Tickets',
    'Tickets & Entry',
    'Payment & Refunds',
    'Account & Profile',
    'Support & Help',
    'Other'
  ]

  // Load FAQs
  useEffect(() => {
    fetchFAQs()
  }, [])

  const fetchFAQs = async () => {
    setLoading(true)
    try {
      const response = await API.get('/faq/admin/all')
      setFaqs(response.data.data || [])
      setError(null)
    } catch (err) {
      setError('Failed to load FAQs')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.question.trim() || !formData.answer.trim()) {
      setError('Question and answer cannot be empty')
      return
    }

    setLoading(true)
    try {
      if (editingId) {
        // Update
        await API.put(`/faq/${editingId}`, formData)
        setSuccess('FAQ updated successfully')
      } else {
        // Create
        await API.post('/faq', formData)
        setSuccess('FAQ created successfully')
      }

      setFormData({
        category: 'Other',
        question: '',
        answer: '',
        isActive: true
      })
      setEditingId(null)
      setShowForm(false)
      setError(null)
      fetchFAQs()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save FAQ')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (faq) => {
    setFormData({
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
      isActive: faq.isActive
    })
    setEditingId(faq._id)
    setShowForm(true)
    window.scrollTo(0, 0)
  }

  const handleDelete = async (id) => {
    setLoading(true)
    try {
      await API.delete(`/faq/${id}`)
      setSuccess('FAQ deleted successfully')
      setDeleteConfirm(null)
      setError(null)
      fetchFAQs()

      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete FAQ')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      category: 'Other',
      question: '',
      answer: '',
      isActive: true
    })
  }

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-[#0B0F19] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">FAQ Management</h1>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            Create, edit, and manage frequently asked questions
          </p>
        </motion.div>

        {/* Success/Error Messages */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-400"
          >
            {success}
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400"
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
              {editingId ? 'Edit FAQ' : 'Add New FAQ'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category */}
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

              {/* Question */}
              <div>
                <label className="block font-semibold mb-2">Question</label>
                <input
                  type="text"
                  name="question"
                  value={formData.question}
                  onChange={handleInputChange}
                  placeholder="Enter the FAQ question"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-[#0B0F19] border-white/20 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:border-red-500`}
                />
              </div>

              {/* Answer */}
              <div>
                <label className="block font-semibold mb-2">Answer</label>
                <textarea
                  name="answer"
                  value={formData.answer}
                  onChange={handleInputChange}
                  placeholder="Enter the FAQ answer"
                  rows="6"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-[#0B0F19] border-white/20 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:border-red-500`}
                />
              </div>

              {/* Active Status */}
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
                  Active (visible to public)
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold rounded-lg disabled:opacity-50 transition"
                >
                  {loading ? 'Saving...' : editingId ? 'Update FAQ' : 'Create FAQ'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
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

        {/* Add Button */}
        {!showForm && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowForm(true)}
            className="mb-8 px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold rounded-lg transition"
          >
            + Add New FAQ
          </motion.button>
        )}

        {/* FAQs List */}
        {loading && !showForm ? (
          <div className="text-center py-12">
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Loading FAQs...</p>
          </div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-12">
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>No FAQs found. Create your first one!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <motion.div
                key={faq._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-6 rounded-lg border ${
                  isDarkMode
                    ? 'bg-[#1a1f2e] border-white/10'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400">
                        {faq.category}
                      </span>
                      {!faq.isActive && (
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-500/20 text-gray-400">
                          Inactive
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold mb-2">{faq.question}</h3>
                    <p className={`mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {faq.answer}
                    </p>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      <span>Created by {faq.createdBy?.name || 'Unknown'}</span>
                      {faq.updatedBy && (
                        <span> • Updated by {faq.updatedBy.name}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(faq)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(faq._id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Delete Confirmation */}
                {deleteConfirm === faq._id && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
                  >
                    <p className="mb-4">Are you sure you want to delete this FAQ?</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleDelete(faq._id)}
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
