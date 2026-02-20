import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useDarkMode } from '../../context/DarkModeContext'
import API from '../../services/api'
import formatCurrency from '../../utils/currency'

export default function ForOrganizers() {
  const { isDarkMode } = useDarkMode()
  const [pageContent, setPageContent] = useState(null)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPlanId, setSelectedPlanId] = useState(null)


  useEffect(() => {
    fetchPageContent()
    fetchPlans()

    const intervalId = setInterval(() => {
      fetchPlans({ silent: true })
    }, 15000)

    return () => clearInterval(intervalId)
  }, [])

  const fetchPageContent = async () => {
    try {
      const { data } = await API.get('/organizers-page/content')
      setPageContent(data.content)
    } catch (err) {
      console.error('Error fetching page content:', err)
    }
  }

  const buildCommissionFeatures = (plan) => {
    const features = {}
    if (plan.commissionPercentage !== undefined) {
      features.commission = {
        enabled: true,
        description: `Commission ${plan.commissionPercentage}%`
      }
    }
    if (plan.eventLimit !== undefined && plan.eventLimit !== null) {
      features.eventLimit = {
        enabled: true,
        description: `Up to ${plan.eventLimit} events`
      }
    }
    if (plan.ticketLimit !== undefined && plan.ticketLimit !== null) {
      features.ticketLimit = {
        enabled: true,
        description: `Up to ${plan.ticketLimit} tickets`
      }
    }
    if (plan.payoutFrequency) {
      features.payout = {
        enabled: true,
        description: `Payouts ${plan.payoutFrequency}`
      }
    }
    if (plan.minPayoutAmount !== undefined) {
      features.minPayout = {
        enabled: true,
        description: `Min payout ₹${plan.minPayoutAmount}`
      }
    }
    return features
  }

  const normalizePlan = (plan) => {
    const monthlyFee = plan.monthlyFee ?? 0
    const normalizedFeatures =
      plan.features && Object.keys(plan.features).length > 0
        ? plan.features
        : buildCommissionFeatures(plan)

    return {
      ...plan,
      displayName: plan.displayName || plan.name,
      monthlyFee: monthlyFee,
      features: normalizedFeatures,
      limits: plan.limits || {
        eventsPerMonth: plan.eventLimit ?? null
      }
    }
  }

  const getCommissionLabel = (plan) => {
    if (plan.commissionPercentage !== undefined && plan.commissionPercentage !== null) {
      return `Commission ${plan.commissionPercentage}%`
    }
    if (plan.features?.commission?.description) {
      return plan.features.commission.description
    }
    return null
  }

  const fetchPlans = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true)
      }
      const { data } = await API.get('/subscriptions/plans')
      const plansData = data?.data || data?.plans || data
      const plansArray = Array.isArray(plansData) ? plansData : []
      if (plansArray.length > 0) {
        const sortedPlans = plansArray
          .map(normalizePlan)
          .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
        setPlans(sortedPlans)
      } else {
        setPlans([])
        setError('No subscription plans found')
      }
      setError(null)
    } catch (err) {
      console.error('Error fetching plans:', err)
      setPlans([])
      if (!silent) {
        setError('Failed to load plans')
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <div className={`animate-spin rounded-full h-12 w-12 border-4 border-gray-300 mx-auto mb-4 ${isDarkMode ? 'border-t-blue-400' : 'border-t-blue-600'}`}></div>
          <p>Loading page content...</p>
        </div>
      </div>
    )
  }

  // Use API data if available, otherwise use defaults
  const content = pageContent || {}
  const benefits = (content.benefits?.items) || [
    {
      icon: '🎟️',
      title: 'Instant Ticket Sales',
      description: 'Start selling tickets immediately after event approval. No upfront fees required.',
    },
    {
      icon: '📊',
      title: 'Real-Time Analytics',
      description: 'Track sales, attendance, and revenue with comprehensive dashboard insights.',
    },
    {
      icon: '💳',
      title: 'Flexible Payments',
      description: 'Accept payments via cards, UPI, wallets. Instant settlements to your account.',
    },
    {
      icon: '📱',
      title: 'QR-Based Entry',
      description: 'Secure QR codes for each ticket with included scanner app for smooth entry.',
    },
    {
      icon: '📧',
      title: 'Automated Notifications',
      description: 'Email and SMS confirmations sent automatically to all ticket buyers.',
    },
    {
      icon: '🎨',
      title: 'Custom Branding',
      description: 'Add your brand colors, logo, and messaging to create a personalized experience.',
    },
    {
      icon: '🔒',
      title: 'Secure Platform',
      description: 'Bank-level security for all transactions and data protection compliance.',
    },
    {
      icon: '🤝',
      title: 'Dedicated Support',
      description: 'Get expert assistance from our team to ensure your event runs smoothly.',
    },
  ]

  const steps = (content.steps?.items) || [
    {
      number: '1',
      title: 'Submit Event Details',
      description: 'Fill out a simple form with your event information, date, venue, and ticket details.',
    },
    {
      number: '2',
      title: 'Choose Your Plan',
      description: 'Select the subscription plan that best fits your event size and requirements.',
    },
    {
      number: '3',
      title: 'Get Approved',
      description: 'Our team reviews your submission and approves it within 24-48 hours.',
    },
    {
      number: '4',
      title: 'Go Live & Sell',
      description: 'Your event goes live on our platform and you start selling tickets immediately.',
    },
  ]

  const faqs = (content.faqs?.items) || [
    {
      question: 'How quickly can I start selling tickets?',
      answer: 'Once your event is approved (typically within 24-48 hours), you can start selling tickets immediately.',
    },
    {
      question: 'What payment methods do you support?',
      answer: 'We support all major payment methods including credit/debit cards, UPI, net banking, and popular digital wallets.',
    },
    {
      question: 'How do I receive payment for ticket sales?',
      answer: 'Payments are automatically settled to your registered bank account within 3-5 business days after the event concludes.',
    },
    {
      question: 'Can I customize the look and feel of my event page?',
      answer: 'Yes! Standard, Professional, and Enterprise plans include branding customization options.',
    },
    {
      question: 'What happens if I need to cancel my event?',
      answer: 'You can cancel anytime. Our system will automatically process refunds to all ticket buyers according to your refund policy.',
    },
    {
      question: 'Is there a limit on the number of events I can create?',
      answer: 'No, you can create as many events as you need. Each event is charged separately based on the plan you choose.',
    },
  ]

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-b from-[#0B0F19] via-[#0d1221] to-[#0B0F19] text-white' : 'bg-gradient-to-b from-gray-50 to-white text-gray-900'}`}>
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 px-6 lg:px-12 max-w-6xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-xs md:text-sm uppercase tracking-[0.3em] text-blue-400 font-semibold mb-4"
          >
            For Event Organizers
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 drop-shadow-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {content.hero?.title || 'Host Your Next Event with K&M Events'}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={`text-lg md:text-xl mb-12 max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
          >
            {content.hero?.subtitle || 'Launch your event on K&M Events and reach thousands of enthusiasts. We handle ticketing, QR codes, payments, and support—so you can focus on creating amazing experiences.'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/create-event"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl text-lg font-bold text-white shadow-lg hover:shadow-blue-500/50 transform hover:scale-105 transition-all duration-300"
            >
              {content.hero?.buttonText1 || 'Submit Your Event'}
            </Link>
            <Link
              to="/contact"
              className={`px-8 py-4 border-2 rounded-xl text-lg font-semibold backdrop-blur-sm transition-all duration-300 ${
                isDarkMode
                  ? 'border-blue-400/50 text-blue-300 hover:bg-blue-500/10 hover:border-blue-400'
                  : 'border-blue-600 text-blue-600 hover:bg-blue-50 hover:border-blue-700'
              }`}
            >
              {content.hero?.buttonText2 || 'Contact Sales'}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className={`py-20 ${isDarkMode ? 'bg-gradient-to-b from-[#0d1221] to-[#0B0F19]' : 'bg-gray-50'}`}>
        <div className="px-6 lg:px-12 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className={`text-3xl md:text-5xl font-extrabold mb-4 drop-shadow-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {content.benefits?.title || 'Why Choose K&M Events?'}
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
              {content.benefits?.subtitle || 'Everything you need to host successful events and sell tickets effortlessly'}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className={`group p-6 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 ${
                  isDarkMode
                    ? 'bg-gradient-to-br from-white/8 to-white/3 border border-white/15 hover:from-white/15 hover:to-white/8 hover:border-blue-500/40'
                    : 'bg-white border border-gray-200 hover:border-blue-500/40 hover:shadow-lg'
                }`}
              >
                <div className="text-4xl mb-4">{benefit.icon}</div>
                <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {benefit.title}
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className={`py-20 ${isDarkMode ? 'bg-gradient-to-b from-[#0B0F19] to-[#0d1221]' : 'bg-white'}`}>
        <div className="px-6 lg:px-12 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className={`text-3xl md:text-5xl font-extrabold mb-4 drop-shadow-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {content.steps?.title || 'How It Works'}
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
              {content.steps?.subtitle || 'Get your event live in 4 simple steps'}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className="relative h-full"
              >
                {/* Connector Line */}
                {idx < steps.length - 1 && (
                  <div className={`hidden lg:block absolute top-12 left-full w-full h-0.5 ${isDarkMode ? 'bg-blue-500/30' : 'bg-blue-300'}`} />
                )}

                <div className={`relative z-10 p-8 rounded-2xl backdrop-blur-sm transition-all duration-300 h-full flex flex-col ${
                  isDarkMode
                    ? 'bg-gradient-to-br from-white/8 to-white/3 border border-white/15'
                    : 'bg-white border border-gray-200 shadow-md'
                }`}>
                  <div className="w-16 h-16 mb-6 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {step.number}
                  </div>
                  <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {step.title}
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-auto`}>
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section className={`py-20 ${isDarkMode ? 'bg-gradient-to-b from-[#0d1221] to-[#0B0F19]' : 'bg-gray-50'}`}>
        <div className="px-6 lg:px-12 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className={`text-3xl md:text-5xl font-extrabold mb-4 drop-shadow-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Pricing Plans
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto mb-6`}>
              Choose the perfect plan for your event size and needs
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedPlanId('comparison')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Compare All Plans
            </motion.button>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, idx) => {
              // Determine if this is the "most popular" plan
              const isPopular = plan.mostPopular === true
              
              // Get enabled features
              const enabledFeatures = plan.features 
                ? Object.entries(plan.features)
                    .filter(([_, feature]) => feature.enabled)
                    .map(([key, feature]) => ({
                      name: key,
                      description: feature.description || key
                    }))
                : []

              // Generate color gradient based on plan name
              const colorMap = {
                'Basic': 'from-blue-500 to-cyan-500',
                'Standard': 'from-purple-500 to-pink-500',
                'Professional': 'from-orange-500 to-red-500',
                'Enterprise': 'from-emerald-500 to-teal-500'
              }
              const color = colorMap[plan.name] || 'from-gray-500 to-gray-600'
              const displayPrice = plan.monthlyFee || 0
              const displayUnit = plan.monthlyFee ? '/month' : '/event'
              const commissionLabel = getCommissionLabel(plan)

              return (
                <motion.div
                  key={plan._id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className={`relative rounded-2xl backdrop-blur-sm transition-all duration-300 overflow-visible group h-full cursor-pointer ${
                    isPopular
                      ? 'hover:-translate-y-3 hover:shadow-2xl hover:shadow-purple-500/50'
                      : 'hover:-translate-y-2 hover:shadow-xl'
                  } ${
                    isPopular
                      ? isDarkMode
                        ? 'bg-gradient-to-br from-purple-900/60 via-pink-900/40 to-purple-900/40 border-2 border-purple-400/60 shadow-2xl shadow-purple-500/40 ring-2 ring-purple-500/20'
                        : 'bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 border-2 border-purple-400 shadow-2xl shadow-purple-300/40 ring-2 ring-purple-500/10'
                      : isDarkMode
                      ? 'bg-gradient-to-br from-white/8 to-white/3 border border-white/15'
                      : 'bg-white border border-gray-200 shadow-md'
                  }`}
                >
                  {/* Animated background effect for popular plan */}
                  {isPopular && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-pink-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  )}

                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30">
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full text-white text-xs font-bold shadow-lg border-2 border-white/40 whitespace-nowrap"
                      >
                        ⭐ Most Popular
                      </motion.div>
                    </div>
                  )}

                  <div className={`p-6 relative z-10 h-full flex flex-col justify-between ${isPopular ? 'pt-8' : ''}`}>
                    <div className="flex-1">
                      {/* Plan Name */}
                      <div className={`mb-3 text-base font-semibold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
                        {plan.displayName || plan.name}
                      </div>

                      {/* Pricing Section */}
                      <div className={`mb-3 pb-3 border-b ${isDarkMode ? 'border-white/10' : 'border-purple-100'}`}>
                        <div className="flex items-baseline gap-1">
                        {displayPrice === 0 ? (
                          <div>
                            <span className={`text-3xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              Custom
                            </span>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Get in touch for pricing</p>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className={`text-3xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {formatCurrency(displayPrice)}
                              </span>
                              <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {displayUnit}
                              </span>
                            </div>
                            {isPopular && (
                              <p className={`text-xs ${isDarkMode ? 'text-pink-300' : 'text-pink-600'} font-semibold mt-1`}>
                                Best Value
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                      {commissionLabel && (
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3 ${
                          isDarkMode
                            ? 'bg-white/10 text-blue-200 border border-white/10'
                            : 'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                          {commissionLabel}
                        </div>
                      )}

                      {/* Description */}
                      <p className={`text-xs mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {plan.description}
                      </p>

                      {/* Features */}
                      <div className="mb-3">
                      <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-700'
                      }`}>
                        ✨ Features
                      </p>
                      <ul className="space-y-2">
                        {enabledFeatures.slice(0, isPopular ? 9 : 8).map((feature, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2">
                            <svg className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                              isPopular 
                                ? isDarkMode ? 'text-pink-400' : 'text-pink-500'
                                : 'text-green-500'
                            }`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {feature.name.charAt(0).toUpperCase() + feature.name.slice(1).replace(/([A-Z])/g, ' $1')}
                            </span>
                          </li>
                        ))}
                        {enabledFeatures.length > (isPopular ? 9 : 8) && (
                          <li 
                            onClick={() => setSelectedPlanId(plan._id || idx)}
                            className={`text-xs font-semibold pt-1 cursor-pointer hover:underline ${
                              isDarkMode ? 'text-purple-300 hover:text-purple-200' : 'text-purple-600 hover:text-purple-700'
                            }`}>
                            +{enabledFeatures.length - (isPopular ? 9 : 8)} more
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Limits */}
                    {plan.limits && Object.keys(plan.limits).length > 0 && (
                      <div className={`mb-4 pb-3 border-t text-xs space-y-1 ${isDarkMode ? 'border-white/10 text-gray-400' : 'border-purple-100 text-gray-600'}`}>
                        {plan.limits.eventsPerMonth && (
                          <li className="flex items-center justify-between list-none">
                            <span>Events/mo:</span>
                            <span className="font-semibold">{plan.limits.eventsPerMonth === 999 ? '∞' : plan.limits.eventsPerMonth}</span>
                          </li>
                        )}
                      </div>
                    )}
                  </div>

                  {/* CTA Button Section */}
                  <div className="mt-auto space-y-2">
                    <Link
                      to="/create-event"
                      className={`block w-full py-3 rounded-lg text-center font-bold text-sm transition-all duration-300 ${
                        isPopular
                          ? isDarkMode
                            ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 hover:from-purple-600 hover:via-pink-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl'
                            : 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                          : isDarkMode
                          ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      }`}
                    >
                      Get Started
                    </Link>

                    {/* Optional recommendation text */}
                    {isPopular && (
                      <p className={`text-xs text-center font-semibold ${
                        isDarkMode ? 'text-purple-300' : 'text-purple-600'
                      }`}>
                        Most teams choose this plan
                      </p>
                    )}
                  </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={`py-20 ${isDarkMode ? 'bg-gradient-to-b from-[#0B0F19] to-[#0d1221]' : 'bg-white'}`}>
        <div className="px-6 lg:px-12 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className={`text-3xl md:text-5xl font-extrabold mb-4 drop-shadow-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {content.faqs?.title || 'Frequently Asked Questions'}
            </h2>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className={`p-6 rounded-2xl backdrop-blur-sm ${
                  isDarkMode
                    ? 'bg-gradient-to-br from-white/8 to-white/3 border border-white/15'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {faq.question}
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {faq.answer}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-700 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 px-6 lg:px-12 max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 text-white drop-shadow-lg"
          >
            {content.cta?.title || 'Ready to Get Started?'}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-lg md:text-xl mb-10 text-white/90"
          >
            {content.cta?.subtitle || 'Join thousands of organizers who trust K&M Events to power their events'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/create-event"
              className="px-10 py-5 bg-white hover:bg-gray-100 text-blue-600 rounded-xl text-lg font-bold shadow-2xl hover:scale-105 transition-all duration-300"
            >
              {content.cta?.buttonText1 || 'Submit Your Event Now'}
            </Link>
            <Link
              to="/contact"
              className="px-10 py-5 border-2 border-white rounded-xl text-lg font-semibold text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
            >
              {content.cta?.buttonText2 || 'Talk to Sales'}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Plan Comparison Modal */}
      {selectedPlanId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedPlanId(null)}
          className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className={`${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto`}
          >
            {/* Modal Header */}
            <div className={`sticky top-0 flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Plan Comparison
              </h2>
              <button
                onClick={() => setSelectedPlanId(null)}
                className={`text-2xl hover:opacity-70 transition-opacity ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
              >
                ×
              </button>
            </div>

            {/* Modal Content - Comparison Table */}
            <div className="p-6 overflow-x-auto">
              <table className={`w-full text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <thead>
                  <tr className={`border-b-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <th className={`text-left py-3 px-4 font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Features</th>
                    {plans.map((plan, idx) => {
                      const commissionLabel = getCommissionLabel(plan)
                      return (
                        <th key={idx} className={`py-3 px-4 text-center font-bold min-w-32 ${
                          selectedPlanId === 'comparison' || (plan._id || idx) === selectedPlanId
                            ? isDarkMode 
                              ? 'bg-purple-900/40 text-purple-300' 
                              : 'bg-purple-50 text-purple-600'
                            : isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          <div className="font-bold text-base">{plan.displayName || plan.name}</div>
                          <div className={`text-lg font-extrabold mt-1 ${
                            isDarkMode ? 'text-purple-300' : 'text-purple-600'
                          }`}>{formatCurrency(plan.monthlyFee || 0)}<span className="text-sm">/month</span></div>
                          {commissionLabel && (
                            <div className={`text-xs mt-1 font-semibold ${
                              isDarkMode ? 'text-purple-200' : 'text-purple-700'
                            }`}>
                              {commissionLabel}
                            </div>
                          )}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {/* Features Section */}
                  <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <td colSpan={plans.length + 1} className={`py-3 px-4 font-bold ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                      ✨ Features
                    </td>
                  </tr>
                  
                  {/* Get all unique features */}
                  {Array.from(new Set(
                    plans.flatMap(plan => Object.keys(plan.features || {}))
                  )).map((featureName) => (
                    <tr key={featureName} className={`border-b ${isDarkMode ? 'border-gray-700/50' : 'border-gray-100'}`}>
                      <td className={`py-3 px-4 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {featureName.charAt(0).toUpperCase() + featureName.slice(1).replace(/([A-Z])/g, ' $1')}
                      </td>
                      {plans.map((plan, idx) => (
                        <td key={idx} className={`py-3 px-4 text-center ${
                          selectedPlanId === 'comparison' || (plan._id || idx) === selectedPlanId
                            ? isDarkMode 
                              ? 'bg-purple-900/20' 
                              : 'bg-purple-50'
                            : ''
                        }`}>
                          {plan.features && plan.features[featureName]?.enabled ? (
                            <svg className={`w-5 h-5 mx-auto ${isDarkMode ? 'text-pink-400' : 'text-pink-500'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <span className={isDarkMode ? 'text-gray-600' : 'text-gray-300'}>−</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Limits Section */}
                  <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <td colSpan={plans.length + 1} className={`py-3 px-4 font-bold mt-4 ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                      📊 Limits & Quotas
                    </td>
                  </tr>

                  {/* Events Per Month */}
                  <tr className={`border-b ${isDarkMode ? 'border-gray-700/50' : 'border-gray-100'}`}>
                    <td className={`py-3 px-4 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Events/Month</td>
                    {plans.map((plan, idx) => (
                      <td key={idx} className={`py-3 px-4 text-center font-semibold ${
                        selectedPlanId === 'comparison' || (plan._id || idx) === selectedPlanId
                          ? isDarkMode 
                            ? 'bg-purple-900/20' 
                            : 'bg-purple-50'
                          : ''
                      }`}>
                        {plan.limits?.eventsPerMonth === 999 ? '∞' : plan.limits?.eventsPerMonth || '−'}
                      </td>
                    ))}
                  </tr>

                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className={`sticky bottom-0 flex justify-end gap-3 p-6 border-t ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
              <button
                onClick={() => setSelectedPlanId(null)}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                Close
              </button>
              <Link
                to="/create-event"
                onClick={() => setSelectedPlanId(null)}
                className="px-6 py-2 rounded-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-colors"
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
