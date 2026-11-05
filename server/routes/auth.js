const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Entity = require('../models/Entity');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const entityRoute = require('./entity');

// Pre-check availability before sending OTP
router.post('/check-availability', async (req, res) => {
    try {
        const { identifier } = req.body;
        if (!identifier || !identifier.trim()) {
            return res.status(400).json({ available: false, message: 'Email or phone number is required' });
        }

        const clean = identifier.trim();
        const isEmail = clean.includes('@');
        let existingUser = null;

        if (isEmail) {
            existingUser = await User.findOne({ email: clean.toLowerCase() });
        } else {
            const digits = clean.replace(/[^0-9]/g, '');
            const queries = [{ email: clean }, { phone: clean }];
            if (digits) {
                queries.push({ phone: digits });
                queries.push({ email: digits });
                queries.push({ phone: `+91${digits.replace(/^91/, '')}` });
            }
            existingUser = await User.findOne({ $or: queries });
        }

        if (existingUser) {
            return res.status(400).json({
                available: false,
                message: isEmail 
                    ? 'An account with this email already exists. Please sign in.' 
                    : 'An account with this phone number already exists. Please sign in.'
            });
        }

        return res.json({ available: true });
    } catch (err) {
        console.error('Check availability error:', err);
        return res.status(500).json({ available: false, message: 'Error checking account availability' });
    }
});

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { name, email, phone, password, role = 'user', entityMode, entityName, securityKey } = req.body;
        
        const cleanEmail = email && email.includes('@') ? email.toLowerCase().trim() : null;
        const cleanPhone = phone ? phone.trim() : (!cleanEmail && email ? email.trim() : null);

        if (!cleanEmail && !cleanPhone) {
            return res.status(400).json({ message: 'Email or mobile phone number is required' });
        }

        // Build uniqueness query
        const uniquenessQuery = [];
        if (cleanEmail) uniquenessQuery.push({ email: cleanEmail });
        if (cleanPhone) {
            uniquenessQuery.push({ phone: cleanPhone });
            uniquenessQuery.push({ email: cleanPhone });
            const digits = cleanPhone.replace(/[^0-9]/g, '');
            if (digits) {
                uniquenessQuery.push({ phone: digits });
                uniquenessQuery.push({ phone: `+91${digits.replace(/^91/, '')}` });
            }
        }

        let user = await User.findOne({ $or: uniquenessQuery });
        if (user) {
            return res.status(400).json({ 
                message: cleanEmail && user.email === cleanEmail
                    ? 'An account with this email already exists' 
                    : 'An account with this phone number already exists' 
            });
        }

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
            email: cleanEmail || cleanPhone, 
            phone: cleanPhone || '',
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
                phone: user.phone,
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
        const { email, identifier, password } = req.body;
        const targetId = (identifier || email || '').trim();

        if (!targetId || !password) {
            return res.status(400).json({ message: 'Email or phone and password are required' });
        }

        const isEmail = targetId.includes('@');
        let user = null;

        if (isEmail) {
            user = await User.findOne({ email: targetId.toLowerCase() });
        } else {
            const digits = targetId.replace(/[^0-9]/g, '');
            const queries = [{ email: targetId }, { phone: targetId }];
            if (digits) {
                queries.push({ phone: digits });
                queries.push({ email: digits });
                queries.push({ phone: `+91${digits.replace(/^91/, '')}` });
            }
            user = await User.findOne({ $or: queries });
        }

        if (!user) return res.status(400).json({ message: 'Invalid credentials. User not found.' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials. Incorrect password.' });

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
                phone: user.phone,
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
