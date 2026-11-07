const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
    action: {
        type: String,
        enum: ['CREATE', 'UPDATE', 'DELETE'],
        required: true
    },
    targetType: {
        type: String,
        default: 'attendee'
    },
    targetId: {
        type: String,
        required: true
    },
    targetName: {
        type: String,
        required: true
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    adminName: {
        type: String,
        required: true
    },
    adminEmail: {
        type: String,
        default: ''
    },
    adminRole: {
        type: String,
        default: 'admin'
    },
    entityName: {
        type: String,
        required: true
    },
    festOrEventName: {
        type: String,
        default: ''
    },
    sectionType: {
        type: String,
        enum: ['festival', 'event'],
        required: true
    },
    details: {
        type: String,
        required: true
    },
    changes: [
        {
            field: String,
            from: mongoose.Schema.Types.Mixed,
            to: mongoose.Schema.Types.Mixed
        }
    ],
    amount: {
        type: Number
    },
    paymentType: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
