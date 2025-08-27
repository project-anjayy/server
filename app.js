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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}))

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', require('./src/routes/events'));
app.use('/api/events/recommend', require('./src/routes/aiChat'));

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

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

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
      io.emit('eventUpdated', { eventId: event.id, updatedFields: payload });
      socket.emit('updateEventResult', { status: 'success', eventId: event.id });
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('disconnect', () => console.log('🔌 Client disconnected:', socket.id));
});

server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌐 API URL: http://localhost:${PORT}`);
});

module.exports = app;
