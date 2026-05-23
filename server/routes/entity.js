const express = require('express');
const router = express.Router();
const Entity = require('../models/Entity');
const User = require('../models/User');
const auth = require('../middleware/auth');
const Festival = require('../models/Festival');
const Event = require('../models/Event');
const Subscription = require('../models/Subscription');
const Expense = require('../models/Expense');
const Card = require('../models/Card');
const Support = require('../models/Support');

// Helper to migrate existing data for an admin (and all peers in same entity) to their entity
const migrateDataToEntity = async (userId, name) => {
    const update = { entityName: name };
    const noEntityFilter = { 
        $or: [
            { entityName: null }, 
            { entityName: '' }, 
            { entityName: { $exists: false } }
        ] 
    };

    // Find all admins in this entity (by baseRole for new users, or by absence of createdBy for legacy users)
    const escName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const peerAdmins = await User.find(
        { 
            entityName: { $regex: new RegExp('^' + escName + '$', 'i') },
            $or: [
                { baseRole: { $in: ['admin', 'superadmin'] } },
                { baseRole: { $exists: false }, createdBy: { $exists: false } }
            ]
        },
        '_id'
    );
    const adminIds = [...peerAdmins.map(p => p._id), userId];

    // Stamp entityName on all untagged documents belonging to any admin in this entity
    const filter = { adminId: { $in: adminIds }, ...noEntityFilter };

    await Promise.all([
        Festival.updateMany(filter, update),
        Event.updateMany(filter, update),
        Subscription.updateMany(filter, update),
        Expense.updateMany(filter, update),
        Card.updateMany(filter, update),
        Support.updateMany(filter, update),
        // Cascade entity assignment to all users created by any of these admins
        User.updateMany({ createdBy: { $in: adminIds } }, { entityName: name })
    ]);
};

// Get entities (Publicly accessible for selection)
router.get('/', async (req, res) => {
    try {
        const entities = await Entity.find({}, 'name');
        res.json(entities);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all entity names globally (Publicly accessible)
router.get('/all', async (req, res) => {
    try {
        const entities = await Entity.find({}, 'name');
        res.json(entities);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get entities for admin management (Owned or joined by current admin)
router.get('/manage', auth, async (req, res) => {
    try {
        const query = { $or: [{ owner: req.user.adminId }] };
        if (req.user.entityName) query.$or.push({ name: req.user.entityName });
        
        const entities = await Entity.find(query);
        res.json(entities);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Register new club (Entity)
router.post('/register', auth, async (req, res) => {
    try {
        const { name, securityKey } = req.body;
        // Search case-insensitively for entity
        const trimmedName = name.trim();
        let entity = await Entity.findOne({ name: { $regex: new RegExp("^" + trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } });
        
        if (entity) {
            // If it exists, check if security key matches to join
            if (entity.securityKey === securityKey) {
                await User.findByIdAndUpdate(req.user.id, { entityName: entity.name });
                await migrateDataToEntity(req.user.id, entity.name);
                return res.json({ message: 'Successfully joined existing entity', entity });
            }
            return res.status(400).json({ message: 'Entity name already registered' });
        }

        entity = new Entity({ name, securityKey, owner: req.user.id });
        await entity.save();

        // Automatically link creator to this entity
        await User.findByIdAndUpdate(req.user.id, { entityName: name });
        await migrateDataToEntity(req.user.id, name);

        res.status(201).json(entity);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Join Entity (Shared access for multiple users/admins)
router.post('/join', auth, async (req, res) => {
    try {
        const { name, securityKey } = req.body;
        const trimmedName = name.trim();
        const entity = await Entity.findOne({ name: { $regex: new RegExp("^" + trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } });
        if (!entity) return res.status(404).json({ message: 'Entity not found' });
        
        if (entity.securityKey !== securityKey) {
            return res.status(400).json({ message: 'Invalid security key' });
        }
        
        // Link user to entity using the canonical name from DB
        await User.findByIdAndUpdate(req.user.id, { entityName: entity.name });
        await migrateDataToEntity(req.user.id, entity.name);
        
        res.json({ success: true, message: `Successfully joined ${name}`, entityName: name });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Verify security key
router.post('/verify', auth, async (req, res) => {
    try {
        const { name, securityKey } = req.body;
        const trimmedName = name.trim();
        const entity = await Entity.findOne({ name: { $regex: new RegExp("^" + trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } });
        if (!entity) return res.status(404).json({ message: 'Entity not found' });
        
        if (entity.securityKey !== securityKey) {
            return res.status(400).json({ message: 'Invalid security key' });
        }
        
        // Link user to entity using the canonical name and migrate data
        await User.findByIdAndUpdate(req.user.id, { entityName: entity.name });
        await migrateDataToEntity(req.user.id, entity.name);
        
        res.json({ success: true, entity });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update entity (CRUD)
router.put('/:id', auth, async (req, res) => {
    try {
        const query = { _id: req.params.id, $or: [{ owner: req.user.adminId }] };
        if (req.user.entityName) query.$or.push({ name: req.user.entityName });

        const entity = await Entity.findOneAndUpdate(query, req.body, { new: true });
        if (!entity) return res.status(404).json({ message: 'Entity not found or unauthorized' });
        res.json(entity);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete entity (CRUD)
router.delete('/:id', auth, async (req, res) => {
    try {
        const query = { _id: req.params.id, $or: [{ owner: req.user.adminId }] };
        if (req.user.entityName) query.$or.push({ name: req.user.entityName });

        const entity = await Entity.findOneAndDelete(query);
        if (!entity) return res.status(404).json({ message: 'Entity not found or unauthorized' });
        res.json({ message: 'Entity deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Forget security key
router.post('/forgot-key', auth, async (req, res) => {
    try {
        const { name } = req.body;
        const entity = await Entity.findOne({ name, owner: req.user.adminId });
        if (!entity) return res.status(404).json({ message: 'Entity not found in your context' });
        res.json({ securityKey: entity.securityKey });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
