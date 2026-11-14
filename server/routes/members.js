const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const auth = require('../middleware/auth');

// Helper: check if user is an authorized admin
const isAuthorizedAdmin = (user) => {
    return Boolean(
        user && (
            ['admin', 'superadmin'].includes(user.role) ||
            ['admin', 'superadmin'].includes(user.baseRole)
        )
    );
};

// 1. GET ALL MEMBERS (Entity-isolated query)
router.get('/', auth, async (req, res) => {
    try {
        const query = req.entityQuery();
        if (req.query.type) {
            query.type = { $in: [req.query.type, 'both'] };
        }
        if (req.query.department && req.query.department !== 'All') {
            query.department = req.query.department;
        }

        const members = await Member.find(query).sort({ createdAt: 1 });
        res.json(members);
    } catch (err) {
        console.error('Error fetching members:', err);
        res.status(500).json({ message: err.message });
    }
});

// 2. CREATE A NEW MEMBER (Admin only)
router.post('/', auth, async (req, res) => {
    try {
        if (!isAuthorizedAdmin(req.user)) {
            return res.status(403).json({ message: 'Access denied. Only administrators can add committee members.' });
        }

        const { 
            name, role, department, contact, countryCode, email, address, photo, type, status, 
            isHidden, hidePhone, hideEmail, hideAddress, hideRole, hideDepartment, notes 
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Member full name is required.' });
        }
        if (!role || !role.trim()) {
            return res.status(400).json({ message: 'Member role / designation is required.' });
        }

        const resolvedEntity = req.user.entityName || req.body.entityName;
        if (!resolvedEntity) {
            return res.status(400).json({ message: 'Entity name is missing from your session.' });
        }

        const member = new Member({
            name: name.trim(),
            role: role.trim(),
            department: department ? department.trim() : 'Core Committee',
            contact: contact ? contact.trim() : '',
            countryCode: countryCode || '+91',
            email: email ? email.trim().toLowerCase() : '',
            address: address ? address.trim() : '',
            photo: photo || '',
            type: type || 'festival',
            status: status || 'Active',
            isHidden: Boolean(isHidden),
            hidePhone: Boolean(hidePhone),
            hideEmail: Boolean(hideEmail),
            hideAddress: Boolean(hideAddress),
            hideRole: Boolean(hideRole),
            hideDepartment: Boolean(hideDepartment),
            notes: notes ? notes.trim() : '',
            entityName: resolvedEntity,
            adminId: req.user.adminId || req.user.id
        });

        await member.save();
        res.status(201).json(member);
    } catch (err) {
        console.error('Error creating member:', err);
        res.status(400).json({ message: `Failed to create member: ${err.message}` });
    }
});

// 3. UPDATE A MEMBER (Admin only)
router.put('/:id', auth, async (req, res) => {
    try {
        if (!isAuthorizedAdmin(req.user)) {
            return res.status(403).json({ message: 'Access denied. Only administrators can edit committee members.' });
        }

        const member = await Member.findById(req.params.id);
        if (!member) {
            return res.status(404).json({ message: 'Member record not found.' });
        }

        const updates = { ...req.body };
        delete updates._id;
        delete updates.adminId;
        delete updates.entityName; // protect tenant boundary

        if (updates.name) updates.name = updates.name.trim();
        if (updates.role) updates.role = updates.role.trim();
        if (updates.email) updates.email = updates.email.trim().toLowerCase();

        const updated = await Member.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
        res.json(updated);
    } catch (err) {
        console.error('Error updating member:', err);
        res.status(400).json({ message: `Failed to update member: ${err.message}` });
    }
});

// 3b. TOGGLE MEMBER VISIBILITY (Hide/Unhide) (Admin only)
router.patch('/:id/toggle-visibility', auth, async (req, res) => {
    try {
        if (!isAuthorizedAdmin(req.user)) {
            return res.status(403).json({ message: 'Access denied. Only administrators can change member visibility.' });
        }

        const member = await Member.findById(req.params.id);
        if (!member) {
            return res.status(404).json({ message: 'Member record not found.' });
        }

        member.isHidden = !member.isHidden;
        await member.save();
        res.json(member);
    } catch (err) {
        console.error('Error toggling member visibility:', err);
        res.status(500).json({ message: `Failed to toggle visibility: ${err.message}` });
    }
});

// 4. DELETE A MEMBER (Admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (!isAuthorizedAdmin(req.user)) {
            return res.status(403).json({ message: 'Access denied. Only administrators can remove committee members.' });
        }

        const member = await Member.findById(req.params.id);
        if (!member) {
            return res.status(404).json({ message: 'Member record not found.' });
        }

        await Member.findByIdAndDelete(req.params.id);
        res.json({ message: 'Member successfully removed.', id: req.params.id });
    } catch (err) {
        console.error('Error deleting member:', err);
        res.status(500).json({ message: `Failed to delete member: ${err.message}` });
    }
});

module.exports = router;

