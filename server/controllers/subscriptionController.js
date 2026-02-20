import SubscriptionPlan from "../models/SubscriptionPlan.js";
import OrganizerSubscription from "../models/OrganizerSubscription.js";
import Commission from "../models/Commission.js";
import Payout from "../models/Payout.js";
import User from "../models/User.js";
import Event from "../models/Event.js";
import Booking from "../models/Booking.js";

// ==================== PLAN MANAGEMENT ====================

// Get all subscription plans
export const getAllPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find()
      .sort({ displayOrder: 1 });
    
    res.json({
      success: true,
      data: plans,
      total: plans.length
    });
  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(500).json({ message: "Failed to fetch plans", error: error.message });
  }
};

// Create a new subscription plan
export const createPlan = async (req, res) => {
  try {
    const { name, description, commissionPercentage, features, monthlyFee, eventLimit, ticketLimit, payoutFrequency, minPayoutAmount, displayOrder } = req.body;

    // Check if plan with same name exists
    const existingPlan = await SubscriptionPlan.findOne({ name });
    if (existingPlan) {
      return res.status(400).json({ message: `Plan with name '${name}' already exists` });
    }

    const plan = new SubscriptionPlan({
      name,
      description,
      commissionPercentage,
      features,
      monthlyFee,
      eventLimit,
      ticketLimit,
      payoutFrequency,
      minPayoutAmount,
      displayOrder
    });

    await plan.save();
    
    res.status(201).json({
      success: true,
      message: "Plan created successfully",
      data: plan
    });
  } catch (error) {
    console.error("Error creating plan:", error);
    res.status(500).json({ message: "Failed to create plan", error: error.message });
  }
};

// Update a subscription plan
export const updatePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const updates = req.body;

    // Validate commission percentage
    if (updates.commissionPercentage !== undefined) {
      if (updates.commissionPercentage < 0 || updates.commissionPercentage > 100) {
        return res.status(400).json({ message: "Commission percentage must be between 0 and 100" });
      }
    }

    const plan = await SubscriptionPlan.findByIdAndUpdate(
      planId,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res.json({
      success: true,
      message: "Plan updated successfully",
      data: plan
    });
  } catch (error) {
    console.error("Error updating plan:", error);
    res.status(500).json({ message: "Failed to update plan", error: error.message });
  }
};

