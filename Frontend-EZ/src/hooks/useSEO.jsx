import { useEffect } from 'react';
import { updateMetaTags, generateEventStructuredData } from '../utils/seo';

/**
 * React Hook for managing SEO meta tags
 * Usage: usePageSEO({ title: 'Page Title', description: 'Page description' })
 */
export const usePageSEO = ({
  title = 'K&M Events - Book Tickets for Amazing Events',
  description = 'Discover and book tickets for the best live events, concerts, conferences, and entertainment near you.',
  image = 'https://km-events.com/assets/og-image.png',
  url = 'https://km-events.com',
  type = 'website',
  keywords = 'events, tickets, concerts, conferences, entertainment',
  structuredData = null
} = {}) => {
  useEffect(() => {
    // Update meta tags
    updateMetaTags({
      title,
      description,
      image,
      url,
      type,
      keywords
    });

    // Add structured data if provided
    if (structuredData) {
      addStructuredData(structuredData);
    }

    // Scroll to top
    window.scrollTo(0, 0);
  }, [title, description, image, url, type, keywords, structuredData]);
};

/**
 * Add JSON-LD structured data to page
 */
const addStructuredData = (data) => {
  // Remove existing structured data script
  const existingScript = document.querySelector('script[type="application/ld+json"][data-type="dynamic"]');
  if (existingScript) {
    existingScript.remove();
  }

  // Create and append new structured data
  if (data) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-type', 'dynamic');
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }
};

/**
 * React Component for Page SEO
 * Usage: <PageSEO title="Title" description="Description" />
 */
export const PageSEO = ({
  title = 'K&M Events - Book Tickets for Amazing Events',
  description = 'Discover and book tickets for the best live events, concerts, conferences, and entertainment near you.',
  image = 'https://km-events.com/assets/og-image.png',
  url = 'https://km-events.com',
  type = 'website',
  keywords = 'events, tickets, concerts, conferences, entertainment',
  structuredData = null
}) => {
  usePageSEO({
    title,
    description,
    image,
    url,
    type,
    keywords,
    structuredData
  });

  return null; // This component doesn't render anything
};

export default usePageSEO;
