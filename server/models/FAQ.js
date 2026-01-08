import mongoose from 'mongoose'

const faqSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: ['Booking & Tickets', 'Tickets & Entry', 'Payment & Refunds', 'Account & Profile', 'Support & Help', 'Other'],
      default: 'Other'
    },
    question: {
      type: String,
      required: true,
      trim: true
    },
    answer: {
      type: String,
      required: true,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    viewCount: {
      type: Number,
      default: 0
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
)

export default mongoose.model('FAQ', faqSchema)
