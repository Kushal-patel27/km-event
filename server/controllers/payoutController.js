import Payout from "../models/Payout.js";
import Commission from "../models/Commission.js";
import OrganizerSubscription from "../models/OrganizerSubscription.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import EventAdminPayout from "../models/EventAdminPayout.js";
import mongoose from "mongoose";

const buildEventAdminPendingData = async (eventAdminId) => {
  const eventAdmin = await User.findById(eventAdminId).select("assignedEvents");
  let eventIds = Array.isArray(eventAdmin?.assignedEvents) ? eventAdmin.assignedEvents : [];

  if (eventIds.length === 0) {
    const events = await Event.find({ organizer: eventAdminId }).select("_id");
    eventIds = events.map(event => event._id);
  }

  if (eventIds.length === 0) {
    return {
      eventIds: [],
      pendingAmount: 0,
      commissionAmount: 0,
      commissionCount: 0,
      ticketCount: 0
    };
  }

  const commissionResult = await Commission.aggregate([
    {
      $match: {
        event: { $in: eventIds },
        status: { $in: ["pending", "allocated"] }
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$organizerAmount" },
        totalCommissionAmount: { $sum: "$commissionAmount" },
        totalCommissions: { $sum: 1 },
        totalTickets: { $sum: "$quantity" }
      }
    }
  ]);

  let data = commissionResult[0] || {
    totalAmount: 0,
    totalCommissionAmount: 0,
    totalCommissions: 0,
    totalTickets: 0
  };

  if (data.totalAmount === 0) {
    const bookings = await Booking.find({
      event: { $in: eventIds },
      status: "confirmed"
    }).select("event quantity totalAmount createdAt");

    if (bookings.length > 0) {
      const eventsWithOrganizers = await Event.find({ _id: { $in: eventIds } })
        .select("_id organizer");
      const eventMap = new Map(
        eventsWithOrganizers.map(event => [event._id.toString(), event])
      );

      const organizerIds = Array.from(
        new Set(
          eventsWithOrganizers
            .map(event => event.organizer?.toString())
            .filter(Boolean)
        )
      );

      const subscriptions = await OrganizerSubscription.find({ organizer: { $in: organizerIds } })
        .select("organizer currentCommissionPercentage");
      const organizerRateMap = new Map(
        subscriptions.map(sub => [sub.organizer.toString(), sub.currentCommissionPercentage])
      );

      const defaultCommissionPercentage = 30;
      let totalAmount = 0;
      let totalCommissionAmount = 0;
      let totalCommissions = 0;
      let totalTickets = 0;

      bookings.forEach(booking => {
        const eventId = booking.event?.toString();
        const eventInfo = eventMap.get(eventId);
        const organizerId = eventInfo?.organizer?.toString();
        const commissionRate = organizerRateMap.get(organizerId) ?? defaultCommissionPercentage;
        const revenue = Number(booking.totalAmount) || 0;
        const tickets = Number(booking.quantity) || 0;
        const commissionAmount = (revenue * commissionRate) / 100;
        const payoutAmount = revenue - commissionAmount;

        totalAmount += payoutAmount;
        totalCommissionAmount += commissionAmount;
        totalCommissions += 1;
        totalTickets += tickets;
      });

      data = {
        totalAmount,
        totalCommissionAmount,
        totalCommissions,
        totalTickets
      };
    }
  }

  const completedPayouts = await EventAdminPayout.aggregate([
    {
      $match: {
        eventAdmin: new mongoose.Types.ObjectId(eventAdminId),
        status: "completed"
      }
    },
    {
      $group: {
        _id: null,
        totalPaid: { $sum: "$totalAmount" }
      }
    }
  ]);

  const totalPaid = completedPayouts[0]?.totalPaid || 0;
  const adjustedPending = Math.max(0, data.totalAmount - totalPaid);

  return {
    eventIds,
    pendingAmount: adjustedPending,
    commissionAmount: data.totalCommissionAmount || 0,
    commissionCount: data.totalCommissions,
    ticketCount: data.totalTickets
  };
};

// ==================== PAYOUT MANAGEMENT ====================

