import Category from '../models/Category.js'

// Get all active categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ isDefault: -1, usageCount: -1, name: 1 }) // Default categories first, then by usage
      .select('name isDefault usageCount')
    
    res.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(500).json({ message: 'Failed to fetch categories' })
  }
}

// Create a new category (when organizer selects "Other" and provides custom name)
export const createCategory = async (req, res) => {
  try {
    const { name } = req.body
    const user = req.user

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' })
    }

    const trimmedName = name.trim()

    // Check if category already exists (case-insensitive)
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } 
    })

    if (existingCategory) {
      // If it exists but is inactive, activate it
      if (!existingCategory.isActive) {
        existingCategory.isActive = true
        existingCategory.usageCount += 1
        await existingCategory.save()
        return res.json(existingCategory)
      }
      
      // If already active, just increment usage
      existingCategory.usageCount += 1
      await existingCategory.save()
      return res.json(existingCategory)
    }

    // Create new category
    const newCategory = new Category({
      name: trimmedName,
      isDefault: false,
      createdBy: user?._id || user?.id,
      usageCount: 1
    })

    await newCategory.save()
    res.status(201).json(newCategory)
  } catch (error) {
    console.error('Error creating category:', error)
    res.status(500).json({ message: 'Failed to create category' })
  }
}

// Initialize default categories (run once during setup)
export const initializeDefaultCategories = async (req, res) => {
  try {
    const defaultCategories = [
      'Music', 'Sports', 'Comedy', 'Arts', 'Culture', 
      'Travel', 'Festival', 'Workshop', 'Conference', 'Other'
    ]

    for (const name of defaultCategories) {
      await Category.findOneAndUpdate(
        { name },
        { 
          name, 
          isDefault: true, 
          isActive: true 
        },
        { upsert: true, new: true }
      )
    }

    res.json({ message: 'Default categories initialized successfully' })
  } catch (error) {
    console.error('Error initializing categories:', error)
    res.status(500).json({ message: 'Failed to initialize categories' })
  }
}

// Admin: Toggle category active status
export const toggleCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params
    const category = await Category.findById(id)

    if (!category) {
      return res.status(404).json({ message: 'Category not found' })
    }

    category.isActive = !category.isActive
    await category.save()

    res.json(category)
  } catch (error) {
    console.error('Error toggling category status:', error)
    res.status(500).json({ message: 'Failed to toggle category status' })
  }
}

// Admin: Get all categories (including inactive)
export const getAllCategoriesAdmin = async (req, res) => {
  try {
    const categories = await Category.find()
      .sort({ isDefault: -1, usageCount: -1, name: 1 })
      .populate('createdBy', 'name email')
    
    res.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(500).json({ message: 'Failed to fetch categories' })
  }
}
