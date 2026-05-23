const mongoose = require('mongoose');

const SupportSchema = new mongoose.Schema({
    role: { type: String, required: true }, // Developer, Admin, etc.
    name: { type: String, required: true },
    contact: { type: String },
    email: { type: String },
    image: { type: String },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Support', SupportSchema);
