const ActivityLog = require('../models/ActivityLog');

/**
 * Safely records an administrative activity without throwing errors to the parent caller.
 */
const logActivity = async ({
    action,
    targetType = 'attendee',
    targetId,
    targetName,
    adminId,
    adminName,
    adminEmail,
    adminRole,
    entityName,
    festOrEventName,
    sectionType = 'festival',
    details,
    changes = [],
    amount,
    paymentType
}) => {
    try {
        if (!action || !targetId || !adminId) return null;

        const log = new ActivityLog({
            action,
            targetType,
            targetId: String(targetId),
            targetName: String(targetName || targetId),
            adminId,
            adminName: String(adminName || 'Admin'),
            adminEmail: String(adminEmail || ''),
            adminRole: String(adminRole || 'admin'),
            entityName: String(entityName || ''),
            festOrEventName: String(festOrEventName || ''),
            sectionType,
            details: String(details || `${action} operation on ${targetName || targetId}`),
            changes: Array.isArray(changes) ? changes : [],
            amount: typeof amount === 'number' ? amount : undefined,
            paymentType: paymentType || undefined
        });

        await log.save();
        return log;
    } catch (err) {
        console.error('Activity logging non-fatal error:', err.message);
        return null;
    }
};

module.exports = { logActivity };
