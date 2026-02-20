import express from 'express'
import { 
  getAllPlans, 
  getPlanById, 
  getPlanByName,
  createPlan,
  updatePlan,
  deletePlan,
  comparePlans
} from '../controllers/subscriptionPlanController.js'
import * as subscriptionController from '../controllers/subscriptionController.js'
import * as payoutController from '../controllers/payoutController.js'
import * as revenueAnalyticsController from '../controllers/revenueAnalyticsController.js'
import { protect, requireAdminRole, requireSuperAdmin } from '../middleware/authMiddleware.js'

const router = express.Router()

// ==================== SUBSCRIPTION PLANS (ADMIN) ====================
// Public routes - anyone can view plans
router.get('/plans', getAllPlans)
router.get('/plans/compare', comparePlans)
router.get('/plans/:id', getPlanById)
router.get('/plans/name/:name', getPlanByName)

// Super Admin only routes
router.post('/plans', protect, requireSuperAdmin, createPlan)
router.put('/plans/:id', protect, requireSuperAdmin, updatePlan)
router.delete('/plans/:id', protect, requireSuperAdmin, deletePlan)

// ==================== ORGANIZER SUBSCRIPTIONS ====================
// Get current subscription (for logged-in organizer)
router.get('/my-subscription', protect, subscriptionController.getOrganizerSubscription)

// Assign/Change plan (Admin)
router.post('/assign-plan', protect, requireAdminRole, subscriptionController.assignPlanToOrganizer)

// Get all subscriptions (Admin)
router.get('/all-subscriptions', protect, requireAdminRole, subscriptionController.getAllOrganizerSubscriptions)

// Update subscription status (Admin)
router.put('/subscriptions/:subscriptionId/status', protect, requireAdminRole, subscriptionController.updateSubscriptionStatus)

// ==================== COMMISSIONS ====================
// Create commission (Internal - called from booking)
router.post('/commissions', protect, subscriptionController.createCommission)

// Get organizer's commissions
router.get('/my-commissions', protect, subscriptionController.getOrganizerCommissions)

// Get all commissions (Admin)
router.get('/all-commissions', protect, requireAdminRole, subscriptionController.getAllCommissions)

// Get commissions by event
router.get('/event/:eventId/commissions', protect, subscriptionController.getCommissionByEvent)

// ==================== PAYOUTS ====================
// Request payout (Organizer)
router.post('/payouts/request', protect, payoutController.requestPayout)

// Get organizer's payouts
router.get('/my-payouts', protect, payoutController.getOrganizerPayouts)

// Get pending payout amount
router.get('/my-payouts/pending/amount', protect, payoutController.getPendingPayoutAmount)

// Get pending payout amount for event admin (assigned events)
router.get('/payouts/event-admin/pending/amount', protect, payoutController.getEventAdminPendingPayoutAmount)

// Get event admin payout history (Event Admin)
router.get('/payouts/event-admin/my', protect, payoutController.getMyEventAdminPayouts)

// Get event admin payouts (Admin)
router.get('/payouts/event-admin', protect, requireAdminRole, payoutController.getEventAdminPayouts)

// Update event admin payout status (Admin)
router.put('/payouts/event-admin/:payoutId/status', protect, requireAdminRole, payoutController.updateEventAdminPayoutStatus)

// Get all payouts (Admin)
router.get('/all-payouts', protect, requireAdminRole, payoutController.getAllPayouts)

// Update payout status (Admin)
router.put('/payouts/:payoutId/status', protect, requireAdminRole, payoutController.updatePayoutStatus)

// ==================== REVENUE ANALYTICS ====================
// Platform analytics (Admin)
router.get('/analytics/platform', protect, requireAdminRole, revenueAnalyticsController.getPlatformRevenueAnalytics)

// Organizer analytics
router.get('/analytics/organizer', protect, revenueAnalyticsController.getOrganizerRevenueAnalytics)

// Event admin analytics
router.get('/analytics/event-admin', protect, revenueAnalyticsController.getEventAdminRevenueAnalytics)

// Compare organizers
router.get('/analytics/compare-organizers', protect, requireAdminRole, revenueAnalyticsController.compareOrganizersPerformance)

export default router
