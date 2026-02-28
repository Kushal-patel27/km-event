import React, { useState } from "react";
import API from "../../services/api";

/**
 * Reusable Razorpay Payment Button Component
 * 
 * @param {Object} props
 * @param {number} props.amount - Amount to charge in INR
 * @param {string} props.paymentType - 'event' or 'subscription'
 * @param {string} props.referenceId - Booking ID or Subscription ID
 * @param {Object} props.metadata - Additional metadata (eventId, planId, etc.)
 * @param {Object} props.coupon - Applied coupon details (optional)
 * @param {Function} props.onSuccess - Callback on successful payment
 * @param {Function} props.onFailure - Callback on payment failure
 * @param {string} props.buttonText - Custom button text
 * @param {string} props.className - Custom CSS classes
 * @param {boolean} props.disabled - Disable button
 */
export default function RazorpayButton({
  amount,
  paymentType,
  referenceId,
  metadata = {},
  coupon,
  onSuccess,
  onFailure,
  buttonText = "Pay Now",
  className = "",
  disabled = false,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError("");

      // Validate inputs
      if (!amount || amount <= 0) {
        setError("Invalid amount");
        setLoading(false);
        return;
      }

      if (!paymentType || !["event", "subscription"].includes(paymentType)) {
        setError("Invalid payment type");
        setLoading(false);
        return;
      }

      if (!referenceId) {
        setError("Reference ID is required");
        setLoading(false);
        return;
      }

      // Load Razorpay SDK
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        setError("Failed to load payment gateway. Please try again.");
        setLoading(false);
        return;
      }

      // Create order on backend
      const { data: orderData } = await API.post("/payments/create-order", {
        amount,
        paymentType,
        referenceId,
        metadata,
        ...(coupon && { coupon }),
      });

      if (!orderData.success) {
        throw new Error(orderData.message || "Failed to create order");
      }

      const { orderId, key, paymentId } = orderData.data;

      // Get user info from localStorage/context
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : {};

      // Razorpay options
      const options = {
        key: key,
        amount: amount * 100, // Amount in paise
        currency: "INR",
        name: "K&M Events",
        description: `Payment for ${paymentType === "event" ? "Event Booking" : "Subscription"}`,
        order_id: orderId,
        prefill: {
          name: user.name || "",
          email: user.email || "",
          contact: user.phone || "",
        },
        theme: {
          color: "#4F46E5", // Indigo color
        },
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verifyData = await API.post("/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentId: paymentId,
            });

            if (verifyData.data.success) {
              setLoading(false);
              if (onSuccess) {
                onSuccess(verifyData.data);
              }
            } else {
              throw new Error("Payment verification failed");
            }
          } catch (err) {
            console.error("Payment verification error:", err);
            setError(err.response?.data?.message || "Payment verification failed");
            setLoading(false);
            if (onFailure) {
              onFailure(err);
            }
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setError("Payment cancelled");
          },
        },
        notes: {
          paymentType,
          referenceId,
        },
      };

      // Open Razorpay checkout
      const razorpayInstance = new window.Razorpay(options);
      
      razorpayInstance.on("payment.failed", async function (response) {
        console.error("Payment failed:", response.error);
        
        // Record failure on backend
        try {
          await API.post("/payments/failure", {
            orderId: orderId,
            errorCode: response.error.code,
            errorDescription: response.error.description,
          });
        } catch (err) {
          console.error("Failed to record payment failure:", err);
        }

        setError(response.error.description || "Payment failed");
        setLoading(false);

        if (onFailure) {
          onFailure(response.error);
        }
      });

      razorpayInstance.open();
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.response?.data?.message || err.message || "Payment failed");
      setLoading(false);

      if (onFailure) {
        onFailure(err);
      }
    }
  };

  return (
    <div className="razorpay-button-wrapper">
      <button
        onClick={handlePayment}
        disabled={disabled || loading}
        className={`
          px-6 py-3 rounded-lg font-semibold text-white
          ${
            disabled || loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }
          transition-colors duration-200
          flex items-center justify-center gap-2
          ${className}
        `}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            <span>{buttonText}</span>
          </>
        )}
      </button>

      {error && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
