const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
    // baseRole is the permanent role set at signup — never changed by role switching.
    // It determines the user's actual access level (admin vs sub-user) regardless of display role.
    baseRole: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
    entityName: { type: String }, // Links user to an entity
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to the creator admin
    createdAt: { type: Date, default: Date.now },
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
