import React, { useState, useEffect } from 'react'
import { useDarkMode } from '../../context/DarkModeContext'
import { motion } from 'framer-motion'
import API from '../../services/api'

export default function FAQ() {
  const { isDarkMode } = useDarkMode()
  const [openIndex, setOpenIndex] = useState(null)
  const [faqItems, setFaqItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const limit = 50

  // Helper: dedupe questions by id or text
  const dedupeQuestions = (questions) => {
    const seen = new Set()
    return questions.filter(item => {
      const key = (item.id || item.q || '').trim().toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  // Fallback FAQ data in case API fails
  const fallbackFAQItems = [
    {
      category: 'Booking & Tickets',
      questions: [
        {
          q: 'How do I book tickets for an event?',
          a: 'To book tickets: 1) Browse our events page, 2) Select your desired event, 3) Choose the number of tickets and seats (if available), 4) Enter your information, 5) Complete the payment. You\'ll receive a confirmation and digital ticket via email.'
        },
        {
          q: 'Can I select specific seats?',
          a: 'Yes! If the event has a seating arrangement, you can select specific seats during checkout. Available seats are shown in green, booked seats in gray. You\'ll see live availability updates.'
        },
        {
          q: 'How many tickets can I book at once?',
          a: 'You can book up to the maximum available tickets for any event. The limit depends on availability and is shown during the booking process.'
        },
        {
          q: 'Can I modify my booking after purchase?',
          a: 'Modifications depend on event policies. Contact our support team at k.m.easyevents@gmail.com with your booking details to discuss possible changes.'
        }
      ]
    },
    {
      category: 'Tickets & Entry',
      questions: [
        {
          q: 'What does my ticket contain?',
          a: 'Your ticket includes: event name, date & time, location, your name, assigned seat (if applicable), a unique QR code for entry, and ticket validity information. You can flip the ticket to view the QR code.'
        },
        {
          q: 'How do I use my ticket at the event?',
          a: 'Simply show your digital ticket (or printed version) at the event entrance. Our staff will scan the QR code to verify your entry. Tickets are one-time use only.'
        },
        {
          q: 'Can I transfer my ticket to someone else?',
          a: 'Tickets are typically non-transferable and personal to the purchaser. Check the specific event\'s terms, or contact support if you need to make changes.'
        },
        {
          q: 'What if I lose my ticket?',
          a: 'Your tickets are stored in your account under "My Bookings". You can download or display them anytime. If you have account access, you can retrieve your tickets.'
        }
      ]
    },
    {
      category: 'Payment & Refunds',
      questions: [
        {
          q: 'What payment methods do you accept?',
          a: 'We accept all major credit cards (Visa, MasterCard, American Express) and other digital payment methods depending on your region.'
        },
        {
          q: 'Is my payment information secure?',
          a: 'Yes! We use industry-standard encryption and security protocols to protect your payment information. Your data is never stored directly on our servers.'
        },
        {
          q: 'What is your refund policy?',
          a: 'Refund eligibility depends on the event\'s specific cancellation policy. Generally, cancellations made 7+ days before the event may be eligible for a refund. Check the event details or contact support.'
        },
        {
          q: 'Can I get a refund if the event is cancelled?',
          a: 'Yes! If an event is cancelled by the organizer, you\'ll receive a full refund automatically. We\'ll also offer priority booking for rescheduled dates.'
        },
        {
          q: 'How long do refunds take?',
          a: 'Refunds typically process within 5-7 business days back to your original payment method, depending on your bank.'
        }
      ]
    },
    {
      category: 'Account & Profile',
      questions: [
        {
          q: 'How do I create an account?',
          a: 'Click "Sign Up" on the homepage, enter your name and email, create a strong password, and verify your email. You\'ll then be able to book tickets and access your bookings.'
        },
        {
          q: 'How do I reset my password?',
          a: 'Click "Login", then select "Forgot Password". Enter your email, and we\'ll send you a password reset link. Follow the link to create a new password.'
        },
        {
          q: 'Can I have multiple accounts?',
          a: 'We recommend using one account per person. If you need a new account, use a different email address. Multiple accounts under the same person may be restricted.'
        },
        {
          q: 'How do I view my booking history?',
          a: 'Log into your account and click "My Bookings". You\'ll see all your current and past bookings with details, tickets, and booking confirmation.'
        },
        {
          q: 'How do I update my profile information?',
          a: 'Go to "Settings" in your account menu. You can update your name, email, phone number, and other profile details there.'
        }
      ]
    },
    {
      category: 'Support',
      questions: [
        {
          q: 'How do I contact customer support?',
          a: 'Email us at k.m.easyevents@gmail.com, call our helpline, or use the chat feature on our website. Our team responds within 24 hours during business hours.'
        },
        {
          q: 'What are your business hours?',
          a: 'Our support team is available Monday-Friday, 9 AM - 6 PM (local time). Urgent issues can be escalated for weekend support.'
        }
      ]
    }
  ]

  // Fetch FAQs from API with pagination so older Q&A can be loaded
  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        setLoading(true)
        const response = await API.get(`/faq?page=${page}&limit=${limit}`)

        const apiFAQs = response.data?.data || []
        const totalPages = response.data?.totalPages || 1

        // Group FAQs by category
        const grouped = {}
        apiFAQs.forEach(faq => {
          if (!grouped[faq.category]) grouped[faq.category] = []
          grouped[faq.category].push({ q: faq.question, a: faq.answer, id: faq._id })
        })

        const formattedFAQs = Object.entries(grouped).map(([category, questions]) => ({ category, questions: dedupeQuestions(questions) }))

        if (page === 1 && formattedFAQs.length === 0) {
          // First load and no data from backend: use fallback content
          setFaqItems(fallbackFAQItems)
          setHasMore(false)
        } else {
          // Merge new page results into existing grouped items
          setFaqItems(prev => {
            const map = new Map(prev.map(s => [s.category, s.questions]))
            formattedFAQs.forEach(s => {
              const existing = map.get(s.category) || []
              const merged = dedupeQuestions([...existing, ...s.questions])
              map.set(s.category, merged)
            })
            return Array.from(map.entries()).map(([category, questions]) => ({ category, questions }))
          })
          setHasMore(page < totalPages)
        }
        setError(null)
      } catch (err) {
        console.error('Failed to fetch FAQs:', err)
        if (page === 1) {
          setFaqItems(fallbackFAQItems)
        }
        setHasMore(false)
      } finally {
        setLoading(false)
      }
    }

    fetchFAQs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const loadMore = () => {
    if (hasMore) setPage(p => p + 1)
  }

  const FAQItem = ({ item, index, isOpen }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`border rounded-xl overflow-hidden transition-all ${
        isDarkMode
          ? 'bg-neutral-900/70 border-neutral-800 hover:border-red-500/60'
          : 'bg-white border-gray-200 hover:border-indigo-300'
      }`}
    >
      <button
        onClick={() => setOpenIndex(isOpen ? null : index)}
        className={`w-full p-5 text-left flex items-center justify-between transition-all ${
          isDarkMode ? 'hover:bg-neutral-900' : 'hover:bg-gray-50'
        }`}
      >
        <span className={`font-semibold text-lg pr-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {item.q}
        </span>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className={`w-6 h-6 flex-shrink-0 ${isDarkMode ? 'text-red-400' : 'text-indigo-600'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </motion.svg>
      </button>

      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className={`p-5 border-t ${isDarkMode ? 'border-neutral-800 bg-neutral-900/60' : 'border-gray-100 bg-gray-50/50'}`}>
          <p className={`text-base leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {item.a}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )

  return (
    <div className={`min-h-screen py-12 transition-colors ${
      isDarkMode
        ? 'bg-black'
        : 'bg-gradient-to-b from-gray-50 to-white'
    }`}>
      <div className="max-w-4xl mx-auto px-6">
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
            Frequently Asked Questions
          </h1>
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Find answers to common questions about booking, tickets, payments, and more.
          </p>
        </motion.div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Loading FAQs...</p>
          </div>
        ) : (
          <>
            {/* FAQ Sections */}
            <div className="space-y-8">
              {faqItems.map((section, sectionIndex) => (
                <motion.div
                  key={sectionIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: sectionIndex * 0.1 }}
                >
                  {/* Section Title */}
                  <div className="mb-6">
                    <h2 className={`text-2xl font-black mb-4 flex items-center gap-3 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      <span className={`w-1 h-8 rounded-full ${
                        isDarkMode ? 'bg-red-600' : 'bg-indigo-600'
                      }`}></span>
                      {section.category}
                    </h2>
                  </div>

                  {/* Questions */}
                  <div className="space-y-3">
                    {section.questions.map((item, itemIndex) => {
                      const globalIndex = faqItems.slice(0, sectionIndex).reduce((sum, s) => sum + s.questions.length, 0) + itemIndex
                      return (
                        <FAQItem
                          key={itemIndex}
                          item={item}
                          index={globalIndex}
                          isOpen={openIndex === globalIndex}
                        />
                      )
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* Load more button for older Q&A */}
        {hasMore && (
          <div className="mt-8 text-center">
            <button
              onClick={loadMore}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold rounded-lg transition"
            >
              Load more FAQs
            </button>
          </div>
        )}

        {/* Still Need Help */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`mt-16 p-8 rounded-2xl border-2 ${
            isDarkMode
              ? 'bg-gradient-to-r from-red-900/30 to-orange-900/30 border-red-500/50'
              : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200'
          }`}
        >
          <h3 className={`text-2xl font-black mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Still need help?
          </h3>
          <p className={`text-lg mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Can't find what you're looking for? Contact our support team:
          </p>
          <div className={`flex flex-col sm:flex-row gap-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <a href="mailto:k.m.easyevents@gmail.com" className={`font-semibold hover:underline ${
                isDarkMode ? 'text-red-400' : 'text-indigo-600'
              }`}>
                k.m.easyevents@gmail.com
              </a>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773c.058.3.238.646.519 1.001.281.355.645.738 1.035 1.122.39.384.793.645 1.055.788.262.143.527.145.774.01l1.3-1.208a1 1 0 011.438.331l2.786 4.884a1 1 0 01-.604 1.419l-2.074.521c-.909.228-1.359 1.229-1.191 2.247.021.131.032.262.044.392.261 2.921-1.604 5.625-3.132 5.832-.504.073-1.14-.235-1.558-.923-.419-.688-.79-1.656-.996-3.071-.404-2.831.068-6.537 1.239-8.339.381-.577.322-1.355.588-2.177.266-.822.641-1.674.734-2.417.31-2.35-1.857-4.383-4.224-4.383H3a1 1 0 01-1-1V3z" />
              </svg>
              <span className="font-semibold">+91 95686-98796</span>
            </div>
          </div>
        </motion.div>

        {/* Hours */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className={`mt-8 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
        >
          <p>Support Hours: Monday - Friday, 9 AM - 6 PM</p>
        </motion.div>
      </div>
    </div>
  )
}
