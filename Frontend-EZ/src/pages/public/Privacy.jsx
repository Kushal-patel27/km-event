import React, { useState } from 'react'
import { useDarkMode } from '../../context/DarkModeContext'
import { motion } from 'framer-motion'

export default function PrivacyPolicy() {
  const { isDarkMode } = useDarkMode()
  const [expandedSection, setExpandedSection] = useState(null)

  const sections = [
    {
      id: 1,
      title: '1. Introduction',
      content: 'K&M Events ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, mobile application, and related services (collectively, the "Services"). Please read this Privacy Policy carefully. If you do not agree with our policies and practices, please do not use our Services.'
    },
    {
      id: 2,
      title: '2. Information We Collect',
      subsections: [
        {
          subtitle: '2.1 Information You Provide Directly',
          content: 'Account Registration: Name, email address, phone number, password, profile photo, date of birth, gender, and address when you create an account.\n\nBooking Information: When you book tickets, we collect event details, ticket preferences, seat selections, and quantity information.\n\nPayment Information: We collect payment information including card details, billing address, and transaction history. Payment processing is handled by secure third-party payment processors.\n\nCommunication: Email addresses, messages, and inquiries when you contact our customer support team.\n\nOptional Information: Profile preferences, favorite events, wishlists, and other optional information you choose to share.'
        },
        {
          subtitle: '2.2 Information Collected Automatically',
          content: 'Device Information: Device type, operating system, browser type, IP address, and unique device identifiers.\n\nUsage Information: Pages visited, time spent, features used, search queries, and interactions with our Services.\n\nLocation Information: Approximate location based on IP address (not precise GPS tracking without consent).\n\nCookies and Similar Technologies: We use cookies, web beacons, and similar tracking technologies to enhance your experience and analyze usage patterns.'
        },
        {
          subtitle: '2.3 Third-Party Information',
          content: 'Social Media: If you connect your social media accounts (Google OAuth), we collect publicly available information to verify your identity.\n\nPayment Providers: Confirmation data from payment processors regarding successful transactions.\n\nAnalytics Partners: Information about your interactions with our platform through Google Analytics and similar services.'
        }
      ]
    },
    {
      id: 3,
      title: '3. How We Use Your Information',
      subsections: [
        {
          subtitle: 'Service Delivery',
          content: 'Processing bookings and ticket purchases\nGenerating and sending digital tickets and QR codes\nManaging seat assignments and availability\nProviding customer support and handling inquiries'
        },
        {
          subtitle: 'Communication',
          content: 'Sending booking confirmations and receipts\nEvent reminders and updates\nNotifications about account activity\nNewsletters and promotional content (with your consent)'
        },
        {
          subtitle: 'Improvement & Analytics',
          content: 'Analyzing usage patterns to improve Services\nIdentifying and fixing technical issues\nPersonalizing your experience\nConducting research and analytics'
        },
        {
          subtitle: 'Security & Compliance',
          content: 'Detecting and preventing fraud\nEnforcing terms of service\nComplying with legal obligations\nProtecting rights and safety of users'
        }
      ]
    },
    {
      id: 4,
      title: '4. How We Share Your Information',
      content: 'Event Organizers: Basic booking information needed to fulfill ticket delivery and entry.\n\nPayment Processors: Payment details required for transaction processing.\n\nService Providers: Third-party vendors for hosting, analytics, email delivery, and customer support.\n\nLegal Requirements: When required by law, court order, or governmental authority.\n\nBusiness Transfers: In case of merger, acquisition, or sale of assets, user information may be transferred.\n\nWith Your Consent: We may share information when you explicitly give permission.'
    },
    {
      id: 5,
      title: '5. Your Privacy Rights',
      subsections: [
        {
          subtitle: 'Access',
          content: 'You have the right to access personal data we hold about you and can request a copy of your information.'
        },
        {
          subtitle: 'Correction',
          content: 'You can update, correct, or modify your personal information through your account settings anytime.'
        },
        {
          subtitle: 'Deletion',
          content: 'You may request deletion of your account and associated personal data. Some information may be retained for legal or business purposes.'
        },
        {
          subtitle: 'Opt-Out',
          content: 'You can unsubscribe from promotional emails and marketing communications at any time.'
        },
        {
          subtitle: 'Data Portability',
          content: 'You have the right to receive your personal data in a structured, commonly used format.'
        }
      ]
    },
    {
      id: 6,
      title: '6. Data Security',
      content: 'We implement comprehensive security measures to protect your personal information:\n\n• SSL/TLS Encryption for all data in transit\n• Secure data storage with access controls\n• Regular security audits and penetration testing\n• PCI DSS compliance for payment handling\n• Employee training on data protection\n• Incident response procedures\n\nHowever, no method of transmission over the internet is completely secure. While we strive to protect your information, we cannot guarantee absolute security.'
    },
    {
      id: 7,
      title: '7. Data Retention',
      content: 'Account Information: Retained while your account is active, or as needed to provide services.\n\nBooking Records: Kept for at least 7 years for legal and tax compliance purposes.\n\nPayment Information: Securely deleted after transaction completion (payment processor retention may apply).\n\nUsage Data: Generally retained for 24 months for analytics purposes.\n\nMarketing Data: Retained until you unsubscribe or request deletion.'
    },
    {
      id: 8,
      title: '8. Cookies and Tracking Technologies',
      subsections: [
        {
          subtitle: 'What are Cookies?',
          content: 'Cookies are small text files stored on your device to remember your preferences and improve your experience.'
        },
        {
          subtitle: 'Types of Cookies We Use',
          content: 'Essential Cookies: Required for website functionality\nPreference Cookies: Remember your settings and preferences\nAnalytics Cookies: Help us understand how you use our Services\nMarketing Cookies: Used for targeted advertising and promotional content'
        },
        {
          subtitle: 'Managing Cookies',
          content: 'You can control cookies through your browser settings. Most browsers allow you to refuse cookies or alert you when cookies are being sent. However, disabling cookies may affect website functionality.'
        }
      ]
    },
    {
      id: 9,
      title: '9. Third-Party Services',
      content: 'Our Services may contain links to third-party websites and services that are not operated by K&M Events. This Privacy Policy applies only to information collected through our Services. We are not responsible for the privacy practices of third-party services. We encourage you to review their privacy policies before providing personal information.'
    },
    {
      id: 10,
      title: '10. Children\'s Privacy',
      content: 'Our Services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected information from a child under 13, we will take steps to delete such information and terminate the child\'s account. Parents or guardians who believe their child has provided information to us should contact us immediately.'
    },
    {
      id: 11,
      title: '11. International Data Transfers',
      content: 'Your information may be transferred to, stored in, and processed in countries other than your country of residence, which may have different data protection laws. By using our Services, you consent to the transfer of your information to countries outside your country of residence, which may provide a different level of data protection than your home country.'
    },
    {
      id: 12,
      title: '12. California Privacy Rights (CCPA)',
      content: 'If you are a California resident, you have the right to:\n\n• Know what personal information is collected\n• Know whether it is sold or disclosed\n• Delete personal information (with certain exceptions)\n• Opt-out of the sale or sharing of personal information\n• Non-discrimination for exercising your rights\n\nTo make a request, please contact us at privacy@kmevents.com with "CCPA Request" in the subject line.'
    },
    {
      id: 13,
      title: '13. European Union Privacy Rights (GDPR)',
      content: 'If you are located in the EU, your personal data is protected under the General Data Protection Regulation (GDPR). You have the right to:\n\n• Access your personal data\n• Rectify inaccurate data\n• Request erasure ("right to be forgotten")\n• Restrict processing\n• Data portability\n• Object to processing\n• Lodge a complaint with your local data protection authority\n\nOur Data Protection Officer can be contacted at privacy@kmevents.com'
    },
    {
      id: 14,
      title: '14. Contact Us',
      content: 'If you have questions about this Privacy Policy or our privacy practices, please contact us:\n\nEmail: privacy@kmevents.com\nMailing Address: K&M Events, Privacy Department, [Address]\nPhone: +1 (555) 123-4567\n\nWe will respond to your inquiry within 30 days.'
    },
    {
      id: 15,
      title: '15. Changes to This Privacy Policy',
      content: 'We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of significant changes by posting the updated Privacy Policy on our website and updating the "Last Updated" date. Your continued use of our Services after such modifications constitutes your acknowledgment and acceptance of the updated Privacy Policy.'
    }
  ]

  const PrivacySection = ({ section, isOpen }) => {
    const hasSubsections = section.subsections && section.subsections.length > 0

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl overflow-hidden border-2 transition ${
          isDarkMode
            ? 'bg-neutral-900/70 border-neutral-800 hover:border-red-500/60'
            : 'bg-white border-gray-200 hover:border-indigo-300'
        }`}
      >
        <button
          onClick={() => setExpandedSection(isOpen ? null : section.id)}
          className={`w-full p-6 text-left flex items-center justify-between transition-all ${
            isDarkMode ? 'hover:bg-neutral-900' : 'hover:bg-gray-50'
          }`}
        >
          <h3 className={`text-lg font-black pr-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {section.title}
          </h3>
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
          <div className={`p-6 border-t space-y-4 ${isDarkMode ? 'border-neutral-800 bg-neutral-900/60' : 'border-gray-100 bg-gray-50/50'}`}>
            {hasSubsections ? (
              <div className="space-y-5">
                {section.subsections.map((subsection, idx) => (
                  <div key={idx} className="space-y-2">
                    <h4 className={`font-bold text-base ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      {subsection.subtitle}
                    </h4>
                    <p className={`text-base leading-relaxed whitespace-pre-line ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {subsection.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-base leading-relaxed whitespace-pre-line ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {section.content}
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    )
  }

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
            Privacy Policy
          </h1>
          <p className={`text-lg mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Your privacy matters to us
          </p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Last Updated: January 4, 2026
          </p>
        </motion.div>

        {/* Introduction Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`mb-8 p-6 rounded-xl border-2 ${
            isDarkMode
              ? 'bg-black border-neutral-800'
              : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'
          }`}
        >
          <p className={`text-base leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            This Privacy Policy explains how K&M Events collects, uses, protects, and shares your personal information. We are committed to transparency and your privacy rights. This policy complies with international data protection regulations including GDPR and CCPA.
          </p>
        </motion.div>

        {/* Table of Contents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`mb-8 p-6 rounded-xl border-2 ${
            isDarkMode
              ? 'bg-neutral-900/70 border-neutral-800'
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          <h2 className={`text-xl font-black mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Contents
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setExpandedSection(section.id)}
                className={`text-sm font-semibold text-left p-2 rounded transition ${
                  expandedSection === section.id
                    ? isDarkMode
                      ? 'bg-red-600/30 text-red-400'
                      : 'bg-indigo-100 text-indigo-600'
                    : isDarkMode
                    ? 'text-gray-400 hover:text-red-400'
                    : 'text-gray-600 hover:text-indigo-600'
                }`}
              >
                {section.title}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Privacy Sections */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-4 mb-12"
        >
          {expandedSection == null ? (
            sections.map((section) => (
              <PrivacySection
                key={section.id}
                section={section}
                isOpen={false}
              />
            ))
          ) : (
            (() => {
              const selected = sections.find(s => s.id === expandedSection)
              if (!selected) return null
              return (
                <>
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={() => setExpandedSection(null)}
                      className={`px-3 py-1.5 text-sm rounded-lg border font-semibold transition ${
                        isDarkMode
                          ? 'border-white/20 text-gray-200 hover:bg-white/10'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Show All Topics
                    </button>
                  </div>
                  <PrivacySection section={selected} isOpen={true} />
                </>
              )
            })()
          )}
        </motion.div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`p-8 rounded-2xl border-2 text-center ${
            isDarkMode
              ? 'bg-black border-neutral-800'
              : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200'
          }`}
        >
          <h2 className={`text-2xl font-black mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Privacy Concerns?
          </h2>
          <p className={`text-lg mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            If you have questions about our privacy practices or need to exercise your privacy rights, contact us:
          </p>
          <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <a href="mailto:privacy@kmevents.com" className={`font-semibold hover:underline ${
                isDarkMode ? 'text-red-400' : 'text-indigo-600'
              }`}>
                privacy@kmevents.com
              </a>
            </div>
            <div className="hidden sm:block">•</div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773c.058.3.238.646.519 1.001.281.355.645.738 1.035 1.122.39.384.793.645 1.055.788.262.143.527.145.774.01l1.3-1.208a1 1 0 011.438.331l2.786 4.884a1 1 0 01-.604 1.419l-2.074.521c-.909.228-1.359 1.229-1.191 2.247.021.131.032.262.044.392.261 2.921-1.604 5.625-3.132 5.832-.504.073-1.14-.235-1.558-.923-.419-.688-.79-1.656-.996-3.071-.404-2.831.068-6.537 1.239-8.339.381-.577.322-1.355.588-2.177.266-.822.641-1.674.734-2.417.31-2.35-1.857-4.383-4.224-4.383H3a1 1 0 01-1-1V3z" />
              </svg>
              <span className="font-semibold">+1 (555) 123-4567</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
