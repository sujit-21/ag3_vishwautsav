const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Entity = require('../models/Entity');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const entityRoute = require('./entity');

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, role = 'user', entityMode, entityName, securityKey } = req.body;
        
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'An account with this email already exists' });

        const effectiveRole = role === 'admin' ? 'admin' : 'user';
        let assignedEntityName = null;
        let verifiedEntityObj = null;
        let createdNewEntity = false;

        if (effectiveRole === 'admin') {
            if (!entityName || !entityName.trim()) {
                return res.status(400).json({ message: 'Entity / Organization Name is required for Administrator accounts' });
            }
            if (!securityKey || !securityKey.trim()) {
                return res.status(400).json({ message: 'Security Key is required for Entity access' });
            }

            const trimmedName = entityName.trim();
            const escName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const trimmedKey = securityKey.trim();

            let existingEntity = await Entity.findOne({ 
                name: { $regex: new RegExp("^" + escName + "$", "i") } 
            });

            if (entityMode === 'join' || (!entityMode && existingEntity)) {
                // Joining existing entity
                if (!existingEntity) {
                    return res.status(404).json({ message: `Entity "${trimmedName}" was not found. Please verify the name or select "Create New Entity".` });
                }
                if (existingEntity.securityKey !== trimmedKey) {
                    return res.status(400).json({ message: 'Invalid security key for this Entity' });
                }
                assignedEntityName = existingEntity.name;
                verifiedEntityObj = { name: existingEntity.name, _id: existingEntity._id };
            } else {
                // Creating new entity
                if (existingEntity) {
                    // If entity already exists and user provided matching security key, let them join as equal admin
                    if (existingEntity.securityKey === trimmedKey) {
                        assignedEntityName = existingEntity.name;
                        verifiedEntityObj = { name: existingEntity.name, _id: existingEntity._id };
                    } else {
                        return res.status(400).json({ 
                            message: `An Entity named "${existingEntity.name}" already exists. If you want to join as an Admin, please choose "Join Existing Entity" and enter its security key.` 
                        });
                    }
                } else {
                    const newEntity = new Entity({
                        name: trimmedName,
                        securityKey: trimmedKey
                    });
                    await newEntity.save();
                    assignedEntityName = newEntity.name;
                    verifiedEntityObj = { name: newEntity.name, _id: newEntity._id };
                    createdNewEntity = true;
                }
            }
        }

        user = new User({ 
            name, 
            email, 
            password, 
            role: effectiveRole,
            baseRole: effectiveRole,
            entityName: assignedEntityName 
        });
        await user.save();

        if (verifiedEntityObj && createdNewEntity) {
            await Entity.findByIdAndUpdate(verifiedEntityObj._id, { owner: user._id });
        }

        if (assignedEntityName && entityRoute.migrateDataToEntity) {
            try {
                await entityRoute.migrateDataToEntity(user._id, assignedEntityName);
            } catch (mErr) {
                console.warn('Entity migration note:', mErr.message);
            }
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.status(201).json({ 
            token, 
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email, 
                role: user.role,
                entityName: user.entityName 
            },
            entity: verifiedEntityObj,
            isNewEntity: createdNewEntity
        });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ message: err.message || 'Error creating account' });
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

        // Lookup linked entity if user has entityName
        let entity = null;
        if (user.entityName) {
            const escName = user.entityName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            entity = await Entity.findOne({ name: { $regex: new RegExp("^" + escName + "$", "i") } });
            if (!entity) {
                entity = { name: user.entityName };
            }
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ 
            token, 
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email, 
                role: user.role,
                entityName: user.entityName 
            },
            entity
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
