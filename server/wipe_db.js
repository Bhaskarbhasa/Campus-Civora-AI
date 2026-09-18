require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');

const User = require('./src/models/User.model');
const Complaint = require('./src/models/Complaint.model');
const Petition = require('./src/models/Petition.model');
const Poll = require('./src/models/Poll.model');
const LostFound = require('./src/models/LostFound.model');
const Notification = require('./src/models/Notification.model');
const bcrypt = require('bcryptjs');

const wipeDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    console.log('Wiping complaints...');
    await Complaint.deleteMany({});
    
    console.log('Wiping petitions...');
    await Petition.deleteMany({});
    
    console.log('Wiping polls...');
    await Poll.deleteMany({});
    
    console.log('Wiping lost and found...');
    await LostFound.deleteMany({});
    
    console.log('Wiping notifications...');
    await Notification.deleteMany({});
    
    console.log('Wiping users...');
    await User.deleteMany({});

    console.log('Creating one master admin account...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Civora@2024', salt);

    await User.create({
      name: 'Super Admin',
      email: 'admin@amrita.edu',
      passwordHash,
      role: 'super_admin',
      isVerified: true,
      isActive: true,
      isFirstLogin: false
    });

    console.log('====================================');
    console.log('Database Wiped Successfully!');
    console.log('A master admin has been created:');
    console.log('Email: admin@amrita.edu');
    console.log('Password: Civora@2024');
    console.log('====================================');

    process.exit(0);
  } catch (error) {
    console.error('Error wiping database:', error);
    process.exit(1);
  }
};

wipeDatabase();
