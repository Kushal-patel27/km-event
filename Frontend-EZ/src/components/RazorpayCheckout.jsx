import React, { useState, useEffect } from 'react';
import API from '../services/api';

export default function RazorpayCheckout({
  bookingId,
  onPaymentSuccess,
  onPaymentFailure,
  isOpen,
  onClose
}) {
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState('');

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Create payment order
  const handleCreateOrder = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await API.post('/payments/order', {
        bookingId
      });

      setOrderData(response.data);
      await initiatePayment(response.data);
    } catch (err) {
      const apiMsg = err.response?.data?.message;
      const apiDetail = err.response?.data?.error;
      const message = apiDetail ? `${apiMsg || 'Payment failed'}: ${apiDetail}` : (apiMsg || err.message);
      setError(message);
      onPaymentFailure && onPaymentFailure(message);
    } finally {
      setLoading(false);
    }
  };

  // Initiate Razorpay payment
  const initiatePayment = async (order) => {
    if (!window.Razorpay) {
      setError('Razorpay SDK not loaded. Please try again.');
      return;
    }

    const options = {
      key: order.key,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: 'KM Event Management',
      description: 'Event Ticket Booking',
      image: '/logo.png',
      prefill: {
        name: order.user?.name || '',
        email: order.user?.email || '',
        contact: order.user?.contact || ''
      },
      handler: handlePaymentSuccess,
      modal: {
        ondismiss: () => {
          onClose && onClose();
        }
      },
      timeout: 900,
      retry: {
        enabled: true,
        max_count: 1
      },
      notes: {
        bookingId,
        orderId: order.orderId
      }
    };

    try {
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setError('Failed to open payment gateway');
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = async (response) => {
    try {
      setLoading(true);
      setError('');

      // Verify payment on backend
      const verifyResponse = await API.post('/payments/verify', {
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
        bookingId
      });

      if (verifyResponse.data.success) {
        onPaymentSuccess && onPaymentSuccess(verifyResponse.data.payment);
        onClose && onClose();
      } else {
        setError('Payment verification failed');
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      setError(message);
      onPaymentFailure && onPaymentFailure(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Payment Checkout
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
            {error}
          </div>
        )}

        {orderData && (
          <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded">
            <p className="text-sm">
              Amount: ₹{(orderData.amount / 100).toLocaleString('en-IN')}
            </p>
            <p className="text-xs mt-1">Secure payment powered by Razorpay</p>
          </div>
        )}

        {!orderData ? (
          <button
            onClick={handleCreateOrder}
            disabled={loading}
            className={`w-full py-2 px-4 rounded font-semibold text-white transition ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }`}
          >
            {loading ? 'Creating Order...' : 'Proceed to Payment'}
          </button>
        ) : (
          <button
            onClick={() => initiatePayment(orderData)}
            disabled={loading}
            className={`w-full py-2 px-4 rounded font-semibold text-white transition ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
            }`}
          >
            {loading ? 'Processing...' : 'Pay with Razorpay'}
          </button>
        )}

        <button
          onClick={onClose}
          disabled={loading}
          className="w-full mt-2 py-2 px-4 rounded font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Cancel
        </button>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
          Your payment is secure and encrypted
        </p>
      </div>
    </div>
  );
}
