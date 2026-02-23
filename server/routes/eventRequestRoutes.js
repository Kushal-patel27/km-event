import express from 'express'
import * as eventRequestController from '../controllers/eventRequestController.js'
import authMiddleware from '../middleware/authMiddleware.js'
import { requireSuperAdmin } from '../middleware/authMiddleware.js'

const router = express.Router()

// Organizer routes
router.post('/create-request', authMiddleware, eventRequestController.createEventRequest)
router.get('/my-requests', authMiddleware, eventRequestController.getMyEventRequests)

// Super Admin routes
router.get('/pending', authMiddleware, requireSuperAdmin, eventRequestController.getPendingEventRequests)
router.get('/all', authMiddleware, requireSuperAdmin, eventRequestController.getAllEventRequests)
router.post('/:id/approve', authMiddleware, requireSuperAdmin, eventRequestController.approveEventRequest)
router.post('/:id/reject', authMiddleware, requireSuperAdmin, eventRequestController.rejectEventRequest)

// Feature toggle routes
// Super Admin only - can view and modify all features
router.get('/:eventId/features', authMiddleware, requireSuperAdmin, eventRequestController.getFeatureToggles)
router.put('/:eventId/features', authMiddleware, requireSuperAdmin, eventRequestController.updateFeatureToggles)

// Event Admin and Organizer - can only view enabled features
// Public endpoint - no auth required for checking if ticketing is enabled
router.get('/:eventId/enabled-features', eventRequestController.getEnabledFeatures)

export default router
