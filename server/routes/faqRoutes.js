import express from 'express'
import { protect, requireAdminRole } from '../middleware/authMiddleware.js'
import {
  getAllFAQs,
  getAllFAQsAdmin,
  getFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  getFAQsByCategory,
  seedDefaultFAQs
} from '../controllers/faqController.js'

const router = express.Router()

// Public routes
router.get('/', getAllFAQs)
router.get('/by-category/:category', getFAQsByCategory)

// Admin routes (require authentication)
router.get('/admin/all', protect, getAllFAQsAdmin)
router.get('/:id', getFAQById)
router.post('/', protect, createFAQ)
router.put('/:id', protect, updateFAQ)
router.delete('/:id', protect, deleteFAQ)
router.post('/admin/seed', protect, requireAdminRole, seedDefaultFAQs)

export default router
