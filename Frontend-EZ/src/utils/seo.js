/**
 * SEO Utility for dynamic meta tag management
 * Update meta tags dynamically for each page
 */

export const updateMetaTags = ({
  title = 'K&M Events - Book Tickets for Amazing Events',
  description = 'Discover and book tickets for the best live events, concerts, conferences, and entertainment near you.',
  image = 'https://km-events.com/assets/og-image.png',
  url = 'https://km-events.com',
  type = 'website',
  keywords = 'events, tickets, concerts, conferences, entertainment'
}) => {
  // Update title
  document.title = title;
  
  // Update meta description
  updateOrCreateMetaTag('name', 'description', description);
  updateOrCreateMetaTag('name', 'keywords', keywords);
  
  // Open Graph tags
  updateOrCreateMetaTag('property', 'og:title', title);
  updateOrCreateMetaTag('property', 'og:description', description);
  updateOrCreateMetaTag('property', 'og:image', image);
  updateOrCreateMetaTag('property', 'og:type', type);
  updateOrCreateMetaTag('property', 'og:url', url);
  
  // Twitter Card tags
  updateOrCreateMetaTag('name', 'twitter:title', title);
  updateOrCreateMetaTag('name', 'twitter:description', description);
  updateOrCreateMetaTag('name', 'twitter:image', image);
  
  // Update canonical URL
  updateOrCreateCanonicalTag(url);
};

/**
 * Update or create meta tag
 */
const updateOrCreateMetaTag = (attribute, attributeValue, content) => {
  let element = document.querySelector(`meta[${attribute}="${attributeValue}"]`);
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, attributeValue);
    document.head.appendChild(element);
  }
  
  element.content = content;
};

/**
 * Update or create canonical tag
 */
const updateOrCreateCanonicalTag = (url) => {
  let link = document.querySelector('link[rel="canonical"]');
  
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  
  link.href = url;
};

/**
 * SEO meta tags for different page types
 */
export const SEO_PAGES = {
  HOME: {
    title: 'K&M Events - Book Tickets for Amazing Events',
    description: 'Discover and book tickets for the best live events, concerts, conferences, and entertainment near you. Join our waitlist for sold-out events.',
    keywords: 'events, tickets, concerts, conferences, entertainment, event booking, live events'
  },
  
  EVENTS: {
    title: 'Browse Events - K&M Events | Tickets for Live Events',
    description: 'Explore hundreds of live events including concerts, conferences, seminars, and entertainment. Buy tickets online or join the waitlist for sold-out events.',
    keywords: 'browse events, live events, concerts, conferences, tickets, event tickets, sold out events'
  },
  
  EVENT_DETAIL: {
    title: '{eventTitle} - Book Tickets | K&M Events',
    description: 'Get details about {eventTitle}. Book your tickets now or join the waitlist. Date: {eventDate}, Location: {eventLocation}',
    keywords: '{eventTitle}, event tickets, book tickets, {eventCategory}'
  },
  
  BOOKING: {
    title: 'Complete Your Booking - K&M Events',
    description: 'Secure your event tickets with K&M Events. Easy booking process with multiple payment options.',
    keywords: 'ticket booking, event booking, book tickets, payment'
  },
  
  MY_BOOKINGS: {
    title: 'My Bookings - K&M Events | Manage Your Tickets',
    description: 'View and manage all your event bookings and tickets. Download tickets and track upcoming events.',
    keywords: 'my bookings, my tickets, event management, ticket downloads'
  },
  
  WAITLIST: {
    title: 'My Waitlist - K&M Events | Get Notified for Sold-Out Events',
    description: 'Track your position in waitlists for sold-out events. Get notified when tickets become available.',
    keywords: 'waitlist, sold out events, event notifications, ticket availability'
  },
  
  LOGIN: {
    title: 'Login - K&M Events | Sign In to Your Account',
    description: 'Sign in to your K&M Events account to manage bookings, join waitlists, and access exclusive features.',
    keywords: 'login, sign in, account'
  },
  
  SIGNUP: {
    title: 'Sign Up - K&M Events | Create Your Account',
    description: 'Create a new K&M Events account to book tickets, join waitlists, and never miss your favorite events.',
    keywords: 'sign up, register, create account'
  },
  
  FOR_ORGANIZERS: {
    title: 'For Organizers - K&M Events | Host Your Event',
    description: 'Create and manage events with K&M Events. Reach thousands of attendees and manage ticket sales effortlessly.',
    keywords: 'event organizer, host event, event management, ticket sales'
  }
};

/**
 * Generate dynamic SEO tags for event detail page
 */
export const generateEventSEO = (event) => {
  if (!event) return SEO_PAGES.EVENT_DETAIL;
  
  return {
    title: `${event.title} - Book Tickets | K&M Events`,
    description: `Get details about ${event.title}. Book your tickets now or join the waitlist. Date: ${new Date(event.date).toLocaleDateString()}, Location: ${event.location}`,
    keywords: `${event.title}, event tickets, book tickets, ${event.category || 'events'}`,
    url: `https://km-events.com/event/${event._id || event.id}`
  };
};

/**
 * Generate structured data (JSON-LD) for events
 */
export const generateEventStructuredData = (event) => {
  if (!event) return null;
  
  return {
    "@context": "https://schema.org/",
    "@type": "Event",
    "name": event.title,
    "description": event.description,
    "startDate": new Date(event.date).toISOString(),
    "endDate": new Date(new Date(event.date).getTime() + 3 * 60 * 60 * 1000).toISOString(),
    "location": {
      "@type": "Place",
      "name": event.location,
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "IN"
      }
    },
    "image": event.image || "https://km-events.com/assets/og-image.png",
    "offers": {
      "@type": "Offer",
      "url": `https://km-events.com/event/${event._id || event.id}`,
      "price": event.price || "0",
      "priceCurrency": "INR",
      "availability": event.availableTickets > 0 ? "InStock" : "OutOfStock"
    },
    "organizer": {
      "@type": "Organization",
      "name": event.organizer?.name || "K&M Events",
      "url": "https://km-events.com"
    }
  };
};

export default updateMetaTags;
