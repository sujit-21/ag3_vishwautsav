const express = require('express');
const router = express.Router();
const Enrollment = require('../models/Enrollment');
const EnrollmentSubmission = require('../models/EnrollmentSubmission');
const Member = require('../models/Member');
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

// Helper: generate reference ID e.g. ENR-7A9B2
const generateReferenceId = () => {
    return 'ENR-' + Math.random().toString(36).substring(2, 7).toUpperCase();
};

// Helper: generate clean slug
const generateSlug = (title = '', entity = '') => {
    const cleanTitle = String(title || 'festival')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    const cleanEntity = String(entity || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    return `${cleanEntity ? cleanEntity + '-' : ''}${cleanTitle}-${randomSuffix}`;
};

// ==========================================
// 1. PUBLIC ROUTES (No Login Required)
// ==========================================

// GET /api/enrollments/public/:slug
router.get('/public/:slug', async (req, res) => {
    try {
        const slug = req.params.slug.trim().toLowerCase();
        const enrollment = await Enrollment.findOne({ slug });

        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment link not found or has expired.' });
        }

        if (!enrollment.isActive) {
            return res.status(403).json({ 
                message: 'This enrollment link is currently closed by the organizers.',
                isClosed: true,
                festOrEventName: enrollment.festOrEventName,
                entityName: enrollment.entityName
            });
        }

        if (enrollment.expiresAt && new Date() > new Date(enrollment.expiresAt)) {
            return res.status(403).json({ 
                message: 'The enrollment deadline for this festival / event has ended.',
                isExpired: true,
                festOrEventName: enrollment.festOrEventName,
                entityName: enrollment.entityName
            });
        }

        res.json({
            slug: enrollment.slug,
            type: enrollment.type,
            festOrEventName: enrollment.festOrEventName,
            entityName: enrollment.entityName,
            title: enrollment.title || `${enrollment.festOrEventName} — Committee & Donor Enrollment`,
            description: enrollment.description || `Official community member enrollment and patron sponsorship for ${enrollment.festOrEventName}.`,
            acceptDonations: enrollment.acceptDonations,
            allowInKind: enrollment.allowInKind,
            suggestedAmounts: enrollment.suggestedAmounts,
            suggestedRoles: enrollment.suggestedRoles,
            suggestedDepts: enrollment.suggestedDepts,
            submissionsCount: enrollment.submissionsCount,
            expiresAt: enrollment.expiresAt
        });
    } catch (err) {
        console.error('Error fetching public enrollment:', err);
        res.status(500).json({ message: 'Server error loading enrollment portal.' });
    }
});

// POST /api/enrollments/public/:slug/submit
router.post('/public/:slug/submit', async (req, res) => {
    try {
        const slug = req.params.slug.trim().toLowerCase();
        const enrollment = await Enrollment.findOne({ slug });

        if (!enrollment || !enrollment.isActive) {
            return res.status(403).json({ message: 'Enrollments are currently closed for this festival / event.' });
        }

        const {
            name, roleInterest, departmentInterest, contact, countryCode, email, address, notes,
            donate, estimatedAmount, contributionItem, category, paymentMode
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Full Name is required.' });
        }
        if (!contact || !contact.trim()) {
            return res.status(400).json({ message: 'Contact Mobile / WhatsApp number is required.' });
        }

        const refId = generateReferenceId();

        const submission = new EnrollmentSubmission({
            enrollmentId: enrollment._id,
            slug: enrollment.slug,
            referenceId: refId,
            type: enrollment.type,
            festOrEventName: enrollment.festOrEventName,
            entityName: enrollment.entityName,
            name: name.trim(),
            roleInterest: roleInterest ? roleInterest.trim() : 'Committee Member',
            departmentInterest: departmentInterest ? departmentInterest.trim() : 'Core Committee',
            contact: contact.trim(),
            countryCode: countryCode || '+91',
            email: email ? email.trim().toLowerCase() : '',
            address: address ? address.trim() : '',
            notes: notes ? notes.trim() : '',
            donate: Boolean(donate),
            estimatedAmount: Number(estimatedAmount) || 0,
            contributionItem: contributionItem ? contributionItem.trim() : '',
            category: category || 'Cash',
            paymentMode: paymentMode || 'Pledged',
            status: 'Pending'
        });

        await submission.save();

        // Increment count
        await Enrollment.findByIdAndUpdate(enrollment._id, { $inc: { submissionsCount: 1 } });

        res.status(201).json({
            message: 'Enrollment submitted successfully! Organizers will review and confirm your participation.',
            referenceId: refId,
            festOrEventName: enrollment.festOrEventName,
            name: submission.name,
            roleInterest: submission.roleInterest,
            estimatedAmount: submission.estimatedAmount,
            contributionItem: submission.contributionItem
        });
    } catch (err) {
        console.error('Error submitting enrollment:', err);
        res.status(500).json({ message: `Submission failed: ${err.message}` });
    }
});


// ==========================================
// 2. ADMIN AUTHENTICATED ROUTES
// ==========================================

