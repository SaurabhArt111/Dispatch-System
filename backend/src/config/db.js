const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dispatch_management';
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log(`[db] Connected to MongoDB: ${uri}`);
}

module.exports = connectDB;
