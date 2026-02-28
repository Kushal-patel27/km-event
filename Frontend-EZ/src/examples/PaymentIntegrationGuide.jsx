/**
 * RAZORPAY PAYMENT INTEGRATION GUIDE
 * 
 * This file shows how to integrate Razorpay payment into:
 * 1. Event Booking Page
 * 2. Subscription Page
 */

import React, { useState } from "react";
import RazorpayButton from "../../components/payment/RazorpayButton";
import PaymentStatus from "../../components/payment/PaymentStatus";
import API from "../../services/api";

/* ========================================
   EXAMPLE 1: EVENT BOOKING WITH PAYMENT
   ======================================== */

export function BookingWithPayment() {
  const [bookingData, setBookingData] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

  const handleBookingFormSubmit = async (e) => {
    e.preventDefault();
    
    // Validate booking form...
    const quantity = 2;
    const ticketPrice = 500;
    const totalAmount = quantity * ticketPrice;

    // Prepare booking data
    const bookingData = {
      eventId: "event_123",
      quantity: quantity,
      ticketTypeId: "ticket_type_123",
      seats: [1, 2],
      totalAmount: totalAmount,
    };

    setBookingData(bookingData);
    setShowPayment(true); // Show payment button
  };

  const handlePaymentSuccess = async (paymentData) => {
    try {
      // Create booking after successful payment
      const response = await API.post("/bookings", {
        ...bookingData,
        paymentId: paymentData.data.paymentId,
        paymentStatus: "completed",
      });

      setPaymentStatus({
        status: "success",
        message: "Booking Confirmed!",
        bookingId: response.data.bookingId,
        transactionId: paymentData.data.paymentId,
      });
    } catch (error) {
      console.error("Booking creation failed:", error);
      alert("Payment successful but booking failed. Please contact support.");
    }
  };

  const handlePaymentFailure = (error) => {
    setPaymentStatus({
      status: "failed",
      message: "Payment Failed",
      error: error.message,
    });
  };

  if (paymentStatus) {
    return (
      <PaymentStatus
        status={paymentStatus.status}
        message={paymentStatus.message}
        paymentId={paymentStatus.bookingId}
        transactionId={paymentStatus.transactionId}
        amount={bookingData?.totalAmount}
        details={{ bookingId: paymentStatus.bookingId }}
        redirectUrl="/my-bookings"
        redirectText="View My Bookings"
        onRetry={() => setPaymentStatus(null)}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Book Event</h1>

      {!showPayment ? (
        <form onSubmit={handleBookingFormSubmit}>
          {/* Your booking form fields here */}
          <button type="submit" className="btn-primary">
            Continue to Payment
          </button>
        </form>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Complete Payment</h2>
          
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span>Quantity:</span>
              <span>{bookingData.quantity} tickets</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total Amount:</span>
              <span>₹{bookingData.totalAmount}</span>
            </div>
          </div>

          <RazorpayButton
            amount={bookingData.totalAmount}
            paymentType="event"
            referenceId={bookingData.eventId}
            metadata={{
              eventId: bookingData.eventId,
              eventName: "Sample Event",
              quantity: bookingData.quantity,
              ticketType: "General",
            }}
            onSuccess={handlePaymentSuccess}
            onFailure={handlePaymentFailure}
            buttonText={`Pay ₹${bookingData.totalAmount}`}
            className="w-full"
          />

          <button
            onClick={() => setShowPayment(false)}
            className="mt-4 text-gray-600 dark:text-gray-400 hover:text-indigo-600"
          >
            ← Back to Booking Form
          </button>
        </div>
      )}
    </div>
  );
}

/* ========================================
   EXAMPLE 2: SUBSCRIPTION WITH PAYMENT
   ======================================== */

export function SubscriptionWithPayment() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);

  const plans = [
    {
      _id: "plan_1",
      name: "Starter",
      monthlyFee: 999,
      commissionPercentage: 15,
      features: ["10 Events", "Basic Support"],
    },
    {
      _id: "plan_2",
      name: "Professional",
      monthlyFee: 2999,
      commissionPercentage: 10,
      features: ["50 Events", "Priority Support", "Analytics"],
    },
    {
      _id: "plan_3",
      name: "Enterprise",
      monthlyFee: 9999,
      commissionPercentage: 5,
      features: ["Unlimited Events", "24/7 Support", "Advanced Analytics"],
    },
  ];

  const handleSubscribe = (plan) => {
    setSelectedPlan(plan);
  };

  const handlePaymentSuccess = async (paymentData) => {
    try {
      // Update subscription status after successful payment
      // The backend already handles this in the payment controller
      setPaymentStatus({
        status: "success",
        message: "Subscription Activated!",
        subscriptionId: paymentData.data.subscriptionId,
        planName: selectedPlan.name,
      });
    } catch (error) {
      console.error("Subscription activation failed:", error);
    }
  };

  const handlePaymentFailure = (error) => {
    setPaymentStatus({
      status: "failed",
      message: "Payment Failed",
      error: error.message,
    });
    setSelectedPlan(null);
  };

  if (paymentStatus) {
    return (
      <PaymentStatus
        status={paymentStatus.status}
        message={paymentStatus.message}
        paymentId={paymentStatus.subscriptionId}
        amount={selectedPlan?.monthlyFee}
        details={{
          subscriptionId: paymentStatus.subscriptionId,
          planName: paymentStatus.planName,
        }}
        redirectUrl="/event-admin"
        redirectText="Go to Dashboard"
        onRetry={() => {
          setPaymentStatus(null);
          setSelectedPlan(null);
        }}
      />
    );
  }

  if (selectedPlan) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Subscribe to {selectedPlan.name}</h2>

          <div className="mb-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Monthly Fee:</span>
              <span className="font-bold text-xl">₹{selectedPlan.monthlyFee}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Commission:</span>
              <span>{selectedPlan.commissionPercentage}%</span>
            </div>
            <div className="border-t pt-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Features:</p>
              <ul className="space-y-1">
                {selectedPlan.features.map((feature, idx) => (
                  <li key={idx} className="text-sm">✓ {feature}</li>
                ))}
              </ul>
            </div>
          </div>

          <RazorpayButton
            amount={selectedPlan.monthlyFee}
            paymentType="subscription"
            referenceId={selectedPlan._id}
            metadata={{
              planId: selectedPlan._id,
              planName: selectedPlan.name,
            }}
            onSuccess={handlePaymentSuccess}
            onFailure={handlePaymentFailure}
            buttonText={`Subscribe for ₹${selectedPlan.monthlyFee}/month`}
            className="w-full"
          />

          <button
            onClick={() => setSelectedPlan(null)}
            className="mt-4 text-gray-600 dark:text-gray-400 hover:text-indigo-600 w-full"
          >
            ← Choose Different Plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Choose Your Plan</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan._id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col"
          >
            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
            <p className="text-3xl font-bold mb-4">
              ₹{plan.monthlyFee}
              <span className="text-sm text-gray-500">/month</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {plan.commissionPercentage}% commission on bookings
            </p>
            <ul className="space-y-2 mb-6 flex-grow">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe(plan)}
              className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
            >
              Subscribe Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ========================================
   EXAMPLE 3: SIMPLE ONE-STEP PAYMENT
   ======================================== */

