import React, { useState } from 'react'
import { useDarkMode } from '../context/DarkModeContext'
import { motion } from 'framer-motion'

export default function TermsOfService() {
  const { isDarkMode } = useDarkMode()
  const [expandedSection, setExpandedSection] = useState(null)

  const sections = [
    {
      id: 1,
      title: '1. Acceptance of Terms',
      content: 'By accessing and using K&M Events website, mobile application, and related services (collectively, the "Services"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to abide by the above, please do not use this service. We reserve the right to review and revise these Terms at any time. Your continued use of the Services following the posting of revised Terms means that you accept and agree to the changes.'
    },
    {
      id: 2,
      title: '2. Use License',
      subsections: [
        {
          subtitle: '2.1 Permission to Use',
          content: 'K&M Events grants you a limited, non-exclusive, non-transferable, and revocable license to use the Services solely for personal, non-commercial purposes in compliance with these Terms. You agree not to use the Services for any unlawful purpose or in any way that violates these Terms.'
        },
        {
          subtitle: '2.2 Prohibited Activities',
          content: 'You may not:\n• Reproduce, duplicate, copy, or sell any portion of the Services\n• Attempt to gain unauthorized access to restricted portions\n• Interfere with or disrupt the integrity of the Services\n• Use automated tools or scripts to access the Services\n• Engage in any form of harassment or abusive behavior\n• Post or upload viruses or malicious code\n• Violate any applicable laws or regulations\n• Engage in fraud, forgery, or deceptive practices'
        },
        {
          subtitle: '2.3 Intellectual Property',
          content: 'All content, graphics, logos, images, and software used in the Services are the property of K&M Events or its content suppliers and are protected by international copyright laws. Unauthorized reproduction or use of any content is strictly prohibited.'
        }
      ]
    },
    {
      id: 3,
      title: '3. User Accounts',
      subsections: [
        {
          subtitle: '3.1 Account Registration',
          content: 'To access certain features of the Services, you may be required to create an account. You agree to:\n• Provide accurate, current, and complete information\n• Maintain the confidentiality of your password\n• Accept responsibility for all activities under your account\n• Notify us immediately of unauthorized access'
        },
        {
          subtitle: '3.2 Account Termination',
          content: 'We reserve the right to terminate or suspend your account at any time, without notice or liability, for violations of these Terms or any unlawful activity. Upon termination, your right to use the Services immediately ceases.'
        },
        {
          subtitle: '3.3 User Responsibilities',
          content: 'You are responsible for:\n• Maintaining accurate account information\n• Keeping your password confidential\n• All activities under your account\n• Complying with all applicable laws and regulations\n• Not impersonating other users or entities'
        }
      ]
    },
    {
      id: 4,
      title: '4. Booking and Ticket Purchases',
      subsections: [
        {
          subtitle: '4.1 Booking Confirmation',
          content: 'All ticket bookings are subject to availability. A booking confirmation is generated upon successful payment. Digital tickets are sent via email and are also available in your account under "My Bookings".'
        },
        {
          subtitle: '4.2 Ticket Validity',
          content: 'Tickets are:\n• Valid only for the event, date, and seat specified\n• Non-transferable and personal to the purchaser\n• One-time use only (cannot be duplicated or shared)\n• Subject to venue entry requirements\n• Must be presented at entry for verification'
        },
        {
          subtitle: '4.3 Seat Assignment',
          content: 'When selecting seats:\n• Only available seats (shown in green) may be booked\n• Seat assignments are confirmed upon payment\n• Changes to seat assignments may be requested subject to availability\n• Standing room assignments are non-specific locations'
        },
        {
          subtitle: '4.4 Ticket Modifications',
          content: 'Modifications to existing bookings are subject to:\n• Event-specific policies\n• Availability of requested changes\n• Applicable modification fees\n• Time constraints (cannot modify within 24 hours of event start)'
        }
      ]
    },
    {
      id: 5,
      title: '5. Payment and Pricing',
      subsections: [
        {
          subtitle: '5.1 Payment Methods',
          content: 'We accept major credit cards (Visa, MasterCard, American Express) and other digital payment methods. All payments are processed through secure third-party payment processors.'
        },
        {
          subtitle: '5.2 Pricing',
          content: 'Prices for tickets are subject to:\n• Availability and demand\n• Change without notice\n• Applicable taxes and fees\n• Currency conversion rates for international transactions\nThe displayed price at the time of booking is the price you will pay.'
        },
        {
          subtitle: '5.3 Transaction Fees',
          content: 'Booking fees, platform fees, and service charges are included in the total price displayed. These fees are non-refundable and cover the cost of ticket processing, customer support, and platform maintenance.'
        },
        {
          subtitle: '5.4 Payment Authorization',
          content: 'By providing payment information, you authorize K&M Events and our payment processors to charge your account for the total amount of your order. You represent that you have the right to use the payment method provided.'
        }
      ]
    },
    {
      id: 6,
      title: '6. Cancellation and Refund Policy',
      subsections: [
        {
          subtitle: '6.1 Cancellation Policy',
          content: 'Ticket cancellations and refunds are subject to the specific event\'s policy:\n• Cancellations 7+ days before event: Full refund minus processing fees\n• Cancellations 3-7 days before event: 75% refund\n• Cancellations 0-3 days before event: No refund\n• Check individual event details for specific policies'
        },
        {
          subtitle: '6.2 Non-Refundable Items',
          content: 'The following are non-refundable:\n• Service and convenience fees\n• Platform fees\n• Booking fees\n• Taxes (in most jurisdictions)\n• Booking credits and promotional codes'
        },
        {
          subtitle: '6.3 Event Cancellation',
          content: 'If an event is cancelled by the organizer:\n• Full refunds will be processed automatically\n• Refunds return to original payment method\n• K&M Events is not responsible for consequential damages\n• Rescheduled events will be offered to ticket holders first'
        },
        {
          subtitle: '6.4 Refund Processing',
          content: 'Approved refunds are processed as follows:\n• Initiated within 48 hours of cancellation\n• Return to original payment method\n• Processing time: 5-7 business days\n• K&M Events is not liable for delays caused by financial institutions'
        }
      ]
    },
    {
      id: 7,
      title: '7. Disclaimer of Warranties',
      content: 'THE SERVICES ARE PROVIDED ON AN "AS-IS" AND "AS-AVAILABLE" BASIS. K&M EVENTS MAKES NO WARRANTIES, EXPRESS OR IMPLIED, REGARDING:\n\n• The accuracy, completeness, or reliability of the Services\n• The fitness of the Services for a particular purpose\n• The absence of defects or errors\n• Uninterrupted access or availability\n\nWE DISCLAIM ALL WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. YOUR USE OF THE SERVICES IS AT YOUR SOLE RISK.'
    },
    {
      id: 8,
      title: '8. Limitation of Liability',
      content: 'TO THE MAXIMUM EXTENT PERMITTED BY LAW, K&M EVENTS SHALL NOT BE LIABLE FOR:\n\n• Indirect, incidental, special, consequential, or punitive damages\n• Lost profits, data, or business interruption\n• Damages arising from unauthorized access or data breaches (unless due to our negligence)\n• Issues related to event venue, organizer, or third parties\n• Any damages exceeding the amount you paid for your tickets\n\nSOME JURISDICTIONS DO NOT ALLOW LIMITATION OF LIABILITY. IN SUCH CASES, OUR LIABILITY SHALL BE LIMITED TO THE MAXIMUM EXTENT PERMITTED BY LAW.'
    },
    {
      id: 9,
      title: '9. User-Generated Content',
      subsections: [
        {
          subtitle: '9.1 Content Ownership',
          content: 'You retain ownership of any content you post on the Services. However, you grant K&M Events a non-exclusive, worldwide, royalty-free license to use, reproduce, modify, and distribute your content for promotional and operational purposes.'
        },
        {
          subtitle: '9.2 Content Standards',
          content: 'You agree not to post content that is:\n• Illegal or promotes illegal activity\n• Defamatory, harassing, or abusive\n• Sexually explicit or obscene\n• Infringing on intellectual property rights\n• Misleading or fraudulent\n• Violating these Terms or applicable laws'
        },
        {
          subtitle: '9.3 Content Removal',
          content: 'K&M Events reserves the right to remove any user-generated content that violates these Terms without notice or liability. We are not obligated to monitor content but may do so at our discretion.'
        }
      ]
    },
    {
      id: 10,
      title: '10. Third-Party Services and Links',
      content: 'The Services may contain links to third-party websites and services. K&M Events is not responsible for:\n\n• The content, accuracy, or practices of third-party services\n• Any damages or losses resulting from your use of third-party services\n• Third-party terms, privacy policies, or practices\n\nYour use of third-party services is subject to their terms and conditions. We encourage you to review their policies before providing personal information or making purchases.'
    },
    {
      id: 11,
      title: '11. Entry and Event Attendance',
      subsections: [
        {
          subtitle: '11.1 Entry Requirements',
          content: 'To gain entry to an event:\n• You must present a valid ticket with QR code\n• You may be required to present a valid ID\n• You must comply with venue rules and event policies\n• You may be denied entry if under the influence or violating policies\n• Refusal of entry does not entitle you to a refund'
        },
        {
          subtitle: '11.2 Venue Policies',
          content: 'You agree to comply with:\n• All venue rules and regulations\n• Event organizer policies and restrictions\n• Security procedures and bag checks\n• Parking and transportation guidelines\n• Any special instructions provided by event staff'
        },
        {
          subtitle: '11.3 No Liability for Event Issues',
          content: 'K&M Events is not liable for:\n• Event cancellations or postponements (beyond our control)\n• Event quality or performer changes\n• Venue conditions, capacity, or safety issues\n• Lost or stolen personal items\n• Injuries or accidents at venue\n• Weather-related disruptions'
        }
      ]
    },
    {
      id: 12,
      title: '12. Prohibited Conduct',
      content: 'You agree not to:\n\n• Engage in any unlawful or fraudulent activity\n• Attempt to access restricted portions of the Services\n• Interfere with the operation of the Services\n• Use automated tools, bots, or scrapers\n• Engage in price gouging or reselling tickets in violation of law\n• Harass, abuse, or threaten other users or staff\n• Post spam, malware, or malicious content\n• Violate any intellectual property rights\n• Engage in money laundering or terrorist financing\n• Violate any applicable laws or regulations\n\nViolations may result in account termination and legal action.'
    },
    {
      id: 13,
      title: '13. Dispute Resolution',
      subsections: [
        {
          subtitle: '13.1 Informal Resolution',
          content: 'If you have a dispute with K&M Events, you agree to first contact us at support@kmevents.com and attempt to resolve the matter informally within 30 days.'
        },
        {
          subtitle: '13.2 Arbitration',
          content: 'You agree that any legal proceeding or dispute shall be resolved through binding arbitration rather than court proceedings. The arbitration shall be conducted in accordance with applicable law and administered by a mutually agreed arbitrator.'
        },
        {
          subtitle: '13.3 Class Action Waiver',
          content: 'You agree that any arbitration shall be conducted on an individual basis only. You waive any right to participate in class action lawsuits or class arbitrations against K&M Events.'
        }
      ]
    },
    {
      id: 14,
      title: '14. Indemnification',
      content: 'You agree to indemnify and hold harmless K&M Events, its officers, directors, employees, and agents from and against any claims, damages, losses, liabilities, and expenses (including legal fees) arising from or related to:\n\n• Your use of the Services\n• Your violation of these Terms\n• Your violation of any applicable law or regulation\n• Your infringement of any third-party rights\n• Your user-generated content\n• Your breach of any representations or warranties'
    },
    {
      id: 15,
      title: '15. Termination',
      subsections: [
        {
          subtitle: '15.1 Termination by K&M Events',
          content: 'We may terminate or suspend your account and access to the Services at any time, with or without cause, and without notice or liability, including for:\n• Violation of these Terms\n• Illegal or fraudulent activity\n• Non-payment of fees\n• Inactivity for extended periods'
        },
        {
          subtitle: '15.2 Termination by You',
          content: 'You may terminate your account at any time by contacting customer support. Upon termination, your right to use the Services ceases immediately. Data retention is subject to our Privacy Policy.'
        },
        {
          subtitle: '15.3 Effect of Termination',
          content: 'Upon termination:\n• All license grants terminate\n• Your right to use the Services ceases\n• Existing tickets remain valid for their respective events\n• Refunds are subject to applicable policies'
        }
      ]
    },
    {
      id: 16,
      title: '16. Governing Law',
      content: 'These Terms shall be governed by and construed in accordance with the laws of the jurisdiction where K&M Events operates, without regard to its conflict of law principles. You agree that any legal action or proceeding shall be subject to the exclusive jurisdiction of the courts located in that jurisdiction.'
    },
    {
      id: 17,
      title: '17. Severability',
      content: 'If any provision of these Terms is held to be invalid, unlawful, or unenforceable, the remaining provisions shall continue in full force and effect. The invalid provision shall be modified to the minimum extent necessary to make it valid and enforceable.'
    },
    {
      id: 18,
      title: '18. Entire Agreement',
      content: 'These Terms, together with our Privacy Policy and any other policies or agreements referenced herein, constitute the entire agreement between you and K&M Events regarding the Services and supersede all prior and contemporaneous agreements, understandings, and negotiations.'
    },
    {
      id: 19,
      title: '19. Amendments and Updates',
      content: 'K&M Events may amend, modify, or update these Terms at any time by posting the revised Terms on the Services. Your continued use of the Services following the posting of changes constitutes your acceptance of the updated Terms. We recommend reviewing these Terms periodically for changes. Significant changes will be noted with an updated "Last Modified" date.'
    },
    {
      id: 20,
      title: '20. Contact Us',
      content: 'If you have questions about these Terms or need to report a violation, please contact us:\n\nEmail: legal@kmevents.com\nSupport Email: support@kmevents.com\nPhone: +1 (555) 123-4567\nMailing Address: K&M Events, Legal Department, [Address]\n\nWe will respond to your inquiry within 30 days.'
    }
  ]

  const TermsSection = ({ section, isOpen }) => {
    const hasSubsections = section.subsections && section.subsections.length > 0

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl overflow-hidden border-2 transition ${
          isDarkMode
            ? 'bg-slate-800/30 border-slate-700 hover:border-red-500/50'
            : 'bg-white border-gray-200 hover:border-indigo-300'
        }`}
      >
        <button
          onClick={() => setExpandedSection(isOpen ? null : section.id)}
          className={`w-full p-6 text-left flex items-center justify-between transition-all ${
            isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'
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
          <div className={`p-6 border-t space-y-4 ${isDarkMode ? 'border-slate-700 bg-slate-900/30' : 'border-gray-100 bg-gray-50/50'}`}>
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
        ? 'bg-gradient-to-b from-slate-900 to-slate-950'
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
            Terms of Service
          </h1>
          <p className={`text-lg mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Binding agreement between you and K&M Events
          </p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Last Updated: January 4, 2026
          </p>
        </motion.div>

        {/* Important Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`mb-8 p-6 rounded-xl border-2 ${
            isDarkMode
              ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-600/50'
              : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
          }`}
        >
          <h2 className={`text-lg font-black mb-3 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
            ⚠️ Important: Please Read Carefully
          </h2>
          <p className={`text-base leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            By accessing and using K&M Events, you agree to be bound by these Terms of Service. These terms contain important limitations of liability, dispute resolution procedures, and other provisions that affect your rights. If you do not agree with these terms, please do not use our Services.
          </p>
        </motion.div>

        {/* Table of Contents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`mb-8 p-6 rounded-xl border-2 ${
            isDarkMode
              ? 'bg-slate-800/30 border-slate-700'
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
                className={`text-sm font-semibold text-left p-2 rounded transition whitespace-normal break-words ${
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

        {/* Terms Sections */}
        <motion.div
          id="terms-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-4 mb-12"
        >
          {expandedSection == null ? (
            // Default: show all sections until a topic is chosen
            sections.map((section) => (
              <TermsSection
                key={section.id}
                section={section}
                isOpen={false}
              />
            ))
          ) : (
            // When a topic is chosen: show only that section
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
                  <TermsSection section={selected} isOpen={true} />
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
              ? 'bg-gradient-to-r from-red-900/30 to-orange-900/30 border-red-500/50'
              : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200'
          }`}
        >
          <h2 className={`text-2xl font-black mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Questions About Our Terms?
          </h2>
          <p className={`text-lg mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            If you have questions about these Terms of Service, please contact us:
          </p>
          <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <a href="mailto:legal@kmevents.com" className={`font-semibold hover:underline ${
                isDarkMode ? 'text-red-400' : 'text-indigo-600'
              }`}>
                legal@kmevents.com
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
