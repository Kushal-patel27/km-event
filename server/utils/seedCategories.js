import Category from '../models/Category.js'

/**
 * Initialize default categories in the database
 * This should be run once when setting up the system
 */
export const seedCategories = async () => {
  try {
    const defaultCategories = [
      'Music',
      'Sports',
      'Comedy',
      'Arts',
      'Culture',
      'Travel',
      'Festival',
      'Workshop',
      'Conference',
      'Other'
    ]
    
    for (const name of defaultCategories) {
      await Category.findOneAndUpdate(
        { name }, // Find by name
        { 
          name, 
          isDefault: true, 
          isActive: true,
          usageCount: 0
        }, // Update/Insert these fields
        { 
          upsert: true, // Create if doesn't exist
          new: true,
          setDefaultsOnInsert: true
        }
      )
    }

    return { success: true, message: 'Default categories initialized' }
  } catch (error) {
    console.error('Error seeding categories:', error)
    return { success: false, error: error.message }
  }
}

export default seedCategories
