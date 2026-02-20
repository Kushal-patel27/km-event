import React, { useEffect, useState } from 'react'
import { useDarkMode } from '../../context/DarkModeContext'
import API from '../../services/api'
import AdminLayout from '../../components/layout/AdminLayout'

export default function ForOrganizersContentManager() {
  const { isDarkMode } = useDarkMode()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [activeTab, setActiveTab] = useState('hero')
  const [formData, setFormData] = useState({
    hero: {
      title: '',
      subtitle: '',
      buttonText1: '',
      buttonText2: '',
    },
    benefits: {
      title: '',
      subtitle: '',
      items: [],
    },
    steps: {
      title: '',
      subtitle: '',
      items: [],
    },
    faqs: {
      title: '',
      items: [],
    },
    cta: {
      title: '',
      subtitle: '',
      buttonText1: '',
      buttonText2: '',
    },
  })

  useEffect(() => {
    fetchPageContent()
  }, [])

  const fetchPageContent = async () => {
    try {
      setLoading(true)
      const { data } = await API.get('/organizers-page/content')
      if (data.content) {
        setFormData(data.content)
      }
      setError(null)
    } catch (err) {
      console.error('Error fetching page content:', err)
      setError('Failed to load page content')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e, section, field) => {
    const { value } = e.target
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }))
  }

  const handleItemChange = (section, itemIdx, field, value) => {
    setFormData((prev) => {
      const items = [...prev[section].items]
      items[itemIdx] = {
        ...items[itemIdx],
        [field]: value,
      }
      return {
        ...prev,
        [section]: {
          ...prev[section],
          items,
        },
      }
    })
  }

  const addItem = (section) => {
    setFormData((prev) => {
      const newItem =
        section === 'benefits'
          ? { icon: '🎯', title: '', description: '' }
          : section === 'steps'
          ? { number: String((prev[section].items.length + 1)), title: '', description: '' }
          : { question: '', answer: '' }

      return {
        ...prev,
        [section]: {
          ...prev[section],
          items: [...prev[section].items, newItem],
        },
      }
    })
  }

  const removeItem = (section, itemIdx) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        items: prev[section].items.filter((_, idx) => idx !== itemIdx),
      },
    }))
  }

  const saveSection = async (section) => {
    try {
      setSaving(true)
      setError(null)
      await API.put(`/organizers-page/content/${section}`, { data: formData[section] })
      setSuccessMessage(`${section.charAt(0).toUpperCase() + section.slice(1)} updated successfully!`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('Error saving section:', err)
      setError(`Failed to save ${section}`)
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = async () => {
    if (window.confirm('Are you sure you want to reset all content to defaults? This cannot be undone.')) {
      try {
        setSaving(true)
        setError(null)
        await API.post('/organizers-page/content/reset')
        setSuccessMessage('Content reset to defaults successfully!')
        fetchPageContent()
        setTimeout(() => setSuccessMessage(null), 3000)
      } catch (err) {
        console.error('Error resetting content:', err)
        setError('Failed to reset content')
      } finally {
        setSaving(false)
      }
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Organizers Content">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading content...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Organizers Content Manager">
      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}

      <div className="mb-6">
        <p className="text-gray-600 dark:text-gray-400">
          Manage all content sections for the For Organizers marketing page
        </p>
      </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 dark:border-gray-700">
          {['hero', 'benefits', 'steps', 'faqs', 'cta'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === tab
                  ? `text-blue-600 border-b-2 border-blue-600`
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Hero Section */}
        {activeTab === 'hero' && (
          <div className="rounded-lg p-8 bg-white dark:bg-gray-800">
            <h2 className="text-2xl font-bold mb-6">Hero Section</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Title</label>
                <input
                  type="text"
                  value={formData.hero.title}
                  onChange={(e) => handleInputChange(e, 'hero', 'title')}
                  className="w-full px-4 py-2 rounded-lg border "
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Subtitle</label>
                <textarea
                  value={formData.hero.subtitle}
                  onChange={(e) => handleInputChange(e, 'hero', 'subtitle')}
                  rows="3"
                  className="w-full px-4 py-2 rounded-lg border "
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Button 1 Text</label>
                  <input
                    type="text"
                    value={formData.hero.buttonText1}
                    onChange={(e) => handleInputChange(e, 'hero', 'buttonText1')}
                    className="w-full px-4 py-2 rounded-lg border "
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Button 2 Text</label>
                  <input
                    type="text"
                    value={formData.hero.buttonText2}
                    onChange={(e) => handleInputChange(e, 'hero', 'buttonText2')}
                    className="w-full px-4 py-2 rounded-lg border "
                  />
                </div>
              </div>
              <button
                onClick={() => saveSection('hero')}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Hero Section'}
              </button>
            </div>
          </div>
        )}

        {/* Benefits Section */}
        {activeTab === 'benefits' && (
          <div className={`rounded-lg p-8 bg-white dark:bg-gray-800`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Benefits Section</h2>
              <button
                onClick={() => addItem('benefits')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                + Add Benefit
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Section Title</label>
                <input
                  type="text"
                  value={formData.benefits.title}
                  onChange={(e) => handleInputChange(e, 'benefits', 'title')}
                  className="w-full px-4 py-2 rounded-lg border "
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Section Subtitle</label>
                <input
                  type="text"
                  value={formData.benefits.subtitle}
                  onChange={(e) => handleInputChange(e, 'benefits', 'subtitle')}
                  className="w-full px-4 py-2 rounded-lg border "
                />
              </div>

              <div className="space-y-4">
                {formData.benefits.items.map((item, idx) => (
                  <div
                    key={idx}
                      className="p-6 rounded-lg border-2 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-semibold">Benefit {idx + 1}</h3>
                      <button
                        onClick={() => removeItem('benefits', idx)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">Icon</label>
                        <input
                          type="text"
                          maxLength="2"
                          value={item.icon}
                          onChange={(e) => handleItemChange('benefits', idx, 'icon', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border "
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Title</label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleItemChange('benefits', idx, 'title', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border "
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-semibold mb-2">Description</label>
                      <textarea
                        value={item.description}
                        onChange={(e) => handleItemChange('benefits', idx, 'description', e.target.value)}
                        rows="2"
                        className="w-full px-4 py-2 rounded-lg border "
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => saveSection('benefits')}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Benefits Section'}
              </button>
            </div>
          </div>
        )}

        {/* Steps Section */}
        {activeTab === 'steps' && (
          <div className={`rounded-lg p-8 bg-white dark:bg-gray-800`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Steps Section</h2>
              <button
                onClick={() => addItem('steps')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                + Add Step
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Section Title</label>
                <input
                  type="text"
                  value={formData.steps.title}
                  onChange={(e) => handleInputChange(e, 'steps', 'title')}
                  className="w-full px-4 py-2 rounded-lg border "
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Section Subtitle</label>
                <input
                  type="text"
                  value={formData.steps.subtitle}
                  onChange={(e) => handleInputChange(e, 'steps', 'subtitle')}
                  className="w-full px-4 py-2 rounded-lg border "
                />
              </div>

              <div className="space-y-4">
                {formData.steps.items.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-6 rounded-lg border ${
                      'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-semibold">Step {idx + 1}</h3>
                      <button
                        onClick={() => removeItem('steps', idx)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">Step Number</label>
                        <input
                          type="text"
                          value={item.number}
                          onChange={(e) => handleItemChange('steps', idx, 'number', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border "
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Title</label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleItemChange('steps', idx, 'title', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border "
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-semibold mb-2">Description</label>
                      <textarea
                        value={item.description}
                        onChange={(e) => handleItemChange('steps', idx, 'description', e.target.value)}
                        rows="2"
                        className="w-full px-4 py-2 rounded-lg border "
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => saveSection('steps')}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Steps Section'}
              </button>
            </div>
          </div>
        )}

        {/* FAQs Section */}
        {activeTab === 'faqs' && (
          <div className={`rounded-lg p-8 bg-white dark:bg-gray-800`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">FAQs Section</h2>
              <button
                onClick={() => addItem('faqs')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                + Add FAQ
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Section Title</label>
                <input
                  type="text"
                  value={formData.faqs.title}
                  onChange={(e) => handleInputChange(e, 'faqs', 'title')}
                  className="w-full px-4 py-2 rounded-lg border "
                />
              </div>

              <div className="space-y-4">
                {formData.faqs.items.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-6 rounded-lg border ${
                      'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-semibold">FAQ {idx + 1}</h3>
                      <button
                        onClick={() => removeItem('faqs', idx)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">Question</label>
                        <input
                          type="text"
                          value={item.question}
                          onChange={(e) => handleItemChange('faqs', idx, 'question', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border "
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Answer</label>
                        <textarea
                          value={item.answer}
                          onChange={(e) => handleItemChange('faqs', idx, 'answer', e.target.value)}
                          rows="3"
                          className="w-full px-4 py-2 rounded-lg border "
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => saveSection('faqs')}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save FAQs Section'}
              </button>
            </div>
          </div>
        )}

        {/* CTA Section */}
        {activeTab === 'cta' && (
          <div className={`rounded-lg p-8 bg-white dark:bg-gray-800`}>
            <h2 className="text-2xl font-bold mb-6">Call To Action Section</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Title</label>
                <input
                  type="text"
                  value={formData.cta.title}
                  onChange={(e) => handleInputChange(e, 'cta', 'title')}
                  className="w-full px-4 py-2 rounded-lg border "
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Subtitle</label>
                <textarea
                  value={formData.cta.subtitle}
                  onChange={(e) => handleInputChange(e, 'cta', 'subtitle')}
                  rows="3"
                  className="w-full px-4 py-2 rounded-lg border "
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Button 1 Text</label>
                  <input
                    type="text"
                    value={formData.cta.buttonText1}
                    onChange={(e) => handleInputChange(e, 'cta', 'buttonText1')}
                    className="w-full px-4 py-2 rounded-lg border "
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Button 2 Text</label>
                  <input
                    type="text"
                    value={formData.cta.buttonText2}
                    onChange={(e) => handleInputChange(e, 'cta', 'buttonText2')}
                    className="w-full px-4 py-2 rounded-lg border "
                  />
                </div>
              </div>
              <button
                onClick={() => saveSection('cta')}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save CTA Section'}
              </button>
            </div>
          </div>
        )}

        {/* Reset Button */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={resetToDefaults}
            disabled={saving}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            Reset All Content to Defaults
          </button>
        </div>
    </AdminLayout>
  )
}