// Delete a subscription plan
export const deletePlan = async (req, res) => {
  try {
    const { planId } = req.params;

    // Check if any organizers are using this plan
    const activeSubscriptions = await OrganizerSubscription.countDocuments({
      plan: planId,
      status: "active"
    });

    if (activeSubscriptions > 0) {
      return res.status(400).json({
        message: `Cannot delete plan with ${activeSubscriptions} active subscribers. Please reassign them first.`
      });
    }

    const plan = await SubscriptionPlan.findByIdAndDelete(planId);

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res.json({
      success: true,
      message: "Plan deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting plan:", error);
    res.status(500).json({ message: "Failed to delete plan", error: error.message });
  }
};

// ==================== ORGANIZER SUBSCRIPTION ====================

// Assign/Change subscription plan for an organizer
export const assignPlanToOrganizer = async (req, res) => {
  try {
    const { organizerId, planId } = req.body;

    // Validate organizer exists
    const organizer = await User.findById(organizerId);
    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    // Validate plan exists
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    // Check if organizer already has a subscription
    let subscription = await OrganizerSubscription.findOne({ organizer: organizerId });

    if (subscription) {
      // Update existing subscription
      subscription.plan = planId;
      subscription.currentCommissionPercentage = plan.commissionPercentage;
      subscription.status = "active";
      subscription.cancelledAt = null;
      subscription.cancelReason = null;
    } else {
      // Create new subscription
      subscription = new OrganizerSubscription({
        organizer: organizerId,
        plan: planId,
        currentCommissionPercentage: plan.commissionPercentage,
        status: "active"
      });
    }

    await subscription.save();
    await subscription.populate("plan");

    res.json({
      success: true,
      message: "Plan assigned successfully",
      data: subscription
    });
  } catch (error) {
    console.error("Error assigning plan:", error);
    res.status(500).json({ message: "Failed to assign plan", error: error.message });
  }
};

// Get organizer's current subscription
export const getOrganizerSubscription = async (req, res) => {
  try {
    const organizerId = req.user.id;

    const subscription = await OrganizerSubscription.findOne({ organizer: organizerId })
      .populate("plan");

    if (!subscription) {
      const fallbackSubscribedAt = req.user?.createdAt || new Date();
      // Return default free plan
      return res.json({
        success: true,
        data: {
          organizer: organizerId,
          subscribedAt: fallbackSubscribedAt,
          plan: {
            name: "Free",
            description: "Free plan",
            commissionPercentage: 30,
            features: []
          },
          currentCommissionPercentage: 30,
          status: "active"
        }
      });
    }

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error("Error fetching organizer subscription:", error);
    res.status(500).json({ message: "Failed to fetch subscription", error: error.message });
  }
};

// Get all organizer subscriptions (Admin)
export const getAllOrganizerSubscriptions = async (req, res) => {
  try {
    const { status, planId, page = 1, limit = 10, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (planId) query.plan = planId;

    if (search) {
      const searchRegex = new RegExp(search, "i");
      const organizers = await User.find({ name: searchRegex }).select("_id");
      query.organizer = { $in: organizers.map(o => o._id) };
    }

    const skip = (page - 1) * limit;

    const subscriptions = await OrganizerSubscription.find(query)
      .populate("organizer", "name email")
      .populate("plan")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await OrganizerSubscription.countDocuments(query);

    const organizerIds = subscriptions
      .map(sub => sub.organizer?._id)
      .filter(Boolean);

    const commissionTotals = organizerIds.length > 0
      ? await Commission.aggregate([
          { $match: { organizer: { $in: organizerIds } } },
          {
            $group: {
              _id: "$organizer",
              totalRevenue: { $sum: "$subtotal" },
              totalTickets: { $sum: "$quantity" }
            }
          }
        ])
      : [];

    let revenueMap = new Map(
      commissionTotals.map(row => [row._id.toString(), row])
    );

    if (revenueMap.size === 0 && organizerIds.length > 0) {
      const bookingTotals = await Booking.aggregate([
        { $match: { status: "confirmed" } },
        {
          $lookup: {
            from: "events",
            localField: "event",
            foreignField: "_id",
            as: "event"
          }
        },
        { $unwind: "$event" },
        { $match: { "event.organizer": { $in: organizerIds } } },
        {
          $group: {
            _id: "$event.organizer",
            totalRevenue: { $sum: "$totalAmount" },
            totalTickets: { $sum: "$quantity" }
          }
        }
      ]);

      revenueMap = new Map(
        bookingTotals.map(row => [row._id.toString(), row])
      );
    }

    const enrichedSubscriptions = subscriptions.map(sub => {
      const key = sub.organizer?._id?.toString();
      const totals = key ? revenueMap.get(key) : null;
      return {
        ...sub.toObject(),
        totalRevenue: totals?.totalRevenue || 0,
        totalTicketsSold: totals?.totalTickets || 0
      };
    });

    res.json({
      success: true,
      data: enrichedSubscriptions,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching organizer subscriptions:", error);
    res.status(500).json({ message: "Failed to fetch subscriptions", error: error.message });
  }
};

// Update organizer subscription status
export const updateSubscriptionStatus = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { status, cancelReason, notes } = req.body;

    const validStatuses = ["active", "inactive", "suspended", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const subscription = await OrganizerSubscription.findByIdAndUpdate(
      subscriptionId,
      {
        status,
        cancelReason: status === "cancelled" ? cancelReason : undefined,
        cancelledAt: status === "cancelled" ? Date.now() : undefined,
        notes
      },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error("Error updating subscription status:", error);
    res.status(500).json({ message: "Failed to update subscription status", error: error.message });
  }
};

// ==================== COMMISSION TRACKING ====================

// Create commission record (called after successful booking)
export const createCommission = async (req, res) => {
  try {
    const { bookingId, eventId, organizerId, ticketPrice, quantity, commissionPercentage } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const subtotal = ticketPrice * quantity;
    const commissionAmount = (subtotal * commissionPercentage) / 100;
    const organizerAmount = subtotal - commissionAmount;

    const commission = new Commission({
      booking: bookingId,
      event: eventId,
      organizer: organizerId,
      ticketPrice,
      quantity,
      subtotal,
      commissionPercentage,
      commissionAmount,
      organizerAmount,
      platformAmount: commissionAmount,
      status: "pending"
    });

    await commission.save();

    // Update booking with commission details
    await Booking.findByIdAndUpdate(bookingId, {
      $set: {
        "commission.commissionPercentage": commissionPercentage,
        "commission.commissionAmount": commissionAmount,
        "commission.organizerAmount": organizerAmount,
        "commission.platformAmount": commissionAmount,
        commissionId: commission._id
      }
    });

    res.status(201).json({
      success: true,
      message: "Commission created successfully",
      data: commission
    });
  } catch (error) {
    console.error("Error creating commission:", error);
    res.status(500).json({ message: "Failed to create commission", error: error.message });
  }
};

// Get commissions for an organizer
export const getOrganizerCommissions = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const { status, eventId, page = 1, limit = 10, fromDate, toDate } = req.query;

    const query = { organizer: organizerId };
    if (status) query.status = status;
    if (eventId) query.event = eventId;

    // Date range filter
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    const skip = (page - 1) * limit;

    const commissions = await Commission.find(query)
      .populate("event", "title date")
      .populate("booking", "ticketType quantity")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Commission.countDocuments(query);

    // Calculate summary
    const summary = await Commission.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalTickets: { $sum: "$quantity" },
          totalRevenue: { $sum: "$subtotal" },
          totalCommission: { $sum: "$commissionAmount" },
          totalOrganizerAmount: { $sum: "$organizerAmount" },
          totalBookings: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: commissions,
      summary: summary[0] || {
        totalTickets: 0,
        totalRevenue: 0,
        totalCommission: 0,
        totalOrganizerAmount: 0,
        totalBookings: 0
      },
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching commissions:", error);
    res.status(500).json({ message: "Failed to fetch commissions", error: error.message });
  }
};

// Get all commissions (Admin)
export const getAllCommissions = async (req, res) => {
  try {
    const { organizerId, eventId, status, page = 1, limit = 10, fromDate, toDate } = req.query;

    const query = {};
    if (organizerId) query.organizer = organizerId;
    if (eventId) query.event = eventId;
    if (status) query.status = status;

    // Date range filter
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    const skip = (page - 1) * limit;

    const commissions = await Commission.find(query)
      .populate("organizer", "name email")
      .populate("event", "title date")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Commission.countDocuments(query);

    // Calculate summary
    const summary = await Commission.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalTickets: { $sum: "$quantity" },
          totalRevenue: { $sum: "$subtotal" },
          totalCommission: { $sum: "$commissionAmount" },
          totalOrganizerAmount: { $sum: "$organizerAmount" },
          totalPlatformAmount: { $sum: "$platformAmount" },
          totalBookings: { $sum: 1 }
        }
      }
    ]);

    if (total === 0) {
      const dateQuery = {};
      if (fromDate) dateQuery.$gte = new Date(fromDate);
      if (toDate) dateQuery.$lte = new Date(toDate);

      let bookingMatch = {
        status: status || "confirmed",
        ...(Object.keys(dateQuery).length ? { createdAt: dateQuery } : {})
      };

      if (eventId) {
        bookingMatch.event = eventId;
      }

      if (organizerId && !eventId) {
        const organizerEvents = await Event.find({ organizer: organizerId }).select("_id");
        bookingMatch.event = { $in: organizerEvents.map(e => e._id) };
      }

      const allBookings = await Booking.find(bookingMatch)
        .select("event totalAmount quantity createdAt status ticketType")
        .lean();

      const eventIds = Array.from(new Set(allBookings.map(b => b.event?.toString()).filter(Boolean)));
      const events = await Event.find({ _id: { $in: eventIds } })
        .select("_id title date organizer")
        .populate("organizer", "name email")
        .lean();

      const eventMap = new Map(events.map(event => [event._id.toString(), event]));
      const organizerIds = Array.from(new Set(events.map(e => e.organizer?._id?.toString()).filter(Boolean)));
      const subscriptions = await OrganizerSubscription.find({ organizer: { $in: organizerIds } })
        .select("organizer currentCommissionPercentage")
        .lean();
      const organizerRateMap = new Map(
        subscriptions.map(sub => [sub.organizer.toString(), sub.currentCommissionPercentage])
      );

      const defaultCommissionPercentage = 30;
      let totalTickets = 0;
      let totalRevenue = 0;
      let totalCommission = 0;
      let totalOrganizerAmount = 0;
      let totalPlatformAmount = 0;
      let totalBookings = 0;

      const sortedBookings = allBookings.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const computeAmounts = (booking) => {
        const eventInfo = eventMap.get(booking.event?.toString());
        const organizerIdResolved = eventInfo?.organizer?._id?.toString();
        const commissionRate = organizerRateMap.get(organizerIdResolved) ?? defaultCommissionPercentage;
        const subtotal = Number(booking.totalAmount) || 0;
        const quantity = Number(booking.quantity) || 0;
        const ticketPrice = booking.ticketType?.price || (quantity ? subtotal / quantity : 0);
        const commissionAmount = (subtotal * commissionRate) / 100;
        const organizerAmount = subtotal - commissionAmount;

        return {
          eventInfo,
          commissionRate,
          subtotal,
          quantity,
          ticketPrice,
          commissionAmount,
          organizerAmount
        };
      };

      allBookings.forEach((booking) => {
        const amounts = computeAmounts(booking);
        totalTickets += amounts.quantity;
        totalRevenue += amounts.subtotal;
        totalCommission += amounts.commissionAmount;
        totalOrganizerAmount += amounts.organizerAmount;
        totalPlatformAmount += amounts.commissionAmount;
      });

      totalBookings = allBookings.length;

      const start = (page - 1) * limit;
      const pageBookings = sortedBookings.slice(start, start + parseInt(limit));

      const commissionRows = pageBookings.map(booking => {
        const amounts = computeAmounts(booking);

        return {
          _id: booking._id,
          organizer: amounts.eventInfo?.organizer || null,
          event: amounts.eventInfo
            ? { _id: amounts.eventInfo._id, title: amounts.eventInfo.title, date: amounts.eventInfo.date }
            : null,
          ticketPrice: amounts.ticketPrice,
          quantity: amounts.quantity,
          subtotal: amounts.subtotal,
          commissionPercentage: amounts.commissionRate,
          commissionAmount: amounts.commissionAmount,
          organizerAmount: amounts.organizerAmount,
          platformAmount: amounts.commissionAmount,
          status: booking.status || "pending",
          createdAt: booking.createdAt
        };
      });

      const summaryData = {
        totalTickets,
        totalRevenue,
        totalCommission,
        totalOrganizerAmount,
        totalPlatformAmount,
        totalBookings
      };

      return res.json({
        success: true,
        data: commissionRows,
        summary: summaryData,
        total: allBookings.length,
        page: parseInt(page),
        pages: Math.ceil(allBookings.length / limit)
      });
    }

    return res.json({
      success: true,
      data: commissions,
      summary: summary[0] || {
        totalTickets: 0,
        totalRevenue: 0,
        totalCommission: 0,
        totalOrganizerAmount: 0,
        totalPlatformAmount: 0,
        totalBookings: 0
      },
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching commissions:", error);
    res.status(500).json({ message: "Failed to fetch commissions", error: error.message });
  }
};

