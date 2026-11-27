const express = require('express');
const router = express.Router();
const Sponsor = require('../models/Sponsor');
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

// 1. GET ALL SPONSORS (Entity-isolated query)
router.get('/', auth, async (req, res) => {
    try {
        const query = req.entityQuery();
        if (req.query.type) {
            query.type = { $in: [req.query.type, 'both'] };
        }
        if (req.query.festOrEventName) {
            query.festOrEventName = req.query.festOrEventName;
        }
        if (req.query.tier && req.query.tier !== 'All') {
            query.tier = req.query.tier;
        }
        if (req.query.category && req.query.category !== 'All') {
            query.category = req.query.category;
        }

        const sponsors = await Sponsor.find(query).sort({ amount: -1, createdAt: 1 });
        res.json(sponsors);
    } catch (err) {
        console.error('Error fetching sponsors:', err);
        res.status(500).json({ message: err.message });
    }
});

// 2. CREATE A NEW SPONSOR / DONOR (Admin only)
router.post('/', auth, async (req, res) => {
    try {
        if (!isAuthorizedAdmin(req.user)) {
            return res.status(403).json({ message: 'Access denied. Only administrators can add sponsors and donors.' });
        }

        const { 
            name, company, tier, contribution, amount, category, 
            contact, countryCode, email, address, logo, paymentMode, 
            paymentStatus, accountingImpact, receivedDate, festOrEventName, type, status, 
            isHidden, hideAmount, hideContact, notes 
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Sponsor / donor name is required.' });
        }
        if (!contribution || !contribution.trim()) {
            return res.status(400).json({ message: 'Donation / contribution description is required.' });
        }

        const resolvedEntity = req.user.entityName || req.body.entityName;
        if (!resolvedEntity) {
            return res.status(400).json({ message: 'Entity name is missing from your session.' });
        }

        const sponsor = new Sponsor({
            name: name.trim(),
            company: company ? company.trim() : '',
            tier: tier || 'Community Donor',
            contribution: contribution.trim(),
            amount: Number(amount) || 0,
            category: category || 'Cash',
            contact: contact ? contact.trim() : '',
            countryCode: countryCode || '+91',
            email: email ? email.trim().toLowerCase() : '',
            address: address ? address.trim() : '',
            logo: logo || '',
            paymentMode: paymentMode || 'Cash',
            paymentStatus: paymentStatus || 'Received',
            accountingImpact: ['None', 'Income', 'Income & Expenses'].includes(accountingImpact) ? accountingImpact : 'Income',
            receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
            festOrEventName: festOrEventName ? festOrEventName.trim() : '',
            entityName: resolvedEntity,
            type: type || 'festival',
            status: status || 'Active',
            isHidden: Boolean(isHidden),
            hideAmount: Boolean(hideAmount),
            hideContact: Boolean(hideContact),
            notes: notes ? notes.trim() : '',
            adminId: req.user.adminId || req.user.id
        });

        await sponsor.save();
        res.status(201).json(sponsor);
    } catch (err) {
        console.error('Error creating sponsor:', err);
        res.status(400).json({ message: `Failed to create sponsor: ${err.message}` });
    }
});

// 3. UPDATE A SPONSOR (Admin only)
router.put('/:id', auth, async (req, res) => {
    try {
        if (!isAuthorizedAdmin(req.user)) {
            return res.status(403).json({ message: 'Access denied. Only administrators can edit sponsors.' });
        }

        const sponsor = await Sponsor.findById(req.params.id);
        if (!sponsor) {
            return res.status(404).json({ message: 'Sponsor record not found.' });
        }

        const updates = { ...req.body };
        delete updates._id;
        delete updates.adminId;
        delete updates.entityName; // protect tenant boundary

        if (updates.name) updates.name = updates.name.trim();
        if (updates.contribution) updates.contribution = updates.contribution.trim();
        if (updates.amount !== undefined) updates.amount = Number(updates.amount) || 0;
        if (updates.email) updates.email = updates.email.trim().toLowerCase();

        const updated = await Sponsor.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
        res.json(updated);
    } catch (err) {
        console.error('Error updating sponsor:', err);
        res.status(400).json({ message: `Failed to update sponsor: ${err.message}` });
    }
});

// 4. TOGGLE SPONSOR VISIBILITY (Hide/Unhide) (Admin only)
router.patch('/:id/toggle-visibility', auth, async (req, res) => {
    try {
        if (!isAuthorizedAdmin(req.user)) {
            return res.status(403).json({ message: 'Access denied. Only administrators can change sponsor visibility.' });
        }

        const sponsor = await Sponsor.findById(req.params.id);
        if (!sponsor) {
            return res.status(404).json({ message: 'Sponsor record not found.' });
        }

        sponsor.isHidden = !sponsor.isHidden;
        await sponsor.save();
        res.json(sponsor);
    } catch (err) {
        console.error('Error toggling sponsor visibility:', err);
        res.status(500).json({ message: `Failed to toggle visibility: ${err.message}` });
    }
});

// 5. DELETE A SPONSOR (Admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (!isAuthorizedAdmin(req.user)) {
            return res.status(403).json({ message: 'Access denied. Only administrators can remove sponsors.' });
        }

        const sponsor = await Sponsor.findById(req.params.id);
        if (!sponsor) {
            return res.status(404).json({ message: 'Sponsor record not found.' });
        }

        await Sponsor.findByIdAndDelete(req.params.id);
        res.json({ message: 'Sponsor record deleted successfully.', id: req.params.id });
    } catch (err) {
        console.error('Error deleting sponsor:', err);
        res.status(500).json({ message: `Failed to delete sponsor: ${err.message}` });
    }
});

module.exports = router;
