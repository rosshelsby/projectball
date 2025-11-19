// Import required packages
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// Load environment variables from .env file
dotenv.config();

// Create Express app
const app = express();
const server = http.createServer(app);

// Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware - code that runs before your routes
app.use(cors()); // Allow frontend to connect
app.use(express.json()); // Parse JSON request bodies

// Import routes
const authRoutes = require('./routes/auth');
const teamRoutes = require('./routes/teams');
const matchRoutes = require('./routes/matches');
const trainingRoutes = require('./routes/training');
const transferRoutes = require('./routes/transfers');
const scoutRoutes = require('./routes/scout');
const usersRoutes = require('./routes/users');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/scout', scoutRoutes);
app.use('/api/users', usersRoutes);

// Test route - just to verify server works
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.username = decoded.username;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.username} (${socket.userId})`);
  
  // Join user to their own room for targeted messages
  socket.join(`user:${socket.userId}`);
  
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.username}`);
  });
});

// Make io accessible to routes
app.set('io', io);

// Start server
const PORT = process.env.PORT || 5000;
const { startScheduler } = require('./services/matchScheduler');
startScheduler(5);
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});