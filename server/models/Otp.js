const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        index: true
    },
    otp: {
        type: String,
        required: true
    },
    purpose: {
        type: String,
        enum: ['signup', 'login', 'pass_download', 'reset_password'],
        default: 'signup'
    },
    attempts: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300 // Automatically removed by MongoDB after 300 seconds (5 minutes)
    }
});

module.exports = mongoose.model('Otp', otpSchema);

