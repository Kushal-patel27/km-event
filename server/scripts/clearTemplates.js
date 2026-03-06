import mongoose from 'mongoose';
import EventTemplate from '../models/EventTemplate.js';
import dotenv from 'dotenv';

dotenv.config();

async function clearTemplates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Count existing templates
    const count = await EventTemplate.countDocuments();
    console.log(`\nFound ${count} templates in database.`);

    if (count === 0) {
      console.log('No templates to clear.\n');
      process.exit(0);
    }

    // Delete all templates
    const result = await EventTemplate.deleteMany({});
    console.log(`✅ Successfully deleted ${result.deletedCount} templates.\n`);

  } catch (error) {
    console.error('❌ Error clearing templates:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Database connection closed\n');
  }
}

// Run the clear function
clearTemplates();
