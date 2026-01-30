import crypto from 'crypto';

/**
 * QR Code Encryption and Security Utilities
 * For large-scale event security with 10,000-20,000 attendees
 */

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.QR_ENCRYPTION_KEY || crypto.randomBytes(32); // 32 bytes for AES-256
const IV_LENGTH = 16; // Initialization vector length
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * Ensure SECRET_KEY is properly formatted
 */
const getEncryptionKey = () => {
  if (typeof SECRET_KEY === 'string') {
    // If it's a string from env, convert to Buffer
    return Buffer.from(SECRET_KEY, 'hex').slice(0, 32);
  }
  return SECRET_KEY;
};

/**
 * Generate encrypted QR payload
 * @param {Object} data - Data to encrypt (bookingId, ticketId, eventId, etc.)
 * @returns {string} - Encrypted payload (Base64)
 */
export const generateEncryptedQRPayload = (data) => {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    // Add timestamp and random nonce for uniqueness
    const payload = {
      ...data,
      timestamp: Date.now(),
      nonce: crypto.randomBytes(16).toString('hex')
    };
    
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    
    let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combine: salt + iv + authTag + encrypted data
    const combined = Buffer.concat([
      salt,
      iv,
      authTag,
      Buffer.from(encrypted, 'hex')
    ]);
    
    return combined.toString('base64');
  } catch (error) {
    console.error('[QR] Encryption error:', error);
    throw new Error('Failed to generate encrypted QR payload');
  }
};

/**
 * Decrypt and validate QR payload
 * @param {string} encryptedPayload - Base64 encrypted payload
 * @param {number} maxAgeMinutes - Maximum age of QR code in minutes (default: 30 days)
 * @returns {Object|null} - Decrypted data or null if invalid
 */
export const decryptQRPayload = (encryptedPayload, maxAgeMinutes = 43200) => { // 30 days default
  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedPayload, 'base64');
    
    // Extract components
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = combined.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
    
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    const payload = JSON.parse(decrypted.toString('utf8'));
    
    // Validate timestamp (prevent replay attacks)
    const ageMinutes = (Date.now() - payload.timestamp) / (1000 * 60);
    if (ageMinutes > maxAgeMinutes) {
      console.warn('[QR] Expired QR code:', { age: ageMinutes, max: maxAgeMinutes });
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('[QR] Decryption error:', error.message);
    return null;
  }
};

/**
 * Generate secure QR code ID (used for tracking)
 * @param {string} bookingId - Booking ID
 * @param {string} ticketId - Ticket ID
 * @returns {string} - Unique QR code ID
 */
export const generateQRCodeId = (bookingId, ticketId) => {
  const data = `${bookingId}:${ticketId}:${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Generate scanner device token (for authentication)
 * @param {string} deviceId - Device identifier
 * @param {string} staffId - Staff user ID
 * @param {string} eventId - Event ID
 * @returns {string} - Signed device token
 */
export const generateDeviceToken = (deviceId, staffId, eventId) => {
  const payload = {
    deviceId,
    staffId,
    eventId,
    issuedAt: Date.now(),
    nonce: crypto.randomBytes(16).toString('hex')
  };
  
  const hmac = crypto.createHmac('sha256', getEncryptionKey());
  hmac.update(JSON.stringify(payload));
  const signature = hmac.digest('hex');
  
  const token = Buffer.from(JSON.stringify({
    ...payload,
    signature
  })).toString('base64');
  
  return token;
};

/**
 * Verify scanner device token
 * @param {string} token - Device token
 * @param {number} maxAgeHours - Maximum token age in hours (default: 24)
 * @returns {Object|null} - Token payload or null if invalid
 */
export const verifyDeviceToken = (token, maxAgeHours = 24) => {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    const { signature, ...payload } = decoded;
    
    // Verify signature
    const hmac = crypto.createHmac('sha256', getEncryptionKey());
    hmac.update(JSON.stringify(payload));
    const expectedSignature = hmac.digest('hex');
    
    if (signature !== expectedSignature) {
      console.warn('[QR] Invalid device token signature');
      return null;
    }
    
    // Check age
    const ageHours = (Date.now() - payload.issuedAt) / (1000 * 60 * 60);
    if (ageHours > maxAgeHours) {
      console.warn('[QR] Expired device token:', { age: ageHours, max: maxAgeHours });
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('[QR] Token verification error:', error.message);
    return null;
  }
};

/**
 * Hash sensitive data (for logging without exposing actual values)
 * @param {string} data - Data to hash
 * @returns {string} - SHA-256 hash
 */
export const hashData = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Generate rate limit key for IP + device combination
 * @param {string} ip - IP address
 * @param {string} deviceId - Device ID
 * @returns {string} - Rate limit key
 */
export const generateRateLimitKey = (ip, deviceId) => {
  return hashData(`${ip}:${deviceId}`);
};

/**
 * Validate QR data structure
 * Supports both encrypted format (bookingId, eventId, qrCodeId) 
 * and raw format (bid, evt, idx)
 * @param {Object} qrData - Parsed QR data
 * @returns {boolean} - True if valid structure
 */
export const validateQRDataStructure = (qrData) => {
  if (!qrData || typeof qrData !== 'object') return false;
  
  // Check for either encrypted or raw format
  const hasBookingId = qrData.hasOwnProperty('bookingId') && qrData.bookingId;
  const hasBid = qrData.hasOwnProperty('bid') && qrData.bid;
  const bookingIdValid = hasBookingId || hasBid;
  
  const hasEventId = qrData.hasOwnProperty('eventId') && qrData.eventId;
  const hasEvt = qrData.hasOwnProperty('evt') && qrData.evt;
  const eventIdValid = hasEventId || hasEvt;
  
  const hasTicketId = qrData.hasOwnProperty('ticketId') && qrData.ticketId;
  const hasIdx = qrData.hasOwnProperty('idx') && qrData.idx;
  const ticketIdValid = hasTicketId || hasIdx;
  
  // All three required fields must exist in at least one format
  return bookingIdValid && eventIdValid && ticketIdValid;
};

/**
 * Generate integrity checksum for offline sync
 * @param {Object} scanData - Scan data to checksum
 * @returns {string} - Checksum
 */
export const generateSyncChecksum = (scanData) => {
  const normalized = JSON.stringify(scanData, Object.keys(scanData).sort());
  return crypto.createHash('sha256').update(normalized).digest('hex');
};

/**
 * Verify sync data integrity
 * @param {Object} scanData - Scan data
 * @param {string} checksum - Expected checksum
 * @returns {boolean} - True if valid
 */
export const verifySyncChecksum = (scanData, checksum) => {
  const calculated = generateSyncChecksum(scanData);
  return calculated === checksum;
};

export default {
  generateEncryptedQRPayload,
  decryptQRPayload,
  generateQRCodeId,
  generateDeviceToken,
  verifyDeviceToken,
  hashData,
  generateRateLimitKey,
  validateQRDataStructure,
  generateSyncChecksum,
  verifySyncChecksum
};
