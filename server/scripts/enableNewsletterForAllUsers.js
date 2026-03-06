import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const enableNewsletterForAllUsers = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');

    const result = await User.updateMany(
      { 'preferences.newsletter': { $ne: true } },
      { $set: { 'preferences.newsletter': true } }
    );

    console.log('Newsletter enablement complete');
    console.log(`Matched users: ${result.matchedCount}`);
    console.log(`Updated users: ${result.modifiedCount}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error.message);
    try {
      await mongoose.connection.close();
    } catch {
      // ignore close error
    }
    process.exit(1);
  }
};

enableNewsletterForAllUsers();
