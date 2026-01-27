import mongoose from 'mongoose'

const featureToggleSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    unique: true
  },
  features: {
    ticketing: {
      enabled: { type: Boolean, default: true },
      description: { type: String, default: 'Allow ticket sales and management' }
    },
    qrCheckIn: {
      enabled: { type: Boolean, default: true },
      description: { type: String, default: 'QR code generation for check-in' }
    },
    scannerApp: {
      enabled: { type: Boolean, default: false },
      description: { type: String, default: 'Mobile scanner app for entry verification' }
    },
    analytics: {
      enabled: { type: Boolean, default: true },
      description: { type: String, default: 'Event analytics and reporting' }
    },
    emailSms: {
      enabled: { type: Boolean, default: false },
      description: { type: String, default: 'Email and SMS notifications' }
    },
    payments: {
      enabled: { type: Boolean, default: true },
      description: { type: String, default: 'Payment processing and wallet integration' }
    },
    weatherAlerts: {
      enabled: { type: Boolean, default: false },
      description: { type: String, default: 'Weather alerts and notifications' }
    },
    subAdmins: {
      enabled: { type: Boolean, default: false },
      description: { type: String, default: 'Add and manage sub-administrators' }
    },
    reports: {
      enabled: { type: Boolean, default: true },
      description: { type: String, default: 'Generate detailed event reports' }
    }
  },
  toggledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

export default mongoose.model('FeatureToggle', featureToggleSchema)
