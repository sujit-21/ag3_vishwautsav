const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Middleware to restrict to admins
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
    next();
};

// GET current user's own profile (Accessible by any logged-in user)
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// UPDATE current user's own profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (name) user.name = name;
        if (email) user.email = email;
        if (password) user.password = password;

        await user.save();
        res.json({ message: 'Profile updated successfully', user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE current user's own account PERMANENTLY
router.delete('/profile', auth, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.user.id);
        res.json({ message: 'Account deleted permanently' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all users in the same entity or created by the authenticated admin
router.get('/', auth, adminOnly, async (req, res) => {
    try {
        const query = req.user.entityName 
            ? { entityName: req.user.entityName } 
            : { createdBy: req.user.id };
            
        const users = await User.find(query).select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add new user (scoped to admin/entity)
router.post('/', auth, adminOnly, async (req, res) => {
    try {
        const { name, email, password, role, entityName } = req.body;
        const user = new User({ 
            name, 
            email, 
            password, 
            role: role || 'user', 
            createdBy: req.user.id,
            entityName: entityName || req.user.entityName // Inherit admin's entity if not provided
        });
        await user.save();
        res.status(201).json(user);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update user (scoped to entity)
router.put('/:id', auth, adminOnly, async (req, res) => {
    try {
        const { password, role, name, email, entityName } = req.body;
        const query = req.user.entityName 
            ? { _id: req.params.id, entityName: req.user.entityName }
            : { _id: req.params.id, createdBy: req.user.id };
            
        const user = await User.findOne(query);
        if (!user) return res.status(404).json({ message: 'User not found or unauthorized' });

        if (password) user.password = password;
        if (role) user.role = role;
        if (name) user.name = name;
        if (email) user.email = email;
        if (entityName) user.entityName = entityName;

        await user.save();
        res.json({ message: 'User updated successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete user (scoped to entity)
router.delete('/:id', auth, adminOnly, async (req, res) => {
    try {
        const query = req.user.entityName 
            ? { _id: req.params.id, entityName: req.user.entityName }
            : { _id: req.params.id, createdBy: req.user.id };
            
        const user = await User.findOneAndDelete(query);
        if (!user) return res.status(404).json({ message: 'User not found or unauthorized' });
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