// Request payout (Organizer)
export const requestPayout = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const { paymentMethod, amount, payoutType, bankDetails, upiId, walletId } = req.body;

    if (payoutType === "event_admin") {
      const minPayoutAmount = 100;
      const pendingData = await buildEventAdminPendingData(organizerId);

      if (!pendingData.eventIds || pendingData.eventIds.length === 0) {
        return res.status(400).json({ message: "No events available for payout" });
      }

      if (amount < minPayoutAmount) {
        return res.status(400).json({
          message: `Minimum payout amount is ₹${minPayoutAmount}. Current pending: ₹${amount}`
        });
      }

      if (amount > pendingData.pendingAmount) {
        return res.status(400).json({
          message: `Requested amount exceeds available balance. Available: ₹${pendingData.pendingAmount}`
        });
      }

      if (paymentMethod === "bank_transfer" && (!bankDetails?.accountNumber || !bankDetails?.ifscCode)) {
        return res.status(400).json({ message: "Please provide bank details" });
      }

      if (paymentMethod === "upi" && !upiId) {
        return res.status(400).json({ message: "Please provide UPI ID" });
      }

      if (paymentMethod === "wallet" && !walletId) {
        return res.status(400).json({ message: "Please provide wallet details" });
      }

      const payout = new EventAdminPayout({
        eventAdmin: organizerId,
        eventIds: pendingData.eventIds,
        totalAmount: amount,
        commissionAmount: pendingData.commissionAmount,
        commissionCount: pendingData.commissionCount,
        ticketCount: pendingData.ticketCount,
        paymentMethod,
        upiId: paymentMethod === "upi" ? upiId : undefined,
        walletId: paymentMethod === "wallet" ? walletId : undefined,
        bankDetails: paymentMethod === "bank_transfer" ? bankDetails : undefined,
        status: "pending",
        requestedAt: new Date()
      });

      await payout.save();

      return res.status(201).json({
        success: true,
        message: "Event admin payout request submitted successfully",
        data: payout
      });
    }

    // Get organizer's subscription
    const subscription = await OrganizerSubscription.findOne({ organizer: organizerId })
      .populate("plan");
    const minPayoutAmount = subscription?.plan?.minPayoutAmount ?? 100;
    const payoutFrequency = subscription?.plan?.payoutFrequency || "monthly";

    if (["daily", "weekly", "monthly"].includes(payoutFrequency)) {
      const lastPayout = await Payout.findOne({ organizer: organizerId })
        .sort({ requestedAt: -1 })
        .select("requestedAt");

      if (lastPayout?.requestedAt) {
        const now = new Date();
        const nextEligibleAt = new Date(lastPayout.requestedAt);
        const daysToAdd = payoutFrequency === "daily" ? 1 : payoutFrequency === "weekly" ? 7 : 30;
        nextEligibleAt.setDate(nextEligibleAt.getDate() + daysToAdd);

        if (now < nextEligibleAt) {
          return res.status(400).json({
            message: `Payouts are ${payoutFrequency}. Next eligible date: ${nextEligibleAt.toDateString()}.`
          });
        }
      }
    }

    if (amount < minPayoutAmount) {
      return res.status(400).json({
        message: `Minimum payout amount is ₹${minPayoutAmount}. Current pending: ₹${amount}`
      });
    }

    // Get pending commissions
    const pendingCommissions = await Commission.find({
      organizer: organizerId,
      status: { $in: ["pending", "allocated"] }
    });

    if (pendingCommissions.length === 0) {
      return res.status(400).json({ message: "No commissions available for payout" });
    }

    const totalAmount = pendingCommissions.reduce((sum, c) => sum + c.organizerAmount, 0);

    if (amount > totalAmount) {
      return res.status(400).json({
        message: `Requested amount exceeds available balance. Available: ₹${totalAmount}`
      });
    }

    // Create payout record
    const payout = new Payout({
      organizer: organizerId,
      commissions: pendingCommissions.map(c => c._id),
      totalAmount: amount,
      commissionCount: pendingCommissions.length,
      paymentMethod,
      bankDetails: paymentMethod === "bank_transfer" ? bankDetails : undefined,
      status: "pending",
      requestedAt: new Date()
    });

    await payout.save();

    // Update commission status to allocated
    await Commission.updateMany(
      { _id: { $in: pendingCommissions.map(c => c._id) } },
      { status: "allocated", payoutId: payout._id }
    );

    res.status(201).json({
      success: true,
      message: "Payout request submitted successfully",
      data: payout
    });
  } catch (error) {
    console.error("Error requesting payout:", error);
    res.status(500).json({ message: "Failed to request payout", error: error.message });
  }
};