// Get commission by event
export const getCommissionByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const commissions = await Commission.find({ event: eventId })
      .populate("organizer", "name email")
      .populate("booking", "ticketType quantity");

    const summary = await Commission.aggregate([
      { $match: { event: new mongoose.Types.ObjectId(eventId) } },
      {
        $group: {
          _id: null,
          totalTickets: { $sum: "$quantity" },
          totalRevenue: { $sum: "$subtotal" },
          totalCommission: { $sum: "$commissionAmount" },
          totalOrganizerAmount: { $sum: "$organizerAmount" }
        }
      }
    ]);

    res.json({
      success: true,
      data: commissions,
      summary: summary[0] || {
        totalTickets: 0,
        totalRevenue: 0,
        totalCommission: 0,
        totalOrganizerAmount: 0
      }
    });
  } catch (error) {
    console.error("Error fetching event commissions:", error);
    res.status(500).json({ message: "Failed to fetch event commissions", error: error.message });
  }
};

export default {
  getAllPlans,
  createPlan,
  updatePlan,
  deletePlan,
  assignPlanToOrganizer,
  getOrganizerSubscription,
  getAllOrganizerSubscriptions,
  updateSubscriptionStatus,
  createCommission,
  getOrganizerCommissions,
  getAllCommissions,
  getCommissionByEvent
};
