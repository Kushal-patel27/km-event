/**
 * Duplicate Webhook Prevention & Idempotency Utilities
 */

import crypto from "crypto";

/**
 * Generate idempotency key from webhook payload
 * Ensures same webhook isn't processed twice
 */
export function generateWebhookIdempotencyKey(payload) {
  const key = `${payload.event}-${payload.payload?.payment?.id || payload.payload?.refund?.id}`;
  return crypto.createHash("sha256").update(key).digest("hex");
}

/**
 * Verify webhook hasn't been processed in cache (optional Redis implementation)
 * For now, uses database uniqueness constraint
 */
export async function checkWebhookDuplicate(webhookId) {
  // This is handled in the Payment model with webhookId uniqueness
  // But you can extend this with Redis for higher performance
  return false; // Not a duplicate if it reaches here
}

/**
 * Razorpay webhook signature verification
 * MUST be called before processing any webhook
 */
export function verifyWebhookSignature(body, signature, secret) {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(body))
    .digest("hex");

  return expectedSignature === signature;
}

/**
 * Safe payment status transition validator
 * Prevents invalid payment state changes
 */
export function isValidStatusTransition(currentStatus, newStatus) {
  const validTransitions = {
    created: ["authorized", "captured", "failed", "cancelled"],
    authorized: ["captured", "failed"],
    captured: ["refunded"],
    failed: [], // Final state
    refunded: [], // Final state
    cancelled: [] // Final state
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
}

/**
 * Validate payment amount matches booking
 */
export function validatePaymentAmount(paymentAmount, bookingAmount) {
  // Allow 1 paisa variance due to rounding
  const difference = Math.abs(paymentAmount - bookingAmount);
  return difference <= 0.01;
}

/**
 * Generate receipt with anti-forgery pattern
 */
export function generateSecureReceipt() {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString("hex");
  return `REC-${timestamp}-${random.toUpperCase()}`;
}

/**
 * Rate limit check for payment attempts
 * Prevent brute force
 */
export async function checkPaymentRateLimit(userId, limit = 5, windowSeconds = 60) {
  // Implement with Redis or database
  // For now, return true (not rate limited)
  return true;
}

/**
 * Validate Razorpay order structure
 */
export function validateRazorpayOrderResponse(order) {
  const required = ["id", "amount", "amount_paid", "amount_due", "status"];
  return required.every(field => field in order);
}

/**
 * Validate Razorpay payment structure
 */
export function validateRazorpayPaymentResponse(payment) {
  const required = ["id", "order_id", "amount", "currency", "status"];
  return required.every(field => field in payment);
}

/**
 * Extract payment details safely
 */
export function extractPaymentDetails(razorpayPayment) {
  return {
    id: razorpayPayment.id,
    orderId: razorpayPayment.order_id,
    amount: razorpayPayment.amount / 100, // Convert from paise to rupees
    currency: razorpayPayment.currency,
    status: razorpayPayment.status,
    method: razorpayPayment.method || "unknown",
    description: razorpayPayment.description,
    errorCode: razorpayPayment.error_code || null,
    errorDescription: razorpayPayment.error_description || null,
    acquiredAt: new Date(razorpayPayment.created_at * 1000),
    vpa: razorpayPayment.vpa || null,
    contact: razorpayPayment.contact || null,
    email: razorpayPayment.email || null,
    fee: razorpayPayment.fee ? razorpayPayment.fee / 100 : 0,
    tax: razorpayPayment.tax ? razorpayPayment.tax / 100 : 0,
    notes: razorpayPayment.notes || {}
  };
}

/**
 * Extract refund details safely
 */
export function extractRefundDetails(razorpayRefund) {
  return {
    id: razorpayRefund.id,
    paymentId: razorpayRefund.payment_id,
    amount: razorpayRefund.amount / 100, // Convert from paise to rupees
    currency: razorpayRefund.currency,
    status: razorpayRefund.status,
    notes: razorpayRefund.notes || {},
    receiptId: razorpayRefund.receipt_id || null,
    acquiredAt: new Date(razorpayRefund.created_at * 1000)
  };
}

/**
 * Calculate fees and taxes
 */
export function calculatePaymentBreakdown(amount, platformFeePercent = 2.36) {
  const platformFee = (amount * platformFeePercent) / 100;
  const gst = (platformFee * 18) / 100;
  const totalFees = platformFee + gst;

  return {
    subtotal: amount,
    platformFee: parseFloat(platformFee.toFixed(2)),
    gst: parseFloat(gst.toFixed(2)),
    totalFees: parseFloat(totalFees.toFixed(2)),
    grandTotal: parseFloat((amount + totalFees).toFixed(2))
  };
}

/**
 * Format payment for logging (sensitive data redacted)
 */
export function formatPaymentForLogging(payment) {
  return {
    id: payment.id,
    amount: payment.amount,
    status: payment.status,
    method: payment.method,
    timestamp: payment.createdAt || new Date()
    // Card details, signatures never logged
  };
}

/**
 * Retry logic for failed operations
 */
export function getRetryDelay(attemptNumber) {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s (max)
  const delay = Math.min(1000 * Math.pow(2, attemptNumber - 1), 16000);
  return delay;
}

/**
 * Check if payment can be refunded
 */
export function canRefundPayment(paymentStatus, refundStatus) {
  if (paymentStatus !== "captured") return false;
  if (refundStatus === "processed") return false;
  return true;
}

export default {
  generateWebhookIdempotencyKey,
  checkWebhookDuplicate,
  verifyWebhookSignature,
  isValidStatusTransition,
  validatePaymentAmount,
  generateSecureReceipt,
  checkPaymentRateLimit,
  validateRazorpayOrderResponse,
  validateRazorpayPaymentResponse,
  extractPaymentDetails,
  extractRefundDetails,
  calculatePaymentBreakdown,
  formatPaymentForLogging,
  getRetryDelay,
  canRefundPayment
};