// Get payouts for organizer
export const getOrganizerPayouts = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { organizer: organizerId };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const payouts = await Payout.find(query)
      .populate("commissions")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ requestedAt: -1 });

    const total = await Payout.countDocuments(query);

    // Get summary
    const summary = await Payout.aggregate([
      { $match: { organizer: new mongoose.Types.ObjectId(organizerId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" }
        }
      }
    ]);

    res.json({
      success: true,
      data: payouts,
      summary: summary,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching payouts:", error);
    res.status(500).json({ message: "Failed to fetch payouts", error: error.message });
  }
};

// Get all payouts (Admin)
export const getAllPayouts = async (req, res) => {
  try {
    const { organizerId, status, page = 1, limit = 10, fromDate, toDate } = req.query;

    const query = {};
    if (organizerId) query.organizer = organizerId;
    if (status) query.status = status;

    if (fromDate || toDate) {
      query.requestedAt = {};
      if (fromDate) query.requestedAt.$gte = new Date(fromDate);
      if (toDate) query.requestedAt.$lte = new Date(toDate);
    }

    const skip = (page - 1) * limit;

    const payouts = await Payout.find(query)
      .populate("organizer", "name email")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ requestedAt: -1 });

    const total = await Payout.countDocuments(query);

    // Get summary
    const summary = await Payout.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" }
        }
      }
    ]);

    res.json({
      success: true,
      data: payouts,
      summary: summary,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching payouts:", error);
    res.status(500).json({ message: "Failed to fetch payouts", error: error.message });
  }
};

// Update payout status (Admin)
export const updatePayoutStatus = async (req, res) => {
  try {
    const { payoutId } = req.params;
    const { status, transactionId, failureReason, notes } = req.body;

    const validStatuses = ["pending", "processing", "completed", "failed", "reversed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const payout = await Payout.findByIdAndUpdate(
      payoutId,
      {
        status,
        transactionId: status === "completed" ? transactionId : undefined,
        failureReason: status === "failed" ? failureReason : undefined,
        processedAt: ["processing", "completed", "failed"].includes(status) ? Date.now() : undefined,
        completedAt: status === "completed" ? Date.now() : undefined,
        notes
      },
      { new: true }
    ).populate("organizer");

    if (!payout) {
      return res.status(404).json({ message: "Payout not found" });
    }

    // Update commission status based on payout status
    if (status === "completed") {
      await Commission.updateMany(
        { _id: { $in: payout.commissions } },
        { status: "paid" }
      );
    } else if (status === "failed" || status === "reversed") {
      await Commission.updateMany(
        { _id: { $in: payout.commissions } },
        { status: "allocated" }
      );
    }

    res.json({
      success: true,
      message: "Payout status updated successfully",
      data: payout
    });
  } catch (error) {
    console.error("Error updating payout status:", error);
    res.status(500).json({ message: "Failed to update payout status", error: error.message });
  }
};

