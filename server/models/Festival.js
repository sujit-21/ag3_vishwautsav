const mongoose = require('mongoose');

const FestivalSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    location: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    category: { type: String, required: true }, // e.g., Music, Food, Culture
    country: { type: String, default: 'India' },
    entityName: { type: String }, // e.g., Rotary Entity, Vishwa Utsav
    image: { type: String }, // URL to image
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Festival', FestivalSchema);
