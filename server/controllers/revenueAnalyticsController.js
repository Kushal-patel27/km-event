import Commission from "../models/Commission.js";
import Payout from "../models/Payout.js";
import OrganizerSubscription from "../models/OrganizerSubscription.js";
import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import mongoose from "mongoose";

// ==================== REVENUE ANALYTICS ====================

// Get platform revenue dashboard (Super Admin)
export const getPlatformRevenueAnalytics = async (req, res) => {
  try {
    const { fromDate, toDate, period = "monthly" } = req.query;

    // Date range
    const dateQuery = {};
    if (fromDate) dateQuery.$gte = new Date(fromDate);
    if (toDate) dateQuery.$lte = new Date(toDate);

    const matchStage = dateQuery ? { createdAt: dateQuery } : {};
    const bookingMatchStage = {
      status: "confirmed",
      ...(Object.keys(dateQuery).length ? { createdAt: dateQuery } : {})
    };

    // Total Revenue Summary
    const totalRevenue = await Commission.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$subtotal" },
          totalCommission: { $sum: "$commissionAmount" },
          totalOrganizerPayout: { $sum: "$organizerAmount" },
          totalTickets: { $sum: "$quantity" },
          totalBookings: { $sum: 1 }
        }
      }
    ]);

    let totalRevenueData = totalRevenue[0];

    if (!totalRevenueData || totalRevenueData.totalRevenue === 0) {
      const bookingSummary = await Booking.aggregate([
        { $match: bookingMatchStage },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
            totalCommission: { $sum: { $ifNull: ["$commission.commissionAmount", 0] } },
            totalOrganizerPayout: { $sum: { $ifNull: ["$commission.organizerAmount", 0] } },
            totalTickets: { $sum: "$quantity" },
            totalBookings: { $sum: 1 }
          }
        }
      ]);

      totalRevenueData = bookingSummary[0] || totalRevenueData;

      if (totalRevenueData && totalRevenueData.totalRevenue > 0) {
        const bookings = await Booking.find(bookingMatchStage)
          .select("event totalAmount")
          .lean();

        const eventIds = Array.from(
          new Set(
            bookings
              .map(booking => booking.event?.toString())
              .filter(Boolean)
          )
        );

        if (eventIds.length > 0) {
          const events = await Event.find({ _id: { $in: eventIds } })
            .select("_id organizer")
            .lean();
          const eventOrganizerMap = new Map(
            events.map(event => [event._id.toString(), event.organizer?.toString()])
          );

          const organizerIds = Array.from(
            new Set(events.map(event => event.organizer?.toString()).filter(Boolean))
          );

          const subscriptions = await OrganizerSubscription.find({ organizer: { $in: organizerIds } })
            .select("organizer currentCommissionPercentage")
            .lean();
          const organizerRateMap = new Map(
            subscriptions.map(sub => [sub.organizer.toString(), sub.currentCommissionPercentage])
          );

          const defaultCommissionPercentage = 30;
          let derivedCommission = 0;
          let derivedOrganizerPayout = 0;

          bookings.forEach(booking => {
            const revenue = Number(booking.totalAmount) || 0;
            const organizerId = eventOrganizerMap.get(booking.event?.toString());
            const commissionRate = organizerRateMap.get(organizerId) ?? defaultCommissionPercentage;
            const commissionAmount = (revenue * commissionRate) / 100;
            derivedCommission += commissionAmount;
            derivedOrganizerPayout += revenue - commissionAmount;
          });

          totalRevenueData.totalCommission = derivedCommission;
          totalRevenueData.totalOrganizerPayout = derivedOrganizerPayout;
        }
      }
    }

    // Revenue by status
    const byStatus = await Commission.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          revenue: { $sum: "$subtotal" },
          commissionEarned: { $sum: "$commissionAmount" }
        }
      }
    ]);

    // Revenue by plan
    const byPlan = await Commission.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "organizersubscriptions",
          localField: "organizer",
          foreignField: "organizer",
          as: "subscription"
        }
      },
      { $unwind: { path: "$subscription", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "subscriptionplans",
          localField: "subscription.plan",
          foreignField: "_id",
          as: "plan"
        }
      },
      { $unwind: { path: "$plan", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { planName: "$plan.name", commissionPercentage: "$commissionPercentage" },
          count: { $sum: 1 },
          revenue: { $sum: "$subtotal" },
          commissionEarned: { $sum: "$commissionAmount" },
          organizerPayouts: { $sum: "$organizerAmount" }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    // Top organizers by revenue
    let topOrganizers = await Commission.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "users",
          localField: "organizer",
          foreignField: "_id",
          as: "organizer"
        }
      },
      { $unwind: "$organizer" },
      {
        $group: {
          _id: "$organizer._id",
          organizerName: { $first: "$organizer.name" },
          organizerEmail: { $first: "$organizer.email" },
          totalRevenue: { $sum: "$subtotal" },
          totalCommissionPaid: { $sum: "$commissionAmount" },
          ticketsSold: { $sum: "$quantity" },
          bookingsCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    if (topOrganizers.length === 0) {
      topOrganizers = await Booking.aggregate([
        { $match: bookingMatchStage },
        {
          $lookup: {
            from: "events",
            localField: "event",
            foreignField: "_id",
            as: "event"
          }
        },
        { $unwind: "$event" },
        {
          $lookup: {
            from: "users",
            localField: "event.organizer",
            foreignField: "_id",
            as: "organizer"
          }
        },
        { $unwind: "$organizer" },
        {
          $group: {
            _id: "$organizer._id",
            organizerName: { $first: "$organizer.name" },
            organizerEmail: { $first: "$organizer.email" },
            totalRevenue: { $sum: "$totalAmount" },
            totalCommissionPaid: { $sum: 0 },
            ticketsSold: { $sum: "$quantity" },
            bookingsCount: { $sum: 1 }
          }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 }
      ]);
    }

    // Top events by revenue
    const topEvents = await Commission.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "events",
          localField: "event",
          foreignField: "_id",
          as: "event"
        }
      },
      { $unwind: "$event" },
      {
        $group: {
          _id: "$event._id",
          eventTitle: { $first: "$event.title" },
          eventDate: { $first: "$event.date" },
          totalRevenue: { $sum: "$subtotal" },
          commissionEarned: { $sum: "$commissionAmount" },
          ticketsSold: { $sum: "$quantity" }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    // Daily revenue trend
    const dailyTrend = await Commission.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          revenue: { $sum: "$subtotal" },
          commission: { $sum: "$commissionAmount" },
          bookings: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        summary: totalRevenueData || {
          totalRevenue: 0,
          totalCommission: 0,
          totalOrganizerPayout: 0,
          totalTickets: 0,
          totalBookings: 0
        },
        byStatus,
        byPlan,
        topOrganizers,
        topEvents,
        dailyTrend
      }
    });
  } catch (error) {
    console.error("Error fetching platform analytics:", error);
    res.status(500).json({ message: "Failed to fetch analytics", error: error.message });
  }
};

