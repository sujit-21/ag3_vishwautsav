const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true }, // e.g. President, General Secretary, Treasurer, Vice President, Cultural Head, Committee Member, Volunteer Lead
    department: { type: String, default: 'Core Committee', trim: true }, // e.g. Core Committee, Executive Wing, Cultural & Events, Treasury & Accounts, Youth & Volunteers, Advisory Board
    contact: { type: String, trim: true },
    countryCode: { type: String, default: '+91' },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    photo: { type: String, default: '' },
    entityName: { type: String, required: true, trim: true },
    type: { type: String, enum: ['festival', 'event', 'both'], default: 'festival' },
    status: { type: String, enum: ['Active', 'Honorary', 'Inactive'], default: 'Active' },
    isHidden: { type: Boolean, default: false },
    hidePhone: { type: Boolean, default: false },
    hideEmail: { type: Boolean, default: false },
    hideAddress: { type: Boolean, default: false },
    hideRole: { type: Boolean, default: false },
    hideDepartment: { type: Boolean, default: false },
    notes: { type: String, trim: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Member', MemberSchema);

