const mongoose = require('mongoose');

const EntitySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    securityKey: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Entity', EntitySchema);
