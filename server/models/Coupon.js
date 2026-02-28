import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [3, "Coupon code must be at least 3 characters long"],
      maxlength: [20, "Coupon code cannot exceed 20 characters"],
      index: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: [true, "Discount type is required (percentage or fixed)"],
    },
    discountValue: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [0.01, "Discount value must be greater than 0"],
      validate: {
        validator: function (v) {
          if (this.discountType === "percentage") {
            return v <= 100;
          }
          return true;
        },
        message: "Percentage discount cannot exceed 100%",
      },
    },
    currency: {
      type: String,
      default: "INR",
      enum: ["INR", "USD", "EUR"],
    },
    expiryDate: {
      type: Date,
      required: [true, "Expiry date is required"],
      validate: {
        validator: function (v) {
          return v > new Date();
        },
        message: "Expiry date must be in the future",
      },
    },
    usageLimit: {
      type: Number,
      default: null,
      min: [1, "Usage limit must be at least 1"],
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: [0, "Minimum order amount cannot be negative"],
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
      min: [0, "Maximum discount amount cannot be negative"],
    },
    applicableEventIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Event",
      default: [],
    },
    applicableCategories: {
      type: [String],
      default: [],
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdByRole: {
      type: String,
      enum: ["admin", "event_admin"],
      required: true,
    },
    eventAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    usedByUsers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        usedAt: {
          type: Date,
          default: Date.now,
        },
        bookingId: mongoose.Schema.Types.ObjectId,
      },
    ],
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Index for active coupons
couponSchema.index({ isActive: 1, expiryDate: 1 });
couponSchema.index({ createdBy: 1, createdByRole: 1 });
couponSchema.index({ code: 1, isActive: 1 });

// Virtual for checking if coupon is valid
couponSchema.virtual("isValid").get(function () {
  return (
    this.isActive &&
    new Date() < this.expiryDate &&
    (!this.usageLimit || this.usageCount < this.usageLimit)
  );
});

// Virtual for checking if coupon is expired
couponSchema.virtual("isExpired").get(function () {
  return new Date() > this.expiryDate;
});

// Check if coupon can be used
couponSchema.methods.canBeUsed = function () {
  if (!this.isActive) return false;
  if (new Date() > this.expiryDate) return false;
  if (this.usageLimit && this.usageCount >= this.usageLimit) return false;
  return true;
};

// Calculate discount amount
couponSchema.methods.calculateDiscount = function (subtotal) {
  if (!this.canBeUsed()) {
    throw new Error("Coupon cannot be used");
  }

  let discountAmount = 0;

  if (this.discountType === "percentage") {
    discountAmount = (subtotal * this.discountValue) / 100;
  } else if (this.discountType === "fixed") {
    discountAmount = this.discountValue;
  }

  // Apply maximum discount amount if set
  if (this.maxDiscountAmount && discountAmount > this.maxDiscountAmount) {
    discountAmount = this.maxDiscountAmount;
  }

  return Math.min(discountAmount, subtotal);
};

// Use coupon (increment usage count and add user)
couponSchema.methods.use = async function (userId, bookingId) {
  if (!this.canBeUsed()) {
    throw new Error("Coupon cannot be used");
  }

  this.usageCount += 1;
  this.usedByUsers.push({
    userId,
    usedAt: new Date(),
    bookingId,
  });

  await this.save();
};

export default mongoose.model("Coupon", couponSchema);
