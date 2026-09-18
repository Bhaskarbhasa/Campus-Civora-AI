require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { initSocket } = require('./socket/socket');
const { runEscalationJob } = require('./jobs/escalation.job');

const authRoutes = require('./routes/auth.routes');
const complaintRoutes = require('./routes/complaint.routes');
const petitionRoutes = require('./routes/petition.routes');
const pollRoutes = require('./routes/poll.routes');
const lostFoundRoutes = require('./routes/lostfound.routes');
const adminRoutes = require('./routes/admin.routes');
const indexRoutes = require('./routes/index.routes');

const app = express();
const server = http.createServer(app);

// Connect DB
connectDB();

// Initialize Socket.io
const io = initSocket(server);

// Rate limiter
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: 'Too many requests, please try again later.' });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

// Middleware
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(limiter);

// Health check
app.get('/api/health', (req, res) => res.json({ success: true, message: 'Campus CIVORA AI API is running 🚀', university: process.env.UNIVERSITY_NAME }));

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/petitions', petitionRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/lost-found', lostFoundRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', indexRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, message: err.message });
  }
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));

// Start escalation job
runEscalationJob();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Campus CIVORA AI Server running on port ${PORT}`);
  console.log(`🎓 University: ${process.env.UNIVERSITY_NAME || 'Amrita Vishwa Vidyapeetham'}`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});

module.exports = { app, io };
