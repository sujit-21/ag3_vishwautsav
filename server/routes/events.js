const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const auth = require('../middleware/auth');

// Create Event
router.post('/', auth, async (req, res) => {
    try {
        const event = new Event({
            ...req.body,
            organizer: req.user.id,
            adminId: req.user.adminId || req.user.id, // Ensure adminId is never null
            entityName: req.user.entityName || req.body.entityName
        });
        await event.save();
        res.status(201).json(event);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get All Events (Shared by Entity — all admins in same entity see all data)
router.get('/', auth, async (req, res) => {
    try {
        const query = req.entityQuery();
        const events = await Event.find(query).populate('festival', 'title');
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update Event
router.put('/:id', auth, async (req, res) => {
    try {
        const query = req.entityQuery({ _id: req.params.id });
        const event = await Event.findOneAndUpdate(query, req.body, { new: true });
        if (!event) return res.status(404).json({ message: 'Event not found or unauthorized' });
        res.json(event);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete Event
router.delete('/:id', auth, async (req, res) => {
    try {
        const query = req.entityQuery({ _id: req.params.id });
        const event = await Event.findOneAndDelete(query);
        if (!event) return res.status(404).json({ message: 'Event not found or unauthorized' });
        res.json({ message: 'Event deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
