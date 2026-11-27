const mongoose = require('mongoose');

const EntitySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    securityKey: { type: String, required: true },
    profilePicture: { type: String, default: '' },
    profileShape: { 
        type: String, 
        enum: ['rounded', 'rectangle', 'square'], 
        default: 'rounded' 
    },
    imageFit: {
        type: String,
        enum: ['contain', 'cover'],
        default: 'contain'
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Entity', EntitySchema);
