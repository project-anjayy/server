const express = require('express');
const { Op } = require('sequelize');
const { Event, User } = require('../config/database');
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
		total_slots: e.total_slots,
		available_slots: e.available_slots,
		created_by: e.created_by,
		creator: e.creator ? { id: e.creator.id, name: e.creator.name, email: e.creator.email } : undefined,
		created_at: e.created_at,
		updated_at: e.updated_at
	};
}

// POST /api/events - create event (auth required)
router.post('/', authenticateToken, async (req, res) => {
	try {
			const { title, description, category, location, time } = req.body;
			let { total_slots } = req.body;

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

			const event = await Event.create({
				title,
				description: description || null,
				category,
				location,
				time,
			total_slots,
			available_slots: total_slots, // set explicitly to avoid validation race
				created_by: req.user.id
			});

		const created = await Event.findByPk(event.id, { include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'] }] });

		res.status(201).json({
			status: 'success',
			message: 'Event created successfully',
			data: formatEvent(created)
		});
	} catch (error) {
		console.error('Create event error:', error);
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
		console.error('List events error:', error);
		res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
	}
});

// GET /api/events/:id - event detail
router.get('/:id', async (req, res) => {
	try {
		const event = await Event.findByPk(req.params.id, {
			include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'] }]
		});
		if (!event) return res.status(404).json({ status: 'error', message: 'Event not found' });
		res.json({ status: 'success', data: formatEvent(event) });
	} catch (error) {
		console.error('Get event error:', error);
		res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
	}
});

// PUT /api/events/:id - update event (only creator)
router.put('/:id', authenticateToken, async (req, res) => {
	try {
		const event = await Event.findByPk(req.params.id);
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
		res.json({ status: 'success', message: 'Event updated successfully', data: formatEvent(updated) });
	} catch (error) {
		console.error('Update event error:', error);
		res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
	}
});

// DELETE /api/events/:id - delete event (only creator)
router.delete('/:id', authenticateToken, async (req, res) => {
	try {
		const event = await Event.findByPk(req.params.id);
		if (!event) return res.status(404).json({ status: 'error', message: 'Event not found' });
		if (event.created_by !== req.user.id) {
			return res.status(403).json({ status: 'error', message: 'Not authorized to delete this event' });
		}
		await event.destroy();
		res.json({ status: 'success', message: 'Event deleted successfully' });
	} catch (error) {
		console.error('Delete event error:', error);
		res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
	}
});

module.exports = router;

