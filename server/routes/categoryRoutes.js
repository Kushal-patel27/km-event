import express from 'express'
import { 
  getAllCategories, 
  createCategory, 
  initializeDefaultCategories,
  toggleCategoryStatus,
  getAllCategoriesAdmin
} from '../controllers/categoryController.js'
import { protect, requireRoles } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public routes
router.get('/all', getAllCategories) // Get all active categories

// Protected routes (requires authentication)
router.post('/create', protect, createCategory) // Create new category

// Admin routes
router.post('/initialize', protect, requireRoles('super_admin'), initializeDefaultCategories) // Initialize default categories
router.get('/admin/all', protect, requireRoles('super_admin', 'admin'), getAllCategoriesAdmin) // Get all categories (admin)
router.patch('/:id/toggle', protect, requireRoles('super_admin'), toggleCategoryStatus) // Toggle category status

export default router
