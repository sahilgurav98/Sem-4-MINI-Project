// Database connection helper.
// Keeps MongoDB connection logic in a single place.
const mongoose = require('mongoose');

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is missing. Please add it to your .env file.');
  }

  await mongoose.connect(mongoUri);
  console.log('✅ MongoDB connected successfully');
}

module.exports = connectDB;
