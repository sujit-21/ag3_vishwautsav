const express = require('express');
const router = express.Router();
const Festival = require('../models/Festival');
const auth = require('../middleware/auth');

// Public: Get All Live Festivals (Open to all visitors for Home Tab display)
router.get('/public/live', async (req, res) => {
    try {
        const liveFestivals = await Festival.find({ isLive: true })
            .select('title description location startDate endDate category country entityName image isLive createdAt')
            .sort({ startDate: 1 })
            .lean();
        res.json(liveFestivals);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create Festival
router.post('/', auth, async (req, res) => {
    try {
        const festival = new Festival({
            ...req.body,
            organizer: req.user.id,
            adminId: req.user.adminId || req.user.id, 
            entityName: req.user.entityName || req.body.entityName
        });
        
        if (!festival.adminId) {
             return res.status(400).json({ message: "Critical Error: adminId could not be resolved from your session. Please re-login." });
        }

        await festival.save();
        res.status(201).json(festival);
    } catch (err) {
        res.status(400).json({ message: `Creation Failed: ${err.message}` });
    }
});

// Get All Festivals (Shared by Entity — all admins in same entity see all data)
router.get('/', auth, async (req, res) => {
    try {
        const query = req.entityQuery();
        const festivals = await Festival.find(query).populate('organizer', 'name');
        res.json(festivals);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Toggle Live Status (Admin only)
router.patch('/:id/toggle-live', auth, async (req, res) => {
    try {
        const query = req.entityQuery({ _id: req.params.id });
        const festival = await Festival.findOne(query);
        if (!festival) return res.status(404).json({ message: 'Festival not found or unauthorized' });

        festival.isLive = req.body.isLive !== undefined ? Boolean(req.body.isLive) : !festival.isLive;
        await festival.save();
        res.json(festival);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update Festival
router.put('/:id', auth, async (req, res) => {
    try {
        const query = req.entityQuery({ _id: req.params.id });
        const festival = await Festival.findOneAndUpdate(query, req.body, { new: true });
        if (!festival) return res.status(404).json({ message: 'Festival not found or unauthorized' });
        res.json(festival);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete Festival
router.delete('/:id', auth, async (req, res) => {
    try {
        const query = req.entityQuery({ _id: req.params.id });
        const festival = await Festival.findOneAndDelete(query);
        if (!festival) return res.status(404).json({ message: 'Festival not found or unauthorized' });
        res.json({ message: 'Festival deleted' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
