const express = require('express');
const { Op } = require('sequelize');
const { Event, User, MyEvent, Feedback, sequelize } = require('../config/database');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Helper to format event response
function formatEvent(eventInstance) {
	if (!eventInstance) return null;
	const e = eventInstance.get({ plain: true });
	return {
		id: e.id,
		title: e.title,
		description: e.description,
		category: e.category,
		location: e.location,
		time: e.time,
		duration: e.duration,
		total_slots: e.total_slots,
		available_slots: e.available_slots,
		created_by: e.created_by,
		creator: e.creator ? { id: e.creator.id, name: e.creator.name, email: e.creator.email } : undefined,
		created_at: e.created_at,
		updated_at: e.updated_at
	};
}

// GET /api/events/:id/rating - get average rating for event
router.get('/:id/rating', async (req, res) => {
	try {
		const eventId = parseInt(req.params.id, 10);
		if (isNaN(eventId)) return res.status(400).json({ status: 'error', message: 'Invalid event id' });
		const result = await Feedback.findAll({
			where: { event_id: eventId },
			attributes: [
				[require('sequelize').fn('AVG', require('sequelize').col('rating')), 'avg_rating'],
				[require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
			]
		});
		const avg = result[0]?.get('avg_rating');
		const count = result[0]?.get('count');
		res.json({ status: 'success', event_id: eventId, avg_rating: avg ? parseFloat(avg).toFixed(2) : null, count: parseInt(count, 10) });
	} catch (error) {
		res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
	}
});

// POST /api/events - create event (auth required)
router.post('/', authenticateToken, async (req, res) => {
	try {
	const { title, description, category, location, time } = req.body;
	let { total_slots, duration } = req.body;

	if (!title || !category || !location || !time || total_slots == null) {
		return res.status(400).json({
			status: 'error',
			message: 'title, category, location, time, total_slots are required'
		});
	}

	total_slots = parseInt(total_slots, 10);
	if (isNaN(total_slots) || total_slots < 1) {
		return res.status(400).json({ status: 'error', message: 'total_slots must be a positive integer' });
	}

	// Fix: Don't use fallback to 90 if duration is explicitly provided, even if 0
	if (duration == null || duration === '') {
		duration = 90;
	} else {
		duration = parseInt(duration, 10);
	}
	
	if (isNaN(duration) || duration < 1) {
		return res.status(400).json({ status: 'error', message: 'duration must be a positive integer (minutes)' });
	}

	const event = await Event.create({
		title,
		description: description || null,
		category,
		location,
		time,
		total_slots,
		available_slots: total_slots, // set explicitly to avoid validation race
		created_by: req.user.id,
		duration
	});
	
	const created = await Event.findByPk(event.id, { include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'] }] });

	// Emit eventCreated via Socket.IO to notify all clients
	const io = req.app.get('io');
	if (io) {
		io.emit('eventCreated', { event: formatEvent(created) });
		
		// Start countdown for the new event if it's scheduled for future
		const eventTime = new Date(created.time);
		const now = new Date();
		if (eventTime > now) {
			// Get the startEventCountdown function from app.js
			const app = req.app;
			if (app.locals.startEventCountdown) {
				app.locals.startEventCountdown(event.id);
			}
		}
	}

	res.status(201).json({
		status: 'success',
		message: 'Event created successfully',
		data: formatEvent(created)
	});
	} catch (error) {
		res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
	}
});

// GET /api/events/my-events - get user's joined events
router.get('/my-events', authenticateToken, async (req, res) => {
	try {
		// Get all events that user has joined (status = 'joined')
		const myEvents = await MyEvent.findAll({
			where: { 
				user_id: req.user.id, 
				status: 'joined' 
			},
			include: [{
				model: Event,
				as: 'event',
				include: [{
					model: User,
					as: 'creator',
					attributes: ['id', 'name', 'email']
				}]
			}],
			order: [['event', 'time', 'ASC']]
		});

		// Format the response to match the expected structure
		const events = myEvents.map(myEvent => formatEvent(myEvent.event)).filter(Boolean);

		res.json({
			status: 'success',
			data: events
		});
	} catch (error) {
		
		res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
	}
});

// GET /api/events - list events with optional category filter & location search
router.get('/', async (req, res) => {
	try {
		const { category, location, q } = req.query; // q alias for search
		const where = {};
		if (category) where.category = category;
		if (location || q) {
			const searchTerm = location || q;
			where.location = { [Op.iLike]: `%${searchTerm}%` };
		}

		const events = await Event.findAll({
			where,
			order: [['time', 'ASC']],
			include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'] }]
		});

		res.json({
			status: 'success',
			data: events.map(formatEvent)
		});
	} catch (error) {
		
		res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
	}
});

// GET /api/events/:id - event detail
router.get('/:id', async (req, res) => {
	try {
		const eventId = parseInt(req.params.id, 10);
		if (isNaN(eventId)) return res.status(400).json({ status: 'error', message: 'Invalid event id' });
		const event = await Event.findByPk(eventId, {
			include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'] }]
		});
		if (!event) return res.status(404).json({ status: 'error', message: 'Event not found' });
		res.json({ status: 'success', data: formatEvent(event) });
	} catch (error) {
		
		res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
	}
});

// PUT /api/events/:id - update event (only creator)
router.put('/:id', authenticateToken, async (req, res) => {
	try {
		const eventId = parseInt(req.params.id, 10);
		if (isNaN(eventId)) return res.status(400).json({ status: 'error', message: 'Invalid event id' });
		const event = await Event.findByPk(eventId);
		if (!event) return res.status(404).json({ status: 'error', message: 'Event not found' });
		if (event.created_by !== req.user.id) {
			return res.status(403).json({ status: 'error', message: 'Not authorized to update this event' });
		}

	const updatableFields = ['title', 'description', 'category', 'location', 'time'];
	updatableFields.forEach(field => {
		if (Object.prototype.hasOwnProperty.call(req.body, field)) {
			event[field] = req.body[field];
		}
	});

	if (Object.prototype.hasOwnProperty.call(req.body, 'duration')) {
		const newDuration = parseInt(req.body.duration, 10);
		if (isNaN(newDuration) || newDuration < 1) {
			return res.status(400).json({ status: 'error', message: 'duration must be a positive integer (minutes)' });
		}
		event.duration = newDuration;
	}

	if (Object.prototype.hasOwnProperty.call(req.body, 'total_slots')) {
		const newTotal = parseInt(req.body.total_slots, 10);
		if (isNaN(newTotal) || newTotal < 1) {
			return res.status(400).json({ status: 'error', message: 'total_slots must be a positive integer' });
		}
		const currentParticipants = event.total_slots - event.available_slots; // number already taken
		if (newTotal < currentParticipants) {
			return res.status(400).json({ status: 'error', message: `total_slots cannot be less than current participants (${currentParticipants})` });
		}
		// Adjust available slots relative to new total.
		event.total_slots = newTotal;
		event.available_slots = newTotal - currentParticipants;
	}

			await event.save();
			const updated = await Event.findByPk(event.id, { include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'] }] });

			// Emit eventUpdated via Socket.IO
			const io = req.app.get('io');
			if (io) {
				io.emit('eventUpdated', { eventId: event.id, event: formatEvent(updated) });
			}

			res.json({ status: 'success', message: 'Event updated successfully', data: formatEvent(updated) });
	} catch (error) {
		
		res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
	}
});

// DELETE /api/events/:id - delete event (only creator)
router.delete('/:id', authenticateToken, async (req, res) => {
	try {
		const eventId = parseInt(req.params.id, 10);
		if (isNaN(eventId)) return res.status(400).json({ status: 'error', message: 'Invalid event id' });
		const event = await Event.findByPk(eventId);
		if (!event) return res.status(404).json({ status: 'error', message: 'Event not found' });
		if (event.created_by !== req.user.id) {
			return res.status(403).json({ status: 'error', message: 'Not authorized to delete this event' });
		}
		const deletedEventId = event.id;
		await event.destroy();

		// Emit eventDeleted via Socket.IO
		const io = req.app.get('io');
		if (io) {
			io.emit('eventDeleted', { eventId: deletedEventId });
		}

		res.json({ status: 'success', message: 'Event deleted successfully' });
	} catch (error) {
		
		res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
	}
});

// POST /api/events/:id/countdown - trigger countdown update (manual emit)
router.post('/:id/countdown', authenticateToken, async (req, res) => {
	const countdownEventId = parseInt(req.params.id, 10);
	if (isNaN(countdownEventId)) return res.status(400).json({ status: 'error', message: 'Invalid event id' });
	const { countdown } = req.body;
	const io = req.app.get('io');
	if (io) {
		io.emit('countdownUpdate', { eventId: countdownEventId, countdown });
	}
	res.json({ status: 'success', message: 'Countdown update emitted', data: { eventId: countdownEventId, countdown } });
});

// POST /api/events/:id/rsvp - join event
router.post('/:id/rsvp', authenticateToken, async (req, res) => {
	try {
		const eventId = parseInt(req.params.id, 10);
		if (isNaN(eventId)) {
			return res.status(400).json({ status: 'error', message: 'Invalid event id' });
		}
		// Cek event dan status
		const event = await Event.findByPk(eventId);
		if (!event) {
			return res.status(404).json({ status: 'error', message: 'Event not found' });
		}
		const now = new Date();
		const eventStart = new Date(event.time);
		const eventDuration = event.duration;
		if (!eventDuration || eventDuration <= 0) {
			return res.status(400).json({ status: 'error', message: 'Event has invalid duration and cannot be joined' });
		}
		const eventEnd = new Date(eventStart.getTime() + (eventDuration * 60000));
		if (now >= eventEnd) {
			return res.status(400).json({ status: 'error', message: 'Cannot join an event that has already finished' });
		}
		if (event.created_by === req.user.id) {
			return res.status(400).json({ status: 'error', message: 'Creator cannot RSVP to their own event' });
		}
		// Cek sudah join
		let myEvent = await MyEvent.findOne({ where: { user_id: req.user.id, event_id: event.id } });
		if (myEvent && myEvent.status === 'joined') {
			return res.status(409).json({ status: 'error', message: 'Already joined this event' });
		}
		// Atomic update available_slots
		const [updatedRows] = await Event.update(
			{ available_slots: sequelize.literal('GREATEST(available_slots - 1, 0)') },
			{ where: { id: event.id, available_slots: { [Op.gt]: 0 } } }
		);
		if (updatedRows === 0) {
			return res.status(400).json({ status: 'error', message: 'No available slots' });
		}
		// Buat atau update MyEvent
		if (!myEvent) {
			myEvent = await MyEvent.create({ user_id: req.user.id, event_id: event.id, status: 'joined' });
		} else {
			myEvent.status = 'joined';
			await myEvent.save();
		}
		// Ambil ulang event untuk slot terbaru
		const updatedEvent = await Event.findByPk(event.id);
		// Emit slotsUpdated via Socket.IO
		const io = req.app.get('io');
		if (io) {
			io.emit('slotsUpdated', { eventId: event.id, availableSlots: updatedEvent.available_slots });
		}
		return res.status(200).json({ status: 'success', message: 'Joined event successfully', data: { event_id: event.id, available_slots: updatedEvent.available_slots } });
	} catch (error) {
		return res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
	}
});

router.delete('/:id/rsvp', authenticateToken, async (req, res) => {
	const t = await sequelize.transaction();
	try {
		const eventId = parseInt(req.params.id, 10);
		if (isNaN(eventId)) {
			await t.rollback();
			return res.status(400).json({ status: 'error', message: 'Invalid event id' });
		}
		const event = await Event.findByPk(eventId, { transaction: t, lock: t.LOCK.UPDATE });
		if (!event) {
			await t.rollback();
			return res.status(404).json({ status: 'error', message: 'Event not found' });
		}

		// Check if event has finished
		const now = new Date();
		const eventStart = new Date(event.time);
		
		// Use actual duration from database
		const eventDuration = event.duration;
		if (!eventDuration || eventDuration <= 0) {
			await t.rollback();
			return res.status(400).json({ 
				status: 'error', 
				message: 'Event has invalid duration' 
			});
		}
		
		const eventEnd = new Date(eventStart.getTime() + (eventDuration * 60000));
		
		if (now >= eventEnd) {
			await t.rollback();
			return res.status(400).json({ 
				status: 'error', 
				message: 'Cannot leave an event that has already finished' 
			});
		}

		const myEvent = await MyEvent.findOne({ where: { user_id: req.user.id, event_id: event.id }, transaction: t, lock: t.LOCK.UPDATE });
		if (!myEvent || myEvent.status !== 'joined') {
			await t.rollback();
			return res.status(404).json({ status: 'error', message: 'You have not joined this event' });
		}

		

		myEvent.status = 'cancelled';
		await myEvent.save({ transaction: t });

		// Increase available slots by 1, but cap at total_slots
		event.available_slots = Math.min(event.total_slots, event.available_slots + 1);
		await event.save({ transaction: t });

		

		await t.commit();

		const io = req.app.get('io');
		if (io) {
			
			io.emit('slotsUpdated', { eventId: event.id, availableSlots: event.available_slots });
		}

		return res.status(200).json({ status: 'success', message: 'Cancelled RSVP successfully', data: { event_id: event.id, available_slots: event.available_slots } });
	} catch (error) {
		await t.rollback();
		
		return res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
	}
});

// POST /api/events/:id/feedback - beri rating & komentar
router.post('/:id/feedback', authenticateToken, async (req, res) => {
	try {
			const eventId = parseInt(req.params.id, 10);
			if (isNaN(eventId)) return res.status(400).json({ status: 'error', message: 'Invalid event id' });
			const { rating, comment } = req.body;
			if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
				return res.status(400).json({ status: 'error', message: 'Rating (1-5) is required' });
			}
			// Cek event ada
			const event = await Event.findByPk(eventId);
			if (!event) return res.status(404).json({ status: 'error', message: 'Event not found' });
			// Cek user sudah join event
			const myEvent = await MyEvent.findOne({ where: { user_id: req.user.id, event_id: eventId, status: 'joined' } });
			if (!myEvent) return res.status(403).json({ status: 'error', message: 'You must join the event before giving feedback' });

			// Cek event sudah selesai (UTC-safe, debug info)
			const now = new Date();
			const eventStart = new Date(event.time);
			
			// Use actual duration from database
			const eventDuration = event.duration;
			if (!eventDuration || eventDuration <= 0) {
				return res.status(400).json({ 
					status: 'error', 
					message: 'Event has invalid duration, cannot process feedback' 
				});
			}
			
			const eventEnd = new Date(eventStart.getTime() + (eventDuration * 60000));
			
			// Debug log waktu
			console.log('[FEEDBACK DEBUG]', {
				now: now.toISOString(),
				eventStart: eventStart.toISOString(),
				eventEnd: eventEnd.toISOString(),
				duration: eventDuration,
				nowMs: now.getTime(),
				eventEndMs: eventEnd.getTime(),
				diffMinutes: (eventEnd.getTime() - now.getTime()) / 60000
			});
			if (now < eventEnd) {
				return res.status(403).json({ status: 'error', message: 'Event has not finished yet. You can only give feedback after the event ends.' });
			}

			// Cek sudah pernah feedback
			const existing = await Feedback.findOne({ where: { user_id: req.user.id, event_id: eventId } });
			if (existing) return res.status(409).json({ status: 'error', message: 'You have already given feedback for this event' });
			// Simpan feedback
			const feedback = await Feedback.create({
				user_id: req.user.id,
				event_id: eventId,
				rating,
				comment: comment || null
			});
			res.status(201).json({ status: 'success', message: 'Feedback submitted', data: feedback });
	} catch (error) {
		
		res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
	}
});

// GET /api/events/:id/feedback - lihat semua feedback event
router.get('/:id/feedback', async (req, res) => {
	try {
		const eventId = parseInt(req.params.id, 10);
		if (isNaN(eventId)) return res.status(400).json({ status: 'error', message: 'Invalid event id' });
		const feedbacks = await Feedback.findAll({
			where: { event_id: eventId },
			include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
			order: [['created_at', 'DESC']]
		});
		res.json({
			status: 'success',
			data: feedbacks.map(fb => ({
				id: fb.id,
				user: fb.user,
				rating: fb.rating,
				comment: fb.comment,
				created_at: fb.created_at
			}))
		});
	} catch (error) {
		
		res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
	}
});

module.exports = router;

