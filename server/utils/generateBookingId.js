import crypto from 'crypto';
import Booking from '../models/Booking.js';

/**
 * Generate a unique Booking ID in format: BK-YYYYMMDD-XXXXX
 * Example: BK-20260223-A1B2C
 */
export const generateUniqueBookingId = async () => {
  const maxAttempts = 10;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    
    // Generate 5 random alphanumeric characters (36^5 = 60,466,176 combinations)
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomBytes = crypto.randomBytes(4);
    let randomPart = '';
    for (let i = 0; i < 5; i++) {
      randomPart += chars[randomBytes[i % 4] % chars.length];
    }

    const bookingId = `BK-${dateStr}-${randomPart}`;

    // Check if this ID already exists
    const existing = await Booking.findOne({ bookingId });
    if (!existing) {
      return bookingId;
    }

    attempts++;
  }

  throw new Error('Failed to generate unique booking ID after multiple attempts');
};

export default generateUniqueBookingId;
