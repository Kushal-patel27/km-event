import mongoose from 'mongoose'

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: false // Made optional, defaults to name
  },
  description: {
    type: String,
    required: true
  },
  // Commission-based revenue model
  commissionPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 30
  },
  monthlyFee: {
    type: Number,
    default: 0,
    min: 0
  },
  eventLimit: {
    type: Number,
    default: null // null = unlimited
  },
  ticketLimit: {
    type: Number,
    default: null // null = unlimited
  },
  payoutFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'custom'],
    default: 'monthly'
  },
  minPayoutAmount: {
    type: Number,
    default: 100,
    min: 0
  },
  features: {
    ticketing: {
      enabled: { type: Boolean, default: true },
      limit: { type: Number, default: null }, // null = unlimited
      description: { type: String, default: 'Sell and manage event tickets' }
    },
    qrCheckIn: {
      enabled: { type: Boolean, default: false },
      description: { type: String, default: 'QR code-based attendee check-in' }
    },
    scannerApp: {
      enabled: { type: Boolean, default: false },
      description: { type: String, default: 'Mobile scanner app for entry verification' }
    },
    analytics: {
      enabled: { type: Boolean, default: false },
      description: { type: String, default: 'Real-time event analytics and insights' }
    },
    emailSms: {
      enabled: { type: Boolean, default: false },
      emailLimit: { type: Number, default: 0 }, // emails per month
      smsLimit: { type: Number, default: 0 }, // SMS per month
      description: { type: String, default: 'Automated email and SMS notifications' }
    },
    payments: {
      enabled: { type: Boolean, default: true },
      transactionFee: { type: Number, default: 3.5 }, // percentage
      description: { type: String, default: 'Secure payment processing' }
    },
    weatherAlerts: {
      enabled: { type: Boolean, default: false },
      description: { type: String, default: 'Weather-based alerts for outdoor events' }
    },
    subAdmins: {
      enabled: { type: Boolean, default: false },
      limit: { type: Number, default: 0 }, // number of sub-admins allowed
      description: { type: String, default: 'Assign additional administrators' }
    },
    reports: {
      enabled: { type: Boolean, default: false },
      types: { type: [String], default: [] }, // ['basic', 'advanced', 'custom']
      description: { type: String, default: 'Generate comprehensive event reports' }
    }
  },
  limits: {
    eventsPerMonth: {
      type: Number,
      default: null
    },
    attendeesPerEvent: {
      type: Number,
      default: null
    },
    customBranding: {
      type: Boolean,
      default: false
    },
    prioritySupport: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  mostPopular: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })

// Pre-save hook to set displayName if not provided
subscriptionPlanSchema.pre('save', function(next) {
  if (!this.displayName) {
    this.displayName = this.name
  }
  next()
})

export default mongoose.model('SubscriptionPlan', subscriptionPlanSchema)
