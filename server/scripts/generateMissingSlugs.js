import mongoose from 'mongoose';
import Event from '../models/Event.js';
import dotenv from 'dotenv';

dotenv.config();

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

const generateUniqueSlugs = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');

    // Find all events without slugs
    const eventsWithoutSlugs = await Event.find({ slug: { $in: [null, ''] } });
    console.log(`Found ${eventsWithoutSlugs.length} events without slugs`);

    let updated = 0;
    let skipped = 0;

    for (const event of eventsWithoutSlugs) {
      const baseSlug = generateSlug(event.title);
      
      // Find if this slug already exists
      let uniqueSlug = baseSlug;
      let slugExists = await Event.findOne({ slug: uniqueSlug, _id: { $ne: event._id } });
      
      if (slugExists) {
        // Append timestamp to make it unique
        uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;
        console.log(`Slug conflict for "${event.title}". Using: ${uniqueSlug}`);
      }

      if (uniqueSlug) {
        event.slug = uniqueSlug;
        await event.save();
        console.log(`✓ Generated slug "${uniqueSlug}" for event "${event.title}"`);
        updated++;
      } else {
        console.log(`✗ Could not generate slug for event "${event.title}"`);
        skipped++;
      }
    }

    console.log(`\nMigration complete!`);
    console.log(`✓ Updated: ${updated} events`);
    console.log(`✗ Skipped: ${skipped} events`);

    // Also show events that don't have shortCode
    const eventsWithoutShortCode = await Event.find({ shortCode: { $in: [null, ''] } });
    if (eventsWithoutShortCode.length > 0) {
      console.log(`\nNote: ${eventsWithoutShortCode.length} events are missing shortCodes`);
      console.log('Run: npm run generate:shortcodes');
    }

    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error.message);
    process.exit(1);
  }
};

generateUniqueSlugs();
