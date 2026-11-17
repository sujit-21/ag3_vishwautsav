const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    type: { type: String, enum: ['festival', 'event', 'both'], default: 'festival' },
    festOrEventName: { type: String, required: true, trim: true },
    entityName: { type: String, required: true, trim: true },
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    acceptDonations: { type: Boolean, default: true },
    allowInKind: { type: Boolean, default: true },
    currency: { type: String, default: '₹', trim: true },
    defaultPayeeName: { type: String, trim: true },
    defaultPayeeNumber: { type: String, trim: true },
    suggestedAmounts: { 
        type: [Number], 
        default: [501, 1001, 2100, 5001] 
    },
    suggestedRoles: { 
        type: [String], 
        default: ['Committee Member', 'Ground Volunteer', 'Cultural Coordinator', 'Logistics & Security', 'Prasad / Food Seva'] 
    },
    suggestedDepts: { 
        type: [String], 
        default: ['Core Committee', 'Executive Wing', 'Cultural & Events', 'Logistics & Security', 'Youth & Volunteers'] 
    },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date },
    submissionsCount: { type: Number, default: 0 },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

EnrollmentSchema.index({ entityName: 1, festOrEventName: 1, type: 1 });

module.exports = mongoose.model('Enrollment', EnrollmentSchema);
