const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');

// Get all expenses by category (Shared by Entity)
router.get('/:category', auth, async (req, res) => {
    try {
        const query = req.entityQuery({ category: req.params.category });
        const expenses = await Expense.find(query).sort({ date: -1 });
        res.json(expenses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create Expense
router.post('/', auth, async (req, res) => {
    try {
        const expense = new Expense({
            ...req.body,
            adminId: req.user.adminId,
            entityName: req.user.entityName
        });
        const savedExpense = await expense.save();
        res.status(201).json(savedExpense);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update Expense
router.put('/:id', auth, async (req, res) => {
    try {
        const query = req.entityQuery({ expenseId: req.params.id });
        const updatedExpense = await Expense.findOneAndUpdate(query, req.body, { new: true });
        if (!updatedExpense) return res.status(404).json({ message: 'Expense not found or unauthorized' });
        res.json(updatedExpense);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete Expense
router.delete('/:id', auth, async (req, res) => {
    try {
        const query = req.entityQuery({ expenseId: req.params.id });
        const expense = await Expense.findOneAndDelete(query);
        if (!expense) return res.status(404).json({ message: 'Expense not found or unauthorized' });
        res.json({ message: 'Expense deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
