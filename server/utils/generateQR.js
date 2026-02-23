import QRCode from "qrcode";

/**
 * Generate a QR code from data
 * @param {string|object} data - Data to encode in QR code
 * @param {object} options - QR code options
 * @returns {Promise<string>} Data URL of the QR code
 */
const generateQR = async (data, options = {}) => {
  const defaultOptions = {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 300,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    ...options
  };

  // Convert object to JSON string if needed
  const qrData = typeof data === 'object' ? JSON.stringify(data) : data;
  
  return await QRCode.toDataURL(qrData, defaultOptions);
};

/**
 * Generate QR code containing booking ID
 * @param {string} bookingId - Unique booking ID
 * @param {string} eventId - Event ID
 * @returns {Promise<string>} Data URL of the QR code
 */
export const generateBookingQRCode = async (bookingId, eventId = null) => {
  const qrData = { bookingId, eventId };
  return generateQR(qrData, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 300,
    margin: 1,
  });
};

export default generateQR;