// Get organizer revenue dashboard
export const getOrganizerRevenueAnalytics = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const { fromDate, toDate } = req.query;

    const dateQuery = {};
    if (fromDate) dateQuery.$gte = new Date(fromDate);
    if (toDate) dateQuery.$lte = new Date(toDate);

    const matchStage = {
      organizer: new mongoose.Types.ObjectId(organizerId),
      ...(Object.keys(dateQuery).length && { createdAt: dateQuery })
    };

    // Revenue Summary
    const summary = await Commission.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$subtotal" },
          totalCommissionDeducted: { $sum: "$commissionAmount" },
          totalPayout: { $sum: "$organizerAmount" },
          totalTickets: { $sum: "$quantity" },
          totalBookings: { $sum: 1 }
        }
      }
    ]);

    // Revenue by status
    const byStatus = await Commission.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          revenue: { $sum: "$subtotal" },
          payoutAmount: { $sum: "$organizerAmount" }
        }
      }
    ]);

    // Revenue by event
    const byEvent = await Commission.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "events",
          localField: "event",
          foreignField: "_id",
          as: "event"
        }
      },
      { $unwind: "$event" },
      {
        $group: {
          _id: "$event._id",
          eventTitle: { $first: "$event.title" },
          eventDate: { $first: "$event.date" },
          totalRevenue: { $sum: "$subtotal" },
          totalCommission: { $sum: "$commissionAmount" },
          totalPayout: { $sum: "$organizerAmount" },
          ticketsSold: { $sum: "$quantity" }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // Commission breakdown
    const commissionBreakdown = await Commission.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$commissionPercentage",
          count: { $sum: 1 },
          revenue: { $sum: "$subtotal" },
          totalCommission: { $sum: "$commissionAmount" },
          totalPayout: { $sum: "$organizerAmount" }
        }
      }
    ]);

    // Payout status
    const payoutStatus = await Payout.aggregate([
      {
        $match: { organizer: new mongoose.Types.ObjectId(organizerId) }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" }
        }
      }
    ]);

    // Daily trend
    const dailyTrend = await Commission.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          revenue: { $sum: "$subtotal" },
          commission: { $sum: "$commissionAmount" },
          payout: { $sum: "$organizerAmount" },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    res.json({
      success: true,
      data: {
        summary: summary[0] || {
          totalRevenue: 0,
          totalCommissionDeducted: 0,
          totalPayout: 0,
          totalTickets: 0,
          totalBookings: 0
        },
        byStatus,
        byEvent,
        commissionBreakdown,
        payoutStatus,
        dailyTrend
      }
    });
  } catch (error) {
    console.error("Error fetching organizer analytics:", error);
    res.status(500).json({ message: "Failed to fetch analytics", error: error.message });
  }
};

