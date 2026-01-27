import OrganizersPageContent from '../models/OrganizersPageContent.js'

// Get all page content
export const getPageContent = async (req, res) => {
  try {
    let content = await OrganizersPageContent.findOne().populate('lastUpdatedBy', 'name email')
    
    // If no content exists, create default content
    if (!content) {
      content = new OrganizersPageContent({
        benefits: {
          items: [
            {
              icon: '🎟️',
              title: 'Instant Ticket Sales',
              description: 'Start selling tickets immediately after event approval. No upfront fees required.'
            },
            {
              icon: '📊',
              title: 'Real-Time Analytics',
              description: 'Track sales, attendance, and revenue with comprehensive dashboard insights.'
            },
            {
              icon: '💳',
              title: 'Flexible Payments',
              description: 'Accept payments via cards, UPI, wallets. Instant settlements to your account.'
            },
            {
              icon: '📱',
              title: 'QR-Based Entry',
              description: 'Secure QR codes for each ticket with included scanner app for smooth entry.'
            },
            {
              icon: '📧',
              title: 'Automated Notifications',
              description: 'Email and SMS confirmations sent automatically to all ticket buyers.'
            },
            {
              icon: '🎨',
              title: 'Custom Branding',
              description: 'Add your brand colors, logo, and messaging to create a personalized experience.'
            },
            {
              icon: '🔒',
              title: 'Secure Platform',
              description: 'Bank-level security for all transactions and data protection compliance.'
            },
            {
              icon: '🤝',
              title: 'Dedicated Support',
              description: 'Get expert assistance from our team to ensure your event runs smoothly.'
            }
          ]
        },
        steps: {
          items: [
            {
              number: '1',
              title: 'Submit Event Details',
              description: 'Fill out a simple form with your event information, date, venue, and ticket details.'
            },
            {
              number: '2',
              title: 'Choose Your Plan',
              description: 'Select the subscription plan that best fits your event size and requirements.'
            },
            {
              number: '3',
              title: 'Get Approved',
              description: 'Our team reviews your submission and approves it within 24-48 hours.'
            },
            {
              number: '4',
              title: 'Go Live & Sell',
              description: 'Your event goes live on our platform and you start selling tickets immediately.'
            }
          ]
        },
        faqs: {
          items: [
            {
              question: 'How quickly can I start selling tickets?',
              answer: 'Once your event is approved (typically within 24-48 hours), you can start selling tickets immediately.'
            },
            {
              question: 'What payment methods do you support?',
              answer: 'We support all major payment methods including credit/debit cards, UPI, net banking, and popular digital wallets.'
            },
            {
              question: 'How do I receive payment for ticket sales?',
              answer: 'Payments are automatically settled to your registered bank account within 3-5 business days after the event concludes.'
            },
            {
              question: 'Can I customize the look and feel of my event page?',
              answer: 'Yes! Standard, Professional, and Enterprise plans include branding customization options.'
            },
            {
              question: 'What happens if I need to cancel my event?',
              answer: 'You can cancel anytime. Our system will automatically process refunds to all ticket buyers according to your refund policy.'
            },
            {
              question: 'Is there a limit on the number of events I can create?',
              answer: 'No, you can create as many events as you need. Each event is charged separately based on the plan you choose.'
            }
          ]
        }
      })
      await content.save()
    }

    res.json({
      success: true,
      content
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching page content',
      error: err.message
    })
  }
}

// Update page content (Super Admin only)
export const updatePageContent = async (req, res) => {
  try {
    const { hero, benefits, steps, faqs, cta } = req.body
    const userId = req.user._id || req.user.id

    let content = await OrganizersPageContent.findOne()

    if (!content) {
      content = new OrganizersPageContent({
        hero,
        benefits,
        steps,
        faqs,
        cta,
        lastUpdatedBy: userId
      })
    } else {
      if (hero) content.hero = { ...content.hero, ...hero }
      if (benefits) content.benefits = { ...content.benefits, ...benefits }
      if (steps) content.steps = { ...content.steps, ...steps }
      if (faqs) content.faqs = { ...content.faqs, ...faqs }
      if (cta) content.cta = { ...content.cta, ...cta }
      content.lastUpdatedBy = userId
      content.lastUpdatedAt = new Date()
    }

    await content.save()
    await content.populate('lastUpdatedBy', 'name email')

    res.json({
      success: true,
      message: 'Page content updated successfully',
      content
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error updating page content',
      error: err.message
    })
  }
}

