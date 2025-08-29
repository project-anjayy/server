const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import database
const db = require('./src/config/database');

// Import routes
const authRoutes = require('./src/routes/auth');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});
app.set('io', io);

// Make startEventCountdown available to routes
app.locals.startEventCountdown = null; // Will be set after function definition

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
app.use(express.urlencoded({extended:true}))

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', require('./src/routes/events'));
app.use('/api/ai-chat', require('./src/routes/aiChat'));

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

const PORT = 3001


// Import DB models for socket handlers
const dbModels = require('./src/config/database');

// Real-time countdown system
let countdownIntervals = new Map();

// Function to start countdown for an event
function startEventCountdown(eventId) {
  // Clear existing interval if any
  if (countdownIntervals.has(eventId)) {
    clearInterval(countdownIntervals.get(eventId));
  }

    const interval = setInterval(async () => {
    try {
      const event = await dbModels.Event.findByPk(eventId);
      if (!event) {
        clearInterval(interval);
        countdownIntervals.delete(eventId);
        return;
      }

      const now = new Date();
      const eventStart = new Date(event.time);
      
      // Use actual duration from database
      const eventDurationMinutes = event.duration;
      if (!eventDurationMinutes || eventDurationMinutes <= 0) {
        clearInterval(interval);
        countdownIntervals.delete(eventId);
        return;
      }
      
      const eventEnd = new Date(eventStart.getTime() + eventDurationMinutes * 60 * 1000);
      
      let countdownData = {
        eventId: eventId,
        eventTime: event.time,
        duration: eventDurationMinutes,
        status: 'upcoming'
      };

      if (now < eventStart) {
        // Event hasn't started yet
        const timeToStart = eventStart.getTime() - now.getTime();
        countdownData.status = 'upcoming';
        countdownData.timeRemaining = timeToStart;
        countdownData.timeToStart = timeToStart;
      } else if (now >= eventStart && now < eventEnd) {
        // Event is ongoing
        const timeToEnd = eventEnd.getTime() - now.getTime();
        countdownData.status = 'ongoing';
        countdownData.timeRemaining = timeToEnd;
        countdownData.timeToEnd = timeToEnd;
      } else {
        // Event has ended
        countdownData.status = 'completed';
        countdownData.timeRemaining = 0;
        // Stop the countdown for this event
        clearInterval(interval);
        countdownIntervals.delete(eventId);
      }

      // Emit countdown update to all clients
      io.emit('countdownUpdate', countdownData);
      
    } catch (error) {
      // Silent error handling - stop countdown on persistent errors
      clearInterval(interval);
      countdownIntervals.delete(eventId);
    }
  }, 30000); // Update every 30 seconds instead of 1 second

  countdownIntervals.set(eventId, interval);
}

// Make startEventCountdown available to routes
app.locals.startEventCountdown = startEventCountdown;

// Function to start countdowns for all upcoming and ongoing events
async function initializeCountdowns() {
  try {
    const now = new Date();
    // Get only upcoming and ongoing events to reduce query load
    const events = await dbModels.Event.findAll({
      where: {
        time: {
          [require('sequelize').Op.gte]: new Date(now.getTime() - 2 * 60 * 60 * 1000) // Events from last 2 hours only
        }
      },
      attributes: ['id', 'time', 'duration', 'title'], // Only select needed fields
      limit: 50 // Limit to prevent too many concurrent countdowns
    });

    events.forEach(event => {
      const eventStart = new Date(event.time);
      const eventDuration = event.duration || 90;
      const eventEnd = new Date(eventStart.getTime() + (eventDuration * 60 * 1000));
      
      // Start countdown only if event is upcoming or ongoing
      if (now < eventEnd) {
        startEventCountdown(event.id);
      }
    });
    
  } catch (error) {
    // Silent error handling for initialization
  }
}

