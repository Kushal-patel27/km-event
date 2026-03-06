import EventTemplate from '../models/EventTemplate.js';
import Event from '../models/Event.js';
import { body, validationResult } from 'express-validator';
import { customAlphabet } from 'nanoid';

// Generate unique short code
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

/**
 * @desc    Get all templates (with filtering)
 * @route   GET /api/templates
 * @access  Private (Admin)
 */
export const getAllTemplates = async (req, res) => {
  try {
    const { category, isPremium, isActive, search, sort = '-usageCount' } = req.query;

    // Build query
    const query = {};
    
    if (category) query.category = category;
    if (isPremium !== undefined) query.isPremium = isPremium === 'true';
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { defaultDescription: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const templates = await EventTemplate.find(query)
      .sort(sort)
      .populate('createdBy', 'name email role')
      .lean();

    res.json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates',
      error: error.message
    });
  }
};

/**
 * @desc    Get single template by ID
 * @route   GET /api/templates/:id
 * @access  Private (Admin)
 */
export const getTemplateById = async (req, res) => {
  try {
    const template = await EventTemplate.findById(req.params.id)
      .populate('createdBy', 'name email role');

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch template',
      error: error.message
    });
  }
};

/**
 * @desc    Create new template
 * @route   POST /api/templates
 * @access  Private (Admin)
 */
export const createTemplate = async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      name,
      category,
      defaultDescription,
      defaultBanner,
      defaultPrice,
      defaultCurrency,
      defaultDuration,
      defaultCapacity,
      isPremium,
      tags,
      previewImage,
      customFields
    } = req.body;

    const template = await EventTemplate.create({
      name,
      category,
      defaultDescription,
      defaultBanner,
      defaultPrice: defaultPrice || 0,
      defaultCurrency: defaultCurrency || 'INR',
      defaultDuration,
      defaultCapacity,
      isPremium: isPremium || false,
      tags: tags || [],
      previewImage,
      customFields,
      createdBy: req.user._id
    });

    const populatedTemplate = await EventTemplate.findById(template._id)
      .populate('createdBy', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: populatedTemplate
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create template',
      error: error.message
    });
  }
};

/**
 * @desc    Update template
 * @route   PUT /api/templates/:id
 * @access  Private (Admin)
 */
export const updateTemplate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const template = await EventTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Update fields
    const allowedUpdates = [
      'name',
      'category',
      'defaultDescription',
      'defaultBanner',
      'defaultPrice',
      'defaultCurrency',
      'defaultDuration',
      'defaultCapacity',
      'isPremium',
      'isActive',
      'tags',
      'previewImage',
      'customFields'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        template[field] = req.body[field];
      }
    });

    await template.save();

    const updatedTemplate = await EventTemplate.findById(template._id)
      .populate('createdBy', 'name email role');

    res.json({
      success: true,
      message: 'Template updated successfully',
      data: updatedTemplate
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update template',
      error: error.message
    });
  }
};

/**
 * @desc    Delete template
 * @route   DELETE /api/templates/:id
 * @access  Private (Admin)
 */
export const deleteTemplate = async (req, res) => {
  try {
    const template = await EventTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Soft delete: just mark as inactive
    template.isActive = false;
    await template.save();

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete template',
      error: error.message
    });
  }
};

/**
 * @desc    Clone template into new Event
 * @route   POST /api/templates/:id/clone
 * @access  Private (Event Admin, Admin)
 */
export const cloneTemplateToEvent = async (req, res) => {
  try {
    const template = await EventTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    if (!template.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This template is no longer active'
      });
    }

    // Check if user has permission (premium templates for premium users only)
    if (template.isPremium && req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      // Check user subscription here if needed
      // For now, allow all authenticated users
    }

    const { customTitle, customDate, customLocation } = req.body;

    // Generate slug from title
    const title = customTitle || `${template.name} Event`;
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug exists, append random string if needed
    let uniqueSlug = slug;
    let slugExists = await Event.findOne({ slug: uniqueSlug });
    if (slugExists) {
      uniqueSlug = `${slug}-${Date.now().toString(36)}`;
    }

    // Generate unique short code
    let shortCode = nanoid();
    let codeExists = await Event.findOne({ shortCode });
    while (codeExists) {
      shortCode = nanoid();
      codeExists = await Event.findOne({ shortCode });
    }

    // Create event from template
    const event = await Event.create({
      title,
      slug: uniqueSlug,
      shortCode,
      description: template.defaultDescription || 'Event created from template',
      image: template.defaultBanner || template.previewImage || '',
      location: customLocation || 'Location TBD',
      date: customDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default: 30 days from now
      category: template.category,
      organizer: req.user._id,
      isPublic: false, // Default to private, user can make public later
      views: 0,
      templateUsed: template._id,
      totalTickets: template.defaultCapacity,
      availableTickets: template.defaultCapacity,
      price: template.defaultPrice, // Legacy field for backward compatibility
      ticketTypes: [{
        name: 'General Admission',
        price: template.defaultPrice,
        quantity: template.defaultCapacity,
        available: template.defaultCapacity,
        description: 'Standard ticket'
      }]
    });

    // Increment template usage
    await template.incrementUsage();

    const populatedEvent = await Event.findById(event._id)
      .populate('organizer', 'name email')
      .populate('templateUsed', 'name category');

    res.status(201).json({
      success: true,
      message: 'Event created from template successfully',
      data: populatedEvent
    });
  } catch (error) {
    console.error('Clone template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clone template',
      error: error.message
    });
  }
};

/**
 * @desc    Get popular templates
 * @route   GET /api/templates/popular
 * @access  Private
 */
export const getPopularTemplates = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const templates = await EventTemplate.getPopular(limit);

    res.json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (error) {
    console.error('Get popular templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular templates',
      error: error.message
    });
  }
};

/**
 * @desc    Get templates by category
 * @route   GET /api/templates/category/:category
 * @access  Private
 */
export const getTemplatesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const templates = await EventTemplate.getByCategory(category);

    res.json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (error) {
    console.error('Get templates by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates',
      error: error.message
    });
  }
};

// Validation rules
export const templateValidationRules = () => {
  return [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Template name is required')
      .isLength({ max: 100 })
      .withMessage('Name cannot exceed 100 characters'),
    body('category')
      .trim()
      .notEmpty()
      .withMessage('Category is required')
      .isIn([
        'concert', 'conference', 'wedding', 'workshop', 'seminar',
        'festival', 'sports', 'exhibition', 'networking', 'meetup',
        'webinar', 'party', 'fundraiser', 'other'
      ])
      .withMessage('Invalid category'),
    body('defaultPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('defaultCapacity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Capacity must be at least 1')
  ];
};
