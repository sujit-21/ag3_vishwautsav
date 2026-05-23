const express = require('express');
const router = express.Router();
const Card = require('../models/Card');
const auth = require('../middleware/auth');

// Create Card
router.post('/', auth, async (req, res) => {
    try {
        const card = new Card({
            ...req.body,
            adminId: req.user.adminId,
            entityName: req.user.entityName
        });
        await card.save();
        res.status(201).json(card);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get Cards by Type (Shared by Entity)
router.get('/:type', auth, async (req, res) => {
    try {
        const query = req.entityQuery({ type: req.params.type });
        const cards = await Card.find(query);
        res.json(cards);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update Card
router.put('/:id', auth, async (req, res) => {
    try {
        const query = req.entityQuery({ cardId: req.params.id });
        const card = await Card.findOneAndUpdate(query, req.body, { new: true });
        if (!card) return res.status(404).json({ message: 'Card not found or unauthorized' });
        res.json(card);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete Card
router.delete('/:id', auth, async (req, res) => {
    try {
        const query = req.entityQuery({ cardId: req.params.id });
        const card = await Card.findOneAndDelete(query);
        if (!card) return res.status(404).json({ message: 'Card not found or unauthorized' });
        res.json({ message: 'Card deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
