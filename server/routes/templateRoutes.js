import express from 'express';
import {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  cloneTemplateToEvent,
  getPopularTemplates,
  getTemplatesByCategory,
  templateValidationRules
} from '../controllers/templateController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
};

// Public routes (for event admins to browse templates)
router.get('/popular', protect, getPopularTemplates);
router.get('/category/:category', protect, getTemplatesByCategory);

// Admin-only routes (template management)
router.get('/', protect, requireAdmin, getAllTemplates);
router.get('/:id', protect, requireAdmin, getTemplateById);
router.post('/', protect, requireAdmin, templateValidationRules(), createTemplate);
router.put('/:id', protect, requireAdmin, templateValidationRules(), updateTemplate);
router.delete('/:id', protect, requireAdmin, deleteTemplate);

// Clone template (available to event admins)
router.post('/:id/clone', protect, cloneTemplateToEvent);

export default router;
