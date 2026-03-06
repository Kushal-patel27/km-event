import mongoose from 'mongoose';
import Event from '../models/Event.js';
import dotenv from 'dotenv';
import { nanoid } from 'nanoid';

dotenv.config();

const generateMissingShortCodes = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');

    // Find all events without shortCodes
    const eventsWithoutCodes = await Event.find({ shortCode: { $in: [null, ''] } });
    console.log(`Found ${eventsWithoutCodes.length} events without short codes`);

    let updated = 0;
    let skipped = 0;

    for (const event of eventsWithoutCodes) {
      let shortCode = nanoid(8).toUpperCase();
      let codeExists = await Event.findOne({ shortCode });
      
      // Retry if code already exists (very unlikely with nanoid)
      let attempts = 0;
      while (codeExists && attempts < 5) {
        shortCode = nanoid(8).toUpperCase();
        codeExists = await Event.findOne({ shortCode });
        attempts++;
      }

      if (!codeExists) {
        event.shortCode = shortCode;
        await event.save();
        console.log(`✓ Generated short code "${shortCode}" for event "${event.title}"`);
        updated++;
      } else {
        console.log(`✗ Failed to generate unique short code for event "${event.title}"`);
        skipped++;
      }
    }

    console.log(`\nMigration complete!`);
    console.log(`✓ Updated: ${updated} events`);
    console.log(`✗ Skipped: ${skipped} events`);

    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error.message);
    process.exit(1);
  }
};

generateMissingShortCodes();
