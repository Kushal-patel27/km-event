import mongoose from 'mongoose';

const eventTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
      maxlength: [100, 'Template name cannot exceed 100 characters']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'concert',
        'conference',
        'wedding',
        'workshop',
        'seminar',
        'festival',
        'sports',
        'exhibition',
        'networking',
        'meetup',
        'webinar',
        'party',
        'fundraiser',
        'other'
      ],
      default: 'other'
    },
    defaultDescription: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    defaultBanner: {
      type: String,
      trim: true
    },
    defaultPrice: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative']
    },
    defaultCurrency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD']
    },
    defaultDuration: {
      hours: {
        type: Number,
        default: 2
      },
      minutes: {
        type: Number,
        default: 0
      }
    },
    defaultCapacity: {
      type: Number,
      default: 100,
      min: [1, 'Capacity must be at least 1']
    },
    isPremium: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    usageCount: {
      type: Number,
      default: 0
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    lastUsedAt: {
      type: Date
    },
    tags: [{
      type: String,
      trim: true
    }],
    previewImage: {
      type: String,
      trim: true
    },
    customFields: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
eventTemplateSchema.index({ category: 1, isActive: 1 });
eventTemplateSchema.index({ createdBy: 1 });
eventTemplateSchema.index({ isPremium: 1 });

// Virtual for formatted price
eventTemplateSchema.virtual('formattedPrice').get(function() {
  if (this.defaultCurrency === 'INR') {
    return `₹${this.defaultPrice.toLocaleString('en-IN')}`;
  }
  const symbols = { USD: '$', EUR: '€', GBP: '£', AUD: 'A$', CAD: 'C$' };
  return `${symbols[this.defaultCurrency] || ''}${this.defaultPrice.toLocaleString()}`;
});

// Method to increment usage count
eventTemplateSchema.methods.incrementUsage = async function() {
  this.usageCount += 1;
  this.lastUsedAt = new Date();
  return await this.save();
};

// Static method to get popular templates
eventTemplateSchema.statics.getPopular = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ usageCount: -1 })
    .limit(limit)
    .populate('createdBy', 'name email');
};

// Static method to get by category
eventTemplateSchema.statics.getByCategory = function(category) {
  return this.find({ category, isActive: true })
    .sort({ usageCount: -1 })
    .populate('createdBy', 'name email');
};

const EventTemplate = mongoose.model('EventTemplate', eventTemplateSchema);

export default EventTemplate;
