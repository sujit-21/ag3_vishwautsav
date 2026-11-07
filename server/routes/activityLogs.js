const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const auth = require('../middleware/auth');

// GET /api/activity-logs
// Returns the activity history for the user's entity, optionally filtered by sectionType, festOrEventName, or action
router.get('/', auth, async (req, res) => {
    try {
        const { sectionType, festOrEventName, action, limit = 150 } = req.query;
        const filter = req.entityQuery();

        if (sectionType) {
            filter.sectionType = sectionType;
        }
        if (festOrEventName) {
            const escName = String(festOrEventName).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.festOrEventName = { $regex: new RegExp('^' + escName + '$', 'i') };
        }
        if (action && ['CREATE', 'UPDATE', 'DELETE'].includes(action.toUpperCase())) {
            filter.action = action.toUpperCase();
        }

        const logs = await ActivityLog.find(filter)
            .sort({ createdAt: -1 })
            .limit(Math.min(parseInt(limit, 10) || 150, 300))
            .lean();

        res.json(logs);
    } catch (err) {
        console.error('Activity logs fetch error:', err);
        res.status(500).json({ message: 'Failed to fetch activity logs' });
    }
});

module.exports = router;
