import FAQ from '../models/FAQ.js'

// Get all FAQs (public - only active ones)
export const getAllFAQs = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10)
    const limit = parseInt(req.query.limit || '20', 10)
    const q = req.query.q?.trim()

    const filter = { isActive: true }
    if (q) {
      filter.$or = [
        { question: { $regex: q, $options: 'i' } },
        { answer: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
      ]
    }

    const total = await FAQ.countDocuments(filter)
    const faqs = await FAQ.find(filter)
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    res.status(200).json({
      success: true,
      count: faqs.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: faqs
    })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching FAQs', 
      error: error.message 
    })
  }
}

// Get all FAQs with inactive (for admin)
export const getAllFAQsAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10)
    const limit = parseInt(req.query.limit || '20', 10)
    const q = req.query.q?.trim()
    const includeInactive = req.query.includeInactive === 'true'

    const filter = includeInactive ? {} : { isActive: true }
    if (q) {
      filter.$or = [
        { question: { $regex: q, $options: 'i' } },
        { answer: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
      ]
    }

    const total = await FAQ.countDocuments(filter)
    const faqs = await FAQ.find(filter)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    res.status(200).json({
      success: true,
      count: faqs.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: faqs
    })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching FAQs', 
      error: error.message 
    })
  }
}

// Get FAQ by ID
export const getFAQById = async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')

    if (!faq) {
      return res.status(404).json({ 
        success: false, 
        message: 'FAQ not found' 
      })
    }

    res.status(200).json({
      success: true,
      data: faq
    })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching FAQ', 
      error: error.message 
    })
  }
}

// Create FAQ
export const createFAQ = async (req, res) => {
  try {
    const { category, question, answer, isActive } = req.body

    if (!category || !question || !answer) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category, question, and answer are required' 
      })
    }

    const newFAQ = new FAQ({
      category,
      question,
      answer,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user.id
    })

    const savedFAQ = await newFAQ.save()
    await savedFAQ.populate('createdBy', 'name email')

    res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      data: savedFAQ
    })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error creating FAQ', 
      error: error.message 
    })
  }
}

// Update FAQ
export const updateFAQ = async (req, res) => {
  try {
    const { category, question, answer, isActive } = req.body

    const faq = await FAQ.findById(req.params.id)
    if (!faq) {
      return res.status(404).json({ 
        success: false, 
        message: 'FAQ not found' 
      })
    }

    if (category) faq.category = category
    if (question) faq.question = question
    if (answer) faq.answer = answer
    if (isActive !== undefined) faq.isActive = isActive
    faq.updatedBy = req.user.id

    const updatedFAQ = await faq.save()
    await updatedFAQ.populate('createdBy', 'name email')
    await updatedFAQ.populate('updatedBy', 'name email')

    res.status(200).json({
      success: true,
      message: 'FAQ updated successfully',
      data: updatedFAQ
    })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error updating FAQ', 
      error: error.message 
    })
  }
}

// Delete FAQ
export const deleteFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id)

    if (!faq) {
      return res.status(404).json({ 
        success: false, 
        message: 'FAQ not found' 
      })
    }

    res.status(200).json({
      success: true,
      message: 'FAQ deleted successfully'
    })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting FAQ', 
      error: error.message 
    })
  }
}

// Get FAQs by category
export const getFAQsByCategory = async (req, res) => {
  try {
    const { category } = req.params

    const faqs = await FAQ.find({ 
      category,
      isActive: true 
    })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: faqs.length,
      data: faqs
    })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching FAQs by category', 
      error: error.message 
    })
  }
}

// Seed default FAQs (admin only)
export const seedDefaultFAQs = async (req, res) => {
  try {
    const defaults = [
      { category: 'Support & Help', question: 'How may I help you?', answer: 'Tell us your issue and we will respond within 24 hours.' },
      { category: 'Support & Help', question: 'Do you offer live chat?', answer: 'Yes, live chat is available during business hours.' },
      { category: 'Booking & Tickets', question: 'How do I book tickets?', answer: 'Go to Events, choose your event, select seats, and pay.' },
      { category: 'Tickets & Entry', question: 'What is a QR ticket?', answer: 'A scannable QR shown at entry to validate your ticket.' },
      { category: 'Payment & Refunds', question: 'What is your refund policy?', answer: 'Refunds depend on organizer policy; cancellations are fully refunded.' },
      { category: 'Account & Profile', question: 'How do I reset my password?', answer: 'Use the Forgot Password option; we will email a reset link.' },
      { category: 'Other', question: 'Is there a mobile app?', answer: 'We’re working on it. The website is mobile-friendly meanwhile.' },
    ]

    // Avoid inserting duplicates based on question text
    const existing = await FAQ.find({ question: { $in: defaults.map(d => d.question) } }).select('question')
    const existSet = new Set(existing.map(e => e.question.toLowerCase()))

    const toInsert = defaults
      .filter(d => !existSet.has(d.question.toLowerCase()))
      .map(d => ({ ...d, isActive: true, createdBy: req.user?.id || null }))

    if (toInsert.length === 0) {
      return res.status(200).json({ success: true, message: 'FAQs already seeded', inserted: 0 })
    }

    const inserted = await FAQ.insertMany(toInsert)
    return res.status(201).json({ success: true, message: 'Seeded FAQs', inserted: inserted.length })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to seed FAQs', error: error.message })
  }
}