// Get event admin revenue analytics
export const getEventAdminRevenueAnalytics = async (req, res) => {
  try {
    const eventAdminId = req.user.id;
    const { fromDate, toDate } = req.query;

    // Prefer assigned events for event admins; fall back to organizer-owned events
    let eventIds = Array.isArray(req.user.assignedEvents) ? req.user.assignedEvents : [];
    if (eventIds.length === 0) {
      const events = await Event.find({ organizer: eventAdminId }).select("_id");
      eventIds = events.map(e => e._id);
    }

    if (eventIds.length === 0) {
      return res.json({
        success: true,
        data: {
          summary: {
            totalRevenue: 0,
            totalCommissionDeducted: 0,
            totalPayout: 0,
            totalTickets: 0,
            totalBookings: 0
          },
          byEvent: [],
          dailyTrend: []
        }
      });
    }

    const dateQuery = {};
    if (fromDate) dateQuery.$gte = new Date(fromDate);
    if (toDate) dateQuery.$lte = new Date(toDate);

    const matchStage = {
      event: { $in: eventIds },
      ...(Object.keys(dateQuery).length && { createdAt: dateQuery })
    };

    // Summary
    const summary = await Commission.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$subtotal" },
          totalCommissionDeducted: { $sum: "$commissionAmount" },
          totalPayout: { $sum: "$organizerAmount" },
          totalTickets: { $sum: "$quantity" },
          totalBookings: { $sum: 1 }
        }
      }
    ]);

    // By event
    const byEvent = await Commission.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "events",
          localField: "event",
          foreignField: "_id",
          as: "event"
        }
      },
      { $unwind: "$event" },
      {
        $group: {
          _id: "$event._id",
          eventTitle: { $first: "$event.title" },
          eventDate: { $first: "$event.date" },
          totalRevenue: { $sum: "$subtotal" },
          totalCommission: { $sum: "$commissionAmount" },
          totalPayout: { $sum: "$organizerAmount" },
          ticketsSold: { $sum: "$quantity" }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // Daily trend
    const dailyTrend = await Commission.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          revenue: { $sum: "$subtotal" },
          commission: { $sum: "$commissionAmount" },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    const defaultSummary = {
      totalRevenue: 0,
      totalCommissionDeducted: 0,
      totalPayout: 0,
      totalTickets: 0,
      totalBookings: 0
    };

    let summaryData = summary[0] || defaultSummary;
    let byEventData = byEvent;
    let dailyTrendData = dailyTrend;

    if (summaryData.totalRevenue === 0) {
      const bookingMatch = {
        event: { $in: eventIds },
        status: "confirmed",
        ...(Object.keys(dateQuery).length && { createdAt: dateQuery })
      };

      const bookings = await Booking.find(bookingMatch)
        .select("event quantity totalAmount createdAt");

      if (bookings.length > 0) {
        const eventsWithOrganizers = await Event.find({ _id: { $in: eventIds } })
          .select("_id title date organizer");
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
        const byEventMap = new Map();
        const dailyTrendMap = new Map();

        let totalRevenue = 0;
        let totalCommissionDeducted = 0;
        let totalPayout = 0;
        let totalTickets = 0;
        let totalBookings = 0;

        bookings.forEach(booking => {
          const eventId = booking.event?.toString();
          const eventInfo = eventMap.get(eventId);
          const organizerId = eventInfo?.organizer?.toString();
          const commissionRate = organizerRateMap.get(organizerId) ?? defaultCommissionPercentage;
          const revenue = Number(booking.totalAmount) || 0;
          const tickets = Number(booking.quantity) || 0;
          const commissionAmount = (revenue * commissionRate) / 100;
          const payoutAmount = revenue - commissionAmount;

          totalRevenue += revenue;
          totalCommissionDeducted += commissionAmount;
          totalPayout += payoutAmount;
          totalTickets += tickets;
          totalBookings += 1;

          if (eventInfo) {
            if (!byEventMap.has(eventId)) {
              byEventMap.set(eventId, {
                _id: eventInfo._id,
                eventTitle: eventInfo.title,
                eventDate: eventInfo.date,
                totalRevenue: 0,
                totalCommission: 0,
                totalPayout: 0,
                ticketsSold: 0
              });
            }
            const eventRow = byEventMap.get(eventId);
            eventRow.totalRevenue += revenue;
            eventRow.totalCommission += commissionAmount;
            eventRow.totalPayout += payoutAmount;
            eventRow.ticketsSold += tickets;
          }

          const bookedAt = booking.createdAt ? new Date(booking.createdAt) : null;
          if (bookedAt) {
            const key = bookedAt.toISOString().slice(0, 10);
            const [year, month, day] = key.split("-").map(Number);
            if (!dailyTrendMap.has(key)) {
              dailyTrendMap.set(key, {
                _id: { year, month, day },
                revenue: 0,
                commission: 0,
                bookings: 0
              });
            }
            const trendRow = dailyTrendMap.get(key);
            trendRow.revenue += revenue;
            trendRow.commission += commissionAmount;
            trendRow.bookings += 1;
          }
        });

        summaryData = {
          totalRevenue,
          totalCommissionDeducted,
          totalPayout,
          totalTickets,
          totalBookings
        };

        byEventData = Array.from(byEventMap.values()).sort(
          (a, b) => b.totalRevenue - a.totalRevenue
        );

        dailyTrendData = Array.from(dailyTrendMap.values()).sort((a, b) => {
          const aKey = `${a._id.year}-${String(a._id.month).padStart(2, "0")}-${String(a._id.day).padStart(2, "0")}`;
          const bKey = `${b._id.year}-${String(b._id.month).padStart(2, "0")}-${String(b._id.day).padStart(2, "0")}`;
          return aKey.localeCompare(bKey);
        });
      }
    }

    res.json({
      success: true,
      data: {
        summary: summaryData,
        byEvent: byEventData,
        dailyTrend: dailyTrendData
      }
    });
  } catch (error) {
    console.error("Error fetching event admin analytics:", error);
    res.status(500).json({ message: "Failed to fetch analytics", error: error.message });
  }
};