// Get pending payout amount for organizer
export const getPendingPayoutAmount = async (req, res) => {
  try {
    const organizerId = req.user.id;

    const result = await Commission.aggregate([
      {
        $match: {
          organizer: new mongoose.Types.ObjectId(organizerId),
          status: { $in: ["pending", "allocated"] }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$organizerAmount" },
          totalCommissionAmount: { $sum: "$commissionAmount" },
          totalCommissions: { $sum: 1 },
          totalTickets: { $sum: "$quantity" }
        }
      }
    ]);

    const data = result[0] || {
      totalAmount: 0,
      totalCommissionAmount: 0,
      totalCommissions: 0,
      totalTickets: 0
    };

    // Get subscription for min payout info
    const subscription = await OrganizerSubscription.findOne({ organizer: organizerId })
      .populate("plan");

    res.json({
      success: true,
      pendingAmount: data.totalAmount,
      commissionCount: data.totalCommissions,
      commissionAmount: data.totalCommissionAmount,
      ticketCount: data.totalTickets,
      minPayoutAmount: subscription?.plan?.minPayoutAmount || 100,
      canRequestPayout: data.totalAmount >= (subscription?.plan?.minPayoutAmount || 100)
    });
  } catch (error) {
    console.error("Error calculating pending payout:", error);
    res.status(500).json({ message: "Failed to calculate pending payout", error: error.message });
  }
};

// Get pending payout amount for event admin (assigned events)
export const getEventAdminPendingPayoutAmount = async (req, res) => {
  try {
    const eventAdminId = req.user.id;
    const pendingData = await buildEventAdminPendingData(eventAdminId);

    res.json({
      success: true,
      pendingAmount: pendingData.pendingAmount,
      commissionCount: pendingData.commissionCount,
      commissionAmount: pendingData.commissionAmount || 0,
      ticketCount: pendingData.ticketCount,
      minPayoutAmount: 100,
      canRequestPayout: pendingData.pendingAmount >= 100
    });
  } catch (error) {
    console.error("Error calculating event admin pending payout:", error);
    res.status(500).json({ message: "Failed to calculate pending payout", error: error.message });
  }
};

export const getEventAdminPayouts = async (req, res) => {
  try {
    const { eventAdminId, status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (eventAdminId) query.eventAdmin = eventAdminId;
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const payouts = await EventAdminPayout.find(query)
      .populate("eventAdmin", "name email")
      .populate("eventIds", "title")
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await EventAdminPayout.countDocuments(query);

    const summary = await EventAdminPayout.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" }
        }
      }
    ]);

    res.json({
      success: true,
      data: payouts,
      summary,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching event admin payouts:", error);
    res.status(500).json({ message: "Failed to fetch event admin payouts", error: error.message });
  }
};

export const getMyEventAdminPayouts = async (req, res) => {
  try {
    const eventAdminId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;
    const query = { eventAdmin: eventAdminId };

    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const payouts = await EventAdminPayout.find(query)
      .populate("eventIds", "title")
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await EventAdminPayout.countDocuments(query);

    const summary = await EventAdminPayout.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" }
        }
      }
    ]);

    res.json({
      success: true,
      data: payouts,
      summary,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching event admin payout history:", error);
    res.status(500).json({ message: "Failed to fetch event admin payout history", error: error.message });
  }
};

export const updateEventAdminPayoutStatus = async (req, res) => {
  try {
    const { payoutId } = req.params;
    const { status, transactionId, failureReason, notes } = req.body;

    const validStatuses = ["pending", "processing", "completed", "failed", "reversed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const payout = await EventAdminPayout.findByIdAndUpdate(
      payoutId,
      {
        status,
        transactionId: status === "completed" ? transactionId : undefined,
        failureReason: status === "failed" ? failureReason : undefined,
        processedAt: ["processing", "completed", "failed"].includes(status) ? Date.now() : undefined,
        completedAt: status === "completed" ? Date.now() : undefined,
        notes
      },
      { new: true }
    ).populate("eventAdmin", "name email");

    if (!payout) {
      return res.status(404).json({ message: "Event admin payout not found" });
    }

    res.json({
      success: true,
      message: "Event admin payout status updated successfully",
      data: payout
    });
  } catch (error) {
    console.error("Error updating event admin payout status:", error);
    res.status(500).json({ message: "Failed to update event admin payout status", error: error.message });
  }
};

export default {
  requestPayout,
  getOrganizerPayouts,
  getAllPayouts,
  updatePayoutStatus,
  getPendingPayoutAmount,
  getEventAdminPendingPayoutAmount,
  getEventAdminPayouts,
  getMyEventAdminPayouts,
  updateEventAdminPayoutStatus
};
