import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: [true, 'Title is required'] 
    },
    description: { 
      type: String, 
      required: [true, 'Description is required'] 
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
    mapLink: {
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
    category: { 
      type: String,
      default: '',
      trim: true
    },
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    assignedStaff: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      role: {
        type: String,
        enum: ['staff', 'staff_admin'],
        default: 'staff'
      },
      assignedAt: {
        type: Date,
        default: Date.now
      }
    }],
    ticketTypes: [{
      name: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true,
        min: 0
      },
      quantity: {
        type: Number,
        required: true,
        min: 0
      },
      available: {
        type: Number,
        required: true,
        min: 0
      },
      description: {
        type: String,
        default: ''
      }
    }],
    subscriptionPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      default: null
    },
    // Public Event & Template Fields
    slug: {
      type: String,
      unique: true,
      sparse: true, // Allow null values for events without slugs
      trim: true,
      lowercase: true,
      index: true
    },
    shortCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
      index: true
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    views: {
      type: Number,
      default: 0,
      min: 0
    },
    templateUsed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventTemplate",
      default: null
    },
    customBranding: {
      primaryColor: {
        type: String,
        default: '#FF0000', // Default red color
        trim: true
      },
      logo: {
        type: String,
        default: '',
        trim: true
      },
      customBanner: {
        type: String,
        default: '',
        trim: true
      }
    }
  },
  { timestamps: true }
);

// Index for public event queries
eventSchema.index({ slug: 1, isPublic: 1 });
eventSchema.index({ shortCode: 1, isPublic: 1 });

// Method to increment views
eventSchema.methods.incrementViews = async function() {
  this.views += 1;
  return await this.save({ validateBeforeSave: false });
};

// Method to generate slug from title
eventSchema.methods.generateSlug = function() {
  if (!this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
};

// Pre-save hook to generate slug if not exists
eventSchema.pre('save', function() {
  if (this.isNew && !this.slug) {
    this.generateSlug();
  }
});

export default mongoose.model("Event", eventSchema);
