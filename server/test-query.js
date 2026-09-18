const mongoose = require('mongoose');
const Complaint = require('./src/models/Complaint.model');
const User = require('./src/models/User.model');
require('dotenv').config({ path: './.env' });
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const warden = await User.findOne({ name: 'B Babu' });
  const query = { 'location.hostelBlock': warden.hostelBlock, status: { $in: ['under_verification', 'submitted', 'ai_processing'] } };
  const matches = await Complaint.find(query);
  console.log('Query matches:', matches.length);
  process.exit(0);
});
