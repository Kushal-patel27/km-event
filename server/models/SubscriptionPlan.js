import mongoose from 'mongoose'

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['Basic', 'Standard', 'Professional', 'Enterprise']
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
    description: 'One-time listing price per event'
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
      default: 1
    },
    attendeesPerEvent: {
      type: Number,
      default: 100
    },
    storageGB: {
      type: Number,
      default: 1
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

export default mongoose.model('SubscriptionPlan', subscriptionPlanSchema)
