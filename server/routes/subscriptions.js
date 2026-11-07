const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const auth = require('../middleware/auth');
const { logActivity } = require('../services/activityLogger');

// Create Subscription
router.post('/', auth, async (req, res) => {
    try {
        const subscription = new Subscription({
            ...req.body,
            adminId: req.user.adminId,
            entityName: req.user.entityName
        });
        await subscription.save();

        // Safe audit logging
        logActivity({
            action: 'CREATE',
            targetType: 'attendee',
            targetId: subscription.subId,
            targetName: subscription.name,
            adminId: req.user.id || req.user.adminId,
            adminName: req.user.name || 'Admin',
            adminEmail: req.user.email || '',
            adminRole: req.user.role || 'admin',
            entityName: req.user.entityName,
            festOrEventName: subscription.festOrEventName || '',
            sectionType: subscription.type || 'festival',
            details: `Created new attendee '${subscription.name}' (ID: ${subscription.subId}) with ${subscription.currency || '₹'}${subscription.amount} (${subscription.paymentType || 'Cash & Paid'}).`,
            amount: subscription.amount,
            paymentType: subscription.paymentType
        });

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
        const existing = await Subscription.findOne(query);
        if (!existing) return res.status(404).json({ message: 'Subscription not found or unauthorized' });

        // Calculate changes
        const changes = [];
        const trackFields = ['name', 'amount', 'paymentType', 'membershipType', 'contact', 'address', 'referenceName', 'date'];
        trackFields.forEach(field => {
            if (req.body[field] !== undefined && String(req.body[field]) !== String(existing[field])) {
                changes.push({
                    field,
                    from: existing[field],
                    to: req.body[field]
                });
            }
        });

        const subscription = await Subscription.findOneAndUpdate(query, req.body, { new: true });

        // Safe audit logging
        const changeDesc = changes.length > 0 
            ? changes.map(c => `${c.field}: '${c.from || 'none'}' → '${c.to}'`).join(', ')
            : 'Updated attendee details';

        logActivity({
            action: 'UPDATE',
            targetType: 'attendee',
            targetId: subscription.subId,
            targetName: subscription.name,
            adminId: req.user.id || req.user.adminId,
            adminName: req.user.name || 'Admin',
            adminEmail: req.user.email || '',
            adminRole: req.user.role || 'admin',
            entityName: req.user.entityName,
            festOrEventName: subscription.festOrEventName || existing.festOrEventName || '',
            sectionType: subscription.type || existing.type || 'festival',
            details: `Updated attendee '${subscription.name}' (${subscription.subId}): ${changeDesc}`,
            changes,
            amount: subscription.amount,
            paymentType: subscription.paymentType
        });

        res.json(subscription);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete Subscription
router.delete('/:id', auth, async (req, res) => {
    try {
        const query = req.entityQuery({ subId: req.params.id });
        const existing = await Subscription.findOne(query);
        if (!existing) return res.status(404).json({ message: 'Subscription not found or unauthorized' });

        await Subscription.findOneAndDelete(query);

        // Safe audit logging
        logActivity({
            action: 'DELETE',
            targetType: 'attendee',
            targetId: existing.subId,
            targetName: existing.name,
            adminId: req.user.id || req.user.adminId,
            adminName: req.user.name || 'Admin',
            adminEmail: req.user.email || '',
            adminRole: req.user.role || 'admin',
            entityName: req.user.entityName,
            festOrEventName: existing.festOrEventName || '',
            sectionType: existing.type || 'festival',
            details: `Deleted attendee '${existing.name}' (ID: ${existing.subId}, Amount: ${existing.currency || '₹'}${existing.amount}, Payment: ${existing.paymentType}).`,
            amount: existing.amount,
            paymentType: existing.paymentType
        });

        res.json({ message: 'Subscription deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