// Compare organizers performance
export const compareOrganizersPerformance = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    const dateQuery = {};
    if (fromDate) dateQuery.$gte = new Date(fromDate);
    if (toDate) dateQuery.$lte = new Date(toDate);

    const matchStage = Object.keys(dateQuery).length ? { createdAt: dateQuery } : {};

    const comparison = await Commission.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "users",
          localField: "organizer",
          foreignField: "_id",
          as: "organizer"
        }
      },
      { $unwind: "$organizer" },
      {
        $lookup: {
          from: "organizersubscriptions",
          localField: "organizer._id",
          foreignField: "organizer",
          as: "subscription"
        }
      },
      { $unwind: { path: "$subscription", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "subscriptionplans",
          localField: "subscription.plan",
          foreignField: "_id",
          as: "plan"
        }
      },
      { $unwind: { path: "$plan", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: {
            organizerId: "$organizer._id",
            organizerName: "$organizer.name",
            planName: { $ifNull: ["$plan.name", "Free"] }
          },
          totalRevenue: { $sum: "$subtotal" },
          totalCommission: { $sum: "$commissionAmount" },
          totalPayout: { $sum: "$organizerAmount" },
          ticketsSold: { $sum: "$quantity" },
          bookings: { $sum: 1 },
          avgTicketPrice: { $avg: "$ticketPrice" }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error("Error comparing organizers:", error);
    res.status(500).json({ message: "Failed to compare organizers", error: error.message });
  }
};

export default {
  getPlatformRevenueAnalytics,
  getOrganizerRevenueAnalytics,
  getEventAdminRevenueAnalytics,
  compareOrganizersPerformance
};
