import mongoose from 'mongoose'

const organizersPageContentSchema = new mongoose.Schema({
  // Hero Section
  hero: {
    title: {
      type: String,
      default: 'Host Your Next Event with K&M Events'
    },
    subtitle: {
      type: String,
      default: 'Launch your event on K&M Events and reach thousands of enthusiasts. We handle ticketing, QR codes, payments, and support—so you can focus on creating amazing experiences.'
    },
    buttonText1: {
      type: String,
      default: 'Submit Your Event'
    },
    buttonText2: {
      type: String,
      default: 'Contact Sales'
    }
  },

  // Benefits Section
  benefits: {
    title: {
      type: String,
      default: 'Why Choose K&M Events?'
    },
    subtitle: {
      type: String,
      default: 'Everything you need to host successful events and sell tickets effortlessly'
    },
    items: [
      {
        icon: String,
        title: String,
        description: String
      }
    ]
  },

  // How It Works Section
  steps: {
    title: {
      type: String,
      default: 'How It Works'
    },
    subtitle: {
      type: String,
      default: 'Get your event live in 4 simple steps'
    },
    items: [
      {
        number: String,
        title: String,
        description: String
      }
    ]
  },

  // FAQ Section
  faqs: {
    title: {
      type: String,
      default: 'Frequently Asked Questions'
    },
    items: [
      {
        question: String,
        answer: String
      }
    ]
  },

  // Final CTA Section
  cta: {
    title: {
      type: String,
      default: 'Ready to Get Started?'
    },
    subtitle: {
      type: String,
      default: 'Join thousands of organizers who trust K&M Events to power their events'
    },
    buttonText1: {
      type: String,
      default: 'Submit Your Event Now'
    },
    buttonText2: {
      type: String,
      default: 'Talk to Sales'
    }
  },

  // Track changes
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true })

export default mongoose.model('OrganizersPageContent', organizersPageContentSchema)
