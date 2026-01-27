import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";
import Event from "../models/Event.js";

// Get payment analytics dashboard
export const getPaymentAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, eventId, status } = req.query;

    let query = {};

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (eventId) query.event = eventId;
    if (status) query.status = status;

    // Get payments
    const payments = await Payment.find(query)
      .populate("user", "name email")
      .populate("event", "title")
      .populate("booking", "quantity ticketType")
      .sort({ createdAt: -1 });

    // Calculate analytics
    const analytics = {
      totalPayments: payments.length,
      totalRevenue: 0,
      successfulPayments: 0,
      failedPayments: 0,
      refundedAmount: 0,
      averageOrderValue: 0,
      paymentsByStatus: {},
      paymentsByMethod: {},
      refunds: [],
      topEvents: []
    };

    const eventRevenue = {};

    payments.forEach(payment => {
      analytics.totalRevenue += payment.amount || 0;

      if (payment.status === "captured") {
        analytics.successfulPayments += 1;
      } else if (payment.status === "failed") {
        analytics.failedPayments += 1;
      }

      if (payment.refund) {
        analytics.refundedAmount += payment.refund.amount || 0;
        analytics.refunds.push({
          paymentId: payment._id,
          refundId: payment.refund.refundId,
          amount: payment.refund.amount,
          status: payment.refund.status,
          processedAt: payment.refund.processedAt
        });
      }

      // Status breakdown
      if (!analytics.paymentsByStatus[payment.status]) {
        analytics.paymentsByStatus[payment.status] = 0;
      }
      analytics.paymentsByStatus[payment.status] += 1;

      // Method breakdown
      const method = payment.method || "razorpay";
      if (!analytics.paymentsByMethod[method]) {
        analytics.paymentsByMethod[method] = 0;
      }
      analytics.paymentsByMethod[method] += 1;

      // Event revenue
      const eventTitle = payment.event?.title || "Unknown";
      if (!eventRevenue[eventTitle]) {
        eventRevenue[eventTitle] = 0;
      }
      eventRevenue[eventTitle] += payment.amount || 0;
    });

    analytics.averageOrderValue = analytics.successfulPayments > 0
      ? analytics.totalRevenue / analytics.successfulPayments
      : 0;

    // Top events
    analytics.topEvents = Object.entries(eventRevenue)
      .map(([eventTitle, revenue]) => ({ eventTitle, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    res.json({
      success: true,
      analytics,
      payments: payments.slice(0, 50) // Latest 50 transactions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get detailed payment report
export const getPaymentReport = async (req, res) => {
  try {
    const { format, startDate, endDate } = req.query;

    let query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const payments = await Payment.find(query)
      .populate("user", "name email phone")
      .populate("event", "title date")
      .populate("booking", "quantity ticketType status")
      .sort({ createdAt: -1 });

    if (format === "csv") {
      let csv = "Payment ID,User,Email,Event,Amount,Status,Method,Date\n";
      payments.forEach(p => {
        csv += `${p._id},"${p.user?.name || 'N/A'}","${p.user?.email || 'N/A'}","${p.event?.title || 'N/A'}",${p.amount},${p.status},${p.method},${p.createdAt.toISOString()}\n`;
      });
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="payment_report.csv"');
      res.send(csv);
    } else {
      res.json({
        success: true,
        count: payments.length,
        payments
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get refund requests
export const getRefundRequests = async (req, res) => {
  try {
    const refunds = await Payment.find({
      "refund.status": { $in: ["pending", "processed", "failed"] }
    })
      .populate("user", "name email phone")
      .populate("event", "title")
      .populate("booking", "quantity totalAmount")
      .sort({ "refund.requestedAt": -1 });

    res.json({
      success: true,
      count: refunds.length,
      refunds
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update refund status manually
export const updateRefundStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status, reason } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (!payment.refund) {
      return res.status(400).json({ message: "No refund for this payment" });
    }

    payment.refund.status = status;
    if (reason) payment.refund.reason = reason;
    if (status === "processed") {
      payment.refund.processedAt = new Date();
    }
    await payment.save();

    res.json({
      success: true,
      message: "Refund status updated",
      refund: payment.refund
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get payment disputes/failed transactions
export const getFailedPayments = async (req, res) => {
  try {
    const failed = await Payment.find({
      status: "failed"
    })
      .populate("user", "name email phone")
      .populate("event", "title")
      .populate("booking", "quantity totalAmount")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: failed.length,
      payments: failed
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Retry failed payment verification
export const retryPaymentVerification = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.status === "captured") {
      return res.status(400).json({ message: "Payment already captured" });
    }

    payment.verificationAttempts += 1;
    payment.lastVerificationAt = new Date();

    if (payment.verificationAttempts > 3) {
      payment.status = "failed";
      payment.errorDescription = "Max verification attempts exceeded";
    }

    await payment.save();

    res.json({
      success: true,
      message: "Verification retry triggered",
      payment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
