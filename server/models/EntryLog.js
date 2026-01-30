import mongoose from "mongoose";

const entryLogSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    qrCodeId: { type: String, required: true, index: true }, // QR code identifier for fast lookup
    staff: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true }, // Staff who scanned
    gateId: { type: String, required: true, index: true }, // Gate/Zone identifier (e.g., "GATE-A", "GATE-B")
    gateName: { type: String }, // Human-readable gate name
    scanMethod: { type: String, enum: ["qr_code", "booking_id", "manual"], default: "qr_code" },
    ticketStatus: { type: String, enum: ["valid", "used", "cancelled", "invalid", "duplicate"], default: "valid" },
    scannedAt: { type: Date, default: Date.now, index: true },
    approvedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Staff Admin who approved
    notes: { type: String },
    ipAddress: { type: String },
    
    // High-concurrency tracking
    isDuplicate: { type: Boolean, default: false }, // Flag for duplicate scan attempts
    duplicateAttemptNumber: { type: Number, default: 0 }, // Track nth duplicate attempt
    originalScanId: { type: mongoose.Schema.Types.ObjectId, ref: "EntryLog" }, // Reference to original scan if duplicate
    
    // Device and location tracking
    deviceId: { type: String }, // Scanner device identifier
    deviceName: { type: String }, // Scanner device name
    deviceType: { type: String, enum: ["mobile", "tablet", "scanner_device", "web"], default: "mobile" },
    
    // Offline sync support
    localTimestamp: { type: Date }, // Timestamp from device (for offline scans)
    syncedAt: { type: Date }, // When offline scan was synced to server
    isOfflineSync: { type: Boolean, default: false }, // Flag for offline synced entries
    
    // Performance metadata
    validationTime: { type: Number }, // Time taken to validate (in ms)
    cacheHit: { type: Boolean, default: false }, // Was data served from cache
  },
  { timestamps: true }
);

// Compound indexes for high-performance queries
entryLogSchema.index({ event: 1, scannedAt: -1 }); // Event timeline
entryLogSchema.index({ event: 1, gateId: 1, scannedAt: -1 }); // Gate-wise reports
entryLogSchema.index({ event: 1, staff: 1, scannedAt: -1 }); // Staff-wise reports
entryLogSchema.index({ qrCodeId: 1, event: 1 }, { unique: false }); // QR lookup (allows duplicates for logging)
entryLogSchema.index({ booking: 1, isDuplicate: 1 }); // Duplicate detection
entryLogSchema.index({ event: 1, isDuplicate: true, scannedAt: -1 }); // Duplicate attempts log
entryLogSchema.index({ event: 1, gateId: 1, staff: 1 }); // Multi-dimensional analytics

// Static method to log duplicate attempt
entryLogSchema.statics.logDuplicateAttempt = async function(originalScanId, duplicateData) {
  const originalScan = await this.findById(originalScanId);
  if (!originalScan) return null;
  
  const duplicateCount = await this.countDocuments({
    qrCodeId: duplicateData.qrCodeId,
    event: duplicateData.event,
    isDuplicate: true
  });
  
  return this.create({
    ...duplicateData,
    isDuplicate: true,
    duplicateAttemptNumber: duplicateCount + 1,
    originalScanId: originalScanId,
    ticketStatus: 'duplicate'
  });
};

// Instance method to get duplicate attempts
entryLogSchema.methods.getDuplicateAttempts = async function() {
  return this.model('EntryLog').find({
    originalScanId: this._id,
    isDuplicate: true
  }).sort({ scannedAt: -1 });
};

export default mongoose.model("EntryLog", entryLogSchema);
