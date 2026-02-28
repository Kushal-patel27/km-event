import React from "react";
import { Link } from "react-router-dom";

/**
 * Payment Status Display Component
 * Shows success, failure, or pending payment states
 * 
 * @param {Object} props
 * @param {string} props.status - 'success', 'failed', 'pending'
 * @param {string} props.message - Status message
 * @param {string} props.paymentId - Payment ID for reference
 * @param {string} props.transactionId - Razorpay payment ID
 * @param {number} props.amount - Payment amount
 * @param {Object} props.details - Additional details
 * @param {Function} props.onRetry - Retry callback for failed payments
 * @param {string} props.redirectUrl - URL to redirect after success
 * @param {string} props.redirectText - Text for redirect button
 */
export default function PaymentStatus({
  status = "pending",
  message = "",
  paymentId = "",
  transactionId = "",
  amount = 0,
  details = {},
  onRetry = null,
  redirectUrl = "/",
  redirectText = "Go to Home",
}) {
  const getStatusIcon = () => {
    switch (status) {
      case "success":
        return (
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        );
      case "failed":
        return (
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        );
      case "pending":
        return (
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-yellow-600 dark:text-yellow-400 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "success":
        return "text-green-600 dark:text-green-400";
      case "failed":
        return "text-red-600 dark:text-red-400";
      case "pending":
        return "text-yellow-600 dark:text-yellow-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getDefaultMessage = () => {
    switch (status) {
      case "success":
        return "Payment Successful!";
      case "failed":
        return "Payment Failed";
      case "pending":
        return "Payment Processing...";
      default:
        return "Payment Status";
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 mb-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        {getStatusIcon()}

        <h2 className={`text-2xl font-bold mb-3 ${getStatusColor()}`}>
          {message || getDefaultMessage()}
        </h2>

        {status === "success" && (
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Thank you for your payment. Your transaction has been completed successfully.
          </p>
        )}

        {status === "failed" && (
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We couldn't process your payment. Please try again or contact support if the issue persists.
          </p>
        )}

        {status === "pending" && (
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your payment is being processed. Please wait...
          </p>
        )}

        {/* Payment Details */}
        {(paymentId || transactionId || amount > 0) && (
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">
              Payment Details
            </h3>
            <div className="space-y-2 text-sm">
              {amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    ₹{amount.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              {transactionId && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Transaction ID:</span>
                  <span className="font-mono text-xs text-gray-900 dark:text-gray-100">
                    {transactionId}
                  </span>
                </div>
              )}
              {paymentId && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Payment ID:</span>
                  <span className="font-mono text-xs text-gray-900 dark:text-gray-100">
                    {paymentId}
                  </span>
                </div>
              )}
              {details.bookingId && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Booking ID:</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {details.bookingId}
                  </span>
                </div>
              )}
              {details.subscriptionId && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Subscription ID:</span>
                  <span className="font-mono text-xs text-gray-900 dark:text-gray-100">
                    {details.subscriptionId}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {status === "success" && (
            <Link
              to={redirectUrl}
              className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors duration-200"
            >
              {redirectText}
            </Link>
          )}

          {status === "failed" && onRetry && (
            <button
              onClick={onRetry}
              className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors duration-200"
            >
              Retry Payment
            </button>
          )}

          {status === "failed" && (
            <Link
              to="/help"
              className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-semibold transition-colors duration-200"
            >
              Contact Support
            </Link>
          )}

          {status !== "pending" && (
            <Link
              to="/"
              className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm"
            >
              ← Back to Home
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
