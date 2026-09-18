const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { setSocketIO } = require('../services/notification.service');

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Authentication error'));
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.userId).select('name role email hostelBlock department');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`🔌 Socket connected: ${user.name} (${user.role})`);

    // Join personal room
    socket.join(`user_${user._id}`);

    // Join role room
    socket.join(`role_${user.role}`);

    // Join location-based room (for community support)
    if (user.hostelBlock) socket.join(`hostel_${user.hostelBlock}`);
    if (user.department) socket.join(`dept_${user.department}`);

    socket.on('join_complaint_room', (complaintId) => {
      socket.join(`complaint_${complaintId}`);
    });

    socket.on('leave_complaint_room', (complaintId) => {
      socket.leave(`complaint_${complaintId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${user.name}`);
    });
  });

  setSocketIO(io);
  return io;
};

module.exports = { initSocket };
