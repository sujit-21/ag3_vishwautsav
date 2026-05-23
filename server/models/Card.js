const mongoose = require('mongoose');

const CardSchema = new mongoose.Schema({
    cardId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    address: { type: String },
    membershipType: { type: String, enum: ['Prime', 'Non-Prime', 'VIP', 'Regular', 'Admin'], default: 'Regular' },
    cardColor: { type: String, default: '#1e293b' },
    backgroundImage: { type: String }, // Stores selection like 'geometric' or 'luxury'
    familyMembers: { type: Number, default: 0 },
    fromDate: { type: Date },
    toDate: { type: Date },
    entityName: { type: String },
    festOrEventName: { type: String },
    type: { type: String, enum: ['festival', 'event'], required: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Card', CardSchema);
