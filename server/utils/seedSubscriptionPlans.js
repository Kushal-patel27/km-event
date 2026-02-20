import mongoose from 'mongoose'
import dotenv from 'dotenv'
import SubscriptionPlan from '../models/SubscriptionPlan.js'
import connectDB from '../config/db.js'

dotenv.config()

const subscriptionPlans = [
  {
    name: 'Basic',
    displayName: 'Basic Plan',
    description: 'Perfect for small gatherings and meetups',
    features: {
      ticketing: {
        enabled: true,
        limit: 100,
        description: 'Sell and manage up to 100 tickets'
      },
      qrCheckIn: {
        enabled: false,
        description: 'QR code generation available'
      },
      scannerApp: {
        enabled: false,
        description: 'Mobile scanner app not available'
      },
      analytics: {
        enabled: true,
        description: 'Basic event analytics'
      },
      emailSms: {
        enabled: true,
        emailLimit: 500,
        smsLimit: 0,
        description: 'Email notifications'
      },
      payments: {
        enabled: true,
        transactionFee: 5.0,
        description: 'Payment gateway integration with 5% platform fee'
      },
      weatherAlerts: {
        enabled: false,
        description: 'Weather alerts not available'
      },
      subAdmins: {
        enabled: false,
        limit: 0,
        description: 'Sub-admin feature not available'
      },
      reports: {
        enabled: true,
        types: ['basic'],
        description: 'Basic event reports'
      }
    },
    limits: {
      eventsPerMonth: 1,
      attendeesPerEvent: 100,
      customBranding: false,
      prioritySupport: false
    },
    isActive: true,
    displayOrder: 1
  },
  {
    name: 'Standard',
    displayName: 'Standard Plan',
    description: 'Ideal for medium-sized events',
    features: {
      ticketing: {
        enabled: true,
        limit: 500,
        description: 'Sell and manage up to 500 tickets'
      },
      qrCheckIn: {
        enabled: true,
        description: 'QR code generation and check-in'
      },
      scannerApp: {
        enabled: false,
        description: 'Mobile scanner app not available'
      },
      analytics: {
        enabled: true,
        description: 'Advanced analytics and reports'
      },
      emailSms: {
        enabled: true,
        emailLimit: 2000,
        smsLimit: 0,
        description: 'Email & SMS notifications'
      },
      payments: {
        enabled: true,
        transactionFee: 4.0,
        description: 'Payment gateway integration with 4% platform fee'
      },
      weatherAlerts: {
        enabled: false,
        description: 'Weather alerts not available'
      },
      subAdmins: {
        enabled: false,
        limit: 0,
        description: 'Sub-admin feature not available'
      },
      reports: {
        enabled: true,
        types: ['basic', 'advanced'],
        description: 'Basic and advanced reports'
      }
    },
    limits: {
      eventsPerMonth: 3,
      attendeesPerEvent: 500,
      customBranding: true,
      prioritySupport: false
    },
    isActive: true,
    displayOrder: 2
  },
  {
    name: 'Professional',
    displayName: 'Professional Plan',
    description: 'For large-scale professional events',
    features: {
      ticketing: {
        enabled: true,
        limit: 2000,
        description: 'Sell and manage up to 2,000 tickets'
      },
      qrCheckIn: {
        enabled: true,
        description: 'QR code generation and check-in'
      },
      scannerApp: {
        enabled: true,
        description: 'Mobile scanner app for entry verification'
      },
      analytics: {
        enabled: true,
        description: 'Real-time analytics with custom reports'
      },
      emailSms: {
        enabled: true,
        emailLimit: 5000,
        smsLimit: 500,
        description: 'Multi-channel email & SMS notifications'
      },
      payments: {
        enabled: true,
        transactionFee: 3.0,
        description: 'Payment gateway integration with 3% platform fee'
      },
      weatherAlerts: {
        enabled: false,
        description: 'Weather alerts not available'
      },
      subAdmins: {
        enabled: true,
        limit: 5,
        description: 'Assign up to 5 sub-administrators'
      },
      reports: {
        enabled: true,
        types: ['basic', 'advanced'],
        description: 'Advanced event reports and analytics'
      }
    },
    limits: {
      eventsPerMonth: 10,
      attendeesPerEvent: 2000,
      customBranding: true,
      prioritySupport: true
    },
    isActive: true,
    displayOrder: 3
  },
  {
    name: 'Enterprise',
    displayName: 'Enterprise Plan',
    description: 'Tailored solution for major events',
    features: {
      ticketing: {
        enabled: true,
        limit: null,
        description: 'Unlimited ticket sales and management'
      },
      qrCheckIn: {
        enabled: true,
        description: 'QR code generation and check-in'
      },
      scannerApp: {
        enabled: true,
        description: 'Mobile scanner app for entry verification'
      },
      analytics: {
        enabled: true,
        description: 'Custom analytics dashboard'
      },
      emailSms: {
        enabled: true,
        emailLimit: null,
        smsLimit: null,
        description: 'Multi-channel notifications'
      },
      payments: {
        enabled: true,
        transactionFee: 0,
        description: 'Dedicated payment solutions'
      },
      weatherAlerts: {
        enabled: true,
        description: 'Weather-based alerts for outdoor events'
      },
      subAdmins: {
        enabled: true,
        limit: null,
        description: 'Unlimited sub-administrators'
      },
      reports: {
        enabled: true,
        types: ['basic', 'advanced', 'custom'],
        description: 'Custom platform features'
      }
    },
    limits: {
      eventsPerMonth: null,
      attendeesPerEvent: null,
      customBranding: true,
      prioritySupport: true
    },
    isActive: true,
    displayOrder: 4
  }
]

const seedPlans = async () => {
  try {
    // Check if we need to seed (avoid clearing on every server restart)
    const count = await SubscriptionPlan.countDocuments()
    if (count >= 4) {
      // Plans already seeded, skipping...
      return
    }

    // Insert new plans
    const createdPlans = await SubscriptionPlan.insertMany(subscriptionPlans)
    console.log(`${createdPlans.length} subscription plans created successfully`)

    console.log('\nCreated Plans:')
    createdPlans.forEach(plan => {
      console.log(`- ${plan.displayName} (${plan.name}): ₹${plan.monthlyFee}/month, Commission: ${plan.commissionPercentage}%`)
    })
  } catch (error) {
    console.error('Error seeding subscription plans:', error.message)
  }
}

// If run directly as a script, execute seedPlans with process.exit
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    await connectDB()
    await seedPlans()
    process.exit(0)
  })().catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
}

// Export for use in server.js
export default seedPlans
