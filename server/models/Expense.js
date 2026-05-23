const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
    expenseId: { type: String, required: true, unique: true },
    date: { type: Date, required: true },
    particular: { type: String, required: true },
    expenseType: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: '₹' },
    paymentType: { type: String, default: 'Cash & Paid' },
    onlineParticulars: { type: String },
    onlineReference: { type: String },
    festOrEventName: { type: String },
    category: { type: String, enum: ['festival', 'event'], required: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Expense', ExpenseSchema);