io.on('connection', (socket) => {

  // joinEvent: RSVP via socket
  socket.on('joinEvent', async ({ eventId, userId }) => {
    try {
      const t = await dbModels.sequelize.transaction();
      const event = await dbModels.Event.findByPk(eventId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!event) return socket.emit('error', { message: 'Event not found' });
      if (event.available_slots <= 0) return socket.emit('error', { message: 'No available slots' });
      let myEvent = await dbModels.MyEvent.findOne({ where: { user_id: userId, event_id: eventId }, transaction: t, lock: t.LOCK.UPDATE });
      if (myEvent && myEvent.status === 'joined') return socket.emit('error', { message: 'Already joined this event' });
      if (!myEvent) {
        myEvent = await dbModels.MyEvent.create({ user_id: userId, event_id: eventId, status: 'joined' }, { transaction: t });
      } else {
        myEvent.status = 'joined';
        await myEvent.save({ transaction: t });
      }
      event.available_slots = Math.max(0, (event.available_slots || 0) - 1);
      await event.save({ transaction: t });
      await t.commit();
      io.emit('slotsUpdated', { eventId: event.id, availableSlots: event.available_slots });
      socket.emit('joinEventResult', { status: 'success', eventId: event.id, availableSlots: event.available_slots });
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  // leaveEvent: Cancel RSVP via socket
  socket.on('leaveEvent', async ({ eventId, userId }) => {
    try {
      const t = await dbModels.sequelize.transaction();
      const event = await dbModels.Event.findByPk(eventId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!event) return socket.emit('error', { message: 'Event not found' });
      const myEvent = await dbModels.MyEvent.findOne({ where: { user_id: userId, event_id: eventId }, transaction: t, lock: t.LOCK.UPDATE });
      if (!myEvent || myEvent.status !== 'joined') return socket.emit('error', { message: 'You have not joined this event' });
      myEvent.status = 'cancelled';
      await myEvent.save({ transaction: t });
      event.available_slots = Math.min(event.total_slots, event.available_slots + 1);
      await event.save({ transaction: t });
      await t.commit();
      io.emit('slotsUpdated', { eventId: event.id, availableSlots: event.available_slots });
      socket.emit('leaveEventResult', { status: 'success', eventId: event.id, availableSlots: event.available_slots });
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  // updateEvent: update event via socket (only creator)
  socket.on('updateEvent', async ({ eventId, userId, payload }) => {
    try {
      const event = await dbModels.Event.findByPk(eventId);
      if (!event) return socket.emit('error', { message: 'Event not found' });
      if (event.created_by !== userId) return socket.emit('error', { message: 'Not authorized' });
      const updatableFields = ['title', 'description', 'category', 'location', 'time', 'duration', 'total_slots'];
      updatableFields.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(payload, field)) {
          event[field] = payload[field];
        }
      });
      await event.save();
      
      // If time or duration is updated, restart countdown
      if (payload.time || payload.duration) {
        startEventCountdown(event.id);
      }
      
      io.emit('eventUpdated', { eventId: event.id, updatedFields: payload });
      socket.emit('updateEventResult', { status: 'success', eventId: event.id });
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  // Subscribe to specific event countdown
  socket.on('subscribeToEvent', ({ eventId }) => {
    socket.join(`event_${eventId}`);
  });

  // Unsubscribe from event countdown
  socket.on('unsubscribeFromEvent', ({ eventId }) => {
    socket.leave(`event_${eventId}`);
  });

  socket.on('disconnect', () => {});
});

// Cleanup function to stop all countdowns
function cleanupCountdowns() {
  countdownIntervals.forEach((interval, eventId) => {
    clearInterval(interval);
  });
  countdownIntervals.clear();
}

// Graceful shutdown
process.on('SIGTERM', () => {
  cleanupCountdowns();
  process.exit(0);
});

process.on('SIGINT', () => {
  cleanupCountdowns();
  process.exit(0);
});

server.listen(PORT, () => {
  // Initialize countdown system
  setTimeout(initializeCountdowns, 3000); // Wait 3 seconds for database connection
});

module.exports = app;
