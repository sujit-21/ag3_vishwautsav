const mongoose = require('mongoose');

const SponsorSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    company: { type: String, trim: true }, // Brand / Business / Organization
    tier: { 
        type: String, 
        enum: ['Title Sponsor', 'Platinum', 'Gold', 'Silver', 'Bronze', 'Associate Sponsor', 'Community Donor', 'In-Kind Donor'], 
        default: 'Community Donor' 
    },
    contribution: { type: String, required: true, trim: true }, // e.g. "Sound & Light System", "Stage Flowers", "500 Food Packets", "Cash Sponsorship"
    amount: { type: Number, required: true, default: 0 },
    category: { 
        type: String, 
        enum: ['Cash', 'In-Kind Services', 'Food / Prasad', 'Stage & Sound', 'Media & Marketing', 'Logistics & Security', 'Other'], 
        default: 'Cash' 
    },
    contact: { type: String, trim: true },
    countryCode: { type: String, default: '+91' },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    logo: { type: String, default: '' },
    paymentMode: { 
        type: String, 
        enum: ['Cash', 'UPI / Online', 'Bank Transfer / Cheque', 'In-Kind / Material'], 
        default: 'Cash' 
    },
    paymentStatus: { 
        type: String, 
        enum: ['Received', 'Pledged', 'Partial', 'Pending'], 
        default: 'Received' 
    },
    accountingImpact: {
        type: String,
        enum: ['None', 'Income', 'Income & Expenses'],
        default: 'Income'
    },
    receivedDate: { type: Date, default: Date.now },
    festOrEventName: { type: String, trim: true }, // Associated festival or event title
    entityName: { type: String, required: true, trim: true },
    type: { type: String, enum: ['festival', 'event', 'both'], default: 'festival' },
    status: { type: String, enum: ['Active', 'Honorary', 'Inactive'], default: 'Active' },
    isHidden: { type: Boolean, default: false },
    hideAmount: { type: Boolean, default: false },
    hideContact: { type: Boolean, default: false },
    notes: { type: String, trim: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Sponsor', SponsorSchema);
