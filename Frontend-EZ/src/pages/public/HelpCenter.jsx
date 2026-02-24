import React, { useEffect, useMemo, useState } from 'react'
import { useDarkMode } from '../../context/DarkModeContext'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fetchHelpArticles } from '../../services/api'

const fallbackSections = [
  {
    key: 'getting-started',
    title: 'Getting Started',
    icon: '🚀',
    content: [
      {
        title: 'Create Your Account',
        description: 'Sign up in seconds to start booking your favorite events',
        steps: [
          'Click "Sign Up" on the homepage',
          'Enter your email and create a password',
          'Verify your email address',
          'Complete your profile (optional)'
        ]
      },
      {
        title: 'Browse Events',
        description: 'Discover amazing events near you',
        steps: [
          'Go to the Events page',
          'Filter by category, date, or location',
          'Click on an event to see details',
          'Check availability and pricing'
        ]
      },
      {
        title: 'Book Your First Ticket',
        description: 'Complete your booking in 3 simple steps',
        steps: [
          'Click "Book Now" on any event',
          'Select the number of tickets',
          'Choose your seats (if available)',
          'Complete payment and get your ticket'
        ]
      }
    ]
  },
  {
    key: 'booking',
    title: 'Booking & Tickets',
    icon: '🎫',
    content: [
      {
        title: 'How to Book',
        description: 'Step-by-step booking guide',
        steps: [
          'Find and select your event',
          'Choose ticket quantity in Step 1',
          'Select seats in Step 2 (if theater layout available)',
          'Review and confirm in Step 3',
          'Complete payment securely'
        ]
      },
      {
        title: 'Seat Selection',
        description: 'How to select and manage your seats',
        steps: [
          'Green seats = Available to book',
          'Red seats = Currently selected by you',
          'Gray seats = Already booked by others',
          'Click seats to toggle selection',
          'See your selection count at the top'
        ]
      },
      {
        title: 'What Happens After Booking',
        description: 'Information about your ticket after purchase',
        steps: [
          'Instant confirmation on screen',
          'Confirmation email sent to your address',
          'Digital ticket available in "My Bookings"',
          'QR code for entry is on your ticket',
          'Can download or print your ticket'
        ]
      },
      {
        title: 'Modify or Cancel',
        description: 'How to change or cancel your booking',
        steps: [
          'Go to "My Bookings" in your account',
          'Select the event you want to modify',
          'Contact support within cancellation window',
          'Refunds processed to original payment method',
          'Typically 5-7 business days'
        ]
      }
    ]
  },
  {
    key: 'tickets',
    title: 'Understanding Your Ticket',
    icon: '🎟️',
    content: [
      {
        title: 'Ticket Components',
        description: 'What information is on your ticket',
        steps: [
          'Event Title - Name of the event',
          'ADMIT ONE - Entry authorization badge',
          'Date & Time - When the event happens',
          'Location - Where to go',
          'Seat Number - Your assigned seat',
          'Ticket Holder - Your name',
          'QR Code - Scan for entry',
          'Ticket ID - Unique identifier'
        ]
      },
      {
        title: 'Using Your Ticket at Entry',
        description: 'How to enter with your digital ticket',
        steps: [
          'Arrive at venue before event start',
          'Show your ticket on phone or printed copy',
          'Our staff will scan the QR code',
          'Present ID if requested',
          'Proceed to your assigned seat'
        ]
      },
      {
        title: 'Ticket Storage & Access',
        description: 'Where to find and manage your tickets',
        steps: [
          'Log into your account anytime',
          'Click "My Bookings" to view all tickets',
          'Click ticket to flip and see QR code',
          'Share booking ID with others (reference)',
          'Download for offline access'
        ]
      },
      {
        title: 'Ticket Validity',
        description: 'Important info about ticket authenticity',
        steps: [
          'Tickets are valid only for purchased person',
          'Non-transferable tickets cannot be gifted',
          'Each QR code is one-time use only',
          'Scanned tickets show "SCANNED" status',
          'Contact us if you suspect fraud'
        ]
      }
    ]
  },
  {
    key: 'payment',
    title: 'Payment & Refunds',
    icon: '💳',
    content: [
      {
        title: 'Accepted Payment Methods',
        description: 'How we accept payments',
        steps: [
          'Credit Cards (Visa, MasterCard, Amex)',
          'Debit Cards with Visa/Mastercard',
          'Digital Wallets (region-dependent)',
          'All payments are secure and encrypted',
          'No sensitive data stored on our servers'
        ]
      },
      {
        title: 'Payment Security',
        description: 'How we protect your information',
        steps: [
          'SSL encryption for all transactions',
          'PCI DSS compliance',
          'No storage of full card numbers',
          'Secure payment gateway partner',
          'Regular security audits'
        ]
      },
      {
        title: 'Refund Policy',
        description: 'When you can get your money back',
        steps: [
          'Cancellations 7+ days before: Full refund',
          'Cancellations 3-7 days before: 75% refund',
          'Cancellations 0-3 days before: No refund',
          'Event cancelled by organizer: Full refund',
          'Check specific event terms for details'
        ]
      },
      {
        title: 'Refund Processing',
        description: 'How long refunds take',
        steps: [
          'Refund initiated immediately upon approval',
          'Refunds return to original payment method',
          'Bank processing: 5-7 business days',
          'Credit card: May appear as credit first',
          'Check bank statement if not visible'
        ]
      }
    ]
  },
  {
    key: 'account',
    title: 'Account & Profile',
    icon: '👤',
    content: [
      {
        title: 'Account Setup',
        description: 'Creating and managing your account',
        steps: [
          'Visit the Sign Up page',
          'Enter email and password',
          'Verify your email with confirmation link',
          'Add profile photo (optional)',
          'Complete your profile information'
        ]
      },
      {
        title: 'Password Management',
        description: 'Securing your account',
        steps: [
          'Use strong, unique passwords',
          'Include numbers, letters, and symbols',
          'Change password regularly',
          'Never share your password',
          'Use "Forgot Password" if you forget it'
        ]
      },
      {
        title: 'Email Notifications',
        description: 'Manage your communication preferences',
        steps: [
          'Go to Settings',
          'Click "Notification Preferences"',
          'Choose which emails to receive',
          'Select notification frequency',
          'Save your preferences'
        ]
      },
      {
        title: 'Account Security',
        description: 'Keep your account safe',
        steps: [
          'Enable two-factor authentication (coming soon)',
          'Review login activity regularly',
          'Use unique passwords',
          'Logout on shared devices',
          'Report suspicious activity immediately'
        ]
      }
    ]
  },
  {
    key: 'troubleshooting',
    title: 'Troubleshooting',
    icon: '🔧',
    content: [
      {
        title: 'Cannot Log In',
        description: 'Troubleshooting login issues',
        steps: [
          'Check spelling of email address',
          'Try "Forgot Password" to reset',
          'Clear browser cache and cookies',
          'Disable browser extensions temporarily',
          'Try a different browser'
        ]
      },
      {
        title: 'Payment Failed',
        description: 'What to do when payment is declined',
        steps: [
          'Check card has sufficient funds',
          'Verify card details are correct',
          'Check expiration date and CVV',
          'Contact your bank to unblock charges',
          'Try a different payment method'
        ]
      },
      {
        title: 'QR Code Not Scanning',
        description: 'Solutions for QR code issues',
        steps: [
          'Ensure good lighting at entry',
          'Hold device steady and at slight angle',
          'Increase brightness on your phone',
          'Clean phone camera lens',
          'Staff can manually verify ticket ID'
        ]
      },
      {
        title: 'Missing Booking Confirmation',
        description: 'Where to find your confirmation',
        steps: [
          'Check "My Bookings" section',
          'Look in spam/junk email folder',
          'Check email address used at signup',
          'Contact support with booking details',
          'We can resend confirmation email'
        ]
      },
      {
        title: 'Website Technical Issues',
        description: 'Fixing common technical problems',
        steps: [
          'Refresh the page (F5 or Ctrl+R)',
          'Clear browser cache',
          'Close and reopen browser',
          'Try mobile app instead',
          'Try different browser (Chrome, Firefox, etc.)'
        ]
      }
    ]
  }
]

