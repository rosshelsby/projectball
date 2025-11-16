// Import required packages
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Create Express app
const app = express();

// Middleware - code that runs before your routes
app.use(cors()); // Allow frontend to connect
app.use(express.json()); // Parse JSON request bodies

// Import routes
const authRoutes = require('./routes/auth');
const teamRoutes = require('./routes/teams');
const matchRoutes = require('./routes/matches');
const trainingRoutes = require('./routes/training');
const transferRoutes = require('./routes/transfers');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/transfers', transferRoutes);

// Test route - just to verify server works
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const { startScheduler } = require('./services/matchScheduler');
startScheduler(5);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});