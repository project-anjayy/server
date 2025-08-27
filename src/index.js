const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import database
const db = require('./config/database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Sports Event Platform API',
    status: 'Server is running!',
    version: '1.0.0',
    database: 'Connected with Sequelize'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    database: 'Sequelize + PostgreSQL'
  });
});

// Test database endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    await db.sequelize.authenticate();
    const users = await db.User.findAll({ limit: 5 });
    res.json({
      message: 'Database connection successful',
      usersCount: users.length,
      models: Object.keys(db).filter(key => key !== 'Sequelize' && key !== 'sequelize')
    });
  } catch (error) {
    res.status(500).json({
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Routes
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
// TODO: Add RSVP routes
// TODO: Add feedback routes
// TODO: Add Socket.IO integration

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`� API URL: http://localhost:${PORT}`);
});
