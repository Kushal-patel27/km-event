import SubscriptionPlan from '../models/SubscriptionPlan.js'

// Get all subscription plans
export const getAllPlans = async (req, res) => {
  try {
    // If 'all' param is provided, return all plans (for admin)
    const query = req.query.all === 'true' ? {} : { isActive: true }
    
    const plans = await SubscriptionPlan.find(query).sort({ displayOrder: 1 })
    res.json({
      success: true,
      plans
    })
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching subscription plans',
      error: err.message 
    })
  }
}

// Get a single plan by ID
export const getPlanById = async (req, res) => {
  try {
    const { id } = req.params
    const plan = await SubscriptionPlan.findById(id)
    
    if (!plan) {
      return res.status(404).json({ 
        success: false,
        message: 'Subscription plan not found' 
      })
    }

    res.json({
      success: true,
      plan
    })
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching subscription plan',
      error: err.message 
    })
  }
}

// Get a plan by name
export const getPlanByName = async (req, res) => {
  try {
    const { name } = req.params
    const plan = await SubscriptionPlan.findOne({ name, isActive: true })
    
    if (!plan) {
      return res.status(404).json({ 
        success: false,
        message: 'Subscription plan not found' 
      })
    }

    res.json({
      success: true,
      plan
    })
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching subscription plan',
      error: err.message 
    })
  }
}

// Super Admin: Create new subscription plan
export const createPlan = async (req, res) => {
  try {
    const planData = req.body
    
    // Validate required fields
    if (!planData.name || !planData.displayName || !planData.description) {
      return res.status(400).json({ 
        success: false,
        message: 'Name, Display Name, and Description are required' 
      })
    }
    
    const existingPlan = await SubscriptionPlan.findOne({ name: planData.name })
    if (existingPlan) {
      return res.status(400).json({ 
        success: false,
        message: 'A plan with this name already exists' 
      })
    }

    const plan = new SubscriptionPlan(planData)
    const savedPlan = await plan.save()

    res.status(201).json({
      success: true,
      message: 'Subscription plan created successfully',
      plan: savedPlan
    })
  } catch (err) {
    // Handle MongoDB validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message)
      return res.status(400).json({ 
        success: false,
        message: 'Validation error',
        errors: errors,
        error: err.message 
      })
    }
    res.status(500).json({ 
      success: false,
      message: 'Error creating subscription plan',
      error: err.message 
    })
  }
}

// Super Admin: Update subscription plan
export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    // Validate required fields
    if (!updates.displayName || !updates.description) {
      return res.status(400).json({ 
        success: false,
        message: 'Display Name and Description are required' 
      })
    }

    const plan = await SubscriptionPlan.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )

    if (!plan) {
      return res.status(404).json({ 
        success: false,
        message: 'Subscription plan not found' 
      })
    }

    res.status(200).json({
      success: true,
      message: 'Subscription plan updated successfully',
      plan
    })
  } catch (err) {
    // Handle MongoDB validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message)
      return res.status(400).json({ 
        success: false,
        message: 'Validation error',
        errors: errors,
        error: err.message 
      })
    }
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'A plan with this name already exists' 
      })
    }
    res.status(500).json({ 
      success: false,
      message: 'Error updating subscription plan',
      error: err.message 
    })
  }
}

// Super Admin: Delete/deactivate subscription plan
export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params

    // Soft delete by setting isActive to false
    const plan = await SubscriptionPlan.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    )

    if (!plan) {
      return res.status(404).json({ 
        success: false,
        message: 'Subscription plan not found' 
      })
    }

    res.json({
      success: true,
      message: 'Subscription plan deactivated successfully',
      plan
    })
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Error deactivating subscription plan',
      error: err.message 
    })
  }
}

// Compare plans side-by-side
export const comparePlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true }).sort({ displayOrder: 1 })
    
    // Format for comparison table
    const comparison = {
      plans: plans.map(p => ({
        name: p.name,
        displayName: p.displayName,
        price: p.price,
        features: p.features,
        limits: p.limits
      }))
    }

    res.json({
      success: true,
      comparison
    })
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Error comparing plans',
      error: err.message 
    })
  }
}
