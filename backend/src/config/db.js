const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dispatch_management';
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);

  const deliveryChallans = mongoose.connection.collection('deliverychallans');
  const indexes = await deliveryChallans.indexes();
  if (indexes.some((index) => index.name === 'challanNo_1')) {
    await deliveryChallans.dropIndex('challanNo_1');
    console.log('[db] Removed obsolete deliverychallans.challanNo_1 index');
  }

  console.log(`[db] Connected to MongoDB: ${uri}`);
}

module.exports = connectDB;