const slugify = (value) => (value || 'general')
  .toString()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '')
  .slice(0, 80) || 'general'

const iconForCategory = (category) => {
  const c = (category || '').toLowerCase()
  if (c.includes('start')) return '🚀'
  if (c.includes('book')) return '🎫'
  if (c.includes('ticket')) return '🎟️'
  if (c.includes('pay') || c.includes('refund')) return '💳'
  if (c.includes('account') || c.includes('profile')) return '👤'
  if (c.includes('trouble') || c.includes('issue')) return '🔧'
  return '❓'
}

export default function HelpCenter() {
  const { isDarkMode } = useDarkMode()
  const defaultSections = useMemo(() => fallbackSections, [])
  const [sections, setSections] = useState(defaultSections)
  const [activeTab, setActiveTab] = useState(defaultSections[0]?.key || 'getting-started')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetchHelpArticles({ q: search || undefined, limit: 200 })
        const items = res.data?.data || []

        if (!mounted) return

        if (!items.length) {
          setSections(defaultSections)
          setActiveTab(defaultSections[0]?.key || 'getting-started')
          setError(null)
          return
        }

        const grouped = new Map()
        items.forEach(item => {
          const key = slugify(item.category || 'General')
          const section = grouped.get(key) || {
            key,
            title: item.category || 'General',
            icon: iconForCategory(item.category),
            content: [],
          }

          section.content.push({
            title: item.title,
            description: item.description,
            steps: Array.isArray(item.steps) ? item.steps.filter(Boolean) : [],
            order: typeof item.order === 'number' ? item.order : 0,
          })

          grouped.set(key, section)
        })

        const normalized = Array.from(grouped.values()).map(section => ({
          ...section,
          content: section.content
            .sort((a, b) => a.order - b.order)
            .map(({ order, ...rest }) => rest),
        }))

        normalized.sort((a, b) => (a.title || '').localeCompare(b.title || ''))

        setSections(normalized)
        if (!normalized.find(s => s.key === activeTab) && normalized[0]) {
          setActiveTab(normalized[0].key)
        }
        setError(null)
      } catch (err) {
        if (!mounted) return
        console.error('Failed to load help articles', err)
        setError('Unable to load live help content. Showing fallback info.')
        setSections(defaultSections)
        setActiveTab(defaultSections[0]?.key || 'getting-started')
      } finally {
        if (mounted) setLoading(false)
      }
    }, 350)

    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [search, defaultSections])

  const contactMethods = [
    {
      icon: '📧',
      title: 'Email Support',
      description: 'Get detailed help via email',
      value: 'support@kmevents.com',
      color: isDarkMode ? 'from-black to-neutral-900 border-neutral-800' : 'from-blue-50 to-cyan-50 border-blue-200'
    },
    {
      icon: '📞',
      title: 'Phone Support',
      description: 'Speak with our team',
      value: '+91 95686-98796',
      color: isDarkMode ? 'from-black to-neutral-900 border-neutral-800' : 'from-purple-50 to-pink-50 border-purple-200'
    },
    {
      icon: '💬',
      title: 'Live Chat',
      description: 'Quick answers from our team',
      value: 'Available Mon-Fri 9AM-6PM',
      color: isDarkMode ? 'from-black to-neutral-900 border-neutral-800' : 'from-orange-50 to-red-50 border-orange-200'
    },
    {
      icon: '❓',
      title: 'FAQ',
      description: 'Browse common questions',
      value: 'Visit our FAQ page',
      link: '/faq',
      color: isDarkMode ? 'from-black to-neutral-900 border-neutral-800' : 'from-green-50 to-emerald-50 border-green-200'
    }
  ]

  const activeSection = sections.find(s => s.key === activeTab) || sections[0] || { title: 'Help Center', icon: '❓', content: [] }
  const displayedArticles = activeSection.content || []

  return (
    <div className={`min-h-screen py-12 transition-colors ${
      isDarkMode
        ? 'bg-black'
        : 'bg-gradient-to-b from-gray-50 to-white'
    }`}>
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className={`text-4xl md:text-5xl font-black mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Help Center
          </h1>
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Everything you need to know about booking events and managing your tickets
          </p>
        </motion.div>

        {/* Quick Contact Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
        >
          {contactMethods.map((method, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -5 }}
              className={`bg-gradient-to-br ${method.color} border-2 rounded-xl p-6 transition`}
            >
              <div className="text-3xl mb-3">{method.icon}</div>
              <h3 className={`font-bold text-lg mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {method.title}
              </h3>
              <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {method.description}
              </p>
              {method.link ? (
                <Link to={method.link} className={`font-semibold ${isDarkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700'}`}>
                  {method.value} →
                </Link>
              ) : (
                <p className={`font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  {method.value}
                </p>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Search & Status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 space-y-3"
        >
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search help articles (title, description, category)"
              className={`flex-1 px-4 py-3 rounded-lg border ${
                isDarkMode
                  ? 'bg-black border-neutral-800 text-white placeholder:text-neutral-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-500'
              } focus:outline-none focus:border-red-500`}
            />
            <button
              type="button"
              onClick={() => setSearch('')}
              className={`px-4 py-3 rounded-lg font-semibold border transition ${
                isDarkMode
                  ? 'border-neutral-800 text-gray-200 hover:bg-neutral-900'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Clear
            </button>
          </div>

          {error && (
            <div className={`p-3 rounded-lg border text-sm ${
              isDarkMode
                ? 'border-amber-500/40 text-amber-200 bg-amber-500/10'
                : 'border-amber-400 text-amber-700 bg-amber-50'
            }`}>
              {error}
            </div>
          )}
        </motion.div>

        {loading ? (
          <div className="text-center py-12">
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Loading help content...</p>
          </div>
        ) : sections.length === 0 ? (
          <div className="text-center py-12">
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>No help articles found.</p>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <div className={`flex flex-wrap gap-2 p-2 rounded-xl ${
                isDarkMode ? 'bg-neutral-900/70' : 'bg-gray-100'
              }`}>
                {sections.map(section => (
                  <button
                    key={section.key}
                    onClick={() => setActiveTab(section.key)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                      activeTab === section.key
                        ? isDarkMode
                          ? 'bg-red-600 text-white'
                          : 'bg-indigo-600 text-white'
                        : isDarkMode
                        ? 'text-gray-400 hover:text-white hover:bg-neutral-800'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-2">{section.icon}</span>
                    {section.title}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Content Section */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <h2 className={`text-3xl font-black mb-8 flex items-center gap-3 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <span className="text-4xl">{activeSection.icon}</span>
                {activeSection.title}
              </h2>

              <div className="space-y-6">
                {displayedArticles.map((item, index) => (
                  <motion.div
                    key={`${item.title}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`rounded-xl overflow-hidden border-2 transition ${
                      isDarkMode
                        ? 'bg-neutral-900/70 border-neutral-800 hover:border-red-500/60'
                        : 'bg-white border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className={`p-6 ${isDarkMode ? 'bg-neutral-900/60' : 'bg-gray-50'}`}>
                      <h3 className={`text-xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {item.title}
                      </h3>
                      <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {item.description}
                      </p>
                    </div>

                    {item.steps?.length > 0 && (
                      <div className={`p-6 border-t ${isDarkMode ? 'border-neutral-800' : 'border-gray-200'}`}>
                        <ul className="space-y-3">
                          {item.steps.map((step, stepIndex) => (
                            <li key={`${step}-${stepIndex}`} className="flex gap-3">
                              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm ${
                                isDarkMode
                                  ? 'bg-red-600/30 text-red-400'
                                  : 'bg-indigo-100 text-indigo-600'
                              }`}>
                                {stepIndex + 1}
                              </div>
                              <p className={`pt-0.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {step}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {/* Video Tutorials Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16"
        >
          <h2 className={`text-3xl font-black mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            📹 Video Tutorials (Coming Soon)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {['How to Book', 'Seat Selection', 'Using Your Ticket'].map((title, index) => (
              <div
                key={index}
                className={`rounded-xl overflow-hidden border-2 ${
                  isDarkMode
                    ? 'bg-neutral-900/70 border-neutral-800'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className={`aspect-video flex items-center justify-center ${
                  isDarkMode ? 'bg-black' : 'bg-gray-200'
                }`}>
                  <svg className="w-16 h-16 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM4 8a1 1 0 011-1h1a1 1 0 010 2H5a1 1 0 01-1-1z" />
                  </svg>
                </div>
                <div className="p-4">
                  <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {title}
                  </h3>
                  <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Video tutorials coming soon
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Still Need Help */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`mt-16 p-8 rounded-2xl border-2 text-center ${
            isDarkMode
              ? 'bg-black border-neutral-800'
              : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200'
          }`}
        >
          <h3 className={`text-2xl font-black mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Still can't find what you're looking for?
          </h3>
          <p className={`text-lg mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Our support team is ready to help you out
          </p>
          <a
            href="mailto:support@kmevents.com"
            className={`inline-block px-8 py-3 rounded-lg font-bold transition transform hover:scale-105 ${
              isDarkMode
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            Contact Support
          </a>
        </motion.div>
      </div>
    </div>
  )
}
