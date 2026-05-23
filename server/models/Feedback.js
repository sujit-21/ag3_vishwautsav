const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    userName: { type: String, required: true },
    userImage: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, required: true },
    image: { type: String }, // Optional attachment
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', FeedbackSchema);
