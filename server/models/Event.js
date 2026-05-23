const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    location: { type: String, required: true },
    price: { type: Number, default: 0 },
    capacity: { type: Number },
    bookedCount: { type: Number, default: 0 },
    festival: { type: mongoose.Schema.Types.ObjectId, ref: 'Festival' }, // Optional link to a festival
    country: { type: String, default: 'India' },
    entityName: { type: String },
    category: { type: String },
    image: { type: String },
    currency: { type: String, default: '₹' },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Event', EventSchema);