// Update specific section
export const updateSection = async (req, res) => {
  try {
    const { section } = req.params
    const { data } = req.body
    const userId = req.user._id || req.user.id

    const validSections = ['hero', 'benefits', 'steps', 'faqs', 'cta']
    if (!validSections.includes(section)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid section'
      })
    }

    let content = await OrganizersPageContent.findOne()

    if (!content) {
      content = new OrganizersPageContent()
    }

    content[section] = { ...content[section], ...data }
    content.lastUpdatedBy = userId
    content.lastUpdatedAt = new Date()

    await content.save()
    await content.populate('lastUpdatedBy', 'name email')

    res.json({
      success: true,
      message: `${section} section updated successfully`,
      content
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error updating section',
      error: err.message
    })
  }
}

// Reset to default content
export const resetToDefaults = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id

    await OrganizersPageContent.deleteMany({})

    const defaultContent = new OrganizersPageContent({
      benefits: {
        items: [
          {
            icon: '🎟️',
            title: 'Instant Ticket Sales',
            description: 'Start selling tickets immediately after event approval. No upfront fees required.'
          },
          {
            icon: '📊',
            title: 'Real-Time Analytics',
            description: 'Track sales, attendance, and revenue with comprehensive dashboard insights.'
          },
          {
            icon: '💳',
            title: 'Flexible Payments',
            description: 'Accept payments via cards, UPI, wallets. Instant settlements to your account.'
          },
          {
            icon: '📱',
            title: 'QR-Based Entry',
            description: 'Secure QR codes for each ticket with included scanner app for smooth entry.'
          },
          {
            icon: '📧',
            title: 'Automated Notifications',
            description: 'Email and SMS confirmations sent automatically to all ticket buyers.'
          },
          {
            icon: '🎨',
            title: 'Custom Branding',
            description: 'Add your brand colors, logo, and messaging to create a personalized experience.'
          },
          {
            icon: '🔒',
            title: 'Secure Platform',
            description: 'Bank-level security for all transactions and data protection compliance.'
          },
          {
            icon: '🤝',
            title: 'Dedicated Support',
            description: 'Get expert assistance from our team to ensure your event runs smoothly.'
          }
        ]
      },
      steps: {
        items: [
          {
            number: '1',
            title: 'Submit Event Details',
            description: 'Fill out a simple form with your event information, date, venue, and ticket details.'
          },
          {
            number: '2',
            title: 'Choose Your Plan',
            description: 'Select the subscription plan that best fits your event size and requirements.'
          },
          {
            number: '3',
            title: 'Get Approved',
            description: 'Our team reviews your submission and approves it within 24-48 hours.'
          },
          {
            number: '4',
            title: 'Go Live & Sell',
            description: 'Your event goes live on our platform and you start selling tickets immediately.'
          }
        ]
      },
      faqs: {
        items: [
          {
            question: 'How quickly can I start selling tickets?',
            answer: 'Once your event is approved (typically within 24-48 hours), you can start selling tickets immediately.'
          },
          {
            question: 'What payment methods do you support?',
            answer: 'We support all major payment methods including credit/debit cards, UPI, net banking, and popular digital wallets.'
          },
          {
            question: 'How do I receive payment for ticket sales?',
            answer: 'Payments are automatically settled to your registered bank account within 3-5 business days after the event concludes.'
          },
          {
            question: 'Can I customize the look and feel of my event page?',
            answer: 'Yes! Standard, Professional, and Enterprise plans include branding customization options.'
          },
          {
            question: 'What happens if I need to cancel my event?',
            answer: 'You can cancel anytime. Our system will automatically process refunds to all ticket buyers according to your refund policy.'
          },
          {
            question: 'Is there a limit on the number of events I can create?',
            answer: 'No, you can create as many events as you need. Each event is charged separately based on the plan you choose.'
          }
        ]
      },
      lastUpdatedBy: userId
    })

    await defaultContent.save()
    await defaultContent.populate('lastUpdatedBy', 'name email')

    res.json({
      success: true,
      message: 'Page content reset to defaults',
      content: defaultContent
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error resetting content',
      error: err.message
    })
  }
}
