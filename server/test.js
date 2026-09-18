require('dotenv').config({path: 'd:/Final_Year_Project/Campus_Civora_Ai_Antigravity/server/.env'});
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('d:/Final_Year_Project/Campus_Civora_Ai_Antigravity/server/src/models/User.model');
  const Complaint = require('d:/Final_Year_Project/Campus_Civora_Ai_Antigravity/server/src/models/Complaint.model');
  const u = await User.findOne({email: 'v_thenmozhi@ch.amrita.edu'}).lean();
  const studentsInDept = await User.find({ department: u.department, role: 'student' }).distinct('_id');
  const comps = await Complaint.find({
    complainantId: { $in: studentsInDept },
    'location.building': 'Academic Block',
    status: { $in: ['under_verification', 'submitted', 'ai_processing'] }
  }).lean();
  console.log('Complaints for Thenmozhi:', comps.length);
  console.log(comps.map(c => c.title));
  process.exit(0);
});
