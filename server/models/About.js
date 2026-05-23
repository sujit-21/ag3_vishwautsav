const mongoose = require('mongoose');

const AboutSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    image: { type: String },
    order: { type: Number, default: 0 },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('About', AboutSchema);
