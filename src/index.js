const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import database
const db = require('./config/database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});
app.set('io', io);

// Middleware
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Additional CORS middleware for preflight requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, ngrok-skip-browser-warning');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

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
const aiChatRoutes = require('./routes/aiChat');
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/ai-chat', aiChatRoutes);
// TODO: Add RSVP routes
// TODO: Add feedback routes
// Socket.IO integration
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌐 API URL: http://localhost:${PORT}`);
});
