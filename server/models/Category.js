import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: false // true for predefined categories, false for user-created
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // null for default categories
  },
  usageCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true })

// Index for faster queries (note: name field already has unique index via unique: true constraint)
categorySchema.index({ isActive: 1, isDefault: -1 })

export default mongoose.model('Category', categorySchema)
