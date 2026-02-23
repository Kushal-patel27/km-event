import express from 'express';
import * as waitlistController from '../controllers/waitlistController.js';
import { protect, requireRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes (require authentication)
router.post('/join', protect, waitlistController.joinWaitlist);
router.delete('/:waitlistId', protect, waitlistController.leaveWaitlist);
router.get('/my-waitlist', protect, waitlistController.getMyWaitlist);

// Admin/Organizer routes
router.get(
  '/event/:eventId',
  protect,
  waitlistController.getEventWaitlist
);

router.get(
  '/event/:eventId/analytics',
  protect,
  waitlistController.getWaitlistAnalytics
);

router.post(
  '/event/:eventId/notify',
  protect,
  requireRoles('admin', 'super_admin', 'event_admin'),
  waitlistController.triggerNotification
);

// Cleanup route (can be called by cron job or admin)
router.post(
  '/cleanup',
  protect,
  requireRoles('admin', 'super_admin'),
  waitlistController.cleanupExpired
);

export default router;