// GET /api/enrollments (List links for active entity/festival/event)
router.get('/', auth, async (req, res) => {
    try {
        const query = req.entityQuery();
        if (req.query.type) {
            query.type = { $in: [req.query.type, 'both'] };
        }
        if (req.query.festOrEventName) {
            query.festOrEventName = req.query.festOrEventName.trim();
        }

        const enrollments = await Enrollment.find(query).sort({ createdAt: -1 });
        res.json(enrollments);
    } catch (err) {
        console.error('Error fetching admin enrollments:', err);
        res.status(500).json({ message: err.message });
    }
});

// POST /api/enrollments (Create or get active link for festival/event)
router.post('/', auth, async (req, res) => {
    try {
        if (!isAuthorizedAdmin(req.user)) {
            return res.status(403).json({ message: 'Access denied. Only administrators can generate enrollment links.' });
        }

        const {
            type, festOrEventName, title, description, acceptDonations, allowInKind,
            suggestedAmounts, suggestedRoles, suggestedDepts, expiresAt
        } = req.body;

        if (!festOrEventName || !festOrEventName.trim()) {
            return res.status(400).json({ message: 'Festival or Event name is required.' });
        }

        const resolvedEntity = req.user.entityName || req.body.entityName;
        if (!resolvedEntity) {
            return res.status(400).json({ message: 'Entity name missing from session.' });
        }

        // Check if link already exists for this festival/event
        let existing = await Enrollment.findOne({
            entityName: resolvedEntity,
            festOrEventName: festOrEventName.trim(),
            type: type || 'festival'
        });

        if (existing) {
            // Re-activate if was deactivated
            if (!existing.isActive) {
                existing.isActive = true;
                await existing.save();
            }
            return res.json(existing);
        }

        const slug = generateSlug(festOrEventName, resolvedEntity);

        const enrollment = new Enrollment({
            slug,
            type: type || 'festival',
            festOrEventName: festOrEventName.trim(),
            entityName: resolvedEntity,
            title: title ? title.trim() : `${festOrEventName.trim()} — Official Committee & Donor Enrollment`,
            description: description ? description.trim() : `Open public registration for committee members, volunteers, and patrons for ${festOrEventName.trim()}.`,
            acceptDonations: acceptDonations !== false,
            allowInKind: allowInKind !== false,
            suggestedAmounts: Array.isArray(suggestedAmounts) && suggestedAmounts.length ? suggestedAmounts : [501, 1001, 2100, 5001],
            suggestedRoles: Array.isArray(suggestedRoles) && suggestedRoles.length ? suggestedRoles : ['Committee Member', 'Ground Volunteer', 'Cultural Coordinator', 'Logistics & Security', 'Prasad / Food Seva'],
            suggestedDepts: Array.isArray(suggestedDepts) && suggestedDepts.length ? suggestedDepts : ['Core Committee', 'Executive Wing', 'Cultural & Events', 'Logistics & Security', 'Youth & Volunteers'],
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            adminId: req.user.adminId || req.user.id
        });

        await enrollment.save();
        res.status(201).json(enrollment);
    } catch (err) {
        console.error('Error generating enrollment link:', err);
        res.status(500).json({ message: `Failed to create link: ${err.message}` });
    }
});

// PUT /api/enrollments/:id (Update link settings / toggle active)
router.put('/:id', auth, async (req, res) => {
    try {
        if (!isAuthorizedAdmin(req.user)) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        const enrollment = await Enrollment.findById(req.params.id);
        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment record not found.' });
        }

        const updates = { ...req.body };
        delete updates._id;
        delete updates.slug;
        delete updates.entityName;
        delete updates.adminId;

        const updated = await Enrollment.findByIdAndUpdate(req.params.id, updates, { new: true });
        res.json(updated);
    } catch (err) {
        console.error('Error updating enrollment link:', err);
        res.status(500).json({ message: err.message });
    }
});

// DELETE /api/enrollments/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        if (!isAuthorizedAdmin(req.user)) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        const enrollment = await Enrollment.findById(req.params.id);
        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment record not found.' });
        }

        await Enrollment.findByIdAndDelete(req.params.id);
        // Optionally delete all submissions
        await EnrollmentSubmission.deleteMany({ enrollmentId: req.params.id });

        res.json({ message: 'Enrollment link and submissions removed successfully.' });
    } catch (err) {
        console.error('Error deleting enrollment link:', err);
        res.status(500).json({ message: err.message });
    }
});

// ==========================================
// 3. SUBMISSIONS CRUD & 1-CLICK APPROVAL SYNC
// ==========================================

