const express = require('express');
const router = express.Router();
const Support = require('../models/Support');
const auth = require('../middleware/auth');

// GET all (Shared by Entity)
router.get('/', auth, async (req, res) => {
    try {
        const query = req.user.entityName 
            ? { $or: [{ entityName: req.user.entityName }, { adminId: req.user.adminId }] } 
            : { adminId: req.user.adminId };
            
        const data = await Support.find(query);
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST
router.post('/', auth, async (req, res) => {
    try {
        const newItem = new Support({ 
            ...req.body, 
            adminId: req.user.adminId,
            entityName: req.user.entityName 
        });
        const saved = await newItem.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT
router.put('/:id', auth, async (req, res) => {
    try {
        const query = req.user.entityName 
            ? { _id: req.params.id, $or: [{ entityName: req.user.entityName }, { adminId: req.user.adminId }] }
            : { _id: req.params.id, adminId: req.user.adminId };
            
        const updated = await Support.findOneAndUpdate(query, req.body, { new: true });
        if (!updated) return res.status(404).json({ message: 'Not found or unauthorized' });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE
router.delete('/:id', auth, async (req, res) => {
    try {
        const query = req.user.entityName 
            ? { _id: req.params.id, $or: [{ entityName: req.user.entityName }, { adminId: req.user.adminId }] }
            : { _id: req.params.id, adminId: req.user.adminId };
            
        const deleted = await Support.findOneAndDelete(query);
        if (!deleted) return res.status(404).json({ message: 'Not found or unauthorized' });
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
