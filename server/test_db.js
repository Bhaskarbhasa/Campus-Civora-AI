const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || 'YOUR_MONGODB_URI_HERE';

async function test() {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection failed:');
    console.error(err);
    process.exit(1);
  }
}

test();
