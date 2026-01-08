import express from 'express'
import { protect, requireAdminRole } from '../middleware/authMiddleware.js'
import {
  getHelpArticles,
  getHelpArticlesAdmin,
  getHelpArticleById,
  createHelpArticle,
  updateHelpArticle,
  deleteHelpArticle,
  seedHelpArticles,
} from '../controllers/helpController.js'

const router = express.Router()

// Public
router.get('/', getHelpArticles)

// Admin (ordered before :id to avoid route conflict)
router.get('/admin/all', protect, requireAdminRole, getHelpArticlesAdmin)
router.post('/', protect, requireAdminRole, createHelpArticle)
router.put('/:id', protect, requireAdminRole, updateHelpArticle)
router.delete('/:id', protect, requireAdminRole, deleteHelpArticle)
router.post('/admin/seed', protect, requireAdminRole, seedHelpArticles)

// Public detail
router.get('/:id', getHelpArticleById)

export default router
