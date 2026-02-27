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
    }
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);
