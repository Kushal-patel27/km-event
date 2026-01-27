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
import { protect, requireSuperAdmin } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public routes - anyone can view plans
router.get('/plans', getAllPlans)
router.get('/plans/compare', comparePlans)
router.get('/plans/:id', getPlanById)
router.get('/plans/name/:name', getPlanByName)

// Super Admin only routes
router.post('/plans', protect, requireSuperAdmin, createPlan)
router.put('/plans/:id', protect, requireSuperAdmin, updatePlan)
router.delete('/plans/:id', protect, requireSuperAdmin, deletePlan)

export default router
