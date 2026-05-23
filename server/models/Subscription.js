const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
    subId: { type: String, required: true, unique: true },
    date: { type: Date, required: true },
    name: { type: String, required: true },
    address: { type: String },
    contact: { type: String, required: true },
    countryCode: { type: String, default: '+91' },
    amount: { type: Number, required: true },
    currency: { type: String, default: '₹' },
    paymentType: { type: String, enum: ['Cash & Paid', 'Due', 'Coupon or Token', 'Online'], default: 'Cash & Paid' },
    referenceName: { type: String },
    onlineParticulars: { type: String },
    onlineReference: { type: String },
    membershipType: { type: String, enum: ['Prime', 'Non-Prime', 'VIP', 'Admin'], default: 'Non-Prime' },
    entityName: { type: String },
    festOrEventName: { type: String },
    type: { type: String, enum: ['festival', 'event'], required: true },
    cardColor: { type: String, default: '#1e293b' },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);
