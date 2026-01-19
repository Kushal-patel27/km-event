import React, { useState } from 'react'
import { useDarkMode } from '../../context/DarkModeContext'
import { motion } from 'framer-motion'

export default function Cookies() {
  const { isDarkMode } = useDarkMode()
  const [expandedSection, setExpandedSection] = useState(null)

  const sections = [
    {
      id: 1,
      title: '1. What Are Cookies?',
      content: 'Cookies are small text files that are stored on your device (computer, smartphone, or tablet) when you visit a website. They help websites recognize your device and remember information about your visit, such as your preferences, login status, and browsing activity. Cookies are widely used to make websites work more efficiently and provide a better user experience.'
    },
    {
      id: 2,
      title: '2. Types of Cookies We Use',
      subsections: [
        {
          subtitle: '2.1 Essential Cookies',
          content: 'These cookies are necessary for the website to function properly. They enable core functionality such as security, authentication, and network management. Without these cookies, certain services cannot be provided.\n\nExamples:\n• Session cookies for maintaining your login state\n• Security cookies to prevent fraudulent activity\n• Load balancing cookies to distribute traffic efficiently\n\nDuration: Session or up to 24 hours\nCan be disabled: No (required for basic functionality)'
        },
        {
          subtitle: '2.2 Performance & Analytics Cookies',
          content: 'These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. They allow us to count visits, identify traffic sources, and understand which pages are most popular.\n\nExamples:\n• Google Analytics cookies (_ga, _gid, _gat)\n• Page view tracking\n• Click tracking and heatmaps\n• Site performance monitoring\n\nDuration: Up to 2 years\nCan be disabled: Yes (via cookie preferences)'
        },
        {
          subtitle: '2.3 Functionality Cookies',
          content: 'These cookies allow the website to remember choices you make (such as your username, language preference, or theme settings) and provide enhanced, personalized features.\n\nExamples:\n• Dark mode preference\n• Language selection\n• Event search filters and preferences\n• Recently viewed events\n• Wishlist items\n\nDuration: Up to 1 year\nCan be disabled: Yes (may impact functionality)'
        },
        {
          subtitle: '2.4 Targeting & Advertising Cookies',
          content: 'These cookies track your browsing habits to deliver advertisements that are relevant to you and your interests. They also limit the number of times you see an ad and help measure the effectiveness of advertising campaigns.\n\nExamples:\n• Facebook Pixel\n• Google Ads conversion tracking\n• Retargeting cookies\n• Social media sharing cookies\n\nDuration: Up to 90 days\nCan be disabled: Yes (via cookie preferences)'
        }
      ]
    },
    {
      id: 3,
      title: '3. Third-Party Cookies',
      content: 'We use services from trusted third-party providers that may set cookies on your device. These include:\n\n• Google Analytics: For website analytics and performance tracking\n• Payment Processors (Stripe, PayPal): For secure payment processing\n• Social Media Platforms (Facebook, Twitter): For social sharing and login features\n• Content Delivery Networks (CDN): For faster content delivery\n• Customer Support Tools: For chat and help desk functionality\n\nThese third parties have their own privacy policies and cookie policies. We recommend reviewing their policies to understand how they use cookies.'
    },
    {
      id: 4,
      title: '4. How We Use Cookies',
      subsections: [
        {
          subtitle: 'Authentication & Security',
          content: '• Keeping you logged in during your session\n• Protecting against unauthorized access\n• Preventing fraudulent activity and spam\n• Securing payment transactions'
        },
        {
          subtitle: 'User Experience',
          content: '• Remembering your preferences and settings\n• Personalizing content and recommendations\n• Maintaining your shopping cart items\n• Displaying relevant event suggestions\n• Enabling dark mode and theme preferences'
        },
        {
          subtitle: 'Analytics & Performance',
          content: '• Understanding how visitors use our website\n• Identifying popular content and features\n• Detecting and fixing technical issues\n• Improving website speed and performance\n• A/B testing new features'
        },
        {
          subtitle: 'Marketing & Advertising',
          content: '• Delivering relevant advertisements\n• Measuring ad campaign effectiveness\n• Retargeting visitors with relevant offers\n• Tracking conversion rates\n• Understanding user engagement'
        }
      ]
    },
    {
      id: 5,
      title: '5. Managing Your Cookie Preferences',
      content: 'You have several options to control and manage cookies:\n\n**Cookie Consent Banner**\nWhen you first visit our website, you\'ll see a cookie consent banner. You can accept all cookies, reject non-essential cookies, or customize your preferences.\n\n**Browser Settings**\nMost web browsers allow you to manage cookies through their settings. You can:\n• Block all cookies\n• Delete existing cookies\n• Set preferences for specific websites\n• Get notifications when cookies are set\n\nNote: Blocking essential cookies may prevent certain parts of the website from functioning properly.\n\n**Opt-Out Tools**\nYou can opt out of specific tracking services:\n• Google Analytics: https://tools.google.com/dlpage/gaoptout\n• Facebook: Adjust your ad preferences in Facebook settings\n• Network Advertising Initiative: http://optout.networkadvertising.org/\n• Digital Advertising Alliance: http://optout.aboutads.info/'
    },
    {
      id: 6,
      title: '6. Browser-Specific Cookie Management',
      subsections: [
        {
          subtitle: 'Google Chrome',
          content: '1. Click the three dots menu (⋮) in the top-right corner\n2. Go to Settings > Privacy and security > Cookies and other site data\n3. Choose your preferred option:\n   • Allow all cookies\n   • Block third-party cookies\n   • Block all cookies'
        },
        {
          subtitle: 'Mozilla Firefox',
          content: '1. Click the menu button (≡) and select Settings\n2. Go to Privacy & Security\n3. Under Cookies and Site Data, choose your preference:\n   • Standard\n   • Strict\n   • Custom'
        },
        {
          subtitle: 'Safari',
          content: '1. Go to Preferences > Privacy\n2. Under Cookies and website data, select:\n   • Block all cookies\n   • Prevent cross-site tracking\n   • Manage Website Data'
        },
        {
          subtitle: 'Microsoft Edge',
          content: '1. Click the three dots menu (•••) > Settings\n2. Go to Cookies and site permissions > Cookies and site data\n3. Choose your cookie settings'
        }
      ]
    },
    {
      id: 7,
      title: '7. Mobile Device Cookie Management',
      content: '**iOS (Safari)**\n1. Go to Settings > Safari\n2. Tap "Block All Cookies" to prevent all cookies\n3. Or manage under "Privacy & Security"\n\n**Android (Chrome)**\n1. Open Chrome app\n2. Tap three dots (⋮) > Settings\n3. Go to Site settings > Cookies\n4. Choose your preference\n\n**Note:** Settings may vary depending on your device and OS version.'
    },
    {
      id: 8,
      title: '8. Cookie Retention Periods',
      content: 'Different cookies have different lifespans:\n\n• **Session Cookies**: Deleted when you close your browser\n• **Essential Cookies**: 24 hours to 1 month\n• **Functionality Cookies**: 30 days to 1 year\n• **Analytics Cookies**: 30 days to 2 years\n• **Advertising Cookies**: 30 days to 90 days\n\nWe regularly review and delete cookies that are no longer necessary.'
    },
    {
      id: 9,
      title: '9. Do Not Track (DNT)',
      content: 'Some browsers offer a "Do Not Track" (DNT) feature that signals websites you visit that you do not want your online activity tracked. Currently, there is no universal standard for how websites should respond to DNT signals.\n\nWe respect your privacy choices. If you enable DNT in your browser, we will:\n• Limit the use of analytics cookies\n• Reduce personalized advertising\n• Honor your tracking preferences where technically feasible'
    },
    {
      id: 10,
      title: '10. Changes to This Cookie Policy',
      content: 'We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our business practices. When we make significant changes, we will:\n\n• Update the "Last Updated" date at the top of this policy\n• Notify you via email (if you have an account)\n• Display a prominent notice on our website\n• Request your consent again if required by law\n\nWe encourage you to review this Cookie Policy periodically to stay informed about how we use cookies.'
    },
    {
      id: 11,
      title: '11. Contact Us',
      content: 'If you have questions or concerns about our use of cookies, please contact us:\n\n**K&M Events Privacy Team**\n\nEmail: privacy@kmevents.com\nPhone: +1 (555) 123-4567\nAddress: 123 Event Street, Suite 100, Los Angeles, CA 90001\n\nData Protection Officer: dpo@kmevents.com\n\nFor general inquiries: support@kmevents.com\n\nWe will respond to your inquiry within 30 days.'
    }
  ]

  const toggleSection = (id) => {
    setExpandedSection(expandedSection === id ? null : id)
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 via-white to-indigo-50'
    }`}>
      {/* Hero Section */}
      <div className={`py-16 px-6 ${
        isDarkMode 
          ? 'bg-gradient-to-r from-gray-800 to-gray-900' 
          : 'bg-gradient-to-r from-indigo-600 to-purple-600'
      }`}>
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-center mb-4">
              <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Cookie Policy
            </h1>
            <p className="text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto">
              Understanding how we use cookies to enhance your experience on K&M Events
            </p>
            <p className="text-sm text-indigo-200 mt-4">
              Last Updated: January 4, 2026
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className={`mb-8 p-6 rounded-lg ${
            isDarkMode 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-white border border-indigo-100 shadow-md'
          }`}
        >
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
            This Cookie Policy explains how K&M Events uses cookies and similar tracking technologies when you visit our website and mobile applications. We are committed to transparency about the data we collect and how we use it to provide you with the best possible experience.
          </p>
        </motion.div>

        {/* Accordion Sections */}
        <div className="space-y-4">
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.4 }}
              className={`rounded-lg overflow-hidden ${
                isDarkMode 
                  ? 'bg-gray-800 border border-gray-700' 
                  : 'bg-white border border-gray-200 shadow-sm'
              }`}
            >
              <button
                onClick={() => toggleSection(section.id)}
                className={`w-full px-6 py-4 text-left flex items-center justify-between transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-gray-750' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <h2 className={`text-lg font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {section.title}
                </h2>
                <svg
                  className={`w-5 h-5 transition-transform ${
                    expandedSection === section.id ? 'rotate-180' : ''
                  } ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedSection === section.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`px-6 pb-6 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  <div className="space-y-4">
                    {section.content && (
                      <p className="leading-relaxed whitespace-pre-line">
                        {section.content}
                      </p>
                    )}
                    
                    {section.subsections && section.subsections.map((subsection, idx) => (
                      <div key={idx} className="mt-4">
                        <h3 className={`font-semibold mb-2 ${
                          isDarkMode ? 'text-indigo-400' : 'text-indigo-700'
                        }`}>
                          {subsection.subtitle}
                        </h3>
                        <p className="leading-relaxed whitespace-pre-line">
                          {subsection.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Cookie Preference Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-12 text-center"
        >
          <button
            onClick={() => {
              // This would typically open a cookie consent modal
              alert('Cookie preferences modal would open here')
            }}
            className={`px-8 py-4 rounded-lg font-semibold transition-all transform hover:scale-105 ${
              isDarkMode
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg'
            }`}
          >
            Manage Cookie Preferences
          </button>
          <p className={`mt-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Click to customize which cookies you allow
          </p>
        </motion.div>

        {/* Quick Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className={`mt-12 p-6 rounded-lg ${
            isDarkMode 
              ? 'bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-700/50' 
              : 'bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200'
          }`}
        >
          <h3 className={`text-xl font-bold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Quick Summary
          </h3>
          <ul className={`space-y-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>We use cookies to improve your experience and provide personalized content</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>You can control cookie settings through your browser or our preference center</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Essential cookies are necessary for the site to function and cannot be disabled</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>We respect your privacy and comply with all applicable data protection laws</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  )
}
