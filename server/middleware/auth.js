const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // Check if no token
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find user to determine their context
        const user = await User.findById(decoded.id);
        if (!user) return res.status(401).json({ message: 'User no longer exists' });

        // ── MIGRATION: Backfill baseRole for existing users who were created before this field existed ──
        // baseRole is the permanent role, role is the current display role (can be switched).
        // If baseRole is missing or still 'user' but user has no createdBy (meaning they registered themselves),
        // treat their original signup role as their baseRole.
        const effectiveBaseRole = user.baseRole || (user.createdBy ? 'user' : user.role);
        if (!user.baseRole) {
            // Async backfill — doesn't block the request
            User.findByIdAndUpdate(user._id, { baseRole: effectiveBaseRole }).catch(() => {});
        }

        // Use the user's entityName if set, otherwise fallback to header (legacy)
        let entityName = user.entityName || (req.header('x-entity-name') ? decodeURIComponent(req.header('x-entity-name')) : null);

        // SYNC: If we have an entity name from header but it's not saved in DB yet, save it now
        if (!user.entityName && entityName) {
            await User.findByIdAndUpdate(user._id, { entityName });
        }

        // ── CONTEXT ADMIN ID ──
        // Use baseRole (permanent) NOT role (display) to determine data ownership.
        // This means an admin who switched to 'user' display mode still sees their own data.
        const isAdmin = ['admin', 'superadmin'].includes(effectiveBaseRole);
        const contextAdminId = isAdmin ? user._id : (user.createdBy || user._id);

        // ── ENTITY SHARING FIX ──
        // Resolve ALL admin IDs that belong to this entity so that
        // any admin in the same entity can see each other's data.
        let allowedAdminIds = [contextAdminId].filter(Boolean);
        if (entityName) {
            const escEntity = String(entityName).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Find all users in entity whose baseRole is admin/superadmin
            // Also include any user whose role is admin/superadmin (covers pre-migration users)
            const entityMembers = await User.find(
                { 
                    entityName: { $regex: new RegExp('^' + escEntity + '$', 'i') },
                    $or: [
                        { baseRole: { $in: ['admin', 'superadmin'] } },
                        { baseRole: { $exists: false }, createdBy: { $exists: false } } // Legacy: no createdBy = was an admin
                    ]
                },
                '_id'
            );
            if (entityMembers.length > 0) {
                const memberIds = entityMembers.map(m => m._id);
                // Merge and deduplicate
                const seen = new Set(allowedAdminIds.map(id => id?.toString()));
                for (const id of memberIds) {
                    if (!seen.has(id.toString())) {
                        allowedAdminIds.push(id);
                        seen.add(id.toString());
                    }
                }
            }
        }

        req.user = {
            id: user._id,
            role: user.role,           // Display role (can be switched)
            baseRole: effectiveBaseRole, // Permanent role (used for access control)
            adminId: contextAdminId,
            allowedAdminIds,           // All admin IDs in the same entity
            entityName: entityName     // Shared key for multiple admins/users
        };

        // Helper: build a Mongoose query that finds documents visible to this user.
        // Matches by entityName (all entity members) OR by any of the allowed adminIds (fallback for legacy data).
        req.entityQuery = (extra = {}) => {
            if (entityName) {
                const esc = String(entityName).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                return {
                    ...extra,
                    $or: [
                        { entityName: { $regex: new RegExp('^' + esc + '$', 'i') } },
                        { adminId: { $in: allowedAdminIds } }
                    ]
                };
            }
            return { ...extra, adminId: { $in: allowedAdminIds } };
        };
        
        req.entityName = entityName; // Kept for routes expecting req.entityName
        
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token is not valid' });
        }
        console.error('Auth middleware error:', err);
        res.status(500).json({ message: 'Server auth logic error' });
    }
};
