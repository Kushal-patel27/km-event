import mongoose from 'mongoose';

const waitlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  ticketType: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  position: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['waiting', 'notified', 'expired', 'converted'],
    default: 'waiting'
  },
  notifiedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  },
  // 48 hours to complete booking after notification
  notificationExpiryHours: {
    type: Number,
    default: 48
  },
  priority: {
    type: Number,
    default: 0 // Higher number = higher priority (for VIP/loyalty users)
  },
  metadata: {
    source: {
      type: String,
      enum: ['web', 'mobile', 'api'],
      default: 'web'
    },
    userAgent: String,
    ipAddress: String
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
waitlistSchema.index({ event: 1, ticketType: 1, status: 1, position: 1 });
waitlistSchema.index({ user: 1, event: 1 });
waitlistSchema.index({ status: 1, expiresAt: 1 });

// Method to check if notification has expired
waitlistSchema.methods.isNotificationExpired = function() {
  if (this.status === 'notified' && this.expiresAt) {
    return new Date() > this.expiresAt;
  }
  return false;
};

// Method to mark as notified
waitlistSchema.methods.markAsNotified = function() {
  this.status = 'notified';
  this.notifiedAt = new Date();
  this.expiresAt = new Date(Date.now() + this.notificationExpiryHours * 60 * 60 * 1000);
  return this.save();
};

// Method to mark as converted (successfully booked)
waitlistSchema.methods.markAsConverted = function() {
  this.status = 'converted';
  return this.save();
};

// Static method to get next in line
waitlistSchema.statics.getNextInLine = async function(eventId, ticketType, limit = 1) {
  return this.find({
    event: eventId,
    ticketType: ticketType,
    status: 'waiting'
  })
  .sort({ priority: -1, position: 1, createdAt: 1 })
  .limit(limit)
  .populate('user', 'name email');
};

// Static method to get user's position
waitlistSchema.statics.getUserPosition = async function(userId, eventId, ticketType) {
  const waitlistEntry = await this.findOne({
    user: userId,
    event: eventId,
    ticketType: ticketType,
    status: 'waiting'
  });

  if (!waitlistEntry) {
    return null;
  }

  const position = await this.countDocuments({
    event: eventId,
    ticketType: ticketType,
    status: 'waiting',
    $or: [
      { priority: { $gt: waitlistEntry.priority } },
      { 
        priority: waitlistEntry.priority,
        position: { $lt: waitlistEntry.position }
      },
      {
        priority: waitlistEntry.priority,
        position: waitlistEntry.position,
        createdAt: { $lt: waitlistEntry.createdAt }
      }
    ]
  });

  return position + 1;
};

// Static method to cleanup expired notifications
waitlistSchema.statics.cleanupExpired = async function() {
  const now = new Date();
  const result = await this.updateMany(
    {
      status: 'notified',
      expiresAt: { $lt: now }
    },
    {
      $set: { status: 'expired' }
    }
  );
  return result.modifiedCount;
};

// Pre-save hook to assign position
waitlistSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const count = await this.constructor.countDocuments({
        event: this.event,
        ticketType: this.ticketType,
        status: 'waiting'
      });
      this.position = count + 1;
    } catch (error) {
      console.error('Error calculating position:', error);
      this.position = 1; // Fallback to position 1
    }
  }
});

export default mongoose.model('Waitlist', waitlistSchema);