// GET /api/enrollments/submissions/all
router.get('/submissions/all', auth, async (req, res) => {
    try {
        const query = req.entityQuery();
        if (req.query.type) {
            query.type = { $in: [req.query.type, 'both'] };
        }
        if (req.query.festOrEventName) {
            query.festOrEventName = req.query.festOrEventName.trim();
        }
        if (req.query.status && req.query.status !== 'All') {
            query.status = req.query.status;
        }

        const submissions = await EnrollmentSubmission.find(query).sort({ createdAt: -1 });
        res.json(submissions);
    } catch (err) {
        console.error('Error fetching submissions:', err);
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/enrollments/submissions/:subId (Edit submission details)
router.put('/submissions/:subId', auth, async (req, res) => {
    try {
        if (!isAuthorizedAdmin(req.user)) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        const sub = await EnrollmentSubmission.findById(req.params.subId);
        if (!sub) {
            return res.status(404).json({ message: 'Submission record not found.' });
        }

        const updates = { ...req.body };
        delete updates._id;
        delete updates.referenceId;
        delete updates.entityName;

        const updated = await EnrollmentSubmission.findByIdAndUpdate(req.params.subId, updates, { new: true });
        res.json(updated);
    } catch (err) {
        console.error('Error updating submission:', err);
        res.status(500).json({ message: err.message });
    }
});

// POST /api/enrollments/submissions/:subId/approve (1-Click Approve & Auto-Sync)
router.post('/submissions/:subId/approve', auth, async (req, res) => {
    try {
        if (!isAuthorizedAdmin(req.user)) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        const sub = await EnrollmentSubmission.findById(req.params.subId);
        if (!sub) {
            return res.status(404).json({ message: 'Submission not found.' });
        }

        let syncedMemberId = sub.syncedMemberId;
        let syncedSponsorId = sub.syncedSponsorId;

        // 1. Create or sync into Member Collection
        if (!syncedMemberId) {
            const newMember = new Member({
                name: sub.name,
                role: sub.roleInterest || 'Committee Member',
                department: sub.departmentInterest || 'Core Committee',
                contact: sub.contact,
                countryCode: sub.countryCode || '+91',
                email: sub.email || '',
                address: sub.address || '',
                festOrEventName: sub.festOrEventName,
                entityName: sub.entityName,
                type: sub.type || 'festival',
                status: 'Active',
                notes: `Self-enrolled via link (${sub.referenceId}). ${sub.notes || ''}`.trim(),
                adminId: req.user.adminId || req.user.id
            });
            await newMember.save();
            syncedMemberId = newMember._id;
        }

        // 2. If applicant pledged amount or item, sync into Sponsor Collection
        if ((sub.donate || sub.estimatedAmount > 0 || sub.contributionItem) && !syncedSponsorId) {
            const newSponsor = new Sponsor({
                name: sub.name,
                tier: sub.estimatedAmount >= 50000 ? 'Gold' : sub.estimatedAmount >= 20000 ? 'Silver' : sub.contributionItem ? 'In-Kind Donor' : 'Community Donor',
                contribution: sub.contributionItem || `Cash Contribution: ₹${sub.estimatedAmount.toLocaleString('en-IN')}`,
                amount: sub.estimatedAmount || 0,
                category: sub.category || (sub.contributionItem ? 'In-Kind Services' : 'Cash'),
                contact: sub.contact,
                countryCode: sub.countryCode || '+91',
                email: sub.email || '',
                address: sub.address || '',
                paymentMode: sub.paymentMode || 'Pledged',
                paymentStatus: 'Pledged',
                festOrEventName: sub.festOrEventName,
                entityName: sub.entityName,
                type: sub.type || 'festival',
                status: 'Active',
                notes: `Enrolled via link (${sub.referenceId})`,
                adminId: req.user.adminId || req.user.id
            });
            await newSponsor.save();
            syncedSponsorId = newSponsor._id;
        }

        sub.status = 'Approved';
        sub.syncedMemberId = syncedMemberId;
        sub.syncedSponsorId = syncedSponsorId;
        await sub.save();

        res.json({
            message: `Successfully approved "${sub.name}"! Synced to Committee Roster${syncedSponsorId ? ' and Sponsors Directory' : ''}.`,
            submission: sub
        });
    } catch (err) {
        console.error('Error approving submission:', err);
        res.status(500).json({ message: `Approval failed: ${err.message}` });
    }
});

// POST /api/enrollments/submissions/:subId/reject
router.post('/submissions/:subId/reject', auth, async (req, res) => {
    try {
        if (!isAuthorizedAdmin(req.user)) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        const sub = await EnrollmentSubmission.findById(req.params.subId);
        if (!sub) {
            return res.status(404).json({ message: 'Submission not found.' });
        }

        sub.status = 'Rejected';
        await sub.save();

        res.json({ message: `Submission for "${sub.name}" has been marked as Rejected.`, submission: sub });
    } catch (err) {
        console.error('Error rejecting submission:', err);
        res.status(500).json({ message: err.message });
    }
});

// DELETE /api/enrollments/submissions/:subId
router.delete('/submissions/:subId', auth, async (req, res) => {
    try {
        if (!isAuthorizedAdmin(req.user)) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        const sub = await EnrollmentSubmission.findById(req.params.subId);
        if (!sub) {
            return res.status(404).json({ message: 'Submission not found.' });
        }

        await EnrollmentSubmission.findByIdAndDelete(req.params.subId);
        // Decrement enrollment count if applicable
        if (sub.enrollmentId) {
            await Enrollment.findByIdAndUpdate(sub.enrollmentId, { $inc: { submissionsCount: -1 } });
        }

        res.json({ message: 'Submission deleted successfully.', id: req.params.subId });
    } catch (err) {
        console.error('Error deleting submission:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
