const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, role, entityName } = req.body;
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        user = new User({ 
            name, 
            email, 
            password, 
            role: role || 'user',
            baseRole: role || 'user',  // Permanent role — never changed by switch-role
            entityName: entityName || null 
        });
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.status(201).json({ 
            token, 
            user: { 
                id: user._id, 
                name, 
                email, 
                role: user.role,
                entityName: user.entityName 
            } 
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ 
            token, 
            user: { 
                id: user._id, 
                name: user.name, 
                email, 
                role: user.role,
                entityName: user.entityName 
            } 
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Forgot Password Request (Demo Flow)
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ message: 'No account found with this email.' });
        }

        res.json({ 
            message: 'A security recovery instruction has been generated. Please contact your system administrator to securely reset your password via the Dashboard Credentials panel.',
            userFound: true 
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update Role (Switch Role) — only updates display role, never baseRole
router.post('/switch-role', auth, async (req, res) => {
    try {
        const { role } = req.body;
        if (!['user', 'admin', 'superadmin'].includes(role)) return res.status(400).json({ message: 'Invalid role' });

        // Only update the display role — baseRole is permanent and not touched here
        const user = await User.findByIdAndUpdate(req.user.id, { role }, { new: true });
        res.json({ role: user.role, baseRole: user.baseRole, entityName: user.entityName });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
