require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('d:/Final_Year_Project/Campus_Civora_Ai_Antigravity/server/src/models/User.model');
const Complaint = require('d:/Final_Year_Project/Campus_Civora_Ai_Antigravity/server/src/models/Complaint.model');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB. Wiping collections...');

    await User.deleteMany({});
    await Complaint.deleteMany({});
    
    console.log('Collections wiped.');

    const defaultPassword = await bcrypt.hash('password123', 12);

    const usersToCreate = [
      // Admins & Supervisors
      { name: 'Super Admin', email: 'admin@ch.amrita.edu', role: 'super_admin', isVerified: true, isActive: true },
      { name: 'Maintenance Supervisor', email: 'supervisor@ch.amrita.edu', role: 'maintenance_supervisor', isVerified: true, isActive: true },
      { name: 'Electrician', email: 'electrician@ch.amrita.edu', role: 'electrician', isVerified: true, isActive: true },
      { name: 'Plumber', email: 'plumber@ch.amrita.edu', role: 'plumber', isVerified: true, isActive: true },

      // Chief Warden
      { name: 'Sabari', email: 'sabari@ch.amrita.edu', role: 'chief_warden', isVerified: true, isActive: true },

      // Hostels
      { name: 'C. S. M. Lekshmi', email: 'sm_lekshmi@ch.amrita.edu', role: 'warden', hostelBlock: 'Koushitaki Bhavan', isVerified: true, isActive: true },
      { name: 'B. Babu', email: 'b_babu@ch.amrita.edu', role: 'warden', hostelBlock: 'Chandogya Bhavan', isVerified: true, isActive: true },
      { name: 'M. Chithambaram', email: 'm_chithambaram@ch.amrita.edu', role: 'warden', hostelBlock: 'Aitareya Bhavan', isVerified: true, isActive: true },
      { name: 'M. Sakthinath', email: 'm_sakthinath@ch.amrita.edu', role: 'warden', hostelBlock: 'Pranava Bhavan', isVerified: true, isActive: true },
      { name: 'Gavi Reddi Nokinidu', email: 'g_nokinidu@ch.amrita.edu', role: 'warden', hostelBlock: 'Maitri Bhavan', isVerified: true, isActive: true },
      { name: 'G. Chandrasekaran', email: 'g_chandrasekaran@ch.amrita.edu', role: 'warden', hostelBlock: 'Aswini Bhavan', isVerified: true, isActive: true },

      // Class Advisors (Departments)
      { name: 'Dr. Jinka Venkata Aravind', email: 'jv_aravind@ch.amrita.edu', role: 'class_advisor', department: 'CSE', isVerified: true, isActive: true },
      { name: 'Dr. M. Rithani', email: 'm_rithani@ch.amrita.edu', role: 'class_advisor', department: 'CSE - AI', isVerified: true, isActive: true },
      { name: 'Dr. S. Saravanan', email: 's_saravanan@ch.amrita.edu', role: 'class_advisor', department: 'CSE - CYS', isVerified: true, isActive: true },
      { name: 'Dr. V. Thenmozhi', email: 'v_thenmozhi@ch.amrita.edu', role: 'class_advisor', department: 'CCE', isVerified: true, isActive: true },
      { name: 'Dr. R. Vaishshale', email: 'r_vaisshale@ch.amrita.edu', role: 'class_advisor', department: 'ECE', isVerified: true, isActive: true },
      { name: 'Dr. Sunil Kumar', email: 's_kumar@ch.amrita.edu', role: 'class_advisor', department: 'ARE', isVerified: true, isActive: true },
      { name: 'M. Vignesh', email: 'm_vignesh@ch.amrita.edu', role: 'class_advisor', department: 'MEE', isVerified: true, isActive: true },

      // Lab Assistants
      { name: 'Nilkantham', email: 'nilkantham@ch.amrita.edu', role: 'lab_assistant', hostelBlock: 'RHISC Lab', isVerified: true, isActive: true },
      { name: 'Dinesh', email: 'dinesh@ch.amrita.edu', role: 'lab_assistant', hostelBlock: 'VIBES Lab', isVerified: true, isActive: true },
      { name: 'Masima', email: 'masima@ch.amrita.edu', role: 'lab_assistant', hostelBlock: 'ASRA Lab', isVerified: true, isActive: true },
      { name: 'Suresh', email: 'suresh@ch.amrita.edu', role: 'lab_assistant', hostelBlock: 'SHIELD Lab', isVerified: true, isActive: true },
      { name: 'Naidu', email: 'naidu@ch.amrita.edu', role: 'lab_assistant', hostelBlock: 'AI Innovation Lab', isVerified: true, isActive: true },
      { name: 'Bhagya & Ram', email: 'bhagya@ch.amrita.edu', role: 'lab_assistant', hostelBlock: 'Computer Lab 1 & 2', isVerified: true, isActive: true },

      // Test Student
      { name: 'Student Test', email: 'student@ch.students.amrita.edu', role: 'student', department: 'CSE - AI', hostelBlock: 'Chandogya Bhavan', year: 3, isVerified: true, isActive: true }
    ];

    const usersWithPasswords = usersToCreate.map(u => ({ ...u, passwordHash: defaultPassword, isFirstLogin: false }));
    await User.insertMany(usersWithPasswords);
    
    console.log('Successfully seeded Amrita real data! All passwords are: password123');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
