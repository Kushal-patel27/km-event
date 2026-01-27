import express from 'express'
import {
  getPageContent,
  updatePageContent,
  updateSection,
  resetToDefaults
} from '../controllers/organizersPageController.js'
import { protect, requireSuperAdmin } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public route - anyone can view
router.get('/content', getPageContent)

// Super Admin only routes
router.put('/content', protect, requireSuperAdmin, updatePageContent)
router.put('/content/:section', protect, requireSuperAdmin, updateSection)
router.post('/content/reset', protect, requireSuperAdmin, resetToDefaults)

export default router
