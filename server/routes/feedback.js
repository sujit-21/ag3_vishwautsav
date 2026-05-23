const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const auth = require('../middleware/auth');

// GET all (Filtered by adminId context)
router.get('/', auth, async (req, res) => {
    try {
        const data = await Feedback.find({ adminId: req.user.adminId }).sort({ createdAt: -1 });
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST
router.post('/', auth, async (req, res) => {
    try {
        const newItem = new Feedback({ ...req.body, adminId: req.user.adminId });
        const saved = await newItem.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT
router.put('/:id', auth, async (req, res) => {
    try {
        const updated = await Feedback.findOneAndUpdate(
            { _id: req.params.id, adminId: req.user.adminId },
            req.body,
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: 'Not found or unauthorized' });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE
router.delete('/:id', auth, async (req, res) => {
    try {
        const deleted = await Feedback.findOneAndDelete({ _id: req.params.id, adminId: req.user.adminId });
        if (!deleted) return res.status(404).json({ message: 'Not found or unauthorized' });
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
