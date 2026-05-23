const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const auth = require('../middleware/auth');

// Create Subscription
router.post('/', auth, async (req, res) => {
    try {
        const subscription = new Subscription({
            ...req.body,
            adminId: req.user.adminId,
            entityName: req.user.entityName
        });
        await subscription.save();
        res.status(201).json(subscription);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Public Lookup by Entity + SubId (Attendee self-service — searches both Subscriptions and Cards)
router.get('/lookup/:entityName/:subId', async (req, res) => {
    try {
        const { entityName, subId } = req.params;
        const searchId = subId.trim().replace(/\s/g, ''); 
        const escEntity = entityName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const idRegex = new RegExp('^' + searchId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i');

        const Card = require('../models/Card');
        
        const entityFilter = { $regex: new RegExp('^' + escEntity + '$', 'i') };
        
        let cardRecord = await Card.findOne({ entityName: entityFilter, cardId: { $regex: idRegex } });
        let subscription = await Subscription.findOne({ entityName: entityFilter, subId: { $regex: idRegex } });

        // If neither exists under THIS entity name...
        if (!cardRecord && !subscription) {
            return res.status(404).json({ 
                message: `No record found for ID: ${searchId} under "${entityName}". Please verify your details.` 
            });
        }

        // Merge data safely
        const record = {
            ...(subscription ? subscription.toObject() : {}),
            ...(cardRecord ? cardRecord.toObject() : {}),
            subId: cardRecord ? cardRecord.cardId : (subscription ? subscription.subId : searchId),
            isGenerated: !!cardRecord
        };
        
        res.json(record);
    } catch (err) {
        console.error('Lookup Error:', err);
        res.status(500).json({ message: 'Internal server error during record lookup.' });
    }
});

// Search Subscription by subId (Shared by Entity)
router.get('/search/:subId', auth, async (req, res) => {
    try {
        const query = req.entityQuery({ subId: req.params.subId });
        const subscription = await Subscription.findOne(query);
        if (!subscription) return res.status(404).json({ message: 'Record not found' });
        res.json(subscription);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Search Subscription by Entity and ID (For general users)
router.get('/search-all/:entityName/:subId', auth, async (req, res) => {
    try {
        const { entityName, subId } = req.params;
        const escEntity = entityName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const escId = subId.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // 1. Try case-insensitive matching first
        let subscription = await Subscription.findOne({ 
            entityName: { $regex: new RegExp('^' + escEntity + '$', 'i') }, 
            subId: { $regex: new RegExp('^' + escId + '$', 'i') } 
        });

        // 2. If not found, try searching by ID alone (fuzzy match)
        if (!subscription) {
            subscription = await Subscription.findOne({ 
                subId: { $regex: new RegExp(escId, 'i') } 
            });
        }

        if (!subscription) return res.status(404).json({ message: 'No record found matching these details.' });
        res.json(subscription);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Subscriptions by Type (Shared by Entity)
router.get('/:type', auth, async (req, res) => {
    try {
        const query = req.entityQuery({ type: req.params.type });
        const subscriptions = await Subscription.find(query);
        res.json(subscriptions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update Subscription
router.put('/:id', auth, async (req, res) => {
    try {
        const query = req.entityQuery({ subId: req.params.id });
        const subscription = await Subscription.findOneAndUpdate(query, req.body, { new: true });
        if (!subscription) return res.status(404).json({ message: 'Subscription not found or unauthorized' });
        res.json(subscription);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete Subscription
router.delete('/:id', auth, async (req, res) => {
    try {
        const query = req.entityQuery({ subId: req.params.id });
        const subscription = await Subscription.findOneAndDelete(query);
        if (!subscription) return res.status(404).json({ message: 'Subscription not found or unauthorized' });
        res.json({ message: 'Subscription deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
