import mongoose from 'mongoose'

const eventRequestSchema = new mongoose.Schema({
  // Organizer Information
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organizerName: {
    type: String,
    required: true
  },
  organizerEmail: {
    type: String,
    required: true
  },
  organizerPhone: {
    type: String
  },
  organizerCompany: {
    type: String
  },

  // Event Information (matching Event model)
  title: {
    type: String,
    required: [true, 'Title is required']
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    validate: {
      validator: function(v) {
        return v instanceof Date && !isNaN(v);
      },
      message: 'Date must be a valid date'
    }
  },
  location: {
    type: String,
    required: [true, 'Location is required']
  },
  locationDetails: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    default: 0,
    min: [0, 'Price cannot be negative']
  },
  image: {
    type: String,
    default: ''
  },
  totalTickets: {
    type: Number,
    required: [true, 'Total tickets is required'],
    min: [1, 'Total tickets must be at least 1']
  },
  availableTickets: {
    type: Number,
    required: [true, 'Available tickets is required'],
    min: [0, 'Available tickets cannot be negative']
  },
  ticketTypes: [
    {
      name: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
      },
      quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1']
      },
      available: {
        type: Number,
        required: true,
        min: [0, 'Available must be at least 0']
      },
      description: {
        type: String,
        default: ''
      }
    }
  ],

  // Request-specific fields
  subscriptionPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },
  planSelected: {
    type: String,
    enum: ['Basic', 'Standard', 'Professional', 'Enterprise'],
    required: true
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'annual'],
    default: 'monthly'
  },
  requestedFeatures: {
    ticketing: { type: Boolean, default: true },
    qrCheckIn: { type: Boolean, default: false },
    scannerApp: { type: Boolean, default: false },
    analytics: { type: Boolean, default: false },
    emailSms: { type: Boolean, default: false },
    payments: { type: Boolean, default: true },
    weatherAlerts: { type: Boolean, default: false },
    subAdmins: { type: Boolean, default: false },
    reports: { type: Boolean, default: false }
  },
  approvedFeatures: {
    ticketing: { type: Boolean, default: false },
    qrCheckIn: { type: Boolean, default: false },
    scannerApp: { type: Boolean, default: false },
    analytics: { type: Boolean, default: false },
    emailSms: { type: Boolean, default: false },
    payments: { type: Boolean, default: false },
    weatherAlerts: { type: Boolean, default: false },
    subAdmins: { type: Boolean, default: false },
    reports: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  rejectReason: {
    type: String
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  adminNotes: {
    type: String
  },
  // Link to created Event (set on approval)
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }
}, { timestamps: true })

export default mongoose.model('EventRequest', eventRequestSchema)