export function SimplePaymentExample() {
  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Pay for Event</h2>

      <RazorpayButton
        amount={1500}
        paymentType="event"
        referenceId="event_123"
        metadata={{
          eventId: "event_123",
          eventName: "Concert 2024",
          quantity: 2,
        }}
        onSuccess={(data) => {
          console.log("Payment successful:", data);
          alert("Payment successful! Booking created.");
        }}
        onFailure={(error) => {
          console.error("Payment failed:", error);
          alert("Payment failed. Please try again.");
        }}
        buttonText="Pay ₹1,500"
      />
    </div>
  );
}

/* ========================================
   USAGE IN EXISTING PAGES
   ======================================== */

/**
 * To integrate into existing Booking.jsx:
 * 
 * 1. Import components:
 *    import RazorpayButton from '../../components/payment/RazorpayButton';
 *    import PaymentStatus from '../../components/payment/PaymentStatus';
 * 
 * 2. Add state:
 *    const [showPayment, setShowPayment] = useState(false);
 *    const [paymentComplete, setPaymentComplete] = useState(false);
 * 
 * 3. Modify handleSubmit:
 *    - Instead of creating booking immediately
 *    - Set showPayment = true
 *    - Store booking data in state
 * 
 * 4. Add RazorpayButton component:
 *    {showPayment && (
 *      <RazorpayButton
 *        amount={finalTotal}
 *        paymentType="event"
 *        referenceId={event.id}
 *        metadata={{ eventId: event.id, quantity, eventName: event.title }}
 *        onSuccess={handlePaymentSuccess}
 *        onFailure={handlePaymentFailure}
 *      />
 *    )}
 * 
 * 5. In handlePaymentSuccess:
 *    - Call the backend booking API
 *    - Include payment reference
 *    - Navigate to success page
 */

/**
 * Backend Changes Needed:
 * 
 * 1. Install Razorpay package:
 *    npm install razorpay
 * 
 * 2. Add to .env:
 *    RAZORPAY_KEY_ID=rzp_test_xxxxx
 *    RAZORPAY_KEY_SECRET=xxxxx
 * 
 * 3. API routes already created:
 *    POST /api/payments/create-order
 *    POST /api/payments/verify
 *    GET  /api/payments/my-payments
 * 
 * 4. Update Booking controller:
 *    - Accept paymentId in booking creation
 *    - Mark booking as completed only after payment
 */
