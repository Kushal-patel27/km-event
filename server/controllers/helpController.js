import HelpArticle from '../models/HelpArticle.js'

// Public: list active help articles with optional search and pagination
export const getHelpArticles = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10)
    const limit = parseInt(req.query.limit || '50', 10)
    const q = req.query.q?.trim()

    const filter = { isActive: true }
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
      ]
    }

    const total = await HelpArticle.countDocuments(filter)
    const items = await HelpArticle.find(filter)
      .sort({ order: 1, updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: items,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching help articles', error: error.message })
  }
}

// Admin: list (optionally include inactive) with pagination
export const getHelpArticlesAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10)
    const limit = parseInt(req.query.limit || '50', 10)
    const q = req.query.q?.trim()
    const includeInactive = req.query.includeInactive === 'true'

    const filter = includeInactive ? {} : { isActive: true }
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
      ]
    }

    const total = await HelpArticle.countDocuments(filter)
    const items = await HelpArticle.find(filter)
      .sort({ order: 1, updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: items,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching help articles', error: error.message })
  }
}

export const getHelpArticleById = async (req, res) => {
  try {
    const item = await HelpArticle.findById(req.params.id)
    if (!item) return res.status(404).json({ success: false, message: 'Help article not found' })
    res.status(200).json({ success: true, data: item })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching help article', error: error.message })
  }
}

export const createHelpArticle = async (req, res) => {
  try {
    const { category, title, description, steps, order, isActive } = req.body
    if (!category || !title || !description) {
      return res.status(400).json({ success: false, message: 'Category, title, and description are required' })
    }

    const normalizedSteps = Array.isArray(steps)
      ? steps.filter(Boolean)
      : typeof steps === 'string'
        ? steps.split('\n').map(s => s.trim()).filter(Boolean)
        : []

    const created = await HelpArticle.create({
      category,
      title,
      description,
      steps: normalizedSteps,
      order: typeof order === 'number' ? order : 0,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user?.id || null,
    })

    res.status(201).json({ success: true, message: 'Help article created', data: created })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating help article', error: error.message })
  }
}

export const updateHelpArticle = async (req, res) => {
  try {
    const { category, title, description, steps, order, isActive } = req.body
    const item = await HelpArticle.findById(req.params.id)
    if (!item) return res.status(404).json({ success: false, message: 'Help article not found' })

    if (category) item.category = category
    if (title) item.title = title
    if (description) item.description = description
    if (steps !== undefined) {
      const normalizedSteps = Array.isArray(steps)
        ? steps.filter(Boolean)
        : typeof steps === 'string'
          ? steps.split('\n').map(s => s.trim()).filter(Boolean)
          : []
      item.steps = normalizedSteps
    }
    if (order !== undefined) item.order = order
    if (isActive !== undefined) item.isActive = isActive
    item.updatedBy = req.user?.id || null

    const saved = await item.save()
    res.status(200).json({ success: true, message: 'Help article updated', data: saved })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating help article', error: error.message })
  }
}

export const deleteHelpArticle = async (req, res) => {
  try {
    const deleted = await HelpArticle.findByIdAndDelete(req.params.id)
    if (!deleted) return res.status(404).json({ success: false, message: 'Help article not found' })
    res.status(200).json({ success: true, message: 'Help article deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting help article', error: error.message })
  }
}

export const seedHelpArticles = async (req, res) => {
  try {
    const existingCount = await HelpArticle.countDocuments()
    if (existingCount >= 6) {
      return res.status(200).json({ success: true, message: 'Help articles already populated', inserted: 0 })
    }

    const defaults = [
      {
        category: 'Getting Started',
        title: 'Create Your Account',
        description: 'Sign up in seconds to start booking your favorite events.',
        steps: [
          'Click "Sign Up" on the homepage',
          'Enter your email and create a password',
          'Verify your email address',
          'Complete your profile (optional)',
        ],
        order: 1,
      },
      {
        category: 'Booking & Tickets',
        title: 'How to Book',
        description: 'Step-by-step booking guide.',
        steps: [
          'Find and select your event',
          'Choose ticket quantity and seats',
          'Review and confirm',
          'Complete payment securely',
        ],
        order: 2,
      },
      {
        category: 'Tickets & Entry',
        title: 'Using Your Ticket',
        description: 'How to enter with your digital ticket.',
        steps: [
          'Arrive before event start',
          'Show the QR code at entry',
          'Bring an ID if requested',
        ],
        order: 3,
      },
      {
        category: 'Payment & Refunds',
        title: 'Refund Policy',
        description: 'When you can get your money back.',
        steps: [
          'Cancellations depend on event policy',
          'Event cancelled by organizer: full refund',
          'Refunds typically 5-7 business days',
        ],
        order: 4,
      },
      {
        category: 'Account & Profile',
        title: 'Password Management',
        description: 'Securing your account.',
        steps: [
          'Use strong, unique passwords',
          'Use "Forgot Password" if you forget',
          'Change password regularly',
        ],
        order: 5,
      },
      {
        category: 'Troubleshooting',
        title: 'Payment Failed',
        description: 'What to do when payment is declined.',
        steps: [
          'Check card funds and details',
          'Contact your bank to unblock',
          'Try another payment method',
        ],
        order: 6,
      },
    ].map(item => ({ ...item, isActive: true, createdBy: req.user?.id || null }))

    const inserted = await HelpArticle.insertMany(defaults)
    return res.status(201).json({ success: true, message: 'Seeded help articles', inserted: inserted.length })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to seed help articles', error: error.message })
  }
}
