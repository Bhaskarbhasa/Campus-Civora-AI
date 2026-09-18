require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load all models
const User = require('../src/models/User.model');
const Complaint = require('../src/models/Complaint.model');
const Petition = require('../src/models/Petition.model');
const Poll = require('../src/models/Poll.model');
const LostFound = require('../src/models/LostFound.model');
const Department = require('../src/models/Department.model');
const SLAConfig = require('../src/models/SLAConfig.model');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_civora_ai';
const DEFAULT_PASSWORD = 'Civora@2024';

const hash = (pwd) => bcrypt.hash(pwd, 12);

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}), Complaint.deleteMany({}), Petition.deleteMany({}),
    Poll.deleteMany({}), LostFound.deleteMany({}), Department.deleteMany({}), SLAConfig.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  const passwordHash = await hash(DEFAULT_PASSWORD);

  // ===================== DEPARTMENTS =====================
  const departments = await Department.insertMany([
    { name: 'Computer Science & Engineering', code: 'CSE', type: 'academic', complaintCategories: ['classroom_equipment', 'laboratory_equipment', 'internet_connectivity', 'academic_grievance'] },
    { name: 'Electronics & Communication', code: 'ECE', type: 'academic', complaintCategories: ['classroom_equipment', 'laboratory_equipment', 'academic_grievance'] },
    { name: 'Mechanical Engineering', code: 'MECH', type: 'academic', complaintCategories: ['laboratory_equipment', 'academic_grievance'] },
    { name: 'Civil Engineering', code: 'CIVIL', type: 'academic', complaintCategories: ['civil_maintenance', 'academic_grievance'] },
    { name: 'Hostel Administration', code: 'HOSTEL', type: 'hostel', complaintCategories: ['hostel_facilities', 'electrical', 'plumbing', 'housekeeping'] },
    { name: 'Electrical Maintenance', code: 'ELECT', type: 'maintenance', complaintCategories: ['electrical'] },
    { name: 'IT Department', code: 'IT', type: 'maintenance', complaintCategories: ['internet_connectivity'] },
    { name: 'Transport Department', code: 'TRANS', type: 'support', complaintCategories: ['transportation'] },
    { name: 'Library', code: 'LIB', type: 'support', complaintCategories: ['library'] },
    { name: 'Security Department', code: 'SEC', type: 'support', complaintCategories: ['security'] },
    { name: 'Mess & Canteen', code: 'MESS', type: 'support', complaintCategories: ['food_services'] },
    { name: 'Student Welfare', code: 'SWO', type: 'administrative', complaintCategories: ['general_administration', 'academic_grievance'] },
    { name: 'Examination Cell', code: 'EXAM', type: 'administrative', complaintCategories: ['examination'] },
  ]);
  console.log(`✅ Created ${departments.length} departments`);

  // ===================== SLA CONFIG =====================
  await SLAConfig.insertMany([
    { priority: 'emergency', responseTimeHours: 2, resolutionTimeHours: 24, escalationSteps: [{ afterHours: 2, escalateTo: 'principal', notifyRoles: ['director', 'security'] }] },
    { priority: 'high', responseTimeHours: 24, resolutionTimeHours: 72, escalationSteps: [{ afterHours: 24, escalateTo: 'chief_warden', notifyRoles: ['student_welfare'] }, { afterHours: 48, escalateTo: 'principal' }] },
    { priority: 'medium', responseTimeHours: 48, resolutionTimeHours: 168, escalationSteps: [{ afterHours: 48, escalateTo: 'chief_warden' }, { afterHours: 96, escalateTo: 'dean' }] },
    { priority: 'low', responseTimeHours: 120, resolutionTimeHours: 336, escalationSteps: [{ afterHours: 120, escalateTo: 'hod' }] },
  ]);
  console.log('✅ Created SLA configs');

  // ===================== ADMIN / LEADERSHIP =====================
  const superAdmin = await User.create({ name: 'System Administrator', email: 'admin@amrita.edu', passwordHash, role: 'super_admin', isVerified: true, isFirstLogin: false, isActive: true, designation: 'Super Administrator' });
  const director = await User.create({ name: 'Dr. Venkat Rangan', email: 'director@amrita.edu', passwordHash, role: 'director', isVerified: true, isFirstLogin: false, designation: 'Director', department: 'Administration', isActive: true });
  const principal = await User.create({ name: 'Dr. Meenakshi Sundaram', email: 'principal@amrita.edu', passwordHash, role: 'principal', designation: 'Principal', department: 'Administration', isVerified: true, isFirstLogin: false, isActive: true });
  const registrar = await User.create({ name: 'Mr. Rajesh Kumar', email: 'registrar@amrita.edu', passwordHash, role: 'registrar', designation: 'Registrar', department: 'Administration', isVerified: true, isFirstLogin: false, isActive: true });

  // ===================== DEANS =====================
  const deanEngineering = await User.create({ name: 'Dr. Priya Krishnan', email: 'dean.engineering@amrita.edu', passwordHash, role: 'dean', designation: 'Dean of Engineering', department: 'Engineering', isVerified: true, isFirstLogin: false, isActive: true });
  const deanStudents = await User.create({ name: 'Dr. Anand Narayanan', email: 'dean.students@amrita.edu', passwordHash, role: 'student_welfare', designation: 'Dean of Student Affairs', department: 'Student Welfare', isVerified: true, isFirstLogin: false, isActive: true });

  // ===================== HODs =====================
  const hodCSE = await User.create({ name: 'Dr. Suresh Babu', email: 'hod.cse@amrita.edu', passwordHash, role: 'hod', designation: 'Head of Department - CSE', department: 'CSE', isVerified: true, isFirstLogin: false, isActive: true });
  const hodECE = await User.create({ name: 'Dr. Latha Vijayan', email: 'hod.ece@amrita.edu', passwordHash, role: 'hod', designation: 'Head of Department - ECE', department: 'ECE', isVerified: true, isFirstLogin: false, isActive: true });
  const hodMECH = await User.create({ name: 'Dr. Ramesh Chandran', email: 'hod.mech@amrita.edu', passwordHash, role: 'hod', designation: 'Head of Department - MECH', department: 'MECH', isVerified: true, isFirstLogin: false, isActive: true });

  // ===================== HOSTEL STAFF =====================
  const chiefWarden = await User.create({ name: 'Mr. Krishnamurthy', email: 'chiefwarden@amrita.edu', passwordHash, role: 'chief_warden', designation: 'Chief Warden', department: 'Hostel Administration', isVerified: true, isFirstLogin: false, isActive: true });
  const wardenA = await User.create({ name: 'Ms. Deepa Sharma', email: 'warden.a@amrita.edu', passwordHash, role: 'warden', designation: 'Warden - Block A', department: 'Hostel Administration', hostelBlock: 'Block A', isVerified: true, isFirstLogin: false, isActive: true });
  const wardenB = await User.create({ name: 'Mr. Senthil Kumar', email: 'warden.b@amrita.edu', passwordHash, role: 'warden', designation: 'Warden - Block B', department: 'Hostel Administration', hostelBlock: 'Block B', isVerified: true, isFirstLogin: false, isActive: true });
  const wardenC = await User.create({ name: 'Ms. Kavitha Rajan', email: 'warden.c@amrita.edu', passwordHash, role: 'warden', designation: 'Warden - Block C (Girls)', department: 'Hostel Administration', hostelBlock: 'Block C', isVerified: true, isFirstLogin: false, isActive: true });

  // ===================== MAINTENANCE =====================
  const mainSup = await User.create({ name: 'Mr. Balasubramanian', email: 'maintenance.sup@amrita.edu', passwordHash, role: 'maintenance_supervisor', designation: 'Maintenance Supervisor', department: 'Maintenance', isVerified: true, isFirstLogin: false, isActive: true });
  const electrician1 = await User.create({ name: 'Mr. Murugan', email: 'elec1@amrita.edu', passwordHash, role: 'electrician', designation: 'Senior Electrician', department: 'Electrical Maintenance', isVerified: true, isFirstLogin: false, isActive: true });
  const electrician2 = await User.create({ name: 'Mr. Selvam', email: 'elec2@amrita.edu', passwordHash, role: 'electrician', designation: 'Electrician', department: 'Electrical Maintenance', isVerified: true, isFirstLogin: false, isActive: true });
  const plumber1 = await User.create({ name: 'Mr. Rajan', email: 'plumber1@amrita.edu', passwordHash, role: 'plumber', designation: 'Senior Plumber', department: 'Plumbing', isVerified: true, isFirstLogin: false, isActive: true });
  const plumber2 = await User.create({ name: 'Mr. Durai', email: 'plumber2@amrita.edu', passwordHash, role: 'plumber', designation: 'Plumber', department: 'Plumbing', isVerified: true, isFirstLogin: false, isActive: true });
  const carpenter = await User.create({ name: 'Mr. Shankar', email: 'carpenter@amrita.edu', passwordHash, role: 'carpenter', designation: 'Carpenter', department: 'Civil Maintenance', isVerified: true, isFirstLogin: false, isActive: true });
  const networkTech = await User.create({ name: 'Mr. Arun Kumar', email: 'network@amrita.edu', passwordHash, role: 'network_technician', designation: 'Network Technician', department: 'IT Department', isVerified: true, isFirstLogin: false, isActive: true });

  // ===================== OTHER STAFF =====================
  const librarian = await User.create({ name: 'Ms. Saraswathi', email: 'librarian@amrita.edu', passwordHash, role: 'librarian', designation: 'Head Librarian', department: 'Library', isVerified: true, isFirstLogin: false, isActive: true });
  const transport = await User.create({ name: 'Mr. Pandian', email: 'transport@amrita.edu', passwordHash, role: 'transport_coordinator', designation: 'Transport Coordinator', department: 'Transport', isVerified: true, isFirstLogin: false, isActive: true });
  const security = await User.create({ name: 'Mr. Velu', email: 'security@amrita.edu', passwordHash, role: 'security', designation: 'Head of Security', department: 'Security', isVerified: true, isFirstLogin: false, isActive: true });
  const messManager = await User.create({ name: 'Mr. Gopalakrishnan', email: 'mess@amrita.edu', passwordHash, role: 'mess_manager', designation: 'Mess Manager', department: 'Mess & Canteen', isVerified: true, isFirstLogin: false, isActive: true });

  // ===================== STUDENTS (30 Students) =====================
  const studentData = [
    { name: 'Arjun Sharma', email: 'cb.en.u4cse21001@cb.students.amrita.edu', rollNumber: 'CB.EN.U4CSE21001', department: 'CSE', year: 4, semester: 7, hostelBlock: 'Block A', roomNumber: 'A-101', gender: 'male' },
    { name: 'Priya Nair', email: 'cb.en.u4cse21002@cb.students.amrita.edu', rollNumber: 'CB.EN.U4CSE21002', department: 'CSE', year: 4, semester: 7, hostelBlock: 'Block C', roomNumber: 'C-205', gender: 'female' },
    { name: 'Rahul Menon', email: 'cb.en.u4ece21003@cb.students.amrita.edu', rollNumber: 'CB.EN.U4ECE21003', department: 'ECE', year: 4, semester: 7, hostelBlock: 'Block A', roomNumber: 'A-112', gender: 'male' },
    { name: 'Sneha Iyer', email: 'cb.en.u4ece21004@cb.students.amrita.edu', rollNumber: 'CB.EN.U4ECE21004', department: 'ECE', year: 4, semester: 7, hostelBlock: 'Block C', roomNumber: 'C-108', gender: 'female' },
    { name: 'Karthik Raju', email: 'cb.en.u4mec21005@cb.students.amrita.edu', rollNumber: 'CB.EN.U4MEC21005', department: 'MECH', year: 4, semester: 7, hostelBlock: 'Block B', roomNumber: 'B-301', gender: 'male' },
    { name: 'Divya Pillai', email: 'cb.en.u4cse22006@cb.students.amrita.edu', rollNumber: 'CB.EN.U4CSE22006', department: 'CSE', year: 3, semester: 5, hostelBlock: 'Block C', roomNumber: 'C-312', gender: 'female' },
    { name: 'Sanjay Krishnan', email: 'cb.en.u4cse22007@cb.students.amrita.edu', rollNumber: 'CB.EN.U4CSE22007', department: 'CSE', year: 3, semester: 5, hostelBlock: 'Block A', roomNumber: 'A-204', gender: 'male' },
    { name: 'Ananya Reddy', email: 'cb.en.u4ece22008@cb.students.amrita.edu', rollNumber: 'CB.EN.U4ECE22008', department: 'ECE', year: 3, semester: 5, hostelBlock: 'Block C', roomNumber: 'C-416', gender: 'female' },
    { name: 'Vikram Subramanian', email: 'cb.en.u4mec22009@cb.students.amrita.edu', rollNumber: 'CB.EN.U4MEC22009', department: 'MECH', year: 3, semester: 5, hostelBlock: 'Block B', roomNumber: 'B-220', gender: 'male' },
    { name: 'Meera Sundaram', email: 'cb.en.u4cse23010@cb.students.amrita.edu', rollNumber: 'CB.EN.U4CSE23010', department: 'CSE', year: 2, semester: 3, hostelBlock: 'Block C', roomNumber: 'C-502', gender: 'female' },
    { name: 'Deepak Anand', email: 'cb.en.u4cse23011@cb.students.amrita.edu', rollNumber: 'CB.EN.U4CSE23011', department: 'CSE', year: 2, semester: 3, hostelBlock: 'Block A', roomNumber: 'A-318', gender: 'male' },
    { name: 'Kavya Balan', email: 'cb.en.u4ece23012@cb.students.amrita.edu', rollNumber: 'CB.EN.U4ECE23012', department: 'ECE', year: 2, semester: 3, hostelBlock: 'Block C', roomNumber: 'C-110', gender: 'female' },
    { name: 'Aditya Varma', email: 'cb.en.u4cve23013@cb.students.amrita.edu', rollNumber: 'CB.EN.U4CVE23013', department: 'CIVIL', year: 2, semester: 3, hostelBlock: 'Block B', roomNumber: 'B-115', gender: 'male' },
    { name: 'Pooja Natarajan', email: 'cb.en.u4cse24014@cb.students.amrita.edu', rollNumber: 'CB.EN.U4CSE24014', department: 'CSE', year: 1, semester: 1, hostelBlock: 'Block C', roomNumber: 'C-601', gender: 'female' },
    { name: 'Rohan Pillai', email: 'cb.en.u4cse24015@cb.students.amrita.edu', rollNumber: 'CB.EN.U4CSE24015', department: 'CSE', year: 1, semester: 1, hostelBlock: 'Block A', roomNumber: 'A-402', gender: 'male' },
  ];

  const students = [];
  for (const data of studentData) {
    const student = await User.create({ ...data, passwordHash, role: 'student', isVerified: true, isFirstLogin: false, isActive: true, phone: `+91 ${Math.floor(7000000000 + Math.random() * 2999999999)}` });
    students.push(student);
  }
  console.log(`✅ Created ${students.length} students`);

  // ===================== COMPLAINTS (20 Complaints) =====================
  const now = new Date();
  const daysAgo = (d) => new Date(now - d * 86400000);

  const complaints = await Complaint.insertMany([
    {
      complainantId: students[0]._id, title: 'Fan not working in Room A-101',
      description: 'The ceiling fan in my hostel room A-101, Block A has stopped working since yesterday. The temperature is very high and it is affecting my sleep and studies.',
      category: 'electrical', location: { building: 'Hostel Block A', floor: '1st Floor', room: 'A-101', hostelBlock: 'Block A' },
      priority: 'high', status: 'work_in_progress', assignedDepartment: 'Electrical Maintenance', assignedTo: electrician1._id,
      verifiedBy: wardenA._id, approvedBy: chiefWarden._id,
      aiAnalysis: { suggestedCategory: 'electrical', suggestedDepartment: 'Electrical Maintenance', predictedPriority: 'high', sentimentScore: 0.7, summary: 'Student reports non-functional ceiling fan in hostel room, causing discomfort.', confidence: 0.9, processed: true },
      slaDeadline: daysAgo(-1), createdAt: daysAgo(3),
      timeline: [
        { status: 'submitted', message: 'Complaint submitted.', performedByName: students[0].name, performedByRole: 'student', timestamp: daysAgo(3) },
        { status: 'verified', message: 'Verified by Warden. Fan confirmed non-functional.', performedByName: wardenA.name, performedByRole: 'warden', timestamp: daysAgo(2) },
        { status: 'approved', message: 'Approved by Chief Warden.', performedByName: chiefWarden.name, performedByRole: 'chief_warden', timestamp: daysAgo(2) },
        { status: 'assigned', message: 'Assigned to electrician.', performedByName: mainSup.name, performedByRole: 'maintenance_supervisor', timestamp: daysAgo(1) },
        { status: 'work_in_progress', message: 'Work started. Fan motor replacement required.', performedByName: electrician1.name, performedByRole: 'electrician', timestamp: daysAgo(0) },
      ],
    },
    {
      complainantId: students[1]._id, title: 'Water leakage in Block C bathroom',
      description: 'There is severe water leakage from the ceiling in the second-floor bathroom of Block C. The entire floor gets wet creating a safety hazard for students.',
      category: 'plumbing', location: { building: 'Hostel Block C', floor: '2nd Floor', hostelBlock: 'Block C', specificArea: 'Common Bathroom' },
      priority: 'emergency', status: 'completed', assignedDepartment: 'Plumbing', assignedTo: plumber1._id,
      verifiedBy: wardenC._id, approvedBy: chiefWarden._id,
      aiAnalysis: { suggestedCategory: 'plumbing', predictedPriority: 'emergency', sentimentScore: 0.85, processed: true, summary: 'Emergency water leakage creating safety hazard in hostel bathroom.' },
      studentVerification: { verified: true, verifiedAt: daysAgo(0), comment: 'Issue fixed. No more leakage.', rating: 4 },
      status: 'pending_student_verification', createdAt: daysAgo(5),
    },
    {
      complainantId: students[2]._id, title: 'Wi-Fi not working in Block A',
      description: 'The Wi-Fi in Block A has been down for 2 days. Multiple students are affected. We cannot access online course materials and submit assignments.',
      category: 'internet_connectivity', location: { building: 'Hostel Block A', hostelBlock: 'Block A' },
      priority: 'high', status: 'assigned', assignedDepartment: 'IT Department', assignedTo: networkTech._id,
      communitySupport: [
        { userId: students[6]._id, comment: 'Same issue, please fix urgently' },
        { userId: students[0]._id, comment: 'Confirmed, no internet since morning' },
      ],
      aiAnalysis: { suggestedCategory: 'internet_connectivity', predictedPriority: 'high', processed: true },
      createdAt: daysAgo(2),
    },
    {
      complainantId: students[4]._id, title: 'Projector not working in Block B Seminar Hall',
      description: 'The projector in the Block B seminar hall has not been functioning properly. The image quality is very poor and it disconnects frequently.',
      category: 'classroom_equipment', location: { building: 'Block B Academic', floor: '2nd Floor', room: 'Seminar Hall 201' },
      priority: 'medium', status: 'verified', assignedDepartment: 'IT Department',
      verifiedBy: wardenB._id, aiAnalysis: { predictedPriority: 'medium', processed: true }, createdAt: daysAgo(4),
    },
    {
      complainantId: students[5]._id, title: 'Mess food quality very poor',
      description: 'The quality of food served in the main mess has deteriorated significantly. Today there were insects found in the rice. This is a serious hygiene concern.',
      category: 'food_services', location: { building: 'Main Mess Hall' },
      priority: 'high', status: 'under_verification', assignedDepartment: 'Mess & Canteen',
      aiAnalysis: { predictedPriority: 'high', sentimentScore: 0.8, processed: true }, isEmergency: false, createdAt: daysAgo(1),
    },
    {
      complainantId: students[7]._id, title: 'Library AC not working',
      description: 'The air conditioning in the main library section has been off for 3 days. The heat makes it impossible to study, especially during exam preparation.',
      category: 'general_administration', location: { building: 'Central Library', floor: '1st Floor' },
      priority: 'medium', status: 'approved', assignedDepartment: 'Electrical Maintenance',
      verifiedBy: hodCSE._id, approvedBy: deanStudents._id, createdAt: daysAgo(6),
    },
    {
      complainantId: students[8]._id, title: 'Bus route 3 frequently delayed',
      description: 'The campus bus on route 3 is consistently 30-45 minutes late every morning, causing students to miss the first hour of classes.',
      category: 'transportation', location: { building: 'Main Bus Stop' },
      priority: 'medium', status: 'closed', assignedDepartment: 'Transport Department',
      studentVerification: { verified: true, verifiedAt: daysAgo(0), rating: 3, comment: 'Some improvement but still occasional delays' },
      closedAt: daysAgo(0), createdAt: daysAgo(10),
    },
    {
      complainantId: students[9]._id, title: 'Broken bench in CSE lab',
      description: 'Multiple benches in CSE Lab 3 are broken. Students are sitting on broken furniture which is unsafe.',
      category: 'classroom_equipment', location: { building: 'CSE Department', floor: '3rd Floor', room: 'Lab 3' },
      priority: 'low', status: 'submitted', aiAnalysis: { predictedPriority: 'low', processed: true }, createdAt: daysAgo(0),
    },
    {
      complainantId: students[10]._id, title: 'Street light not working near Block A entrance',
      description: 'The street light at the entrance of Block A hostel has been not working for a week. It is very dark at night which is a safety concern for students returning late.',
      category: 'electrical', location: { building: 'Hostel Block A', specificArea: 'Main Entrance' },
      priority: 'high', status: 'under_verification', aiAnalysis: { predictedPriority: 'high', sentimentScore: 0.6, processed: true }, createdAt: daysAgo(2),
    },
    {
      complainantId: students[11]._id, title: 'Drinking water cooler not working',
      description: 'The water cooler on the 3rd floor of the academic block has not been working for 5 days. Students have to go to ground floor for water, which is inconvenient.',
      category: 'general_administration', location: { building: 'Main Academic Block', floor: '3rd Floor' },
      priority: 'medium', status: 'closed', studentVerification: { verified: true, rating: 5, comment: 'Fixed quickly!' }, closedAt: daysAgo(1), createdAt: daysAgo(8),
    },
  ]);
  console.log(`✅ Created ${complaints.length} complaints`);

  // ===================== PETITIONS =====================
  const petitions = await Petition.insertMany([
    {
      creatorId: students[0]._id, title: 'Extend Library Hours to 11 PM During Exams',
      description: 'We request the university administration to extend library operating hours from current 9 PM to 11 PM during examination periods. Many students require access to reference materials and a quiet study space during this critical time.',
      purpose: 'Improve academic resources during examination period', expectedOutcome: 'Library hours extended to 11 PM from one week before exams until results',
      targetCommunity: { type: 'university', value: null },
      supportCount: 234, oppositionCount: 12, status: 'under_review', thresholdReached: true,
      aiSummary: 'Students request extended library hours during exams. Strong student support indicates genuine need for additional study time access.',
      supportVotes: students.slice(0, 8).map((s) => ({ userId: s._id, votedAt: daysAgo(Math.random() * 5) })),
      createdAt: daysAgo(10),
    },
    {
      creatorId: students[1]._id, title: 'Install More Washing Machines in Girls Hostel Block C',
      description: 'Block C currently has only 4 washing machines for 200+ girls. Wait times are often 3-4 hours. We request at least 4 more washing machines to be installed in Block C.',
      purpose: 'Improve hostel facilities', expectedOutcome: 'Additional 4 washing machines installed in Block C within 1 month',
      targetCommunity: { type: 'hostel', value: 'Block C' },
      eligibilityRules: { hostelBlocks: ['Block C'] },
      supportCount: 87, oppositionCount: 3, status: 'active', thresholdReached: false,
      supportVotes: students.filter((s) => s.hostelBlock === 'Block C').map((s) => ({ userId: s._id })),
      createdAt: daysAgo(7),
    },
    {
      creatorId: students[2]._id, title: 'Improve Internet Speed in Hostels',
      description: 'The internet speed in all hostel blocks is extremely slow, particularly during evening hours. Online classes, research, and assignment submissions are badly affected. We request upgrading to minimum 100 Mbps per block.',
      purpose: 'Academic productivity improvement', expectedOutcome: 'Internet speed upgraded to minimum 100 Mbps in all hostel blocks',
      targetCommunity: { type: 'university', value: null },
      supportCount: 456, oppositionCount: 5, status: 'approved', thresholdReached: true,
      officialResponse: 'Administration acknowledges this issue. Network infrastructure upgrade has been approved. Implementation expected within 3 months.',
      respondedBy: deanStudents._id, respondedAt: daysAgo(2),
      createdAt: daysAgo(15),
    },
    {
      creatorId: students[4]._id, title: 'Additional Bus Service on Route 3 During Peak Hours',
      description: 'Route 3 is overcrowded during 8 AM and 5 PM slots. A single bus cannot accommodate all students resulting in many being left behind.',
      purpose: 'Improve transportation services', expectedOutcome: 'One additional bus allocated to Route 3 during peak hours',
      targetCommunity: { type: 'transport_route', value: 'Route 3' },
      supportCount: 128, oppositionCount: 2, status: 'under_review', thresholdReached: true,
      createdAt: daysAgo(12),
    },
    {
      creatorId: students[5]._id, title: 'Install RO Water Purifiers in All Hostel Floors',
      description: 'Currently students rely on a single water cooler per hostel block. We request RO water purifiers to be installed on every floor to ensure clean drinking water access.',
      purpose: 'Student health and wellbeing', expectedOutcome: 'RO purifiers installed on every floor of all hostel blocks',
      targetCommunity: { type: 'university', value: null },
      supportCount: 312, oppositionCount: 8, status: 'active', thresholdReached: false,
      createdAt: daysAgo(4),
    },
  ]);
  console.log(`✅ Created ${petitions.length} petitions`);

  // ===================== POLLS =====================
  const polls = await Poll.insertMany([
    {
      creatorId: deanStudents._id, creatorName: deanStudents.name,
      question: 'What type of events would you like for the Annual Fest 2025?',
      description: 'Help us plan the Annual Fest by sharing your preferences.',
      options: [
        { id: 'opt_1', text: 'Technical competitions (Hackathon, Coding)', voteCount: 145 },
        { id: 'opt_2', text: 'Cultural events (Music, Dance, Drama)', voteCount: 120 },
        { id: 'opt_3', text: 'Sports tournaments', voteCount: 89 },
        { id: 'opt_4', text: 'Guest lectures and workshops', voteCount: 67 },
      ],
      isAnonymous: false, eligibilityCriteria: { campusWide: true },
      openAt: daysAgo(7), closeAt: daysAgo(-7), status: 'active', totalVotes: 421,
      category: 'event', votes: students.map((s) => ({ userId: s._id, selectedOptions: ['opt_1'], votedAt: daysAgo(Math.random() * 5) })),
    },
    {
      creatorId: hodCSE._id, creatorName: hodCSE.name,
      question: 'Which elective would you prefer for 7th Semester?',
      options: [
        { id: 'opt_1', text: 'Machine Learning & Deep Learning', voteCount: 45 },
        { id: 'opt_2', text: 'Cloud Computing & DevOps', voteCount: 38 },
        { id: 'opt_3', text: 'Cybersecurity & Ethical Hacking', voteCount: 52 },
        { id: 'opt_4', text: 'Blockchain Technology', voteCount: 23 },
      ],
      isAnonymous: true, eligibilityCriteria: { departments: ['CSE'], years: [3, 4], campusWide: false },
      openAt: daysAgo(3), closeAt: daysAgo(-4), status: 'active', totalVotes: 158, category: 'academic',
    },
    {
      creatorId: wardenA._id, creatorName: wardenA.name,
      question: 'What should be the late-night return curfew timing for hostel students?',
      options: [
        { id: 'opt_1', text: '9:30 PM (current)', voteCount: 23 },
        { id: 'opt_2', text: '10:00 PM', voteCount: 67 },
        { id: 'opt_3', text: '10:30 PM', voteCount: 89 },
        { id: 'opt_4', text: '11:00 PM', voteCount: 45 },
      ],
      isAnonymous: true, eligibilityCriteria: { campusWide: false },
      openAt: daysAgo(14), closeAt: daysAgo(0), status: 'closed', totalVotes: 224, category: 'policy',
      results: { winner: 'opt_3', summary: 'Majority prefer 10:30 PM curfew' },
    },
  ]);
  console.log(`✅ Created ${polls.length} polls`);

  // ===================== LOST & FOUND =====================
  const lostFound = await LostFound.insertMany([
    {
      reporterId: students[0]._id, type: 'lost', itemCategory: 'id_card',
      itemName: 'Student ID Card', description: 'Lost my Amrita University ID card. Blue lanyard. Name: Arjun Sharma, Roll: CB.EN.U4CSE21001',
      color: 'White', lastSeenLocation: 'Near Main Canteen', locationDetails: 'Table near window in canteen',
      dateTime: daysAgo(2), isUrgent: true, status: 'active',
      verificationQuestions: [{ question: 'What is the roll number on the ID?', answer: 'CB.EN.U4CSE21001' }],
    },
    {
      reporterId: students[3]._id, type: 'found', itemCategory: 'wallet',
      itemName: 'Black Leather Wallet', description: 'Found a black leather wallet near the library entrance. Contains some cash and cards.',
      color: 'Black', brand: 'No brand visible', foundLocation: 'Library Entrance',
      dateTime: daysAgo(1), status: 'active',
    },
    {
      reporterId: students[5]._id, type: 'lost', itemCategory: 'calculator',
      itemName: 'Casio FX-991EX Scientific Calculator', description: 'Lost my scientific calculator in the ECE lab. It has my initials "D.P." written on the back with a marker.',
      color: 'Black', brand: 'Casio FX-991EX', lastSeenLocation: 'ECE Lab 2', dateTime: daysAgo(3), status: 'active',
      verificationQuestions: [{ question: 'What initials are written on the back?', answer: 'D.P.' }],
    },
    {
      reporterId: students[7]._id, type: 'found', itemCategory: 'calculator',
      itemName: 'Scientific Calculator', description: 'Found a Casio scientific calculator in ECE lab area. Has some writing on the back.',
      color: 'Black', brand: 'Casio', foundLocation: 'ECE Lab 2 corridor', dateTime: daysAgo(2), status: 'matched',
      potentialMatches: [{ matchedReportId: null, matchScore: 0.92 }],
    },
    {
      reporterId: students[9]._id, type: 'lost', itemCategory: 'keys',
      itemName: 'Room Keys with Batman keychain', description: 'Lost my hostel room keys with a distinctive Batman keychain. Very important as it also has my locker key.',
      color: 'Silver', lastSeenLocation: 'Sports Complex', dateTime: daysAgo(0), isUrgent: true, status: 'active',
    },
    {
      reporterId: students[11]._id, type: 'found', itemCategory: 'mobile',
      itemName: 'OnePlus Nord CE2 Lite', description: 'Found a blue OnePlus phone near the library. Phone is locked. Has a cracked screen protector.',
      color: 'Blue', brand: 'OnePlus', foundLocation: 'Central Library, Ground Floor', dateTime: daysAgo(0), status: 'active',
    },
  ]);
  console.log(`✅ Created ${lostFound.length} lost & found reports`);

  console.log('\n🎉 Database seeding complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Default Login Credentials:');
  console.log(`   Password for ALL accounts: ${DEFAULT_PASSWORD}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 Key accounts:');
  console.log(`   Super Admin:    admin@amrita.edu`);
  console.log(`   Director:       director@amrita.edu`);
  console.log(`   Principal:      principal@amrita.edu`);
  console.log(`   Chief Warden:   chiefwarden@amrita.edu`);
  console.log(`   Warden A:       warden.a@amrita.edu`);
  console.log(`   Maintenance Sup: maintenance.sup@amrita.edu`);
  console.log(`   Electrician:    elec1@amrita.edu`);
  console.log(`   HOD CSE:        hod.cse@amrita.edu`);
  console.log(`   Student 1:      cb.en.u4cse21001@cb.students.amrita.edu`);
  console.log(`   Student 2:      cb.en.u4cse21002@cb.students.amrita.edu`);

  await mongoose.connection.close();
}

seed().catch((err) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
