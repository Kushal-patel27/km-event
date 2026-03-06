import mongoose from 'mongoose';
import EventTemplate from '../models/EventTemplate.js';
import dotenv from 'dotenv';

dotenv.config();

const defaultTemplates = [
  {
    name: 'Live Music Concert',
    category: 'concert',
    defaultDescription: 'Join us for an unforgettable evening of live music featuring talented artists. Experience the energy, excitement, and passion of live performance in an intimate setting. Perfect for music lovers and those seeking an entertaining night out.',
    defaultBanner: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200',
    previewImage: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400',
    defaultPrice: 1500,
    defaultCurrency: 'INR',
    defaultCapacity: 500,
    defaultDuration: { hours: 3, minutes: 0 },
    isPremium: false,
    tags: ['music', 'live', 'entertainment', 'concert'],
    customFields: {
      venue_type: 'Concert Hall',
      audio_setup: 'Professional PA System',
      seating: 'Standing and Reserved Seating'
    }
  },
  {
    name: 'Professional Conference',
    category: 'conference',
    defaultDescription: 'A premier professional conference bringing together industry leaders, innovators, and experts. Features keynote speeches, panel discussions, networking opportunities, and workshops. Ideal for professional development and industry insights.',
    defaultBanner: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
    previewImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400',
    defaultPrice: 5000,
    defaultCurrency: 'INR',
    defaultCapacity: 200,
    defaultDuration: { hours: 8, minutes: 0 },
    isPremium: true,
    tags: ['conference', 'business', 'networking', 'professional'],
    customFields: {
      includes: 'Lunch, Coffee Breaks, Materials',
      format: 'In-person',
      certificates: 'Participation Certificate Provided'
    }
  },
  {
    name: 'Dream Wedding Celebration',
    category: 'wedding',
    defaultDescription: 'Celebrate your special day with elegance and joy. A beautifully planned wedding ceremony and reception with all the traditional touches. Create lasting memories with family and friends in a stunning venue.',
    defaultBanner: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200',
    previewImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400',
    defaultPrice: 150000,
    defaultCurrency: 'INR',
    defaultCapacity: 300,
    defaultDuration: { hours: 6, minutes: 0 },
    isPremium: true,
    tags: ['wedding', 'ceremony', 'celebration', 'special'],
    customFields: {
      includes: 'Catering, Decoration, Photography',
      venue_type: 'Banquet Hall',
      services: 'Full Wedding Planning Support'
    }
  },
  {
    name: 'Skill Development Workshop',
    category: 'workshop',
    defaultDescription: 'Hands-on interactive workshop designed to build practical skills and knowledge. Led by experienced instructors with real-world expertise. Includes exercises, discussions, and take-home materials.',
    defaultBanner: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200',
    previewImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400',
    defaultPrice: 2000,
    defaultCurrency: 'INR',
    defaultCapacity: 50,
    defaultDuration: { hours: 4, minutes: 0 },
    isPremium: false,
    tags: ['workshop', 'learning', 'skills', 'training'],
    customFields: {
      level: 'All Levels Welcome',
      materials: 'All Materials Provided',
      certification: 'Certificate of Completion'
    }
  },
  {
    name: 'Industry Seminar',
    category: 'seminar',
    defaultDescription: 'Educational seminar featuring expert speakers sharing insights on current trends and best practices. Includes Q&A session and networking time. Perfect for staying updated with industry developments.',
    defaultBanner: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=1200',
    previewImage: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=400',
    defaultPrice: 1000,
    defaultCurrency: 'INR',
    defaultCapacity: 100,
    defaultDuration: { hours: 3, minutes: 0 },
    isPremium: false,
    tags: ['seminar', 'education', 'learning', 'professional'],
    customFields: {
      format: 'Presentation + Q&A',
      materials: 'Digital Materials Provided',
      refreshments: 'Light Refreshments Included'
    }
  },
  {
    name: 'Cultural Festival',
    category: 'festival',
    defaultDescription: 'A vibrant celebration of culture, art, and community. Multiple stages featuring performances, food stalls, art exhibitions, and activities for all ages. Experience diverse traditions and entertainment in a festive atmosphere.',
    defaultBanner: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200',
    previewImage: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400',
    defaultPrice: 500,
    defaultCurrency: 'INR',
    defaultCapacity: 2000,
    defaultDuration: { hours: 10, minutes: 0 },
    isPremium: false,
    tags: ['festival', 'culture', 'celebration', 'family'],
    customFields: {
      activities: 'Multiple Stages, Food, Art, Games',
      venue_type: 'Outdoor Festival Ground',
      family_friendly: 'Yes'
    }
  },
  {
    name: 'Sports Championship',
    category: 'sports',
    defaultDescription: 'Exciting sports tournament featuring competitive matches and skilled athletes. Watch thrilling action, support your favorite teams, and enjoy the energy of live sports. Includes halftime entertainment and refreshments.',
    defaultBanner: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200',
    previewImage: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400',
    defaultPrice: 800,
    defaultCurrency: 'INR',
    defaultCapacity: 1000,
    defaultDuration: { hours: 5, minutes: 0 },
    isPremium: false,
    tags: ['sports', 'tournament', 'competition', 'athletic'],
    customFields: {
      sport_type: 'Multiple Events',
      facilities: 'Professional Sports Venue',
      parking: 'Available'
    }
  },
  {
    name: 'Art & Design Exhibition',
    category: 'exhibition',
    defaultDescription: 'Showcase of contemporary art and design featuring works from talented artists and designers. Explore diverse styles, meet the creators, and discover unique pieces. Perfect for art enthusiasts and collectors.',
    defaultBanner: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=1200',
    previewImage: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=400',
    defaultPrice: 300,
    defaultCurrency: 'INR',
    defaultCapacity: 150,
    defaultDuration: { hours: 6, minutes: 0 },
    isPremium: false,
    tags: ['exhibition', 'art', 'design', 'gallery'],
    customFields: {
      artists: '15+ Featured Artists',
      venue_type: 'Gallery Space',
      sales: 'Artworks Available for Purchase'
    }
  },
  {
    name: 'Professional Networking Event',
    category: 'networking',
    defaultDescription: 'Connect with professionals from your industry in a relaxed, engaging environment. Features structured networking sessions, conversation starters, and refreshments. Expand your professional network and discover new opportunities.',
    defaultBanner: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200',
    previewImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400',
    defaultPrice: 1500,
    defaultCurrency: 'INR',
    defaultCapacity: 80,
    defaultDuration: { hours: 3, minutes: 0 },
    isPremium: false,
    tags: ['networking', 'business', 'professional', 'connections'],
    customFields: {
      format: 'Structured + Free Networking',
      refreshments: 'Cocktails & Appetizers',
      dress_code: 'Business Casual'
    }
  },
  {
    name: 'Community Meetup',
    category: 'meetup',
    defaultDescription: 'Casual gathering for community members to connect, share ideas, and build relationships. Open to all skill levels and backgrounds. Features informal discussions, activities, and refreshments in a welcoming atmosphere.',
    defaultBanner: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200',
    previewImage: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=400',
    defaultPrice: 0,
    defaultCurrency: 'INR',
    defaultCapacity: 50,
    defaultDuration: { hours: 2, minutes: 30 },
    isPremium: false,
    tags: ['meetup', 'community', 'social', 'networking'],
    customFields: {
      format: 'Casual & Informal',
      venue_type: 'Cafe or Community Space',
      cost: 'Free Event'
    }
  },
  {
    name: 'Online Webinar',
    category: 'webinar',
    defaultDescription: 'Interactive online session featuring expert presentations and live Q&A. Join from anywhere with internet access. Includes recording access, downloadable resources, and follow-up materials.',
    defaultBanner: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=1200',
    previewImage: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400',
    defaultPrice: 500,
    defaultCurrency: 'INR',
    defaultCapacity: 500,
    defaultDuration: { hours: 1, minutes: 30 },
    isPremium: false,
    tags: ['webinar', 'online', 'virtual', 'education'],
    customFields: {
      platform: 'Zoom/Google Meet',
      recording: 'Available for 30 Days',
      interaction: 'Live Q&A Session'
    }
  },
  {
    name: 'Celebration Party',
    category: 'party',
    defaultDescription: 'Lively party with music, dancing, entertainment, and great company. Featuring DJ, refreshments, and a fun atmosphere. Perfect for celebrations, special occasions, or just a great night out with friends.',
    defaultBanner: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1200',
    previewImage: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400',
    defaultPrice: 2000,
    defaultCurrency: 'INR',
    defaultCapacity: 150,
    defaultDuration: { hours: 5, minutes: 0 },
    isPremium: false,
    tags: ['party', 'celebration', 'music', 'dance'],
    customFields: {
      entertainment: 'DJ + Live Entertainment',
      includes: 'Food & Beverages',
      dress_code: 'Festive Attire'
    }
  },
  {
    name: 'Charity Fundraiser',
    category: 'fundraiser',
    defaultDescription: 'Fundraising event supporting a worthy cause. Features entertainment, auction items, and opportunities to contribute. Join us in making a difference while enjoying an evening of community and compassion.',
    defaultBanner: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1200',
    previewImage: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400',
    defaultPrice: 2500,
    defaultCurrency: 'INR',
    defaultCapacity: 200,
    defaultDuration: { hours: 4, minutes: 0 },
    isPremium: false,
    tags: ['fundraiser', 'charity', 'nonprofit', 'community'],
    customFields: {
      cause: 'Supporting Local Community',
      tax_deductible: 'Yes',
      activities: 'Auction, Entertainment, Dinner'
    }
  },
  {
    name: 'Special Event',
    category: 'other',
    defaultDescription: 'A unique event designed for a specific purpose or occasion. Customizable to meet your specific needs and goals. Contact us to discuss how we can make your vision a reality.',
    defaultBanner: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200',
    previewImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400',
    defaultPrice: 1000,
    defaultCurrency: 'INR',
    defaultCapacity: 100,
    defaultDuration: { hours: 3, minutes: 0 },
    isPremium: false,
    tags: ['event', 'special', 'custom'],
    customFields: {
      customizable: 'Fully Customizable',
      contact: 'Contact for Details'
    }
  }
];

async function seedTemplates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Check if templates already exist
    const existingCount = await EventTemplate.countDocuments();
    if (existingCount > 0) {
      console.log(`\n⚠️  Found ${existingCount} existing templates in database.`);
      console.log('Do you want to:');
      console.log('  1. Skip seeding (keep existing templates)');
      console.log('  2. Add new templates alongside existing ones');
      console.log('  3. Clear all and seed fresh templates');
      console.log('\nTo proceed, modify the script or clear manually.');
      console.log('Exiting to prevent accidental data loss...\n');
      process.exit(0);
    }

    // Create a system user ID for the templates
    // In production, you might want to use an actual admin user ID
    const systemUserId = new mongoose.Types.ObjectId('000000000000000000000000');

    // Add createdBy field to each template
    const templatesWithUser = defaultTemplates.map(template => ({
      ...template,
      createdBy: systemUserId,
      isActive: true
    }));

    // Insert templates
    const result = await EventTemplate.insertMany(templatesWithUser);
    console.log(`\n✅ Successfully created ${result.length} default templates!\n`);

    // Display created templates
    console.log('Created templates:');
    result.forEach((template, index) => {
      console.log(`  ${index + 1}. ${template.name} (${template.category})`);
    });

    console.log('\n📋 Template Summary:');
    console.log(`  - Total: ${result.length}`);
    console.log(`  - Premium: ${result.filter(t => t.isPremium).length}`);
    console.log(`  - Free: ${result.filter(t => !t.isPremium).length}`);
    console.log(`  - Categories: ${new Set(result.map(t => t.category)).size}`);

    console.log('\n🎯 Next Steps:');
    console.log('  1. Access admin panel: http://localhost:5173/admin/templates');
    console.log('  2. View created templates');
    console.log('  3. Clone templates to create events');
    console.log('  4. Customize templates as needed\n');

  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Database connection closed\n');
  }
}

// Run the seed function
seedTemplates();
